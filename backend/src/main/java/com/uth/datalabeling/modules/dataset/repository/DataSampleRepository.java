package com.uth.datalabeling.modules.dataset.repository;

import com.uth.datalabeling.modules.dataset.entity.DataSample;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DataSampleRepository extends JpaRepository<DataSample, UUID> {
}
