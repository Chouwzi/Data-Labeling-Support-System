package com.uth.datalabeling.modules.annotation.repository;

import com.uth.datalabeling.modules.annotation.entity.Annotation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnnotationRepository extends JpaRepository<Annotation, UUID> {
    List<Annotation> findByTaskIdOrderByCreatedAtAsc(UUID taskId);

    void deleteByTaskId(UUID taskId);
}
