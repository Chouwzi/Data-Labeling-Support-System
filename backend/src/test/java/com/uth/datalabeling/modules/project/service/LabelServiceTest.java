package com.uth.datalabeling.modules.project.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.*;

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
class LabelServiceTest {

    @Mock
    LabelRepository labelRepository;

    @Mock
    ProjectRepository projectRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    ProjectMapper projectMapper;

    @InjectMocks
    LabelService labelService;

    @Mock
    SecurityContext securityContext;

    @Mock
    Authentication authentication;

    private User mockManager;
    private Project project;
    private UUID projectId;
    private UUID labelId;

    @BeforeEach
    void setUp() {
        projectId = UUID.randomUUID();
        labelId = UUID.randomUUID();
        mockManager = User.builder()
                .id(UUID.randomUUID())
                .email("manager@test.com")
                .role("MANAGER")
                .build();

        project = Project.builder()
                .id(projectId)
                .name("Project Test")
                .managerId(mockManager.getId())
                .build();

        SecurityContextHolder.setContext(securityContext);
    }

    private void mockCurrentUser() {
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("manager@test.com");
        when(userRepository.findByEmail("manager@test.com")).thenReturn(Optional.of(mockManager));
    }

    @Test
    void createLabel_Success() {
        mockCurrentUser();
        LabelRequest request = new LabelRequest("Animal", "#FF0000");
        Label label = Label.builder().name("Animal").colorHex("#FF0000").project(project).build();

        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
        when(labelRepository.existsByNameAndProjectIdAndDeletedAtIsNull("Animal", projectId)).thenReturn(false);
        when(projectMapper.toLabel(request)).thenReturn(label);
        when(labelRepository.save(any(Label.class))).thenReturn(label);
        when(projectMapper.toLabelResponse(any(Label.class))).thenReturn(new LabelResponse());

        LabelResponse response = labelService.createLabel(projectId, request);

        assertNotNull(response);
        verify(labelRepository).save(label);
    }

    @Test
    void createLabel_DuplicateName_ThrowsException() {
        mockCurrentUser();
        LabelRequest request = new LabelRequest("Animal", "#FF0000");

        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
        when(labelRepository.existsByNameAndProjectIdAndDeletedAtIsNull("Animal", projectId)).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> labelService.createLabel(projectId, request));
        assertEquals(ErrorCode.LABEL_ALREADY_EXISTS, ex.getErrorCode());
    }

    @Test
    void updateLabel_Success() {
        mockCurrentUser();
        LabelRequest request = new LabelRequest("Animal Updated", "#00FF00");
        Label existingLabel = Label.builder().id(labelId).name("Animal").project(project).build();

        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
        when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)).thenReturn(Optional.of(existingLabel));
        when(labelRepository.existsByNameAndProjectIdAndIdNotAndDeletedAtIsNull("Animal Updated", projectId, labelId)).thenReturn(false);
        when(labelRepository.save(any(Label.class))).thenReturn(existingLabel);
        when(projectMapper.toLabelResponse(any(Label.class))).thenReturn(new LabelResponse());

        LabelResponse response = labelService.updateLabel(projectId, labelId, request);

        assertNotNull(response);
        verify(labelRepository).save(existingLabel);
        verify(projectMapper).updateLabel(existingLabel, request);
    }

    @Test
    void deleteLabel_Success() {
        mockCurrentUser();
        Label existingLabel = Label.builder().id(labelId).name("Animal").project(project).build();

        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
        when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId)).thenReturn(Optional.of(existingLabel));

        labelService.deleteLabel(projectId, labelId);

        assertNotNull(existingLabel.getDeletedAt());
        verify(labelRepository).save(existingLabel);
    }

    @Test
    void getLabelsByProject_Success() {
        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));
        when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(new Label()));

        List<LabelResponse> responses = labelService.getLabelsByProject(projectId);

        assertFalse(responses.isEmpty());
        verify(labelRepository).findByProjectIdAndDeletedAtIsNull(projectId);
    }

    @Test
    void findProjectAndCheckAccess_ForbiddenForOtherManager() {
        mockCurrentUser();
        project.setManagerId(UUID.randomUUID()); // Other manager

        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(project));

        AppException ex = assertThrows(AppException.class, () -> labelService.createLabel(projectId, new LabelRequest()));
        assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
    }
}
