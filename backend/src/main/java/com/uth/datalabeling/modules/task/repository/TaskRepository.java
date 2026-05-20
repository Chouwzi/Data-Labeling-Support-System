package com.uth.datalabeling.modules.task.repository;

import com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO;
import com.uth.datalabeling.modules.task.entity.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

        boolean existsByProjectIdAndAnnotatorId(UUID projectId, UUID annotatorId);

        boolean existsByProjectIdAndSampleId(UUID projectId, UUID sampleId);

        List<Task> findByProjectId(UUID projectId);

        List<Task> findBySampleId(UUID sampleId);

        @Query("SELECT t.sample.id FROM Task t WHERE t.project.id = :projectId AND t.sample.id IN :sampleIds")
        Set<UUID> findExistingSampleIdsForProject(
                        @Param("projectId") UUID projectId,
                        @Param("sampleIds") List<UUID> sampleIds);

        long countByStatusIgnoreCase(String status);

        List<Task> findByProjectIdAndStatusIgnoreCase(UUID projectId, String status);

        @Query("SELECT new com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO(t.status, COUNT(t)) " +
                        "FROM Task t WHERE t.project.id = :projectId GROUP BY t.status")
        List<TaskStatusCountDTO> countTasksByStatus(@Param("projectId") UUID projectId);

        @Query("""
                        SELECT t FROM Task t
                        WHERE t.annotator.id = :annotatorId
                          AND (:projectId IS NULL OR t.project.id = :projectId)
                          AND (:status IS NULL OR UPPER(t.status) = :status)
                        ORDER BY t.assignedAt DESC, t.createdAt DESC
                        """)
        Page<Task> findAssignedImagesForAnnotator(
                        @Param("annotatorId") UUID annotatorId,
                        @Param("projectId") UUID projectId,
                        @Param("status") String status,
                        Pageable pageable);

        @Query(value = """
                        SELECT t FROM Task t
                        JOIN FETCH t.project
                        JOIN FETCH t.sample
                        LEFT JOIN FETCH t.annotator
                        LEFT JOIN User manager ON manager.id = t.project.managerId
                        WHERE (:projectId IS NULL OR t.project.id = :projectId)
                          AND (:managerId IS NULL OR t.project.managerId = :managerId)
                          AND (:reviewerGroupId IS NULL OR manager.group.id = :reviewerGroupId)
                          AND UPPER(t.status) = :status
                        ORDER BY t.updatedAt DESC, t.createdAt DESC
                        """, countQuery = """
                        SELECT COUNT(t) FROM Task t
                        LEFT JOIN User manager ON manager.id = t.project.managerId
                        WHERE (:projectId IS NULL OR t.project.id = :projectId)
                          AND (:managerId IS NULL OR t.project.managerId = :managerId)
                          AND (:reviewerGroupId IS NULL OR manager.group.id = :reviewerGroupId)
                          AND UPPER(t.status) = :status
                        """)
        Page<Task> findReviewQueueImages(
                        @Param("projectId") UUID projectId,
                        @Param("managerId") UUID managerId,
                        @Param("reviewerGroupId") UUID reviewerGroupId,
                        @Param("status") String status,
                        Pageable pageable);

        default Page<Task> findReviewQueueImages(UUID projectId, UUID managerId, String status, Pageable pageable) {
                return findReviewQueueImages(projectId, managerId, null, status, pageable);
        }

        @Query("""
                        SELECT COUNT(t) FROM Task t
                        LEFT JOIN User manager ON manager.id = t.project.managerId
                        WHERE (:projectId IS NULL OR t.project.id = :projectId)
                          AND (:managerId IS NULL OR t.project.managerId = :managerId)
                          AND (:reviewerGroupId IS NULL OR manager.group.id = :reviewerGroupId)
                          AND UPPER(t.status) = :status
                        """)
        long countReviewQueueImages(
                        @Param("projectId") UUID projectId,
                        @Param("managerId") UUID managerId,
                        @Param("reviewerGroupId") UUID reviewerGroupId,
                        @Param("status") String status);

        default long countReviewQueueImages(UUID projectId, UUID managerId, String status) {
                return countReviewQueueImages(projectId, managerId, null, status);
        }

        /**
         * Eagerly fetches sample (and sample.dataset) for all COMPLETED tasks in a
         * project.
         * Avoids N+1 queries during COCO JSON export.
         */
        @Query("""
                        SELECT t FROM Task t
                        JOIN FETCH t.sample s
                        WHERE t.project.id = :projectId
                          AND UPPER(t.status) = UPPER(:status)
                        ORDER BY t.createdAt ASC
                        """)
        List<Task> findByProjectIdAndStatusWithSample(
                        @Param("projectId") UUID projectId,
                        @Param("status") String status);

        @Query("""
                        SELECT t FROM Task t
                        WHERE t.project.id = :projectId
                          AND t.annotator.id = :annotatorId
                          AND UPPER(t.status) = 'READY_FOR_REVIEW'
                        """)
        List<Task> findReadyForReviewByProjectIdAndAnnotatorId(
                        @Param("projectId") UUID projectId,
                        @Param("annotatorId") UUID annotatorId);
}
