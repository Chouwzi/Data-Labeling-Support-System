package com.uth.datalabeling.modules.project.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.dto.request.LabelRequest;
import com.uth.datalabeling.modules.project.dto.request.ProjectCreateRequest;
import com.uth.datalabeling.modules.project.dto.response.ProjectResponse;
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

    private ProjectCreateRequest validRequest;
    private User mockUser;
    private Project mockProject;
    private ProjectResponse mockResponse;

    @BeforeEach
    void setUp() {
        validRequest = ProjectCreateRequest.builder()
                .name("Test Project")
                .description("Desc")
                .labels(Collections.singletonList(new LabelRequest("Car", "#FF0000")))
                .build();

        mockUser = User.builder()
                .id(UUID.randomUUID())
                .email("manager@test.com")
                .build();

        mockProject = Project.builder()
                .name("Test Project")
                .build();

        mockResponse = ProjectResponse.builder()
                .id(UUID.randomUUID())
                .name("Test Project")
                .build();

        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void createProject_Success_ReturnsResponse() {
        // Arrange
        when(projectRepository.existsByNameAndDeletedAtIsNull(validRequest.getName())).thenReturn(false);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("manager@test.com");
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(mockUser));
        when(projectMapper.toProject(validRequest)).thenReturn(mockProject);
        when(projectRepository.save(any(Project.class))).thenReturn(mockProject);
        when(projectMapper.toProjectResponse(mockProject)).thenReturn(mockResponse);

        // Act
        ProjectResponse result = projectService.createProject(validRequest);

        // Assert
        assertNotNull(result);
        assertEquals("Test Project", result.getName());
        verify(projectRepository, times(1)).save(any(Project.class));
    }

    @Test
    void createProject_DuplicateName_ThrowsException() {
        // Arrange
        when(projectRepository.existsByNameAndDeletedAtIsNull(validRequest.getName())).thenReturn(true);

        // Act & Assert
        AppException exception = assertThrows(AppException.class, () -> projectService.createProject(validRequest));
        assertEquals(ErrorCode.PROJECT_ALREADY_EXISTS, exception.getErrorCode());
        verify(projectRepository, never()).save(any(Project.class));
    }
}
