package com.uth.datalabeling.modules.dataset.repository;

import com.uth.datalabeling.modules.dataset.entity.DataSample;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.UUID;

@Repository
public interface DataSampleRepository extends JpaRepository<DataSample, UUID> {
    Page<DataSample> findAllByDatasetId(UUID datasetId, Pageable pageable);

    long countByDatasetId(UUID datasetId);

    long countByDatasetIdIn(Collection<UUID> datasetIds);
}
