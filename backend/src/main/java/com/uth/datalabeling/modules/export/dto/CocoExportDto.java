package com.uth.datalabeling.modules.export.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Root COCO dataset export structure.
 * Spec: https://cocodataset.org/#format-data
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CocoExportDto {

    private CocoInfo info;

    /** Typically empty for custom datasets. */
    private List<Object> licenses;

    private List<CocoCategory> categories;
    private List<CocoImage> images;
    private List<CocoAnnotation> annotations;
}
