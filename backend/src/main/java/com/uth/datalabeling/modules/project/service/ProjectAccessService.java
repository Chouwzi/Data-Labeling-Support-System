package com.uth.datalabeling.modules.project.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * Dịch vụ dùng chung cho việc lấy thông tin user hiện tại
 * và kiểm tra quyền truy cập project.
 *
 * Tránh lặp lại getCurrentUser() / isAdmin() / findProjectAndCheckAccess()
 * trong nhiều Service khác nhau (DRY Principle).
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectAccessService {

    UserRepository userRepository;
    ProjectRepository projectRepository;
    TaskRepository taskRepository;

    /**
     * Lấy User hiện tại từ SecurityContext.
     */
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    /**
     * Kiểm tra user có phải ADMIN không.
     */
    public boolean isAdmin(User user) {
        return "ADMIN".equals(user.getRole());
    }

    /**
     * Tìm project và kiểm tra quyền truy cập.
     * Nếu requireManagerAccess = true, chỉ ADMIN hoặc Manager của project mới được phép.
     */
    public Project findProjectAndCheckAccess(java.util.UUID projectId, boolean requireManagerAccess) {
        Project project = projectRepository.findByIdAndDeletedAtIsNull(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND));

        if (requireManagerAccess) {
            User currentUser = getCurrentUser();
            if (!isAdmin(currentUser) && !Objects.equals(project.getManagerId(), currentUser.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }
        return project;
    }

    /**
     * Tìm project cho các API chỉ đọc.
     * ADMIN và REVIEWER được đọc tất cả, MANAGER được đọc project của mình,
     * ANNOTATOR chỉ được đọc project có task được giao.
     */
    public Project findProjectAndCheckReadAccess(java.util.UUID projectId) {
        Project project = projectRepository.findByIdAndDeletedAtIsNull(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND));
        User currentUser = getCurrentUser();

        if (isAdmin(currentUser)
                || isAssignedReviewer(projectId, currentUser)
                || Objects.equals(project.getManagerId(), currentUser.getId())
                || isAssignedAnnotator(projectId, currentUser)) {
            return project;
        }

        throw new AppException(ErrorCode.FORBIDDEN);
    }

    private boolean isAssignedAnnotator(java.util.UUID projectId, User currentUser) {
        return "ANNOTATOR".equals(currentUser.getRole())
                && taskRepository.existsByProjectIdAndAnnotatorId(projectId, currentUser.getId());
    }

    private boolean isReviewer(User currentUser) {
        return "REVIEWER".equals(currentUser.getRole());
    }

    private boolean isAssignedReviewer(java.util.UUID projectId, User currentUser) {
        return isReviewer(currentUser)
                && projectRepository.existsByIdAndReviewersId(projectId, currentUser.getId());
    }

    public void ensureUserAssignableInCurrentScope(User target) {
        User currentUser = getCurrentUser();
        if (isAdmin(currentUser)) {
            return;
        }
        java.util.UUID currentGroupId = currentUser.getGroup() != null ? currentUser.getGroup().getId() : null;
        java.util.UUID targetGroupId = target.getGroup() != null ? target.getGroup().getId() : null;
        if (currentGroupId == null || !currentGroupId.equals(targetGroupId)) {
            throw new AppException(ErrorCode.FORBIDDEN);
        }
    }

    /**
     * Tìm project và kiểm tra quyền (mặc định yêu cầu Manager access).
     */
    public Project findProjectAndCheckAccess(java.util.UUID projectId) {
        return findProjectAndCheckAccess(projectId, true);
    }
}
