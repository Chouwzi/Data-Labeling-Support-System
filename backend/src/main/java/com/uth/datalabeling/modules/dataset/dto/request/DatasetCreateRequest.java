package com.uth.datalabeling.modules.dataset.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;
@Data
public class DatasetCreateRequest {

    @NotBlank
    private String name;

    private UUID projectId;
}