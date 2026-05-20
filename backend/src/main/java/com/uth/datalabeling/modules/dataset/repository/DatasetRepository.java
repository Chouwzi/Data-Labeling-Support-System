package com.uth.datalabeling.modules.dataset.repository;

import com.uth.datalabeling.modules.dataset.entity.Dataset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DatasetRepository extends JpaRepository<Dataset, UUID> {
    List<Dataset> findAllByDeletedAtIsNull();

    Page<Dataset> findAllByDeletedAtIsNull(Pageable pageable);

    Optional<Dataset> findByIdAndDeletedAtIsNull(UUID id);
}
