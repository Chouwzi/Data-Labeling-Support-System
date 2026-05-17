package com.uth.datalabeling.modules.review.repository;

import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:review-queue-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class ReviewQueueRepositoryTest {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private DatasetRepository datasetRepository;

    @Autowired
    private DataSampleRepository dataSampleRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Test
    void findReviewQueueImages_FiltersPendingReviewTasksByProject() {
        User manager = saveUser("MANAGER");
        User annotator = saveUser("ANNOTATOR");
        Dataset dataset = datasetRepository.save(Dataset.builder().name("Traffic").creator(manager).build());
        Project projectA = saveProject("Project A", manager, dataset);
        Project projectB = saveProject("Project B", manager, dataset);

        Task pendingInProjectA = saveTask(projectA, saveSample(dataset, "a.jpg"), annotator, "PENDING_REVIEW");
        saveTask(projectA, saveSample(dataset, "assigned.jpg"), annotator, "ASSIGNED");
        saveTask(projectB, saveSample(dataset, "b.jpg"), annotator, "PENDING_REVIEW");

        Page<Task> page = taskRepository.findReviewQueueImages(
                projectA.getId(),
                "PENDING_REVIEW",
                PageRequest.of(0, 10));

        assertEquals(1, page.getTotalElements());
        assertEquals(pendingInProjectA.getId(), page.getContent().getFirst().getId());
    }

    @Test
    void findReviewQueueImages_WithNullProjectReturnsAllPendingReviewTasksOnly() {
        User manager = saveUser("MANAGER");
        User annotator = saveUser("ANNOTATOR");
        Dataset dataset = datasetRepository.save(Dataset.builder().name("Traffic").creator(manager).build());
        Project projectA = saveProject("Project A", manager, dataset);
        Project projectB = saveProject("Project B", manager, dataset);

        Task pendingInProjectA = saveTask(projectA, saveSample(dataset, "a.jpg"), annotator, "pending_review");
        Task pendingInProjectB = saveTask(projectB, saveSample(dataset, "b.jpg"), annotator, "PENDING_REVIEW");
        saveTask(projectA, saveSample(dataset, "done.jpg"), annotator, "DONE");

        Page<Task> page = taskRepository.findReviewQueueImages(
                null,
                "PENDING_REVIEW",
                PageRequest.of(0, 10));

        Set<UUID> taskIds = page.getContent().stream()
                .map(Task::getId)
                .collect(Collectors.toSet());

        assertEquals(2, page.getTotalElements());
        assertTrue(taskIds.contains(pendingInProjectA.getId()));
        assertTrue(taskIds.contains(pendingInProjectB.getId()));
    }

    private User saveUser(String role) {
        String suffix = UUID.randomUUID().toString();
        return userRepository.save(User.builder()
                .email(role.toLowerCase() + "-" + suffix + "@example.com")
                .fullName(role + " User")
                .password("password123")
                .role(role)
                .build());
    }

    private Project saveProject(String name, User manager, Dataset dataset) {
        return projectRepository.save(Project.builder()
                .name(name)
                .managerId(manager.getId())
                .dataset(dataset)
                .status("ACTIVE")
                .build());
    }

    private DataSample saveSample(Dataset dataset, String imageUrl) {
        return dataSampleRepository.save(DataSample.builder()
                .dataset(dataset)
                .imageUrl("uploads/" + imageUrl)
                .build());
    }

    private Task saveTask(Project project, DataSample sample, User annotator, String status) {
        return taskRepository.save(Task.builder()
                .project(project)
                .sample(sample)
                .annotator(annotator)
                .status(status)
                .build());
    }
}
