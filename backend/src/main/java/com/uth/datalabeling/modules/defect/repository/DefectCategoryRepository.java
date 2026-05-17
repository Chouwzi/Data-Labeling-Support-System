package com.uth.datalabeling.modules.defect.repository;

import com.uth.datalabeling.modules.defect.entity.DefectCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface DefectCategoryRepository extends JpaRepository<DefectCategory, UUID> {
}
