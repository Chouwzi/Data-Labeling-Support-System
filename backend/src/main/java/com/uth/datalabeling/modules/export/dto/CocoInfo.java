package com.uth.datalabeling.modules.export.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * COCO format "info" section — dataset metadata.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CocoInfo {

    private String description;
    private String version;
    private int year;
    private String contributor;

    @JsonProperty("date_created")
    private String dateCreated;
}
