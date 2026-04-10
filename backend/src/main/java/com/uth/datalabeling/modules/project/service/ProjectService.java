package com.uth.datalabeling.modules.project.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.constant.ProjectStatus;
import com.uth.datalabeling.modules.project.dto.request.ProjectCreateRequest;
import com.uth.datalabeling.modules.project.dto.response.ProjectResponse;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.mapper.ProjectMapper;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ProjectService {
    ProjectRepository projectRepository;
    UserRepository userRepository;
    ProjectMapper projectMapper;

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        // 1. Check duplicate project name (Active projects only)
        if (projectRepository.existsByNameAndDeletedAtIsNull(request.getName())) {
            throw new AppException(ErrorCode.PROJECT_ALREADY_EXISTS);
        }

        // 2. Get current manager from context
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 3. Map DTO to Entity
        Project project = projectMapper.toProject(request);
        
        // 4. Set defaults and internal fields
        project.setStatus(ProjectStatus.DRAFT);
        project.setManagerId(currentUser.getId());
        project.setCreatedBy(currentUser.getId());
        project.setUpdatedBy(currentUser.getId());

        // 5. Link labels to project (Bi-directional link for cascading)
        if (project.getLabels() != null) {
            project.getLabels().forEach(label -> label.setProject(project));
        }

        // 6. Save and return
        Project savedProject = projectRepository.save(project);
        return projectMapper.toProjectResponse(savedProject);
    }
}
