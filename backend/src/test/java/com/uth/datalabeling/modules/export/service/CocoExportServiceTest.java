package com.uth.datalabeling.modules.export.service;

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
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link CocoExportService}.
 * Validates coordinate conversion, image skip logic, sequential ID mapping,
 * and correct category / annotation linkage.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CocoExportService — unit tests")
class CocoExportServiceTest {

    @Mock ProjectAccessService projectAccessService;
    @Mock TaskRepository taskRepository;
    @Mock LabelRepository labelRepository;
    @Mock AnnotationRepository annotationRepository;

    @InjectMocks CocoExportService service;

    @TempDir Path tempDir;

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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of());

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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of());

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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of());

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getImages()).hasSize(1);
        assertThat(dto.getImages().get(0).getId()).isEqualTo(1);
        assertThat(dto.getImages().get(0).getWidth()).isEqualTo(640);
        assertThat(dto.getImages().get(0).getHeight()).isEqualTo(480);
    }

    @Test
    @DisplayName("COCO ZIP package includes annotations, manifest, and local image files")
    void packageExport_includesJsonManifestAndImages() throws Exception {
        Path imageFile = tempDir.resolve("sample image.jpg");
        Files.write(imageFile, new byte[] {1, 2, 3, 4});

        DataSample sample = DataSample.builder()
                .id(UUID.randomUUID())
                .imageUrl(imageFile.toString())
                .metadata(Map.of("width", 640, "height", 480, "fileName", "sample image.jpg"))
                .build();
        Task task = makeTask(sample);

        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of());

        byte[] zipBytes = service.buildExportPackage(projectId);

        assertThat(zipEntryNames(zipBytes))
                .contains("annotations/coco.json", "export_manifest.json", "images/sample_image.jpg");
    }

    @Test
    @DisplayName("COCO ZIP annotation JSON uses image-relative file_name and omits system image_url")
    void packageExport_cocoJsonUsesImageDirectoryAndNoImageUrl() throws Exception {
        Path imageFile = tempDir.resolve("sample image.jpg");
        Files.write(imageFile, new byte[] {1, 2, 3, 4});

        DataSample sample = DataSample.builder()
                .id(UUID.randomUUID())
                .imageUrl(imageFile.toString())
                .metadata(Map.of("width", 640, "height", 480))
                .build();
        Task task = makeTask(sample);

        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of());

        JsonNode cocoJson = readZipJson(service.buildExportPackage(projectId), "annotations/coco.json");

        assertThat(cocoJson.at("/images/0/file_name").asText()).isEqualTo("images/sample_image.jpg");
        assertThat(cocoJson.at("/images/0/image_url").isMissingNode()).isTrue();
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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED"))
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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED"))
                .thenReturn(List.of(task));

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getImages()).isEmpty();
        assertThat(dto.getAnnotations()).isEmpty();
    }

    @Test
    @DisplayName("Images missing metadata dimensions are exported when local file dimensions can be read")
    void images_missingMetadataDimensionsButLocalFileExists_areExported() throws Exception {
        Path imageFile = tempDir.resolve("existing.png");
        Files.write(imageFile, pngBytes(7, 5));

        DataSample sample = DataSample.builder()
                .id(UUID.randomUUID())
                .imageUrl(imageFile.toString())
                .metadata(Map.of("fileName", "existing.png"))
                .build();
        Task task = makeTask(sample);

        ReflectionTestUtils.setField(service, "uploadDir", tempDir.toString());
        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED"))
                .thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of());

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getImages()).hasSize(1);
        assertThat(dto.getImages().get(0).getWidth()).isEqualTo(7);
        assertThat(dto.getImages().get(0).getHeight()).isEqualTo(5);
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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of(task));
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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of(ann));

        CocoExportDto dto = service.buildExport(projectId);
        double area = dto.getAnnotations().get(0).getArea();
        double expectedArea = (0.50 * 640) * (0.50 * 480);
        assertThat(area).isCloseTo(expectedArea, within(0.001));
    }

    @Test
    @DisplayName("Bounding boxes include rectangle polygon segmentation for COCO instance compatibility")
    void annotations_includeRectangleSegmentation() {
        DataSample sample = makeSample(100, 50);
        Task task = makeTask(sample);
        Annotation ann = makeAnnotation(task, label1, 0.10, 0.20, 0.30, 0.40);

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(project);
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(label1));
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of(task));
        when(annotationRepository.findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId())))
                .thenReturn(List.of(ann));

        CocoExportDto dto = service.buildExport(projectId);

        assertThat(dto.getAnnotations().get(0).getSegmentation())
                .containsExactly(List.of(10.0, 10.0, 40.0, 10.0, 40.0, 30.0, 10.0, 30.0));
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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED"))
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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of(task));
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
        when(taskRepository.findByProjectIdAndStatusWithSample(projectId, "COMPLETED")).thenReturn(List.of(task));
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

    private List<String> zipEntryNames(byte[] zipBytes) throws Exception {
        List<String> names = new ArrayList<>();
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                names.add(entry.getName());
            }
        }
        return names;
    }

    private JsonNode readZipJson(byte[] zipBytes, String entryName) throws Exception {
        try (ZipInputStream zip = new ZipInputStream(new ByteArrayInputStream(zipBytes))) {
            ZipEntry entry;
            while ((entry = zip.getNextEntry()) != null) {
                if (entryName.equals(entry.getName())) {
                    return new ObjectMapper().readTree(new String(zip.readAllBytes(), StandardCharsets.UTF_8));
                }
            }
        }
        throw new AssertionError("Missing zip entry: " + entryName);
    }

    private byte[] pngBytes(int width, int height) throws Exception {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "png", output);
        return output.toByteArray();
    }
}
