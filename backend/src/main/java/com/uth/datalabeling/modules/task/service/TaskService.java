package com.uth.datalabeling.modules.task.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.uth.datalabeling.modules.task.dto.response.TaskProgressResponse;
import com.uth.datalabeling.modules.task.entity.TaskStatus;
import com.uth.datalabeling.modules.task.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskService {

private final TaskRepository taskRepository;

public TaskProgressResponse getProgress(UUID projectId) {

    // gọi repository để database đếm task theo status
    List<Object[]> results = taskRepository.countTasksByStatus(projectId);

    long completed = 0;
    long inProgress = 0;
    long notStarted = 0;

    for (Object[] row : results) {

        TaskStatus status = TaskStatus.valueOf((String) row[0]); // trạng thái task
        long count = ((Number) row[1]).longValue(); // số lượng task

        /*
         * kiểm tra status rồi gán vào biến tương ứng
         */
        if (status == TaskStatus.COMPLETED) {
            completed = count;
        }
        else if (status == TaskStatus.IN_PROGRESS) {
            inProgress = count;
        }
        else if (status == TaskStatus.NOT_STARTED) {
            notStarted = count;
        }
    }

    // tổng số task
    long total = completed + inProgress + notStarted;

    // trả response
    return TaskProgressResponse.builder()
            .totalTasks(total)
            .completed(completed)
            .inProgress(inProgress)
            .notStarted(notStarted)
            .build();
}
}