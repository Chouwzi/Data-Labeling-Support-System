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
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    boolean existsByProjectIdAndAnnotatorId(UUID projectId, UUID annotatorId);

    List<Task> findByProjectId(UUID projectId);

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
            WHERE (:projectId IS NULL OR t.project.id = :projectId)
              AND (:managerId IS NULL OR t.project.managerId = :managerId)
              AND UPPER(t.status) = :status
            ORDER BY t.updatedAt DESC, t.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(t) FROM Task t
            WHERE (:projectId IS NULL OR t.project.id = :projectId)
              AND (:managerId IS NULL OR t.project.managerId = :managerId)
              AND UPPER(t.status) = :status
            """)
    Page<Task> findReviewQueueImages(
            @Param("projectId") UUID projectId,
            @Param("managerId") UUID managerId,
            @Param("status") String status,
            Pageable pageable);
}
