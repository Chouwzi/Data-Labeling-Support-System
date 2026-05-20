package com.uth.datalabeling.modules.export.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
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
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;
import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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
    private static final String IMAGE_ENTRY_PREFIX = "images/";
    private static final String ANNOTATION_ENTRY = "annotations/coco.json";
    private static final String MANIFEST_ENTRY = "export_manifest.json";

    ProjectAccessService projectAccessService;
    TaskRepository taskRepository;
    LabelRepository labelRepository;
    AnnotationRepository annotationRepository;

    @NonFinal
    @Value("${app.upload.dir:uploads/}")
    String uploadDir;

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
        Map<UUID, ImageDimensions> dimensionsBySampleId = new LinkedHashMap<>();
        List<CocoImage> cocoImages = new ArrayList<>();
        List<UUID> validTaskIds = new ArrayList<>();
        int skipped = 0;

        for (Task task : completedTasks) {
            DataSample sample = task.getSample();
            if (sample == null) {
                skipped++;
                continue;
            }

            ImageDimensions dimensions = resolveImageDimensions(sample);

            if (dimensions == null) {
                log.warn("Skipping sample {} (task {}) — unable to determine image dimensions",
                        sample.getId(), task.getId());
                skipped++;
                continue;
            }

            int cocoImageId = cocoImages.size() + 1;
            sampleToCocoId.put(sample.getId(), cocoImageId);
            dimensionsBySampleId.put(sample.getId(), dimensions);
            validTaskIds.add(task.getId());

            // Extract file name from imageUrl (last segment after '/')
            String imageUrl = sample.getImageUrl();
            String fileName = imageUrl != null && imageUrl.contains("/")
                    ? imageUrl.substring(imageUrl.lastIndexOf('/') + 1)
                    : (imageUrl != null ? imageUrl : sample.getId().toString());

            cocoImages.add(CocoImage.builder()
                    .id(cocoImageId)
                    .fileName(fileName)
                    .imageUrl(imageUrl)
                    .width(dimensions.width())
                    .height(dimensions.height())
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

                Task t = taskById.get(ann.getTask().getId());
                ImageDimensions dimensions = dimensionsBySampleId.get(t.getSample().getId());
                if (dimensions == null) continue;
                int imgW = dimensions.width();
                int imgH = dimensions.height();

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
                List<Double> segmentation = List.of(
                        bboxX, bboxY,
                        bboxX + bboxW, bboxY,
                        bboxX + bboxW, bboxY + bboxH,
                        bboxX, bboxY + bboxH);

                cocoAnnotations.add(CocoAnnotation.builder()
                        .id(annotationCounter++)
                        .imageId(cocoImageId)
                        .categoryId(categoryId)
                        .bbox(List.of(bboxX, bboxY, bboxW, bboxH))
                        .segmentation(List.of(segmentation))
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

    @Transactional(readOnly = true)
    public byte[] buildExportPackage(UUID projectId) {
        CocoExportDto export = buildExport(projectId);
        ObjectMapper objectMapper = new ObjectMapper();
        List<ImagePackageEntry> imageEntries = prepareImageEntries(export);
        long includedImages = imageEntries.stream().filter(ImagePackageEntry::included).count();
        Map<String, Object> manifest = buildPackageManifest(export, imageEntries, includedImages);

        try (ByteArrayOutputStream output = new ByteArrayOutputStream();
             ZipOutputStream zip = new ZipOutputStream(output)) {

            writeJsonEntry(zip, objectMapper, ANNOTATION_ENTRY, export);
            writeJsonEntry(zip, objectMapper, MANIFEST_ENTRY, manifest);

            for (ImagePackageEntry entry : imageEntries) {
                if (!entry.included()) {
                    continue;
                }
                zip.putNextEntry(new ZipEntry(IMAGE_ENTRY_PREFIX + entry.fileName()));
                Files.copy(entry.path(), zip);
                zip.closeEntry();
            }

            if (!export.getImages().isEmpty() && includedImages == 0) {
                log.warn("COCO package built with {} image reference(s), but no local image files were included. Check app.upload.dir={}",
                        export.getImages().size(), uploadDir);
            }

            zip.finish();
            return output.toByteArray();
        } catch (IOException ex) {
            throw new AppException(ErrorCode.INTERNAL_SERVER_ERROR, "Unable to build export package");
        }
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

    private ImageDimensions resolveImageDimensions(DataSample sample) {
        Integer width = extractInt(sample.getMetadata(), "width");
        Integer height = extractInt(sample.getMetadata(), "height");
        if (width != null && height != null && width > 0 && height > 0) {
            return new ImageDimensions(width, height);
        }

        Path imagePath = resolveLocalImagePath(sample.getImageUrl());
        if (imagePath == null) {
            return null;
        }

        try {
            BufferedImage image = ImageIO.read(imagePath.toFile());
            if (image != null && image.getWidth() > 0 && image.getHeight() > 0) {
                return new ImageDimensions(image.getWidth(), image.getHeight());
            }
        } catch (IOException ex) {
            log.warn("Unable to read dimensions for local image {}", imagePath);
        }
        return null;
    }

    private double toDouble(Object val) {
        if (val instanceof Number n) return n.doubleValue();
        return 0.0;
    }

    private Path resolveLocalImagePath(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank() || imageUrl.startsWith("http")) {
            return null;
        }

        Path directPath = Path.of(imageUrl).toAbsolutePath().normalize();
        if (Files.isRegularFile(directPath)) {
            return directPath;
        }

        String normalized = stripQuery(imageUrl).replace("\\", "/");
        Path uploadRoot = Path.of(uploadDir == null || uploadDir.isBlank() ? "uploads/" : uploadDir)
                .toAbsolutePath()
                .normalize();
        List<String> candidates = buildUploadRelativeCandidates(normalized);

        for (String candidate : candidates) {
            Path resolved = uploadRoot.resolve(candidate).normalize();
            if (resolved.startsWith(uploadRoot) && Files.isRegularFile(resolved)) {
                return resolved;
            }
        }

        return null;
    }

    private List<ImagePackageEntry> prepareImageEntries(CocoExportDto export) {
        Set<String> usedFileNames = new HashSet<>();
        List<ImagePackageEntry> entries = new ArrayList<>();

        for (CocoImage image : export.getImages()) {
            String fileName = uniqueZipFileName(image.getFileName(), image.getId(), usedFileNames);
            image.setFileName(IMAGE_ENTRY_PREFIX + fileName);
            Path imagePath = resolveLocalImagePath(image.getImageUrl());
            boolean included = imagePath != null && Files.isRegularFile(imagePath);
            entries.add(new ImagePackageEntry(
                    image.getId(),
                    fileName,
                    image.getImageUrl(),
                    included ? imagePath : null,
                    included));
        }

        return entries;
    }

    private void writeJsonEntry(ZipOutputStream zip, ObjectMapper objectMapper, String entryName, Object value)
            throws IOException {
        zip.putNextEntry(new ZipEntry(entryName));
        zip.write(objectMapper.writerWithDefaultPrettyPrinter().writeValueAsBytes(value));
        zip.closeEntry();
    }

    private Map<String, Object> buildPackageManifest(
            CocoExportDto export,
            List<ImagePackageEntry> imageEntries,
            long includedImages) {
        Map<String, Object> manifest = new LinkedHashMap<>();
        manifest.put("format", "COCO object detection");
        manifest.put("annotation_file", ANNOTATION_ENTRY);
        manifest.put("image_root", IMAGE_ENTRY_PREFIX.substring(0, IMAGE_ENTRY_PREFIX.length() - 1));
        manifest.put("completed_images_expected", export.getImages().size());
        manifest.put("images_included", includedImages);
        manifest.put("images_missing", export.getImages().size() - includedImages);
        manifest.put("notes", "Train with annotations/coco.json and use the images directory as the image root. Only COMPLETED tasks are exported.");

        List<Map<String, Object>> images = imageEntries.stream()
                .map(entry -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("image_id", entry.imageId());
                    item.put("file_name", entry.fileName());
                    item.put("zip_path", entry.included() ? IMAGE_ENTRY_PREFIX + entry.fileName() : null);
                    item.put("included", entry.included());
                    item.put("source", entry.source() == null ? "" : entry.source());
                    return item;
                })
                .toList();
        manifest.put("images", images);
        return manifest;
    }

    private List<String> buildUploadRelativeCandidates(String normalized) {
        List<String> candidates = new ArrayList<>();
        String clean = stripLeadingSlash(normalized);
        String lower = clean.toLowerCase(Locale.ROOT);

        int apiUploadsIndex = lower.indexOf("api/v1/uploads/");
        if (apiUploadsIndex >= 0) {
            candidates.add(clean.substring(apiUploadsIndex + "api/v1/uploads/".length()));
        }

        int uploadsIndex = lower.indexOf("uploads/");
        if (uploadsIndex >= 0) {
            candidates.add(clean.substring(uploadsIndex + "uploads/".length()));
        }

        if (!clean.contains("/")) {
            candidates.add(clean);
        } else {
            candidates.add(clean.substring(clean.lastIndexOf('/') + 1));
        }

        return candidates.stream()
                .filter(candidate -> candidate != null && !candidate.isBlank() && !candidate.contains(".."))
                .distinct()
                .toList();
    }

    private String stripQuery(String value) {
        int queryIndex = value.indexOf('?');
        return queryIndex >= 0 ? value.substring(0, queryIndex) : value;
    }

    private String stripLeadingSlash(String value) {
        String result = value;
        while (result.startsWith("/")) {
            result = result.substring(1);
        }
        return result;
    }

    private String uniqueZipFileName(String fileName, int imageId, Set<String> usedFileNames) {
        String clean = fileName == null || fileName.isBlank()
                ? "image_" + imageId + ".jpg"
                : fileName.replace("\\", "/");
        clean = stripQuery(clean);
        clean = clean.substring(clean.lastIndexOf('/') + 1);
        clean = clean.replaceAll("[^A-Za-z0-9._-]", "_");
        if (clean.isBlank() || clean.equals(".") || clean.equals("..")) {
            clean = "image_" + imageId + ".jpg";
        }
        if (usedFileNames.add(clean)) {
            return clean;
        }

        int dotIndex = clean.lastIndexOf('.');
        String base = dotIndex > 0 ? clean.substring(0, dotIndex) : clean;
        String extension = dotIndex > 0 ? clean.substring(dotIndex) : "";
        String candidate = base + "_" + imageId + extension;
        int suffix = 2;
        while (!usedFileNames.add(candidate)) {
            candidate = base + "_" + imageId + "_" + suffix++ + extension;
        }
        return candidate;
    }

    private record ImagePackageEntry(
            int imageId,
            String fileName,
            String source,
            Path path,
            boolean included) {
    }

    private record ImageDimensions(int width, int height) {
    }
}
