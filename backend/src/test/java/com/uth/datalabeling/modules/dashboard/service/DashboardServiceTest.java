package com.uth.datalabeling.modules.dashboard.service;

import com.uth.datalabeling.modules.activitylog.entity.ActivityLog;
import com.uth.datalabeling.modules.activitylog.repository.ActivityLogRepository;
import com.uth.datalabeling.modules.dashboard.dto.response.AdminDashboardResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.ManagerDashboardResponse;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("DashboardService")
class DashboardServiceTest {

    @Mock
    ProjectAccessService projectAccessService;
    @Mock
    ProjectRepository projectRepository;
    @Mock
    TaskRepository taskRepository;
    @Mock
    DatasetRepository datasetRepository;
    @Mock
    DataSampleRepository dataSampleRepository;
    @Mock
    UserRepository userRepository;
    @Mock
    ActivityLogRepository activityLogRepository;

    @InjectMocks
    DashboardService dashboardService;

    @Test
    @DisplayName("manager dashboard is scoped to current manager and exposes operational queues")
    void getManagerDashboard_scopesByCurrentManager() {
        UUID managerId = UUID.randomUUID();
        UUID datasetId = UUID.randomUUID();
        Project project = project("Road Signs", managerId, datasetId, 2);

        when(projectAccessService.getCurrentUser()).thenReturn(User.builder().id(managerId).role("MANAGER").build());
        when(projectRepository.findAllByManagerIdAndDeletedAtIsNull(eq(managerId), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(project)));
        when(taskRepository.countTasksByManagerId(managerId)).thenReturn(List.of(
                new TaskStatusCountDTO("PENDING", 3L),
                new TaskStatusCountDTO("PENDING_REVIEW", 2L),
                new TaskStatusCountDTO("COMPLETED", 5L),
                new TaskStatusCountDTO("REJECTED", 1L)));
        when(taskRepository.countTasksByStatus(project.getId())).thenReturn(List.of(
                new TaskStatusCountDTO("PENDING_REVIEW", 2L),
                new TaskStatusCountDTO("COMPLETED", 5L),
                new TaskStatusCountDTO("REJECTED", 1L)));
        User ann = annotator("Ann", "ann@test.com");
        when(taskRepository.findByManagerIdWithAnnotator(managerId)).thenReturn(List.of(
                task(project, "COMPLETED", ann),
                task(project, "REJECTED", ann)));
        when(dataSampleRepository.countByDatasetIdIn(List.of(datasetId))).thenReturn(12L);
        when(dataSampleRepository.countByDatasetId(datasetId)).thenReturn(12L);
        when(activityLogRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of());

        ManagerDashboardResponse result = dashboardService.getManagerDashboard();

        assertThat(result.getSummary().getTotalProjects()).isEqualTo(1);
        assertThat(result.getSummary().getDatasetImages()).isEqualTo(12);
        assertThat(result.getSummary().getPendingReview()).isEqualTo(2);
        assertThat(result.getSummary().getRejected()).isEqualTo(1);
        assertThat(result.getTaskPipeline()).extracting("status")
                .containsExactly("PENDING", "ASSIGNED", "IN_PROGRESS", "READY_FOR_REVIEW", "PENDING_REVIEW", "COMPLETED", "REJECTED");
        assertThat(result.getProjectHealth()).hasSize(1);
        assertThat(result.getProjectHealth().get(0).getNextAction()).containsIgnoringCase("review");
        assertThat(result.getTopAnnotators()).hasSize(1);
        assertThat(result.getTopAnnotators().get(0).getRejected()).isEqualTo(1);
        assertThat(result.getAttentionQueue()).isNotEmpty();
    }

