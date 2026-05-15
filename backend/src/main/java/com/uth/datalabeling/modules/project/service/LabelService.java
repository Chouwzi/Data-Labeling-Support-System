package com.uth.datalabeling.modules.project.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.project.dto.request.LabelRequest;
import com.uth.datalabeling.modules.project.dto.response.LabelResponse;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.mapper.ProjectMapper;
import com.uth.datalabeling.modules.project.repository.LabelRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LabelService {
    LabelRepository labelRepository;
    ProjectAccessService projectAccessService;
    ProjectMapper projectMapper;

    /**
     * Tạo nhãn mới trong dự án.
     */
    @Transactional
    public LabelResponse createLabel(UUID projectId, LabelRequest request) {
        Project project = projectAccessService.findProjectAndCheckAccess(projectId, true);

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
        projectAccessService.findProjectAndCheckAccess(projectId, true);

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
        projectAccessService.findProjectAndCheckAccess(projectId, true);

        Label label = labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)
                .orElseThrow(() -> new AppException(ErrorCode.LABEL_NOT_FOUND));

        // Lưu ý: Có thể bổ sung check logic isLabelInUse() tại đây khi có Module Task
        // đánh nhãn, chặn xóa (ném Exception) nếu nhãn đang được bind vào ảnh/tài liệu.
        label.setDeletedAt(LocalDateTime.now());
        labelRepository.save(label);
    }

    /**
     * Lấy danh sách toàn bộ nhãn của dự án.
     */
    @Transactional(readOnly = true)
    public List<LabelResponse> getLabelsByProject(UUID projectId) {
        projectAccessService.findProjectAndCheckReadAccess(projectId);

        List<Label> labels = labelRepository.findByProjectIdAndDeletedAtIsNull(projectId);
        return labels.stream()
                .map(projectMapper::toLabelResponse)
                .collect(Collectors.toList());
    }
}
