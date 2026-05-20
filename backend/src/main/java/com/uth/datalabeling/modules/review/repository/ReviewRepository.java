package com.uth.datalabeling.modules.review.repository;

import com.uth.datalabeling.modules.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    long countByReviewerId(UUID reviewerId);

    long countByReviewerIdAndActionIgnoreCase(UUID reviewerId, String action);

    long countByReviewerIdAndTaskProjectId(UUID reviewerId, UUID projectId);

    long countByReviewerIdAndTaskProjectIdAndActionIgnoreCase(UUID reviewerId, UUID projectId, String action);

    Optional<Review> findTopByTaskIdAndActionIgnoreCaseOrderByCreatedAtDesc(UUID taskId, String action);

    @Query(value = """
            SELECT r FROM Review r
            JOIN FETCH r.task t
            JOIN FETCH t.project p
            JOIN FETCH t.sample s
            LEFT JOIN FETCH t.annotator a
            JOIN FETCH r.reviewer reviewer
            LEFT JOIN FETCH r.defectCategory dc
            LEFT JOIN User manager ON manager.id = p.managerId
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:managerId IS NULL OR p.managerId = :managerId)
              AND (:reviewerGroupId IS NULL OR manager.group.id = :reviewerGroupId)
              AND (:status IS NULL OR UPPER(r.action) = :status)
              AND (:annotatorId IS NULL OR a.id = :annotatorId)
            ORDER BY r.createdAt DESC
            """, countQuery = """
            SELECT COUNT(r) FROM Review r
            JOIN r.task t
            JOIN t.project p
            LEFT JOIN t.annotator a
            LEFT JOIN User manager ON manager.id = p.managerId
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:managerId IS NULL OR p.managerId = :managerId)
              AND (:reviewerGroupId IS NULL OR manager.group.id = :reviewerGroupId)
              AND (:status IS NULL OR UPPER(r.action) = :status)
              AND (:annotatorId IS NULL OR a.id = :annotatorId)
            """)
    Page<Review> findReviewHistory(
            @Param("projectId") UUID projectId,
            @Param("managerId") UUID managerId,
            @Param("reviewerGroupId") UUID reviewerGroupId,
            @Param("status") String status,
            @Param("annotatorId") UUID annotatorId,
            Pageable pageable);

    @Query("""
            SELECT COUNT(r) FROM Review r
            JOIN r.task t
            JOIN t.project p
            LEFT JOIN User manager ON manager.id = p.managerId
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:managerId IS NULL OR p.managerId = :managerId)
              AND (:reviewerGroupId IS NULL OR manager.group.id = :reviewerGroupId)
              AND UPPER(r.action) = :action
              AND r.createdAt >= :from
            """)
    long countByActionSince(
            @Param("projectId") UUID projectId,
            @Param("managerId") UUID managerId,
            @Param("reviewerGroupId") UUID reviewerGroupId,
            @Param("action") String action,
            @Param("from") LocalDateTime from);

    @Query("""
            SELECT COUNT(r) FROM Review r
            JOIN r.task t
            JOIN t.project p
            LEFT JOIN User manager ON manager.id = p.managerId
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:managerId IS NULL OR p.managerId = :managerId)
              AND (:reviewerGroupId IS NULL OR manager.group.id = :reviewerGroupId)
              AND r.createdAt >= :from
            """)
    long countReviewedSince(
            @Param("projectId") UUID projectId,
            @Param("managerId") UUID managerId,
            @Param("reviewerGroupId") UUID reviewerGroupId,
            @Param("from") LocalDateTime from);
}
