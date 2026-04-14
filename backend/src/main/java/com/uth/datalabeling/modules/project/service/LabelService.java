package com.uth.datalabeling.modules.project.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.dto.request.LabelRequest;
import com.uth.datalabeling.modules.project.dto.response.LabelResponse;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.mapper.ProjectMapper;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LabelService {
    LabelRepository labelRepository;
    ProjectRepository projectRepository;
    UserRepository userRepository;
    ProjectMapper projectMapper;

    /**
     * Tạo nhãn mới trong dự án.
     */
    @Transactional
    public LabelResponse createLabel(UUID projectId, LabelRequest request) {
        Project project = findProjectAndCheckAccess(projectId, true);

        if (labelRepository.existsByNameAndProjectIdAndDeletedAtIsNull(request.getName(), projectId)) {
            throw new AppException(ErrorCode.LABEL_ALREADY_EXISTS);
        }

        Label label = projectMapper.toLabel(request);
        label.setProject(project);

        // Đảm bảo các trường do DB tạo (createdAt, updatedAt) có giá trị
        Label savedLabel = labelRepository.saveAndFlush(label);
        Label hydratedLabel = labelRepository.findByIdAndDeletedAtIsNull(savedLabel.getId())
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));
        return projectMapper.toLabelResponse(hydratedLabel);
    }

    /**
     * Cập nhật thông tin nhãn.
     */
    @Transactional
    public LabelResponse updateLabel(UUID projectId, UUID labelId, LabelRequest request) {
        findProjectAndCheckAccess(projectId, true);

        Label label = labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));

        if (request.getName() != null &&
                labelRepository.existsByNameAndProjectIdAndIdNotAndDeletedAtIsNull(request.getName(), projectId,
                        labelId)) {
            throw new AppException(ErrorCode.LABEL_ALREADY_EXISTS);
        }

        projectMapper.updateLabel(label, request);

        // Ghi ngay thay đổi để các trường do DB sinh có giá trị, sau đó tải lại
        Label savedLabel = labelRepository.saveAndFlush(label);
        Label hydratedLabel = labelRepository.findByIdAndDeletedAtIsNull(savedLabel.getId())
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));
        return projectMapper.toLabelResponse(hydratedLabel);
    }

    /**
     * Xóa mềm một nhãn.
     */
    @Transactional
    public void deleteLabel(UUID projectId, UUID labelId) {
        findProjectAndCheckAccess(projectId, true);

        Label label = labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));

        // Lưu ý: Có thể bổ sung check logic isLabelInUse() tại đây khi có Module Task
        // đánh nhãn,
        // chặn xóa (ném Exception) nếu nhãn đang được bind vào ảnh/tài liệu.
        label.setDeletedAt(LocalDateTime.now());
        labelRepository.save(label);
    }

    /**
     * Lấy danh sách toàn bộ nhãn của dự án.
     */
    public List<LabelResponse> getLabelsByProject(UUID projectId) {
        // Có thể cho phép lấy mà không cần check access ở mức Service vì Controller đã
        // dùng @PreAuthorize.
        // Chỉ cần đảm bảo Project tồn tại trước khi lấy API.
        projectRepository.findByIdAndDeletedAtIsNull(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND));

        List<Label> labels = labelRepository.findByProjectIdAndDeletedAtIsNull(projectId);
        return labels.stream()
                .map(projectMapper::toLabelResponse)
                .collect(Collectors.toList());
    }

    private Project findProjectAndCheckAccess(UUID projectId, boolean requireManagerAccess) {
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

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
    }

    private boolean isAdmin(User user) {
        return "ADMIN".equals(user.getRole());
    }
}
