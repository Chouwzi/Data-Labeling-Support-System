package com.uth.datalabeling.modules.project.repository;

import java.util.Optional;
import java.util.UUID;

import com.uth.datalabeling.modules.project.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    Page<Project> findAllByDeletedAtIsNull(Pageable pageable);

    Page<Project> findAllByManagerIdAndDeletedAtIsNull(UUID managerId, Pageable pageable);

    @Query("""
            SELECT DISTINCT t.project FROM Task t
            WHERE t.annotator.id = :annotatorId
              AND t.project.deletedAt IS NULL
            """)
    Page<Project> findAssignedProjectsForAnnotator(@Param("annotatorId") UUID annotatorId, Pageable pageable);

    @Query("""
            SELECT DISTINCT p FROM Project p
            JOIN User reviewer ON reviewer.id = :reviewerId
            LEFT JOIN User manager ON manager.id = p.managerId
            WHERE reviewer.group IS NOT NULL
              AND manager.group IS NOT NULL
              AND reviewer.group.id = manager.group.id
              AND p.deletedAt IS NULL
            """)
    Page<Project> findAssignedProjectsForReviewer(@Param("reviewerId") UUID reviewerId, Pageable pageable);

    boolean existsByIdAndReviewersId(UUID projectId, UUID reviewerId);
}
