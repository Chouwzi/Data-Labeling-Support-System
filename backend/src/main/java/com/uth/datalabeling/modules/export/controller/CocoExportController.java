package com.uth.datalabeling.modules.export.controller;

import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.export.dto.CocoExportDto;
import com.uth.datalabeling.modules.export.service.CocoExportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * API endpoint to export project annotation data in COCO JSON format.
 *
 * <p>Only COMPLETED tasks are included. Images missing dimension metadata are skipped
 * to ensure the exported JSON is valid for use with pycocotools and ML pipelines.</p>
 *
 * <p>Access: ADMIN (any project) or MANAGER (own project only).</p>
 */
@Tag(name = "Export", description = "Dataset export APIs")
@RestController
@RequestMapping("/projects/{projectId}/export")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CocoExportController {

    CocoExportService cocoExportService;

    /**
     * Export project annotations as a COCO JSON file download.
     *
     * @param projectId the project to export
     * @return JSON byte stream with Content-Disposition attachment header
     */
    @GetMapping("/coco")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "EXPORT_COCO_JSON", entityType = "PROJECT", entityIdParam = "projectId")
    @Operation(
            summary = "Export COCO JSON",
            description = "Exports all COMPLETED labeled images for the project in COCO JSON format. "
                    + "Only accessible by ADMIN or the project Manager. "
                    + "Images without stored dimensions are skipped to maintain COCO validity.")
    public ResponseEntity<CocoExportDto> exportCoco(@PathVariable UUID projectId) {
        CocoExportDto dto = cocoExportService.buildExport(projectId);

        String filename = "project_" + projectId
                + "_coco_"
                + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
                + ".json";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .body(dto);
    }

    @GetMapping("/coco.zip")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    @LogActivity(action = "EXPORT_COCO_PACKAGE", entityType = "PROJECT", entityIdParam = "projectId")
    @Operation(
            summary = "Export COCO ZIP package",
            description = "Exports COMPLETED labeled images as a ZIP containing annotations/coco.json, export_manifest.json, "
                    + "and an images/ directory with the local image files when available.")
    public ResponseEntity<byte[]> exportCocoPackage(@PathVariable UUID projectId) {
        byte[] zip = cocoExportService.buildExportPackage(projectId);
        String filename = "project_" + projectId
                + "_coco_package_"
                + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE)
                + ".zip";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .header(HttpHeaders.CONTENT_TYPE, "application/zip")
                .body(zip);
    }
}
