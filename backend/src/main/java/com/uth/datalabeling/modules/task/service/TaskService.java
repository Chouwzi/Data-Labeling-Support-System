package com.uth.datalabeling.modules.task.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.review.dto.response.ReviewQueueAnnotationResponse;
import com.uth.datalabeling.modules.review.entity.Review;
import com.uth.datalabeling.modules.review.repository.ReviewRepository;
import com.uth.datalabeling.modules.task.dto.request.TaskAssignRequest;
import com.uth.datalabeling.modules.task.dto.request.TaskSplitRequest;
import com.uth.datalabeling.modules.task.dto.response.AnnotatorWorkloadResponse;
import com.uth.datalabeling.modules.task.dto.response.AssignedImageResponse;
import com.uth.datalabeling.modules.task.dto.response.BulkSubmitReadyResponse;
import com.uth.datalabeling.modules.task.dto.response.GenerateTasksResponse;
import com.uth.datalabeling.modules.task.dto.response.ProjectWorkloadResponse;
import com.uth.datalabeling.modules.task.dto.response.ReviewerWorkloadResponse;
import com.uth.datalabeling.modules.task.dto.response.TaskResponse;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.mapper.TaskMapper;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TaskService {

    TaskRepository taskRepository;
    DatasetRepository datasetRepository;
    UserRepository userRepository;
    TaskMapper taskMapper;
    ProjectAccessService projectAccessService;
    AnnotationRepository annotationRepository;
    ReviewRepository reviewRepository;

    /**
     * Tạo danh sách công việc (Tasks) từ các mẫu dữ liệu trong một tập dữ liệu (Dataset).
     */
    @Transactional
    public GenerateTasksResponse generateTasksFromDataset(UUID projectId, UUID datasetId) {
        Project project = projectAccessService.findProjectAndCheckAccess(projectId, true);

        Dataset dataset = datasetRepository.findById(datasetId)
                .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND));

        List<UUID> sampleIds = dataset.getDataSamples().stream()
                .map(sample -> sample.getId())
                .toList();
        Set<UUID> existingSampleIds = sampleIds.isEmpty()
                ? Set.of()
                : taskRepository.findExistingSampleIdsForProject(projectId, sampleIds);

        List<Task> tasksToCreate = dataset.getDataSamples().stream()
                .filter(sample -> !existingSampleIds.contains(sample.getId()))
                .map(sample -> Task.builder()
                        .project(project)
                        .sample(sample)
                        .status("PENDING")
                        .build())
                .toList();

        if (!tasksToCreate.isEmpty()) {
            taskRepository.saveAll(tasksToCreate);
        }

        return GenerateTasksResponse.builder()
                .createdCount(tasksToCreate.size())
                .skippedCount(existingSampleIds.size())
                .totalSamples(sampleIds.size())
                .build();
    }

    /**
     * Phân bổ danh sách công việc cho một người gắn nhãn (Annotator).
     */
    @Transactional
    public List<TaskResponse> assignTasks(UUID projectId, TaskAssignRequest request) {
        projectAccessService.findProjectAndCheckAccess(projectId, true);

        User annotator = userRepository.findById(request.getAnnotatorId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!"ANNOTATOR".equals(annotator.getRole())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        projectAccessService.ensureUserAssignableInCurrentScope(annotator);

        Set<UUID> requestedTaskIds = new HashSet<>(request.getTaskIds());
        List<Task> tasks = taskRepository.findAllById(requestedTaskIds);
        if (tasks.size() != requestedTaskIds.size()) {
            throw new AppException(ErrorCode.TASK_NOT_FOUND);
        }

        boolean hasTaskOutsideProject = tasks.stream()
                .anyMatch(task -> task.getProject() == null || !projectId.equals(task.getProject().getId()));
        if (hasTaskOutsideProject) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }

        LocalDateTime assignedAt = LocalDateTime.now();
        
        tasks.forEach(task -> {
            task.setAnnotator(annotator);
            task.setStatus("ASSIGNED");
            task.setAssignedAt(assignedAt);
        });

        return taskRepository.saveAll(tasks).stream()
                .map(taskMapper::toTaskResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách công việc của dự án, hỗ trợ lọc theo trạng thái.
     */
    @Transactional(readOnly = true)
    public List<TaskResponse> getTasksByProject(UUID projectId, String status) {
        projectAccessService.findProjectAndCheckReadAccess(projectId);

        List<Task> tasks = status == null || status.trim().isEmpty()
                ? taskRepository.findByProjectId(projectId)
                : taskRepository.findByProjectIdAndStatusIgnoreCase(projectId, status.trim());

        return tasks.stream()
                .map(taskMapper::toTaskResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectWorkloadResponse getProjectWorkload(UUID projectId) {
        Project project = projectAccessService.findProjectAndCheckAccess(projectId, true);
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        Map<String, Long> counts = tasks.stream()
                .collect(Collectors.groupingBy(task -> normalizeStatusValue(task.getStatus()), Collectors.counting()));

        Map<UUID, List<Task>> byAnnotator = tasks.stream()
                .filter(task -> task.getAnnotator() != null)
                .collect(Collectors.groupingBy(task -> task.getAnnotator().getId()));

        List<AnnotatorWorkloadResponse> annotators = byAnnotator.values().stream()
                .map(this::toAnnotatorWorkload)
                .sorted(java.util.Comparator.comparing(AnnotatorWorkloadResponse::getAnnotatorName,
                        java.util.Comparator.nullsLast(String::compareToIgnoreCase)))
                .toList();
        List<ReviewerWorkloadResponse> reviewers = buildReviewerWorkload(project, counts);

        return ProjectWorkloadResponse.builder()
                .unassigned(counts.getOrDefault("PENDING", 0L))
                .assigned(counts.getOrDefault("ASSIGNED", 0L) + counts.getOrDefault("READY_FOR_REVIEW", 0L))
                .inProgress(counts.getOrDefault("IN_PROGRESS", 0L))
                .pendingReview(counts.getOrDefault("PENDING_REVIEW", 0L))
                .completed(counts.getOrDefault("COMPLETED", 0L))
                .rejected(counts.getOrDefault("REJECTED", 0L))
                .total(tasks.size())
                .annotators(annotators)
                .reviewers(reviewers)
                .build();
    }

    @Transactional
    public List<TaskResponse> splitTasks(UUID projectId, TaskSplitRequest request) {
        Project project = projectAccessService.findProjectAndCheckAccess(projectId, true);
        List<User> annotators = userRepository.findAllById(request.getAnnotatorIds());
        if (annotators.size() != new HashSet<>(request.getAnnotatorIds()).size()) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        annotators.forEach(annotator -> {
            if (!"ANNOTATOR".equals(annotator.getRole())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
            projectAccessService.ensureUserAssignableInCurrentScope(annotator);
            ensureAnnotatorBelongsToProjectManagerGroup(project, annotator);
        });

        List<Task> pendingTasks = taskRepository.findByProjectIdAndStatusIgnoreCase(projectId, "PENDING");
        if (pendingTasks.isEmpty()) {
            return List.of();
        }

        List<Task> assigned = "PERCENTAGE".equalsIgnoreCase(request.getMode())
                ? splitByPercentage(pendingTasks, annotators, request)
                : splitEvenly(pendingTasks, annotators);

        LocalDateTime now = LocalDateTime.now();
        assigned.forEach(task -> {
            task.setStatus("ASSIGNED");
            task.setAssignedAt(now);
        });

        return taskRepository.saveAll(assigned).stream()
                .map(taskMapper::toTaskResponse)
                .toList();
    }

    /**
     * Lấy danh sách hình ảnh được giao cho annotator đang đăng nhập.
     */
    @Transactional(readOnly = true)
    public PageResponse<AssignedImageResponse> getMyAssignedImages(UUID projectId, String status, Pageable pageable) {
        User currentUser = projectAccessService.getCurrentUser();
        String normalizedStatus = normalizeStatus(status);
        Page<Task> taskPage = taskRepository.findAssignedImagesForAnnotator(
                currentUser.getId(),
                projectId,
                normalizedStatus,
                pageable);

        return PageResponse.<AssignedImageResponse>builder()
                .currentPage(taskPage.getNumber())
                .totalPages(taskPage.getTotalPages())
                .pageSize(taskPage.getSize())
                .totalElements(taskPage.getTotalElements())
                .data(taskPage.getContent().stream()
                        .map(this::toAssignedImageResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private String normalizeStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return null;
        }
        return status.trim().toUpperCase();
    }

    private String normalizeStatusValue(String status) {
        return status == null ? "" : status.trim().toUpperCase();
    }

    private AnnotatorWorkloadResponse toAnnotatorWorkload(List<Task> tasks) {
        User annotator = tasks.get(0).getAnnotator();
        Map<String, Long> counts = tasks.stream()
                .collect(Collectors.groupingBy(task -> normalizeStatusValue(task.getStatus()), Collectors.counting()));
        long completed = counts.getOrDefault("COMPLETED", 0L);
        long rejected = counts.getOrDefault("REJECTED", 0L);
        long reviewed = completed + rejected;
        return AnnotatorWorkloadResponse.builder()
                .annotatorId(annotator.getId())
                .annotatorName(annotator.getFullName())
                .email(annotator.getEmail())
                .assigned(counts.getOrDefault("ASSIGNED", 0L))
                .inProgress(counts.getOrDefault("IN_PROGRESS", 0L))
                .pendingReview(counts.getOrDefault("PENDING_REVIEW", 0L))
                .completed(completed)
                .rejected(rejected)
                .total(tasks.size())
                .completionRate(tasks.isEmpty() ? 0.0 : roundPercent(completed, tasks.size()))
                .rejectionRate(reviewed == 0 ? 0.0 : roundPercent(rejected, reviewed))
                .build();
    }

    private List<ReviewerWorkloadResponse> buildReviewerWorkload(Project project, Map<String, Long> counts) {
        if (project.getManagerId() == null) {
            return List.of();
        }
        return userRepository.findById(project.getManagerId())
                .map(User::getGroup)
                .map(group -> userRepository.findAllByRoleAndGroupId("REVIEWER", group.getId()).stream()
                        .map(reviewer -> {
                            long approved = reviewRepository.countByReviewerIdAndTaskProjectIdAndActionIgnoreCase(
                                    reviewer.getId(), project.getId(), "APPROVED");
                            long rejected = reviewRepository.countByReviewerIdAndTaskProjectIdAndActionIgnoreCase(
                                    reviewer.getId(), project.getId(), "REJECTED");
                            long reviewed = approved + rejected;
                            return ReviewerWorkloadResponse.builder()
                                    .reviewerId(reviewer.getId())
                                    .reviewerName(reviewer.getFullName())
                                    .email(reviewer.getEmail())
                                    .pendingReview(counts.getOrDefault("PENDING_REVIEW", 0L))
                                    .reviewed(reviewed)
                                    .approved(approved)
                                    .rejected(rejected)
                                    .approvalRate(reviewed == 0 ? 0.0 : roundPercent(approved, reviewed))
                                    .rejectionRate(reviewed == 0 ? 0.0 : roundPercent(rejected, reviewed))
                                    .build();
                        })
                        .toList())
                .orElse(List.of());
    }

    private void ensureAnnotatorBelongsToProjectManagerGroup(Project project, User annotator) {
        if (project.getManagerId() == null) {
            throw new AppException(ErrorCode.FORBIDDEN, "Assign a manager before splitting project tasks");
        }
        User manager = userRepository.findById(project.getManagerId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        UUID managerGroupId = manager.getGroup() != null ? manager.getGroup().getId() : null;
        UUID annotatorGroupId = annotator.getGroup() != null ? annotator.getGroup().getId() : null;
        if (managerGroupId == null || !managerGroupId.equals(annotatorGroupId)) {
            throw new AppException(ErrorCode.FORBIDDEN, "Annotator must belong to the project manager's group");
        }
    }

    @Transactional
    public BulkSubmitReadyResponse submitReadyImages(UUID projectId) {
        User currentUser = projectAccessService.getCurrentUser();
        if (!"ANNOTATOR".equals(currentUser.getRole())) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
        projectAccessService.findProjectAndCheckReadAccess(projectId);
        List<Task> readyTasks = taskRepository.findReadyForReviewByProjectIdAndAnnotatorId(projectId, currentUser.getId());
        long totalAssignedToProject = taskRepository.findAssignedImagesForAnnotator(
                currentUser.getId(),
                projectId,
                null,
                org.springframework.data.domain.Pageable.unpaged())
                .getTotalElements();
        readyTasks.forEach(task -> task.setStatus("PENDING_REVIEW"));
        taskRepository.saveAll(readyTasks);
        return BulkSubmitReadyResponse.builder()
                .submittedCount(readyTasks.size())
                .skippedCount(Math.max(0, totalAssignedToProject - readyTasks.size()))
                .build();
    }

    private List<Task> splitEvenly(List<Task> pendingTasks, List<User> annotators) {
        List<Task> assigned = new java.util.ArrayList<>();
        for (int i = 0; i < pendingTasks.size(); i++) {
            Task task = pendingTasks.get(i);
            task.setAnnotator(annotators.get(i % annotators.size()));
            assigned.add(task);
        }
        return assigned;
    }

    private List<Task> splitByPercentage(List<Task> pendingTasks, List<User> annotators, TaskSplitRequest request) {
        Map<UUID, Integer> percentages = request.getPercentages() == null ? Map.of() : request.getPercentages();
        int totalPercent = annotators.stream()
                .mapToInt(annotator -> percentages.getOrDefault(annotator.getId(), 0))
                .sum();
        if (totalPercent != 100) {
            throw new AppException(ErrorCode.VALIDATION_ERROR, "Percentages must add up to 100");
        }

        List<Task> assigned = new java.util.ArrayList<>();
        int cursor = 0;
        for (int i = 0; i < annotators.size(); i++) {
            User annotator = annotators.get(i);
            int count = i == annotators.size() - 1
                    ? pendingTasks.size() - cursor
                    : (int) Math.floor((pendingTasks.size() * percentages.getOrDefault(annotator.getId(), 0)) / 100.0);
            for (int j = 0; j < count && cursor < pendingTasks.size(); j++) {
                Task task = pendingTasks.get(cursor++);
                task.setAnnotator(annotator);
                assigned.add(task);
            }
        }
        while (cursor < pendingTasks.size()) {
            Task task = pendingTasks.get(cursor);
            task.setAnnotator(annotators.get(cursor % annotators.size()));
            assigned.add(task);
            cursor++;
        }
        return assigned;
    }

    private double roundPercent(long value, long total) {
        return Math.round(((double) value / (double) total) * 10000.0) / 100.0;
    }

    private AssignedImageResponse toAssignedImageResponse(Task task) {
        LocalDateTime assignedAt = task.getAssignedAt() != null ? task.getAssignedAt() : task.getCreatedAt();
        List<ReviewQueueAnnotationResponse> annotations = annotationRepository
                .findByTaskIdInOrderByTaskIdAscCreatedAtAsc(List.of(task.getId()))
                .stream()
                .map(this::toAnnotationPreview)
                .toList();
        Review latestRejection = reviewRepository
                .findTopByTaskIdAndActionIgnoreCaseOrderByCreatedAtDesc(task.getId(), "REJECTED")
                .orElse(null);
        return AssignedImageResponse.builder()
                .taskId(task.getId())
                .projectId(task.getProject().getId())
                .projectName(task.getProject().getName())
                .sampleId(task.getSample().getId())
                .imageUrl(task.getSample().getImageUrl())
                .status(task.getStatus())
                .assignedAt(assignedAt)
                .updatedAt(task.getUpdatedAt())
                .reviewerComment(latestRejection != null ? latestRejection.getComments() : null)
                .reviewerCategory(latestRejection != null && latestRejection.getDefectCategory() != null
                        ? latestRejection.getDefectCategory().getName()
                        : null)
                .annotations(annotations)
                .build();
    }

    private ReviewQueueAnnotationResponse toAnnotationPreview(Annotation annotation) {
        Label label = annotation.getLabel();
        return ReviewQueueAnnotationResponse.builder()
                .id(annotation.getId())
                .labelId(label.getId())
                .labelName(label.getName())
                .colorHex(label.getColorHex())
                .shapeType(annotation.getShapeType().name())
                .geometry(annotation.getGeometry())
                .isAiGenerated(Boolean.TRUE.equals(annotation.getIsAiGenerated()))
                .build();
    }
}
