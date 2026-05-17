package com.uth.datalabeling.modules.export.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * COCO format "categories" entry — maps to a project Label.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CocoCategory {

    private int id;
    private String name;
    private String supercategory;
}
