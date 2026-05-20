package com.uth.datalabeling.modules.export.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * COCO format "annotations" entry — maps to an Annotation entity.
 * bbox = [x_min, y_min, width, height] in absolute pixels.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CocoAnnotation {

    private int id;

    @JsonProperty("image_id")
    private int imageId;

    @JsonProperty("category_id")
    private int categoryId;

    /** [x_min, y_min, width, height] in absolute pixel values. */
    private List<Double> bbox;

    /** Rectangle polygon derived from bbox for COCO instance-style consumers. */
    private List<List<Double>> segmentation;

    /** For bounding-box-only annotations: bbox_width × bbox_height. */
    private double area;

    /** 0 = single object, 1 = crowd (always 0 here). */
    private int iscrowd;
}
