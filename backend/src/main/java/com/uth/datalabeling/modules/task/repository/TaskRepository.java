package com.uth.datalabeling.modules.task.repository;

import com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO;
import com.uth.datalabeling.modules.task.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    @Query("SELECT new com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO(t.status, COUNT(t)) " +
           "FROM Task t WHERE t.project.id = :projectId GROUP BY t.status")
    List<TaskStatusCountDTO> countTasksByStatus(@Param("projectId") UUID projectId);
}
