package com.uth.datalabeling.modules.export.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.export.dto.CocoExportDto;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;

/**
 * Unit tests for {@link CocoExportService}.
 * Validates coordinate conversion, image skip logic, sequential ID mapping,
 * and correct category / annotation linkage.
 *
 * NOTE FOR LEARNING:
 * - Những mock `taskRepository.findByProjectIdAndStatusWithSample(...)` đã được
 *   cập nhật để nhận `List<String>` (danh sách trạng thái) thay vì một chuỗi.
 * - Kiểm tra ở mức unit-test giả lập rằng service chỉ lấy task với trạng thái
 *   "COMPLETED" (xem danh sách trạng thái trong service). Nếu bạn muốn kiểm tra
 *   thêm trường hợp trạng thái lưu trong `DataSample.metadata`, hãy thêm test
 *   mới mô phỏng metadata tương ứng và điều chỉnh service.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CocoExportService — unit tests")
class CocoExportServiceTest {

    @Mock ProjectAccessService projectAccessService;
    @Mock TaskRepository taskRepository;
    @Mock LabelRepository labelRepository;
    @Mock AnnotationRepository annotationRepository;

    @InjectMocks CocoExportService service;

    UUID projectId;
    Project project;
    Label label1;
    Label label2;

    @BeforeEach
    void setup() {
        projectId = UUID.randomUUID();
        project = Project.builder()
                .id(projectId)
                .name("Test Project")
                .status("ACTIVE")
                .managerId(UUID.randomUUID())
                .build();

        label1 = Label.builder().id(UUID.randomUUID()).name("Stop Sign").colorHex("#ff0000").project(project).build();
        label2 = Label.builder().id(UUID.randomUUID()).name("Yield Sign").colorHex("#ffff00").project(project).build();
    }

    // ── Category mapping ───────────────────────────────────────────────────

    @Test
    @DisplayName("Labels mapped to sequential category IDs starting at 1")
    void categories_sequentialIds() {
        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1, label2));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED"))).thenReturn(List.of());

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getCategories()).hasSize(2);
        assertThat(dto.getCategories().get(0).getId()).isEqualTo(1);
        assertThat(dto.getCategories().get(0).getName()).isEqualTo("Stop Sign");
        assertThat(dto.getCategories().get(1).getId()).isEqualTo(2);
        assertThat(dto.getCategories().get(1).getName()).isEqualTo("Yield Sign");
    }

    // ── Empty project ──────────────────────────────────────────────────────

    @Test
    @DisplayName("Project with no COMPLETED tasks returns valid empty COCO JSON")
    void emptyProject_returnsValidCocoWithEmptyLists() {
        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED"))).thenReturn(List.of());

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getImages()).isEmpty();
        assertThat(dto.getAnnotations()).isEmpty();
        assertThat(dto.getInfo()).isNotNull();
        assertThat(dto.getInfo().getDescription()).isEqualTo("Test Project");
        assertThat(dto.getLicenses()).isEmpty();
    }

    // ── Image dimensions — skip logic ───────────────────────────────────────

    @Test
    @DisplayName("Images with width/height in metadata are exported correctly")
    void images_withDimensions_areExported() {
        DataSample sample = makeSample(640, 480);
        Task task = makeTask(sample);

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED"))).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of());

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getImages()).hasSize(1);
        assertThat(dto.getImages().get(0).getId()).isEqualTo(1);
        assertThat(dto.getImages().get(0).getWidth()).isEqualTo(640);
        assertThat(dto.getImages().get(0).getHeight()).isEqualTo(480);
    }

    @Test
    @DisplayName("Images missing dimensions are skipped — no entry in images or annotations")
    void images_missingDimensions_areSkipped() {
        DataSample sampleNoMeta = DataSample.builder()
                .id(UUID.randomUUID())
                .imageUrl("http://cdn/no-dim.jpg")
                .metadata(Map.of("fileName", "no-dim.jpg"))  // no width/height
                .build();
        Task taskSkipped = makeTask(sampleNoMeta);

        DataSample sampleOk = makeSample(800, 600);
        Task taskOk = makeTask(sampleOk);
        Annotation ann = makeAnnotation(taskOk, label1, 0.1, 0.2, 0.3, 0.4);

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED")))
                .thenReturn(List.of(taskSkipped, taskOk));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(taskOk.getId())))
                .thenReturn(List.of(ann));

        CocoExportDto dto = service.buildExport(projectId);

        // Only the task with dimensions is exported
        assertThat(dto.getImages()).hasSize(1);
        assertThat(dto.getImages().get(0).getWidth()).isEqualTo(800);
        assertThat(dto.getAnnotations()).hasSize(1);
    }

    @Test
    @DisplayName("Images with null metadata are skipped")
    void images_nullMetadata_areSkipped() {
        DataSample sample = DataSample.builder()
                .id(UUID.randomUUID())
                .imageUrl("http://cdn/img.jpg")
                .metadata(null)
                .build();
        Task task = makeTask(sample);

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of());
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED")))
                .thenReturn(List.of(task));

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getImages()).isEmpty();
        assertThat(dto.getAnnotations()).isEmpty();
    }

    // ── Coordinate conversion ──────────────────────────────────────────────

    @Test
    @DisplayName("Normalized geometry is correctly converted to absolute pixel bbox")
    void annotations_coordinateConversion_isCorrect() {
        DataSample sample = makeSample(640, 480);
        Task task = makeTask(sample);
        // geometry = {x:0.15, y:0.20, width:0.30, height:0.40}
        Annotation ann = makeAnnotation(task, label1, 0.15, 0.20, 0.30, 0.40);

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED"))).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of(ann));

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getAnnotations()).hasSize(1);
        List<Double> bbox = dto.getAnnotations().get(0).getBbox();
        assertThat(bbox.get(0)).isCloseTo(0.15 * 640, within(0.001));  // x_min = 96.0
        assertThat(bbox.get(1)).isCloseTo(0.20 * 480, within(0.001));  // y_min = 96.0
        assertThat(bbox.get(2)).isCloseTo(0.30 * 640, within(0.001));  // width = 192.0
        assertThat(bbox.get(3)).isCloseTo(0.40 * 480, within(0.001));  // height = 192.0
    }

    @Test
    @DisplayName("Area equals bbox_width × bbox_height")
    void annotations_area_isBboxWidthTimesHeight() {
        DataSample sample = makeSample(640, 480);
        Task task = makeTask(sample);
        Annotation ann = makeAnnotation(task, label1, 0.10, 0.10, 0.50, 0.50);

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED"))).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of(ann));

        CocoExportDto dto = service.buildExport(projectId);
        double area = dto.getAnnotations().get(0).getArea();
        double expectedArea = (0.50 * 640) * (0.50 * 480);
        assertThat(area).isCloseTo(expectedArea, within(0.001));
    }

    // ── image_id / category_id linkage ─────────────────────────────────────

    @Test
    @DisplayName("annotation.image_id correctly references the image entry")
    void annotations_imageId_matchesImage() {
        DataSample s1 = makeSample(640, 480);
        DataSample s2 = makeSample(1280, 720);
        Task t1 = makeTask(s1);
        Task t2 = makeTask(s2);
        Annotation ann1 = makeAnnotation(t1, label1, 0.1, 0.1, 0.2, 0.2);
        Annotation ann2 = makeAnnotation(t2, label2, 0.3, 0.3, 0.2, 0.2);

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1, label2));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED")))
                .thenReturn(List.of(t1, t2));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(t1.getId(), t2.getId())))
                .thenReturn(List.of(ann1, ann2));

        CocoExportDto dto = service.buildExport(projectId);

        // image IDs are 1 and 2
        assertThat(dto.getImages()).hasSize(2);
        int imgId1 = dto.getImages().get(0).getId();
        int imgId2 = dto.getImages().get(1).getId();

        // annotation image_id references should match
        assertThat(dto.getAnnotations().get(0).getImageId()).isEqualTo(imgId1);
        assertThat(dto.getAnnotations().get(1).getImageId()).isEqualTo(imgId2);
    }

    @Test
    @DisplayName("annotation.category_id correctly references the category entry")
    void annotations_categoryId_matchesCategory() {
        DataSample sample = makeSample(640, 480);
        Task task = makeTask(sample);
        Annotation ann = makeAnnotation(task, label2, 0.1, 0.1, 0.2, 0.2); // label2 → category_id=2

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1, label2));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED"))).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of(ann));

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getAnnotations().get(0).getCategoryId()).isEqualTo(2);
    }

    @Test
    @DisplayName("iscrowd is always 0")
    void annotations_iscrowd_isZero() {
        DataSample sample = makeSample(640, 480);
        Task task = makeTask(sample);
        Annotation ann = makeAnnotation(task, label1, 0.1, 0.1, 0.2, 0.2);

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, List.of("COMPLETED"))).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of(ann));

        CocoExportDto dto = service.buildExport(projectId);
        assertThat(dto.getAnnotations().get(0).getIscrowd()).isZero();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private DataSample makeSample(int width, int height) {
        Map<String, Object> meta = new HashMap<>();
        meta.put("width", width);
        meta.put("height", height);
        meta.put("fileName", "img_" + UUID.randomUUID() + ".jpg");
        return DataSample.builder()
                .id(UUID.randomUUID())
                .imageUrl("http://cdn/" + UUID.randomUUID() + ".jpg")
                .metadata(meta)
                .build();
    }

    private Task makeTask(DataSample sample) {
        return Task.builder()
                .id(UUID.randomUUID())
                .project(project)
                .sample(sample)
                .status("COMPLETED")
                .build();
    }

    private Annotation makeAnnotation(Task task, Label label,
                                      double x, double y, double w, double h) {
        Map<String, Object> geom = new HashMap<>();
        geom.put("x", x);
        geom.put("y", y);
        geom.put("width", w);
        geom.put("height", h);

        // Wire task reference back (annotation.getTask().getSample() is used)
        Annotation ann = Annotation.builder()
                .id(UUID.randomUUID())
                .task(task)
                .label(label)
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .geometry(geom)
                .isAiGenerated(false)
                .build();
        return ann;
    }
}
