package com.uth.datalabeling.modules.dataset.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DatasetResponse {

    private UUID id;
    private String name;
    private LocalDateTime createdAt;
}