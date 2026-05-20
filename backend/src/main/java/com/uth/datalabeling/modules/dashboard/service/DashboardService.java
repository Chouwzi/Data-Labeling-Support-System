package com.uth.datalabeling.modules.dashboard.service;

import com.uth.datalabeling.modules.activitylog.entity.ActivityLog;
import com.uth.datalabeling.modules.activitylog.repository.ActivityLogRepository;
import com.uth.datalabeling.modules.dashboard.dto.response.AdminDashboardResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.AuditActivityPointResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.DashboardAttentionItemResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.DashboardBreakdownItemResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.DashboardPersonMetricResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.DashboardSummaryResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.ManagerDashboardResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.ProjectHealthResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.QualitySnapshotResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.RecentActivityResponse;
import com.uth.datalabeling.modules.dashboard.dto.response.TaskPipelineItemResponse;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DashboardService {
    static List<PipelineMeta> PIPELINE = List.of(
            new PipelineMeta("PENDING", "Unassigned", "#94a3b8"),
            new PipelineMeta("ASSIGNED", "Assigned", "#38bdf8"),
            new PipelineMeta("IN_PROGRESS", "In Progress", "#f59e0b"),
            new PipelineMeta("READY_FOR_REVIEW", "Ready", "#8b5cf6"),
            new PipelineMeta("PENDING_REVIEW", "Review", "#14b8a6"),
            new PipelineMeta("COMPLETED", "Completed", "#10b981"),
            new PipelineMeta("REJECTED", "Rework", "#ef4444"));

    ProjectAccessService projectAccessService;
    ProjectRepository projectRepository;
    TaskRepository taskRepository;
    DatasetRepository datasetRepository;
    DataSampleRepository dataSampleRepository;
    UserRepository userRepository;
    ActivityLogRepository activityLogRepository;

    public ManagerDashboardResponse getManagerDashboard() {
        User manager = projectAccessService.getCurrentUser();
        List<Project> projects = projectRepository
                .findAllByManagerIdAndDeletedAtIsNull(manager.getId(), Pageable.unpaged())
                .getContent();
        Map<String, Long> counts = toStatusMap(taskRepository.countTasksByManagerId(manager.getId()));
        List<ProjectHealthResponse> projectHealth = buildProjectHealth(projects);
        long datasetImages = countDatasetImages(projects);
        DashboardSummaryResponse summary = buildSummary(projects.size(), datasetImages, counts)
                .build();

        return ManagerDashboardResponse.builder()
                .summary(summary)
                .taskPipeline(buildPipeline(counts))
                .projectHealth(projectHealth)
                .qualitySnapshot(buildQualitySnapshot(counts))
                .topAnnotators(buildTopAnnotators(manager.getId()))
                .attentionQueue(buildManagerAttention(projectHealth, counts))
                .recentActivity(buildRecentActivity())
                .build();
    }

    public AdminDashboardResponse getAdminDashboard() {
        List<Project> projects = projectRepository.findAllByDeletedAtIsNull(Pageable.unpaged()).getContent();
        Map<String, Long> counts = toStatusMap(taskRepository.countTasksByStatus());
        long datasetImages = countDatasetImages(projects);
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.countByActiveTrue();
        List<ProjectHealthResponse> projectHealth = buildProjectHealth(projects);
        long setupGaps = projectHealth.stream()
                .filter(project -> !"READY".equals(project.getReadinessState()))
                .count();

        DashboardSummaryResponse summary = buildSummary(projects.size(), datasetImages, counts)
                .totalUsers(totalUsers)
                .activeUsers(activeUsers)
                .inactiveUsers(Math.max(0, totalUsers - activeUsers))
                .totalDatasets(datasetRepository.countByDeletedAtIsNull())
                .setupGaps(setupGaps)
                .activeLabelingTasks(counts.getOrDefault("ASSIGNED", 0L) + counts.getOrDefault("IN_PROGRESS", 0L))
                .build();

        return AdminDashboardResponse.builder()
                .summary(summary)
                .roleBreakdown(buildRoleBreakdown())
                .taskPipeline(buildPipeline(counts))
                .projectSetupBreakdown(buildProjectSetupBreakdown(projectHealth))
                .auditActivity(buildAuditActivity())
                .attentionQueue(buildAdminAttention(summary, counts))
                .recentActivity(buildRecentActivity())
                .build();
    }

    private DashboardSummaryResponse.DashboardSummaryResponseBuilder buildSummary(
            long totalProjects,
            long datasetImages,
            Map<String, Long> counts) {
        long totalTasks = PIPELINE.stream().mapToLong(meta -> counts.getOrDefault(meta.status(), 0L)).sum();
        long completed = counts.getOrDefault("COMPLETED", 0L);
        long rejected = counts.getOrDefault("REJECTED", 0L);

        return DashboardSummaryResponse.builder()
                .totalProjects(totalProjects)
                .datasetImages(datasetImages)
                .totalTasks(totalTasks)
                .unassigned(counts.getOrDefault("PENDING", 0L))
                .assigned(counts.getOrDefault("ASSIGNED", 0L))
                .inProgress(counts.getOrDefault("IN_PROGRESS", 0L))
                .readyForReview(counts.getOrDefault("READY_FOR_REVIEW", 0L))
                .pendingReview(counts.getOrDefault("PENDING_REVIEW", 0L))
                .completed(completed)
                .rejected(rejected)
                .completionRate(percent(completed, totalTasks))
                .rejectionRate(percent(rejected, completed + rejected));
    }

    private List<TaskPipelineItemResponse> buildPipeline(Map<String, Long> counts) {
        return PIPELINE.stream()
                .map(meta -> TaskPipelineItemResponse.builder()
                        .status(meta.status())
                        .label(meta.label())
                        .color(meta.color())
                        .count(counts.getOrDefault(meta.status(), 0L))
                        .build())
                .toList();
    }

    private List<ProjectHealthResponse> buildProjectHealth(List<Project> projects) {
        return projects.stream()
                .map(project -> {
                    Map<String, Long> counts = toStatusMap(taskRepository.countTasksByStatus(project.getId()));
                    long totalTasks = PIPELINE.stream().mapToLong(meta -> counts.getOrDefault(meta.status(), 0L)).sum();
                    long completed = counts.getOrDefault("COMPLETED", 0L);
                    long rejected = counts.getOrDefault("REJECTED", 0L);
                    long pendingReview = counts.getOrDefault("PENDING_REVIEW", 0L);
                    long imageCount = project.getDataset() == null ? 0 : dataSampleRepository.countByDatasetId(project.getDataset().getId());
                    long labelCount = project.getLabels() == null ? 0 : project.getLabels().stream()
                            .filter(label -> label.getDeletedAt() == null)
                            .count();
                    String readiness = readinessState(project, imageCount, labelCount, totalTasks);

                    return ProjectHealthResponse.builder()
                            .id(project.getId())
                            .name(project.getName())
                            .datasetId(project.getDataset() == null ? null : project.getDataset().getId())
                            .imageCount(imageCount)
                            .labelCount(labelCount)
                            .totalTasks(totalTasks)
                            .pendingReview(pendingReview)
                            .rejected(rejected)
                            .completionRate(percent(completed, totalTasks))
                            .rejectionRate(percent(rejected, completed + rejected))
                            .readinessState(readiness)
                            .nextAction(nextAction(readiness, counts))
                            .build();
                })
                .sorted(Comparator
                        .comparing((ProjectHealthResponse project) -> severityRank(project.getReadinessState()))
                        .thenComparing(ProjectHealthResponse::getPendingReview, Comparator.reverseOrder())
                        .thenComparing(ProjectHealthResponse::getRejected, Comparator.reverseOrder()))
                .limit(8)
                .toList();
    }

    private List<DashboardPersonMetricResponse> buildTopAnnotators(UUID managerId) {
        Map<UUID, List<Task>> byAnnotator = taskRepository.findByManagerIdWithAnnotator(managerId).stream()
                .filter(task -> task.getAnnotator() != null)
                .collect(Collectors.groupingBy(task -> task.getAnnotator().getId()));

        return byAnnotator.values().stream()
                .map(tasks -> {
                    User annotator = tasks.get(0).getAnnotator();
                    Map<String, Long> counts = tasks.stream()
                            .map(Task::getStatus)
                            .filter(Objects::nonNull)
                            .collect(Collectors.groupingBy(String::toUpperCase, Collectors.counting()));
                    long total = tasks.size();
                    long completed = counts.getOrDefault("COMPLETED", 0L);
                    long rejected = counts.getOrDefault("REJECTED", 0L);

                    return DashboardPersonMetricResponse.builder()
                            .userId(annotator.getId())
                            .name(annotator.getFullName())
                            .email(annotator.getEmail())
                            .role(annotator.getRole())
                            .assigned(counts.getOrDefault("ASSIGNED", 0L))
                            .inProgress(counts.getOrDefault("IN_PROGRESS", 0L))
                            .pendingReview(counts.getOrDefault("PENDING_REVIEW", 0L))
                            .completed(completed)
                            .rejected(rejected)
                            .total(total)
                            .completionRate(percent(completed, total))
                            .rejectionRate(percent(rejected, completed + rejected))
                            .build();
                })
                .sorted(Comparator.comparing(DashboardPersonMetricResponse::getTotal).reversed())
                .limit(5)
                .toList();
    }

    private List<DashboardBreakdownItemResponse> buildRoleBreakdown() {
        return List.of(
                breakdown("ADMIN", "Admins", userRepository.countByRole("ADMIN"), "#0f766e"),
                breakdown("MANAGER", "Managers", userRepository.countByRole("MANAGER"), "#10b981"),
                breakdown("ANNOTATOR", "Annotators", userRepository.countByRole("ANNOTATOR"), "#38bdf8"),
                breakdown("REVIEWER", "Reviewers", userRepository.countByRole("REVIEWER"), "#f59e0b"));
    }

    private List<DashboardBreakdownItemResponse> buildProjectSetupBreakdown(List<ProjectHealthResponse> health) {
        Map<String, Long> counts = health.stream()
                .collect(Collectors.groupingBy(ProjectHealthResponse::getReadinessState, LinkedHashMap::new, Collectors.counting()));

        return List.of(
                breakdown("READY", "Ready", counts.getOrDefault("READY", 0L), "#10b981"),
                breakdown("MISSING_DATASET", "Missing dataset", counts.getOrDefault("MISSING_DATASET", 0L), "#ef4444"),
                breakdown("MISSING_LABELS", "Missing labels", counts.getOrDefault("MISSING_LABELS", 0L), "#f59e0b"),
                breakdown("MISSING_TASKS", "Missing tasks", counts.getOrDefault("MISSING_TASKS", 0L), "#14b8a6"));
    }

    private List<AuditActivityPointResponse> buildAuditActivity() {
        LocalDate today = LocalDate.now();
        LocalDate start = today.minusDays(6);
        Map<LocalDate, Long> counts = activityLogRepository.findByCreatedAtAfter(start.atStartOfDay()).stream()
                .filter(log -> log.getCreatedAt() != null)
                .collect(Collectors.groupingBy(log -> log.getCreatedAt().toLocalDate(), Collectors.counting()));

        List<AuditActivityPointResponse> points = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = start.plusDays(i);
            points.add(AuditActivityPointResponse.builder()
                    .date(date)
                    .count(counts.getOrDefault(date, 0L))
                    .build());
        }
        return points;
    }

    private QualitySnapshotResponse buildQualitySnapshot(Map<String, Long> counts) {
        long completed = counts.getOrDefault("COMPLETED", 0L);
        long rejected = counts.getOrDefault("REJECTED", 0L);
        return QualitySnapshotResponse.builder()
                .completed(completed)
                .rejected(rejected)
                .pendingReview(counts.getOrDefault("PENDING_REVIEW", 0L))
                .approvalRate(percent(completed, completed + rejected))
                .rejectionRate(percent(rejected, completed + rejected))
                .build();
    }

    private List<DashboardAttentionItemResponse> buildManagerAttention(
            List<ProjectHealthResponse> health,
            Map<String, Long> counts) {
        List<DashboardAttentionItemResponse> items = new ArrayList<>();
        if (counts.getOrDefault("PENDING_REVIEW", 0L) > 0) {
            items.add(attention("manager-review", "warning", "Review backlog",
                    counts.get("PENDING_REVIEW") + " images are waiting for review.",
                    "Open review queue", "/manager/review-queue"));
        }
        if (counts.getOrDefault("REJECTED", 0L) > 0) {
            items.add(attention("manager-rework", "danger", "Rejected rework",
                    counts.get("REJECTED") + " images need reassignment or correction.",
                    "Open projects", "/manager/projects"));
        }
        health.stream()
                .filter(project -> !"READY".equals(project.getReadinessState()))
                .limit(3)
                .forEach(project -> items.add(attention("manager-setup-" + project.getId(), "info",
                        project.getName(),
                        setupDescription(project.getReadinessState()),
                        "Fix setup", "/manager/projects/" + project.getId())));
        if (items.isEmpty()) {
            items.add(attention("manager-clear", "success", "Queue is clear",
                    "No setup, review, or rework blockers need attention right now.",
                    "View projects", "/manager/projects"));
        }
        return items;
    }

    private List<DashboardAttentionItemResponse> buildAdminAttention(DashboardSummaryResponse summary, Map<String, Long> counts) {
        List<DashboardAttentionItemResponse> items = new ArrayList<>();
        if (summary.getSetupGaps() > 0) {
            items.add(attention("admin-setup", "danger", "Project setup gaps",
                    summary.getSetupGaps() + " projects are missing dataset, labels, or generated tasks.",
                    "Open projects", "/admin/projects"));
        }
        if (summary.getInactiveUsers() > 0) {
            items.add(attention("admin-users", "warning", "Inactive users",
                    summary.getInactiveUsers() + " users are inactive and may need access cleanup.",
                    "Review users", "/admin/users"));
        }
        if (counts.getOrDefault("REJECTED", 0L) > 0) {
            items.add(attention("admin-quality", "warning", "Quality hotspot",
                    counts.get("REJECTED") + " rejected tasks exist across projects.",
                    "Inspect dashboards", "/admin/analytics"));
        }
        if (items.isEmpty()) {
            items.add(attention("admin-clear", "success", "Operations stable",
                    "No global setup, quality, or user access blockers are visible.",
                    "Open audit logs", "/admin/audit-logs"));
        }
        return items;
    }

    private List<RecentActivityResponse> buildRecentActivity() {
        return activityLogRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(log -> RecentActivityResponse.builder()
                        .id(log.getId())
                        .action(log.getAction())
                        .entityType(log.getEntityType())
                        .userId(log.getUserId())
                        .status(log.getStatus())
                        .createdAt(log.getCreatedAt())
                        .tone(log.getStatus() != null && log.getStatus() >= 400 ? "danger" : "neutral")
                        .build())
                .toList();
    }

    private long countDatasetImages(List<Project> projects) {
        List<UUID> datasetIds = projects.stream()
                .map(Project::getDataset)
                .filter(Objects::nonNull)
                .map(dataset -> dataset.getId())
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        return datasetIds.isEmpty() ? 0 : dataSampleRepository.countByDatasetIdIn(datasetIds);
    }

    private Map<String, Long> toStatusMap(List<TaskStatusCountDTO> counts) {
        if (counts == null) {
            return Map.of();
        }
        return counts.stream()
                .filter(dto -> dto.status() != null)
                .collect(Collectors.toMap(
                        dto -> dto.status().toUpperCase(),
                        TaskStatusCountDTO::count,
                        Long::sum));
    }

    private DashboardBreakdownItemResponse breakdown(String key, String label, long count, String color) {
        return DashboardBreakdownItemResponse.builder()
                .key(key)
                .label(label)
                .count(count)
                .color(color)
                .build();
    }

    private DashboardAttentionItemResponse attention(String id, String tone, String title, String description, String action, String path) {
        return DashboardAttentionItemResponse.builder()
                .id(id)
                .tone(tone)
                .title(title)
                .description(description)
                .action(action)
                .path(path)
                .build();
    }

    private String readinessState(Project project, long imageCount, long labelCount, long totalTasks) {
        if (project.getDataset() == null || imageCount == 0) {
            return "MISSING_DATASET";
        }
        if (labelCount == 0) {
            return "MISSING_LABELS";
        }
        if (totalTasks == 0) {
            return "MISSING_TASKS";
        }
        return "READY";
    }

    private String nextAction(String readinessState, Map<String, Long> counts) {
        if ("MISSING_DATASET".equals(readinessState)) {
            return "Attach or upload dataset images";
        }
        if ("MISSING_LABELS".equals(readinessState)) {
            return "Create label taxonomy";
        }
        if ("MISSING_TASKS".equals(readinessState)) {
            return "Generate tasks from dataset";
        }
        if (counts.getOrDefault("PENDING_REVIEW", 0L) > 0) {
            return "Review completed annotations";
        }
        if (counts.getOrDefault("REJECTED", 0L) > 0) {
            return "Reassign rejected tasks";
        }
        return "Monitor throughput";
    }

    private String setupDescription(String readinessState) {
        return switch (readinessState) {
            case "MISSING_DATASET" -> "Dataset images are missing or not linked.";
            case "MISSING_LABELS" -> "Label taxonomy is missing.";
            case "MISSING_TASKS" -> "Dataset and labels exist, but tasks are not generated.";
            default -> "Project is ready.";
        };
    }

    private int severityRank(String readinessState) {
        return switch (readinessState) {
            case "MISSING_DATASET" -> 0;
            case "MISSING_LABELS" -> 1;
            case "MISSING_TASKS" -> 2;
            default -> 3;
        };
    }

    private double percent(long value, long total) {
        if (total <= 0) {
            return 0.0;
        }
        return Math.round((value * 10000.0 / total)) / 100.0;
    }

    private record PipelineMeta(String status, String label, String color) {
    }
}
