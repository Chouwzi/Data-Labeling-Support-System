package com.uth.datalabeling.modules.project.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

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
            if (!isAdmin(currentUser) && !project.getManagerId().equals(currentUser.getId())) {
                throw new AppException(ErrorCode.FORBIDDEN);
            }
        }
        return project;
    }

    /**
     * Tìm project và kiểm tra quyền (mặc định yêu cầu Manager access).
     */
    public Project findProjectAndCheckAccess(java.util.UUID projectId) {
        return findProjectAndCheckAccess(projectId, true);
    }
}
