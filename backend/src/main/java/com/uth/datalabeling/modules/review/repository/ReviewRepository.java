package com.uth.datalabeling.modules.review.repository;

import com.uth.datalabeling.modules.review.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    long countByReviewerId(UUID reviewerId);

    long countByReviewerIdAndActionIgnoreCase(UUID reviewerId, String action);

    @Query(value = """
            SELECT r FROM Review r
            JOIN FETCH r.task t
            JOIN FETCH t.project p
            JOIN FETCH t.sample s
            LEFT JOIN FETCH t.annotator a
            JOIN FETCH r.reviewer reviewer
            LEFT JOIN FETCH r.defectCategory dc
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:managerId IS NULL OR p.managerId = :managerId)
              AND (:reviewerScopeId IS NULL OR EXISTS (
                  SELECT projectReviewer FROM Project p2 JOIN p2.reviewers projectReviewer
                  WHERE p2 = p AND projectReviewer.id = :reviewerScopeId
              ))
              AND (:status IS NULL OR UPPER(r.action) = :status)
              AND (:annotatorId IS NULL OR a.id = :annotatorId)
            ORDER BY r.createdAt DESC
            """, countQuery = """
            SELECT COUNT(r) FROM Review r
            JOIN r.task t
            JOIN t.project p
            LEFT JOIN t.annotator a
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:managerId IS NULL OR p.managerId = :managerId)
              AND (:reviewerScopeId IS NULL OR EXISTS (
                  SELECT projectReviewer FROM Project p2 JOIN p2.reviewers projectReviewer
                  WHERE p2 = p AND projectReviewer.id = :reviewerScopeId
              ))
              AND (:status IS NULL OR UPPER(r.action) = :status)
              AND (:annotatorId IS NULL OR a.id = :annotatorId)
            """)
    Page<Review> findReviewHistory(
            @Param("projectId") UUID projectId,
            @Param("managerId") UUID managerId,
            @Param("reviewerScopeId") UUID reviewerScopeId,
            @Param("status") String status,
            @Param("annotatorId") UUID annotatorId,
            Pageable pageable);

    @Query("""
            SELECT COUNT(r) FROM Review r
            JOIN r.task t
            JOIN t.project p
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:managerId IS NULL OR p.managerId = :managerId)
              AND (:reviewerScopeId IS NULL OR EXISTS (
                  SELECT projectReviewer FROM Project p2 JOIN p2.reviewers projectReviewer
                  WHERE p2 = p AND projectReviewer.id = :reviewerScopeId
              ))
              AND UPPER(r.action) = :action
              AND r.createdAt >= :from
            """)
    long countByActionSince(
            @Param("projectId") UUID projectId,
            @Param("managerId") UUID managerId,
            @Param("reviewerScopeId") UUID reviewerScopeId,
            @Param("action") String action,
            @Param("from") LocalDateTime from);

    @Query("""
            SELECT COUNT(r) FROM Review r
            JOIN r.task t
            JOIN t.project p
            WHERE (:projectId IS NULL OR p.id = :projectId)
              AND (:managerId IS NULL OR p.managerId = :managerId)
              AND (:reviewerScopeId IS NULL OR EXISTS (
                  SELECT projectReviewer FROM Project p2 JOIN p2.reviewers projectReviewer
                  WHERE p2 = p AND projectReviewer.id = :reviewerScopeId
              ))
              AND r.createdAt >= :from
            """)
    long countReviewedSince(
            @Param("projectId") UUID projectId,
            @Param("managerId") UUID managerId,
            @Param("reviewerScopeId") UUID reviewerScopeId,
            @Param("from") LocalDateTime from);
}
