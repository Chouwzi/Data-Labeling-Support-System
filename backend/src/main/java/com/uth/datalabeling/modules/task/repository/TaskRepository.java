package com.uth.datalabeling.modules.task.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO;
import com.uth.datalabeling.modules.task.entity.Task;

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

    /**
     * Eagerly fetches sample (and sample.dataset) for all tasks whose status
     * matches one of the provided values.
     *
     * - Trả về `List<Task>` với `sample` đã fetch sẵn để tránh N+1 khi build COCO.
     * - Tham số `statuses` là danh sách chuỗi trạng thái (đã được chuyển sang UPPER
     *   ở bên gọi trước khi truyền vào) và được sử dụng trong JPQL `IN`.
     * - Nếu muốn thay đổi logic "Hoàn thành" (ví dụ kiểm tra trong `DataSample.metadata`),
     *   thay đổi ở chỗ gọi service hoặc thêm điều kiện bổ sung.
     */
                @Query(value = """
                                                SELECT t FROM Task t
                                                JOIN FETCH t.sample s
                                                WHERE t.project.id = :projectId
                                                        AND UPPER(t.status) IN :statuses
                                                ORDER BY t.createdAt ASC
                                                """,
                                                countQuery = """
                                                SELECT COUNT(t) FROM Task t
                                                WHERE (:projectId IS NULL OR t.project.id = :projectId)
                                                        AND UPPER(t.status) IN :statuses
                                                """)
    List<Task> findByProjectIdAndStatusWithSample(
            @Param("projectId") UUID projectId,
            @Param("statuses") List<String> statuses);
}
