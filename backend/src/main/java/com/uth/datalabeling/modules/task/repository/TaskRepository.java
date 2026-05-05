package com.uth.datalabeling.modules.task.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.uth.datalabeling.modules.task.entity.Task;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    List<Task> findByProjectId(UUID projectId);



    //để database đếm từng task luôn thay vì đếm ở service, sẽ tối ưu hơn rất nhiều
    @Query("""
        SELECT t.status, COUNT(t)
        FROM Task t
        WHERE t.projectId = :projectId
        GROUP BY t.status
    """)
    List<Object[]> countTasksByStatus(UUID projectId);

}