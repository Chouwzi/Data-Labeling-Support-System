package com.uth.datalabeling.modules.task.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class TaskProgressResponse {

    long totalTasks;
    long completed;
    long inProgress;
    long notStarted;

}