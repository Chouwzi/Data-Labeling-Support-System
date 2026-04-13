package com.uth.datalabeling.modules.project.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.uth.datalabeling.modules.project.entity.Label;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LabelRepository extends JpaRepository<Label, UUID> {
    List<Label> findByProjectIdAndDeletedAtIsNull(UUID projectId);
    Optional<Label> findByIdAndDeletedAtIsNull(UUID id);
    Optional<Label> findByIdAndProjectIdAndDeletedAtIsNull(UUID id, UUID projectId);
    boolean existsByNameAndProjectIdAndDeletedAtIsNull(String name, UUID projectId);
    boolean existsByNameAndProjectIdAndIdNotAndDeletedAtIsNull(String name, UUID projectId, UUID id);
}
