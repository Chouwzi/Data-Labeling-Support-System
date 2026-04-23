package com.uth.datalabeling.config;

import java.util.UUID;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner loadData(TaskRepository taskRepository) {
        return args -> {

            UUID projectId = UUID.fromString("7a6c9d34-1234-4567-89ab-111111111111");

            taskRepository.save(Task.builder()
                    .projectId(projectId)
                    .status("COMPLETED")
                    .build());

            taskRepository.save(Task.builder()
                    .projectId(projectId)
                    .status("IN_PROGRESS")
                    .build());

            taskRepository.save(Task.builder()
                    .projectId(projectId)
                    .status("NOT_STARTED")
                    .build());
        };
    }
}