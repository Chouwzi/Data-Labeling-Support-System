package com.uth.datalabeling.modules.project.repository;

import java.util.Optional;
import java.util.UUID;

import com.uth.datalabeling.modules.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Tầng giao tiếp dữ liệu Dự án.
 */
@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    
    boolean existsByNameAndDeletedAtIsNull(String name);
    
    // Kiểm tra trùng tên khi cập nhật, loại trừ ID hiện tại
    boolean existsByNameAndIdNotAndDeletedAtIsNull(String name, UUID id);
    
    Optional<Project> findByIdAndDeletedAtIsNull(UUID id);

    @EntityGraph(attributePaths = {"labels"})
    Page<Project> findAllByDeletedAtIsNull(Pageable pageable);

    @EntityGraph(attributePaths = {"labels"})
    Page<Project> findAllByManagerIdAndDeletedAtIsNull(UUID managerId, Pageable pageable);
}