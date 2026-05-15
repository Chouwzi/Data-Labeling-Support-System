package com.uth.datalabeling.modules.project.service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.common.response.PageResponse;

import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.constant.ProjectStatus;
import com.uth.datalabeling.modules.project.dto.request.ProjectCreateRequest;
import com.uth.datalabeling.modules.project.dto.request.ProjectUpdateRequest;
import com.uth.datalabeling.modules.project.dto.response.ProjectResponse;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.mapper.ProjectMapper;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectService {

    ProjectRepository projectRepository;
    ProjectAccessService projectAccessService;
    ProjectMapper projectMapper;
    DatasetRepository datasetRepository;


    /**
     * Tạo dự án mới và khởi tạo danh sách nhãn dán.
     */
    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {

        // check trùng tên project
        if (projectRepository.existsByNameAndDeletedAtIsNull(request.getName())) {
            throw new AppException(ErrorCode.PROJECT_ALREADY_EXISTS);
        }

        User currentUser = projectAccessService.getCurrentUser();

        // map request → entity
        Project project = projectMapper.toProject(request);

        // handle dataset if provided
        if (request.getDatasetId() != null) {
            project.setDataset(datasetRepository.findById(request.getDatasetId())
                    .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND)));
        }


        // set thông tin hệ thống
        project.setStatus(ProjectStatus.DRAFT);
        project.setManagerId(currentUser.getId());
        project.setCreatedBy(currentUser.getId());
        project.setUpdatedBy(currentUser.getId());

        // thiết lập quan hệ 2 chiều label
        if (project.getLabels() != null) {
            project.getLabels().forEach(label -> label.setProject(project));
        }

        Project savedProject = projectRepository.saveAndFlush(project);

        // load lại để trả về đầy đủ (labels, dataset…)
        Project hydratedProject = reloadProjectForResponse(savedProject.getId());

        return projectMapper.toProjectResponse(hydratedProject);
    }


    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> getAllProjects(Pageable pageable) {
        User currentUser = projectAccessService.getCurrentUser();
        Page<Project> projectPage;

        if (projectAccessService.isAdmin(currentUser)) {
            projectPage = projectRepository.findAllByDeletedAtIsNull(pageable);
        } else {
            projectPage = projectRepository.findAllByManagerIdAndDeletedAtIsNull(currentUser.getId(), pageable);
        }

        return PageResponse.<ProjectResponse>builder()
                .currentPage(projectPage.getNumber())
                .totalPages(projectPage.getTotalPages())
                .pageSize(projectPage.getSize())
                .totalElements(projectPage.getTotalElements())
                .data(projectPage.getContent().stream()
                        .map(projectMapper::toProjectResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public PageResponse<ProjectResponse> getMyAssignedProjects(Pageable pageable) {
        User currentUser = projectAccessService.getCurrentUser();
        Page<Project> projectPage = projectRepository.findAssignedProjectsForAnnotator(currentUser.getId(), pageable);

        return PageResponse.<ProjectResponse>builder()
                .currentPage(projectPage.getNumber())
                .totalPages(projectPage.getTotalPages())
                .pageSize(projectPage.getSize())
                .totalElements(projectPage.getTotalElements())
                .data(projectPage.getContent().stream()
                        .map(projectMapper::toProjectResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(UUID id) {
        Project project = projectAccessService.findProjectAndCheckReadAccess(id);
        return projectMapper.toProjectResponse(project);
    }

    @Transactional
    public ProjectResponse updateProject(UUID id, ProjectUpdateRequest request) {
        Project project = projectAccessService.findProjectAndCheckAccess(id);

        if (request.getName() != null &&
                projectRepository.existsByNameAndIdNotAndDeletedAtIsNull(request.getName(), id)) {
            throw new AppException(ErrorCode.PROJECT_ALREADY_EXISTS);
        }

        if (request.getStatus() != null) {
            String normalizedStatus = request.getStatus().trim().toUpperCase();
            if (!isValidProjectStatus(normalizedStatus)) {
                throw new AppException(ErrorCode.VALIDATION_ERROR, "Trạng thái dự án không hợp lệ");
            }
            if (!isValidStatusTransition(project.getStatus(), normalizedStatus)) {
                throw new AppException(ErrorCode.CONFLICT, "Không thể chuyển trạng thái dự án");
            }
            request.setStatus(normalizedStatus);
        }

        projectMapper.updateProject(project, request);
        project.setUpdatedBy(projectAccessService.getCurrentUser().getId());

        // handle dataset update if provided
        if (request.getDatasetId() != null) {
            project.setDataset(datasetRepository.findById(request.getDatasetId())
                    .orElseThrow(() -> new AppException(ErrorCode.DATASET_NOT_FOUND)));
        }

        if (request.getLabels() != null) {
            syncLabels(project, request);
        }

        Project savedProject = projectRepository.saveAndFlush(project);
        Project hydratedProject = reloadProjectForResponse(savedProject.getId());
        return projectMapper.toProjectResponse(hydratedProject);
    }

    @Transactional
    public void deleteProject(UUID id) {
        Project project = projectAccessService.findProjectAndCheckAccess(id);
        project.setDeletedAt(LocalDateTime.now());
        project.setUpdatedBy(projectAccessService.getCurrentUser().getId());
        projectRepository.save(project);
    }

    private void syncLabels(Project project, ProjectUpdateRequest request) {
        List<Label> currentLabels = project.getLabels();
        Map<String, Label> currentLabelMap = currentLabels.stream()
                .collect(Collectors.toMap(Label::getName, l -> l));

        List<Label> updatedLabels = new ArrayList<>();
        Set<String> processedNames = new HashSet<>();

        request.getLabels().forEach(reqLabel -> {
            Label label = currentLabelMap.get(reqLabel.getName());
            if (label != null) {
                projectMapper.updateLabel(label, reqLabel);
            } else {
                label = projectMapper.toLabel(reqLabel);
                label.setProject(project);
            }
            updatedLabels.add(label);
            processedNames.add(reqLabel.getName());
        });

        List<Label> toRemove = currentLabels.stream()
                .filter(l -> !processedNames.contains(l.getName()))
                .collect(Collectors.toList());

        for (Label label : toRemove) {
            if (isLabelInUse(label)) {
                throw new AppException(ErrorCode.CONFLICT, "Nhãn dán '" + label.getName() + "' đang được sử dụng.");
            }
        }

        currentLabels.clear();
        currentLabels.addAll(updatedLabels);
    }

    private boolean isLabelInUse(Label label) {
        return false;
    }

    private Project reloadProjectForResponse(UUID projectId) {
        Project project = projectRepository.findByIdAndDeletedAtIsNull(projectId)
                .orElseThrow(() -> new AppException(ErrorCode.PROJECT_NOT_FOUND));
        project.getLabels().size();
        return project;
    }

    private boolean isValidProjectStatus(String status) {
        return ProjectStatus.DRAFT.equals(status)
                || ProjectStatus.ACTIVE.equals(status)
                || ProjectStatus.ARCHIVED.equals(status);
    }

    private boolean isValidStatusTransition(String currentStatus, String targetStatus) {
        if (currentStatus == null || targetStatus == null) {
            return false;
        }

        if (currentStatus.equals(targetStatus)) {
            return true;
        }

        return switch (currentStatus) {
            case ProjectStatus.DRAFT -> ProjectStatus.ACTIVE.equals(targetStatus)
                    || ProjectStatus.ARCHIVED.equals(targetStatus);
            case ProjectStatus.ACTIVE -> ProjectStatus.ARCHIVED.equals(targetStatus);
            case ProjectStatus.ARCHIVED -> false;
            default -> false;
        };
    }
}
