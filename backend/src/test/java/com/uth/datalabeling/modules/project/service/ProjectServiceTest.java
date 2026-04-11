package com.uth.datalabeling.modules.project.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.*;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.dto.request.LabelRequest;
import com.uth.datalabeling.modules.project.dto.request.ProjectCreateRequest;
import com.uth.datalabeling.modules.project.dto.request.ProjectUpdateRequest;
import com.uth.datalabeling.modules.project.dto.response.ProjectResponse;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.mapper.ProjectMapper;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Kiểm thử đơn vị cho ProjectService.
 */
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    ProjectRepository projectRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    ProjectMapper projectMapper;

    @InjectMocks
    ProjectService projectService;

    @Mock
    SecurityContext securityContext;

    @Mock
    Authentication authentication;

    private User mockManager;
    private Project existingProject;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        mockManager = User.builder()
                .id(UUID.randomUUID())
                .email("manager@test.com")
                .role("MANAGER")
                .build();

        existingProject = Project.builder()
                .id(projectId)
                .name("Dự án cũ")
                .managerId(mockManager.getId())
                .labels(new ArrayList<>(Collections.singletonList(
                        Label.builder().name("OldLabel").colorHex("#000000").build()
                )))
                .build();

        SecurityContextHolder.setContext(securityContext);
    }

    // Giả lập người dùng hiện tại trong Security Context
    private void mockCurrentUser() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("manager@test.com");
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(mockManager));
    }

    @Test
    void createProject_Success() {
        ProjectCreateRequest request = ProjectCreateRequest.builder().name("Dự án mới").build();
        mockCurrentUser();
        
        when(projectRepository.existsByNameAndDeletedAtIsNull("Dự án mới")).thenReturn(false);
        when(projectMapper.toProject(request)).thenReturn(new Project());
        when(projectRepository.save(any(Project.class))).thenReturn(existingProject);
        when(projectMapper.toProjectResponse(any())).thenReturn(ProjectResponse.builder().name("Dự án mới").build());

        ProjectResponse response = projectService.createProject(request);
        
        assertNotNull(response);
        verify(projectRepository).save(any());
    }

    @Test
    void updateProject_Success_WithLabelSync() {
        mockCurrentUser();
        ProjectUpdateRequest request = ProjectUpdateRequest.builder()
                .name("Tên cập nhật")
                .labels(Collections.singletonList(new LabelRequest("NewLabel", "#FFFFFF")))
                .build();

        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(existingProject));
        when(projectRepository.existsByNameAndIdNotAndDeletedAtIsNull("Tên cập nhật", projectId)).thenReturn(false);
        
        when(projectMapper.toLabel(any())).thenAnswer(invocation -> {
            LabelRequest arg = invocation.getArgument(0);
            return Label.builder().name(arg.getName()).colorHex(arg.getColorHex()).build();
        });
        
        when(projectRepository.save(any(Project.class))).thenReturn(existingProject);
        when(projectMapper.toProjectResponse(any())).thenReturn(new ProjectResponse());

        projectService.updateProject(projectId, request);

        verify(projectRepository).save(existingProject);
        assertEquals(1, existingProject.getLabels().size());
        assertEquals("NewLabel", existingProject.getLabels().get(0).getName());
    }

    @Test
    void updateProject_ForbiddenForOtherManager() {
        User otherManager = User.builder().id(UUID.randomUUID()).email("manager@test.com").role("MANAGER").build();
        existingProject.setManagerId(UUID.randomUUID());
        
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("manager@test.com");
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(otherManager));
        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(existingProject));

        assertThrows(AppException.class, () -> projectService.updateProject(projectId, new ProjectUpdateRequest()));
    }

    @Test
    void deleteProject_Success() {
        mockCurrentUser();
        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(existingProject));

        projectService.deleteProject(projectId);

        assertNotNull(existingProject.getDeletedAt());
        verify(projectRepository).save(existingProject);
    }
}
