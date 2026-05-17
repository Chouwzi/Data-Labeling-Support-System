package com.uth.datalabeling.modules.annotation.repository;

import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:annotation-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class AnnotationRepositoryTest {

    @Autowired
    private AnnotationRepository annotationRepository;

    @Autowired
    private TaskRepository taskRepository;

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

    @Test
    @Transactional // Simulate the @Transactional from the Service layer
    void deleteByTaskId_DeletesAnnotationsCorrectly() {
        User manager = userRepository.save(User.builder()
                .email("manager@example.com")
                .fullName("Manager")
                .password("password")
                .role("MANAGER")
                .build());

        Dataset dataset = datasetRepository.save(Dataset.builder().name("Traffic").creator(manager).build());
        Project project = projectRepository.save(Project.builder()
                .name("Project A")
                .managerId(manager.getId())
                .dataset(dataset)
                .status("ACTIVE")
                .build());

        DataSample sample = dataSampleRepository.save(DataSample.builder()
                .dataset(dataset)
                .imageUrl("uploads/a.jpg")
                .build());

        Task task = taskRepository.save(Task.builder()
                .project(project)
                .sample(sample)
                .annotator(manager)
                .status("IN_PROGRESS")
                .build());

        Label label = labelRepository.save(Label.builder().project(project).name("Car").colorHex("#000000").build());

        annotationRepository.save(Annotation.builder()
                .task(task)
                .label(label)
                .createdBy(manager)
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .geometry(Map.of("x", 0.1, "y", 0.1, "width", 0.1, "height", 0.1))
                .isAiGenerated(false)
                .build());

        // Verify it was saved
        List<Annotation> beforeDelete = annotationRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        assertEquals(1, beforeDelete.size());

        // Delete it using the derived query method
        annotationRepository.deleteByTaskId(task.getId());

        // Verify it was deleted
        List<Annotation> afterDelete = annotationRepository.findByTaskIdOrderByCreatedAtAsc(task.getId());
        assertTrue(afterDelete.isEmpty());
    }
}
