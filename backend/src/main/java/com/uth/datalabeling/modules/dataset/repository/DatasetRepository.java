package com.uth.datalabeling.modules.dataset.repository;

import com.uth.datalabeling.modules.dataset.entity.Dataset;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

// CRUD dataset
public interface DatasetRepository extends JpaRepository<Dataset, UUID> {
}