    @Test
    @DisplayName("admin dashboard aggregates global users, setup gaps, role mix, and 7-day audit activity")
    void getAdminDashboard_aggregatesGlobalOperations() {
        UUID managerId = UUID.randomUUID();
        UUID datasetId = UUID.randomUUID();
        Project readyProject = project("Ready", managerId, datasetId, 2);
        Project missingDataset = project("Missing Dataset", managerId, null, 1);

        when(projectRepository.findAllByDeletedAtIsNull(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(readyProject, missingDataset)));
        when(datasetRepository.countByDeletedAtIsNull()).thenReturn(3L);
        when(userRepository.count()).thenReturn(4L);
        when(userRepository.countByActiveTrue()).thenReturn(3L);
        when(userRepository.countByRole("ADMIN")).thenReturn(1L);
        when(userRepository.countByRole("MANAGER")).thenReturn(1L);
        when(userRepository.countByRole("ANNOTATOR")).thenReturn(1L);
        when(userRepository.countByRole("REVIEWER")).thenReturn(1L);
        when(taskRepository.countTasksByStatus()).thenReturn(List.of(
                new TaskStatusCountDTO("ASSIGNED", 4L),
                new TaskStatusCountDTO("IN_PROGRESS", 2L),
                new TaskStatusCountDTO("PENDING_REVIEW", 1L),
                new TaskStatusCountDTO("REJECTED", 1L)));
        when(taskRepository.countTasksByStatus(readyProject.getId())).thenReturn(List.of(
                new TaskStatusCountDTO("ASSIGNED", 4L),
                new TaskStatusCountDTO("IN_PROGRESS", 2L)));
        when(taskRepository.countTasksByStatus(missingDataset.getId())).thenReturn(List.of());
        when(dataSampleRepository.countByDatasetIdIn(List.of(datasetId))).thenReturn(8L);
        when(dataSampleRepository.countByDatasetId(datasetId)).thenReturn(8L);
        when(activityLogRepository.findByCreatedAtAfter(any(LocalDateTime.class))).thenReturn(List.of(
                ActivityLog.builder().action("UPDATE_CONFIG").createdAt(LocalDate.now().atStartOfDay()).build(),
                ActivityLog.builder().action("DELETE_USER").createdAt(LocalDate.now().minusDays(1).atStartOfDay()).build()));
        when(activityLogRepository.findTop5ByOrderByCreatedAtDesc()).thenReturn(List.of());

        AdminDashboardResponse result = dashboardService.getAdminDashboard();

        assertThat(result.getSummary().getTotalUsers()).isEqualTo(4);
        assertThat(result.getSummary().getInactiveUsers()).isEqualTo(1);
        assertThat(result.getSummary().getSetupGaps()).isEqualTo(1);
        assertThat(result.getSummary().getActiveLabelingTasks()).isEqualTo(6);
        assertThat(result.getRoleBreakdown()).extracting("key")
                .containsExactly("ADMIN", "MANAGER", "ANNOTATOR", "REVIEWER");
        assertThat(result.getProjectSetupBreakdown()).extracting("key")
                .contains("READY", "MISSING_DATASET");
        assertThat(result.getAuditActivity()).hasSize(7);
        assertThat(result.getAuditActivity()).anySatisfy(point -> assertThat(point.getCount()).isEqualTo(1));
        assertThat(result.getAttentionQueue()).isNotEmpty();
    }

    private Project project(String name, UUID managerId, UUID datasetId, int labels) {
        Dataset dataset = datasetId == null ? null : Dataset.builder().id(datasetId).name(name + " dataset").build();
        Project project = Project.builder()
                .id(UUID.randomUUID())
                .name(name)
                .managerId(managerId)
                .dataset(dataset)
                .status("ACTIVE")
                .build();
        for (int i = 0; i < labels; i++) {
            project.getLabels().add(Label.builder().id(UUID.randomUUID()).name("Label " + i).project(project).build());
        }
        return project;
    }

    private User annotator(String name, String email) {
        return User.builder().id(UUID.randomUUID()).fullName(name).email(email).role("ANNOTATOR").build();
    }

    private Task task(Project project, String status, User annotator) {
        return Task.builder()
                .id(UUID.randomUUID())
                .project(project)
                .status(status)
                .annotator(annotator)
                .build();
    }
}
