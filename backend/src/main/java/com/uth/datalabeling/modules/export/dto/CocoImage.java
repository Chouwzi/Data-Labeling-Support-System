package com.uth.datalabeling.modules.export.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * COCO format "images" entry — maps to a DataSample.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CocoImage {

    private int id;

    @JsonProperty("file_name")
    private String fileName;

    private int width;
    private int height;
}
