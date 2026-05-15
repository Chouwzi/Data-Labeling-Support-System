package com.uth.datalabeling.modules.project.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class ProjectAccessServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    ProjectRepository projectRepository;

    @Mock
    TaskRepository taskRepository;

    @InjectMocks
    ProjectAccessService projectAccessService;

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void findProjectAndCheckReadAccess_AllowsAnnotatorAssignedToProject() {
        UUID projectId = UUID.randomUUID();
        User annotator = currentUser("annotator@test.com", "ANNOTATOR");
        Project project = Project.builder()
                .id(projectId)
                .managerId(UUID.randomUUID())
                .build();

        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findByEmail("annotator@test.com")).thenReturn(Optional.of(annotator));
        when(taskRepository.existsByProjectIdAndAnnotatorId(projectId, annotator.getId())).thenReturn(true);

        Project result = projectAccessService.findProjectAndCheckReadAccess(projectId);

        assertSame(project, result);
    }

    @Test
    void findProjectAndCheckReadAccess_RejectsUnassignedAnnotator() {
        UUID projectId = UUID.randomUUID();
        User annotator = currentUser("annotator@test.com", "ANNOTATOR");
        Project project = Project.builder()
                .id(projectId)
                .managerId(UUID.randomUUID())
                .build();

        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
        when(userRepository.findByEmail("annotator@test.com")).thenReturn(Optional.of(annotator));
        when(taskRepository.existsByProjectIdAndAnnotatorId(projectId, annotator.getId())).thenReturn(false);

        AppException ex = assertThrows(AppException.class,
                () -> projectAccessService.findProjectAndCheckReadAccess(projectId));

        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }

    private User currentUser(String email, String role) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(email, null));
        return User.builder()
                .id(UUID.randomUUID())
                .email(email)
                .role(role)
                .build();
    }
}
