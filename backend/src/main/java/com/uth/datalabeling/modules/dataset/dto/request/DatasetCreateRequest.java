package com.uth.datalabeling.modules.dataset.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DatasetCreateRequest {

    @NotBlank
    private String name;
}