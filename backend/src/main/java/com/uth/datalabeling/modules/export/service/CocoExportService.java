package com.uth.datalabeling.modules.export.service;

import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.export.dto.*;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds a COCO-format export for all COMPLETED tasks in a given project.
 *
 * <p>Geometry conversion: annotations are stored as normalized ratios [0,1]
 * in the format {x, y, width, height} (top-left origin) — same layout as COCO.
 * Multiply each ratio by the image dimension to get absolute pixel values.</p>
 *
 * <p>Images without stored dimensions (width/height missing from metadata)
 * are SKIPPED to avoid emitting invalid COCO JSON (width=0 breaks pycocotools).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CocoExportService {

    private static final String STATUS_COMPLETED = "COMPLETED";

    ProjectAccessService projectAccessService;
    TaskRepository taskRepository;
    LabelRepository labelRepository;
    AnnotationRepository annotationRepository;

    /**
     * Builds and returns a COCO-format export DTO for the given project.
     * Access validation is performed internally via {@link ProjectAccessService}.
     *
     * @param projectId the project to export
     * @return populated {@link CocoExportDto}
     */
    @Transactional(readOnly = true)
    public CocoExportDto buildExport(UUID projectId) {
        // 1. Validate access (ADMIN or project Manager)
        Project project = projectAccessService.findProjectAndCheckAccess(projectId);

        // 2. Fetch labels → sequential category IDs
        List<Label> labels = labelRepository.findByProjectIdAndDeletedAtIsNull(projectId);
        Map<UUID, Integer> labelToCocoId = buildSequentialMap(
                labels.stream().map(Label::getId).toList());

        List<CocoCategory> categories = labels.stream()
                .map(l -> CocoCategory.builder()
                        .id(labelToCocoId.get(l.getId()))
                        .name(l.getName())
                        .supercategory("")
                        .build())
                .toList();

        // 3. Fetch COMPLETED tasks — eagerly loaded with sample to avoid N+1
        List<Task> completedTasks = taskRepository.findByProjectIdAndStatusWithSample(
                projectId, STATUS_COMPLETED);

        if (completedTasks.isEmpty()) {
            log.info("Project {} has no COMPLETED tasks — exporting empty COCO JSON", projectId);
            return emptyExport(project, categories);
        }

        // 4. Build image list — skip samples missing dimensions
        Map<UUID, Integer> sampleToCocoId = new LinkedHashMap<>();
        List<CocoImage> cocoImages = new ArrayList<>();
        List<UUID> validTaskIds = new ArrayList<>();
        int skipped = 0;

        for (Task task : completedTasks) {
            DataSample sample = task.getSample();
            if (sample == null) {
                skipped++;
                continue;
            }

            Integer width  = extractInt(sample.getMetadata(), "width");
            Integer height = extractInt(sample.getMetadata(), "height");

            if (width == null || height == null || width <= 0 || height <= 0) {
                log.warn("Skipping sample {} (task {}) — missing image dimensions in metadata",
                        sample.getId(), task.getId());
                skipped++;
                continue;
            }

            int cocoImageId = cocoImages.size() + 1;
            sampleToCocoId.put(sample.getId(), cocoImageId);
            validTaskIds.add(task.getId());

            // Extract file name from imageUrl (last segment after '/')
            String imageUrl = sample.getImageUrl();
            String fileName = imageUrl != null && imageUrl.contains("/")
                    ? imageUrl.substring(imageUrl.lastIndexOf('/') + 1)
                    : (imageUrl != null ? imageUrl : sample.getId().toString());

            cocoImages.add(CocoImage.builder()
                    .id(cocoImageId)
                    .fileName(fileName)
                    .width(width)
                    .height(height)
                    .build());
        }

        if (skipped > 0) {
            log.warn("Project {} export: {} task(s) skipped due to missing image dimensions", projectId, skipped);
        }

        // 5. Batch-fetch annotations for valid tasks
        List<CocoAnnotation> cocoAnnotations = new ArrayList<>();

        if (!validTaskIds.isEmpty()) {
            // Build task→sample lookup to get image dimensions for conversion
            Map<UUID, Task> taskById = completedTasks.stream()
                    .collect(Collectors.toMap(Task::getId, t -> t));

            List<Annotation> annotations = annotationRepository
                    .findByTaskIdInOrderByTaskIdAscCreatedAtAsc(validTaskIds);

            int annotationCounter = 1;
            for (Annotation ann : annotations) {
                UUID sampleId = ann.getTask().getSample().getId();
                Integer cocoImageId = sampleToCocoId.get(sampleId);
                if (cocoImageId == null) continue; // task was skipped

                Integer categoryId = labelToCocoId.get(ann.getLabel().getId());
                if (categoryId == null) continue; // label was deleted

                // Get image dimensions for pixel conversion
                Task t = taskById.get(ann.getTask().getId());
                int imgW = extractInt(t.getSample().getMetadata(), "width");
                int imgH = extractInt(t.getSample().getMetadata(), "height");

                Map<String, Object> geom = ann.getGeometry();
                double rx = toDouble(geom.get("x"));
                double ry = toDouble(geom.get("y"));
                double rw = toDouble(geom.get("width"));
                double rh = toDouble(geom.get("height"));

                // Convert normalized ratio → absolute pixels (top-left origin, same convention)
                double bboxX = rx * imgW;
                double bboxY = ry * imgH;
                double bboxW = rw * imgW;
                double bboxH = rh * imgH;
                double area  = bboxW * bboxH;

                cocoAnnotations.add(CocoAnnotation.builder()
                        .id(annotationCounter++)
                        .imageId(cocoImageId)
                        .categoryId(categoryId)
                        .bbox(List.of(bboxX, bboxY, bboxW, bboxH))
                        .area(area)
                        .iscrowd(0)
                        .build());
            }
        }

        // 6. Build root DTO
        return CocoExportDto.builder()
                .info(buildInfo(project))
                .licenses(List.of())
                .categories(categories)
                .images(cocoImages)
                .annotations(cocoAnnotations)
                .build();
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private CocoExportDto emptyExport(Project project, List<CocoCategory> categories) {
        return CocoExportDto.builder()
                .info(buildInfo(project))
                .licenses(List.of())
                .categories(categories)
                .images(List.of())
                .annotations(List.of())
                .build();
    }

    private CocoInfo buildInfo(Project project) {
        return CocoInfo.builder()
                .description(project.getName())
                .version("1.0")
                .year(LocalDateTime.now().getYear())
                .contributor("Data Labeling Support System")
                .dateCreated(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .build();
    }

    /**
     * Assigns a sequential integer (starting at 1) to each UUID in encounter order.
     */
    private Map<UUID, Integer> buildSequentialMap(List<UUID> ids) {
        Map<UUID, Integer> map = new LinkedHashMap<>();
        int counter = 1;
        for (UUID id : ids) {
            map.put(id, counter++);
        }
        return map;
    }

    private Integer extractInt(Map<String, Object> metadata, String key) {
        if (metadata == null) return null;
        Object val = metadata.get(key);
        if (val instanceof Number n) return n.intValue();
        return null;
    }

    private double toDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        return 0.0;
    }
}
