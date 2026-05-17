package com.uth.datalabeling.modules.integration;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.export.dto.CocoExportDto;
import com.uth.datalabeling.modules.export.service.CocoExportService;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * E2E Integration Test for the COCO Export logic using a real H2 database in PostgreSQL mode.
 * Evaluates:
 *  - Real DB operations and relational mapping queries.
 *  - E2E coordinate normalization to absolute pixel values.
 *  - Skip logic for images without width/height in metadata.
 *  - RBAC verification by setting security context.
 */
@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:coco-integration-jpa;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("Coco Export Service — Database Integration Tests")
class CocoExportIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DatasetRepository datasetRepository;

    @Autowired
    private DataSampleRepository dataSampleRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private LabelRepository labelRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private AnnotationRepository annotationRepository;

    private CocoExportService cocoExportService;

    private User manager;
    private User admin;
    private User annotator;
    private User manager2;
    private Project project;
    private Label labelStop;
    private Label labelYield;

    @BeforeEach
    void setUp() {
        // Instantiate real services with wired repositories
        ProjectAccessService projectAccessService = new ProjectAccessService(
                userRepository, projectRepository, taskRepository);

        cocoExportService = new CocoExportService(
                projectAccessService, taskRepository, labelRepository, annotationRepository);

        // 1. Create Users
        manager = userRepository.save(User.builder()
                .email("mgr@lab.io")
                .fullName("Manager One")
                .password("Secret123!")
                .role("MANAGER")
                .build());

        admin = userRepository.save(User.builder()
                .email("admin@lab.io")
                .fullName("Admin")
                .password("Secret123!")
                .role("ADMIN")
                .build());

        annotator = userRepository.save(User.builder()
                .email("ann@lab.io")
                .fullName("Annotator")
                .password("Secret123!")
                .role("ANNOTATOR")
                .build());

        manager2 = userRepository.save(User.builder()
                .email("mgr2@lab.io")
                .fullName("Manager Two")
                .password("Secret123!")
                .role("MANAGER")
                .build());

        // 2. Create Dataset & Samples
        Dataset dataset = datasetRepository.save(Dataset.builder()
                .name("Traffic Signs Dataset")
                .creator(manager)
                .build());

        // Sample 1: Valid metadata (640x480)
        DataSample sample1 = dataSampleRepository.save(DataSample.builder()
                .dataset(dataset)
                .imageUrl("uploads/stop-001.jpg")
                .metadata(Map.of("width", 640, "height", 480))
                .build());

        // Sample 2: Missing width/height in metadata (will be skipped in COCO)
        DataSample sampleSkipped = dataSampleRepository.save(DataSample.builder()
                .dataset(dataset)
                .imageUrl("uploads/yield-002.jpg")
                .metadata(Map.of("filename", "yield-002.jpg"))
                .build());

        // 3. Create Project & Labels
        project = projectRepository.save(Project.builder()
                .name("Autonomous Driving Labels")
                .description("Autonomous driving datasets labeling project")
                .managerId(manager.getId())
                .dataset(dataset)
                .status("ACTIVE")
                .build());

        labelStop = labelRepository.save(Label.builder()
                .name("Stop Sign")
                .colorHex("#FF0000")
                .project(project)
                .build());

        labelYield = labelRepository.save(Label.builder()
                .name("Yield Sign")
                .colorHex("#FFFF00")
                .project(project)
                .build());

        // 4. Create Tasks
        // Task 1: COMPLETED, has dimensions (will be exported)
        Task task1 = taskRepository.save(Task.builder()
                .project(project)
                .sample(sample1)
                .status("COMPLETED")
                .annotator(annotator)
                .build());

        // Task 2: COMPLETED, but missing dimensions (will be skipped)
        Task task2 = taskRepository.save(Task.builder()
                .project(project)
                .sample(sampleSkipped)
                .status("COMPLETED")
                .annotator(annotator)
                .build());

        // Task 3: PENDING, has dimensions (not completed, so will be ignored)
        DataSample samplePending = dataSampleRepository.save(DataSample.builder()
                .dataset(dataset)
                .imageUrl("uploads/speed-003.jpg")
                .metadata(Map.of("width", 800, "height", 600))
                .build());
        taskRepository.save(Task.builder()
                .project(project)
                .sample(samplePending)
                .status("PENDING")
                .build());

        // 5. Add Annotations to Task 1
        // Bounding box at [0.1, 0.2, 0.3, 0.4] in normalized ratio.
        // Absolute: x = 0.1 * 640 = 64.0, y = 0.2 * 480 = 96.0, w = 0.3 * 640 = 192.0, h = 0.4 * 480 = 192.0
        annotationRepository.save(Annotation.builder()
                .task(task1)
                .label(labelStop)
                .createdBy(annotator)
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .geometry(Map.of("x", 0.1, "y", 0.2, "width", 0.3, "height", 0.4))
                .isAiGenerated(false)
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void setSecurityContext(String email) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn(email);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    @DisplayName("MANAGER of the project can successfully export and get precise COCO pixel values conversion")
    void manager_canExportProject_withCorrectCocoStructureAndPixels() {
        setSecurityContext("mgr@lab.io");

        CocoExportDto dto = cocoExportService.buildExport(project.getId());

        // Verify DTO structure
        assertThat(dto.getInfo()).isNotNull();
        assertThat(dto.getInfo().getDescription()).isEqualTo("Autonomous Driving Labels");

        // Categories sequential validation
        assertThat(dto.getCategories()).hasSize(2);
        assertThat(dto.getCategories().get(0).getId()).isEqualTo(1);
        assertThat(dto.getCategories().get(0).getName()).isEqualTo("Stop Sign");
        assertThat(dto.getCategories().get(1).getId()).isEqualTo(2);
        assertThat(dto.getCategories().get(1).getName()).isEqualTo("Yield Sign");

        // Image skip logic: only 1 image exported (task1), task2 (missing dimensions) is skipped
        assertThat(dto.getImages()).hasSize(1);
        assertThat(dto.getImages().get(0).getId()).isEqualTo(1);
        assertThat(dto.getImages().get(0).getFileName()).isEqualTo("stop-001.jpg");
        assertThat(dto.getImages().get(0).getWidth()).isEqualTo(640);
        assertThat(dto.getImages().get(0).getHeight()).isEqualTo(480);

        // Annotation validation (precise float pixel values conversion)
        assertThat(dto.getAnnotations()).hasSize(1);
        assertThat(dto.getAnnotations().get(0).getId()).isEqualTo(1);
        assertThat(dto.getAnnotations().get(0).getImageId()).isEqualTo(1);
        assertThat(dto.getAnnotations().get(0).getCategoryId()).isEqualTo(1);
        assertThat(dto.getAnnotations().get(0).getBbox().get(0)).isEqualTo(64.0);  // 0.1 * 640
        assertThat(dto.getAnnotations().get(0).getBbox().get(1)).isEqualTo(96.0);  // 0.2 * 480
        assertThat(dto.getAnnotations().get(0).getBbox().get(2)).isEqualTo(192.0); // 0.3 * 640
        assertThat(dto.getAnnotations().get(0).getBbox().get(3)).isEqualTo(192.0); // 0.4 * 480
        assertThat(dto.getAnnotations().get(0).getArea()).isEqualTo(36864.0);      // 192.0 * 192.0
    }

    @Test
    @DisplayName("ADMIN can successfully export any project")
    void admin_canExportAnyProject() {
        setSecurityContext("admin@lab.io");

        CocoExportDto dto = cocoExportService.buildExport(project.getId());

        assertThat(dto.getInfo().getDescription()).isEqualTo("Autonomous Driving Labels");
        assertThat(dto.getImages()).hasSize(1);
    }

    @Test
    @DisplayName("MANAGER of another project is FORBIDDEN from exporting this project")
    void managerOfAnotherProject_getsForbidden() {
        setSecurityContext("mgr2@lab.io");

        assertThatThrownBy(() -> cocoExportService.buildExport(project.getId()))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("ANNOTATOR is FORBIDDEN from exporting project")
    void annotator_getsForbidden() {
        setSecurityContext("ann@lab.io");

        assertThatThrownBy(() -> cocoExportService.buildExport(project.getId()))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.FORBIDDEN);
    }

    @Test
    @DisplayName("Exporting a non-existent project returns PROJECT_NOT_FOUND")
    void exportNonExistentProject_returnsNotFound() {
        setSecurityContext("admin@lab.io");

        assertThatThrownBy(() -> cocoExportService.buildExport(UUID.randomUUID()))
                .isInstanceOf(AppException.class)
                .hasFieldOrPropertyWithValue("errorCode", ErrorCode.PROJECT_NOT_FOUND);
    }
}
