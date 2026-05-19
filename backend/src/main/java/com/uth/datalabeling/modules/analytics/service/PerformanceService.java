package com.uth.datalabeling.modules.analytics.service;

import com.uth.datalabeling.modules.analytics.dto.UserPerformanceResponse;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.service.ProjectAccessService;
import com.uth.datalabeling.modules.review.repository.ReviewRepository;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PerformanceService {
  UserRepository userRepository;
  TaskRepository taskRepository;
  ReviewRepository reviewRepository;
  ProjectAccessService projectAccessService;

  @Transactional(readOnly = true)
  public List<UserPerformanceResponse> getVisibleUserPerformance() {
    User currentUser = projectAccessService.getCurrentUser();
    List<User> users = projectAccessService.isAdmin(currentUser)
        ? userRepository.findAll()
        : currentUser.getGroup() == null
            ? List.of()
            : userRepository.findAllByGroupId(currentUser.getGroup().getId());
    return users.stream().map(user -> buildUserPerformance(user, null)).toList();
  }

  @Transactional(readOnly = true)
  public List<UserPerformanceResponse> getProjectPerformance(UUID projectId) {
    projectAccessService.findProjectAndCheckAccess(projectId, true);
    return taskRepository.findByProjectId(projectId).stream()
        .map(Task::getAnnotator)
        .filter(user -> user != null)
        .distinct()
        .map(user -> buildUserPerformance(user, projectId))
        .toList();
  }

  @Transactional(readOnly = true)
  public UserPerformanceResponse getMyPerformance() {
    return buildUserPerformance(projectAccessService.getCurrentUser(), null);
  }

  private UserPerformanceResponse buildUserPerformance(User user, UUID projectId) {
    List<Task> tasks = projectId == null
        ? taskRepository.findAll().stream()
            .filter(task -> task.getAnnotator() != null && user.getId().equals(task.getAnnotator().getId()))
            .toList()
        : taskRepository.findByProjectId(projectId).stream()
            .filter(task -> task.getAnnotator() != null && user.getId().equals(task.getAnnotator().getId()))
            .toList();
    Map<String, Long> counts = tasks.stream()
        .collect(Collectors.groupingBy(task -> task.getStatus() == null ? "" : task.getStatus().toUpperCase(), Collectors.counting()));
    long completed = counts.getOrDefault("COMPLETED", 0L);
    long rejected = counts.getOrDefault("REJECTED", 0L);
    long reviewed = "REVIEWER".equals(user.getRole()) ? reviewRepository.countByReviewerId(user.getId()) : completed + rejected;
    long pendingToReview = "REVIEWER".equals(user.getRole())
        ? taskRepository.countReviewQueueImages(projectId, null, user.getId(), "PENDING_REVIEW")
        : counts.getOrDefault("PENDING_REVIEW", 0L);
    long approved = "REVIEWER".equals(user.getRole()) ? reviewRepository.countByReviewerIdAndActionIgnoreCase(user.getId(), "APPROVED") : completed;
    long reviewRejected = "REVIEWER".equals(user.getRole()) ? reviewRepository.countByReviewerIdAndActionIgnoreCase(user.getId(), "REJECTED") : rejected;

    return UserPerformanceResponse.builder()
        .userId(user.getId())
        .fullName(user.getFullName())
        .email(user.getEmail())
        .role(user.getRole())
        .groupId(user.getGroup() != null ? user.getGroup().getId() : null)
        .groupName(user.getGroup() != null ? user.getGroup().getName() : null)
        .assigned(counts.getOrDefault("ASSIGNED", 0L))
        .inProgress(counts.getOrDefault("IN_PROGRESS", 0L))
        .pendingReview(counts.getOrDefault("PENDING_REVIEW", 0L))
        .completed(completed)
        .rejected(rejected)
        .reviewed(reviewed)
        .pendingToReview(pendingToReview)
        .completionRate(tasks.isEmpty() ? 0.0 : roundPercent(completed, tasks.size()))
        .approvalRate(reviewed == 0 ? 0.0 : roundPercent(approved, reviewed))
        .rejectionRate(reviewed == 0 ? 0.0 : roundPercent(reviewRejected, reviewed))
        .build();
  }

  private double roundPercent(long value, long total) {
    return Math.round(((double) value / (double) total) * 10000.0) / 100.0;
  }
}
