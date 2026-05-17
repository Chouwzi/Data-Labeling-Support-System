package com.uth.datalabeling.modules.annotation.repository;

import com.uth.datalabeling.modules.annotation.entity.Annotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnotationRepository extends JpaRepository<Annotation, UUID> {
    List<Annotation> findByTaskIdOrderByCreatedAtAsc(UUID taskId);

    @Query("""
            SELECT a FROM Annotation a
            JOIN FETCH a.label
            WHERE a.task.id IN :taskIds
            ORDER BY a.task.id ASC, a.createdAt ASC
            """)
    List<Annotation> findByTaskIdInOrderByTaskIdAscCreatedAtAsc(@Param("taskIds") List<UUID> taskIds);

    @Modifying
    @Query("DELETE FROM Annotation a WHERE a.task.id = :taskId")
    void deleteByTaskId(@Param("taskId") UUID taskId);
}
