package com.uth.datalabeling.modules.project.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.*;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.dto.request.LabelRequest;
import com.uth.datalabeling.modules.project.dto.response.LabelResponse;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.mapper.ProjectMapper;
import com.uth.datalabeling.modules.project.repository.LabelRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LabelServiceTest {

        @Mock
        LabelRepository labelRepository;

        @Mock
        ProjectAccessService projectAccessService;

        @Mock
        ProjectMapper projectMapper;

        @InjectMocks
        LabelService labelService;

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
        }

        // ============================================================
        // CREATE LABEL
        // ============================================================

        @Test
        void createLabel_Success() {
                LabelRequest request = new LabelRequest("Animal", "#FF0000");
                Label label = Label.builder().id(labelId).name("Animal").colorHex("#FF0000").project(project).build();

                when(projectAccessService.findProjectAndCheckAccess(projectId, true)).thenReturn(project);
                when(labelRepository.existsByNameAndProjectIdAndDeletedAtIsNull("Animal", projectId)).thenReturn(false);
                when(projectMapper.toLabel(request)).thenReturn(label);
                when(labelRepository.saveAndFlush(any(Label.class))).thenReturn(label);
                when(labelRepository.findByIdAndDeletedAtIsNull(labelId)).thenReturn(Optional.of(label));
                when(projectMapper.toLabelResponse(any(Label.class))).thenReturn(new LabelResponse());

                LabelResponse response = labelService.createLabel(projectId, request);

                assertNotNull(response);
                verify(labelRepository).saveAndFlush(label);
        }

        @Test
        void createLabel_DuplicateName_ThrowsException() {
                LabelRequest request = new LabelRequest("Animal", "#FF0000");

                when(projectAccessService.findProjectAndCheckAccess(projectId, true)).thenReturn(project);
                when(labelRepository.existsByNameAndProjectIdAndDeletedAtIsNull("Animal", projectId)).thenReturn(true);

                AppException ex = assertThrows(AppException.class, () -> labelService.createLabel(projectId, request));
                assertEquals(ErrorCode.LABEL_ALREADY_EXISTS, ex.getErrorCode());
        }

        @Test
        void createLabel_ProjectNotFound_ThrowsException() {
                LabelRequest request = new LabelRequest("Animal", "#FF0000");

                when(projectAccessService.findProjectAndCheckAccess(projectId, true))
                                .thenThrow(new AppException(ErrorCode.PROJECT_NOT_FOUND));

                AppException ex = assertThrows(AppException.class, () -> labelService.createLabel(projectId, request));
                assertEquals(ErrorCode.PROJECT_NOT_FOUND, ex.getErrorCode());
        }

        // ============================================================
        // UPDATE LABEL
        // ============================================================

        @Test
        void updateLabel_Success() {
                LabelRequest request = new LabelRequest("Animal Updated", "#00FF00");
                Label existingLabel = Label.builder().id(labelId).name("Animal").project(project).build();

                when(projectAccessService.findProjectAndCheckAccess(projectId, true)).thenReturn(project);
                when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId))
                                .thenReturn(Optional.of(existingLabel));
                when(labelRepository.existsByNameAndProjectIdAndIdNotAndDeletedAtIsNull("Animal Updated", projectId,
                                labelId))
                                .thenReturn(false);
                when(labelRepository.saveAndFlush(any(Label.class))).thenReturn(existingLabel);
                when(labelRepository.findByIdAndDeletedAtIsNull(labelId)).thenReturn(Optional.of(existingLabel));
                when(projectMapper.toLabelResponse(any(Label.class))).thenReturn(new LabelResponse());

                LabelResponse response = labelService.updateLabel(projectId, labelId, request);

                assertNotNull(response);
                verify(labelRepository).saveAndFlush(existingLabel);
                verify(projectMapper).updateLabel(existingLabel, request);
        }

        @Test
        void updateLabel_DuplicateName_ThrowsException() {
                LabelRequest request = new LabelRequest("ExistingName", "#00FF00");
                Label existingLabel = Label.builder().id(labelId).name("Animal").project(project).build();

                when(projectAccessService.findProjectAndCheckAccess(projectId, true)).thenReturn(project);
                when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId))
                                .thenReturn(Optional.of(existingLabel));
                when(labelRepository.existsByNameAndProjectIdAndIdNotAndDeletedAtIsNull("ExistingName", projectId,
                                labelId))
                                .thenReturn(true);

                AppException ex = assertThrows(AppException.class,
                                () -> labelService.updateLabel(projectId, labelId, request));
                assertEquals(ErrorCode.LABEL_ALREADY_EXISTS, ex.getErrorCode());
        }

        @Test
        void updateLabel_LabelNotFound_ThrowsException() {
                LabelRequest request = new LabelRequest("Animal", "#FF0000");

                when(projectAccessService.findProjectAndCheckAccess(projectId, true)).thenReturn(project);
                when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId))
                                .thenReturn(Optional.empty());

                AppException ex = assertThrows(AppException.class,
                                () -> labelService.updateLabel(projectId, labelId, request));
                assertEquals(ErrorCode.LABEL_NOT_FOUND, ex.getErrorCode());
        }

        // ============================================================
        // DELETE LABEL
        // ============================================================

        @Test
        void deleteLabel_Success() {
                Label existingLabel = Label.builder().id(labelId).name("Animal").project(project).build();

                when(projectAccessService.findProjectAndCheckAccess(projectId, true)).thenReturn(project);
                when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId))
                                .thenReturn(Optional.of(existingLabel));

                labelService.deleteLabel(projectId, labelId);

                assertNotNull(existingLabel.getDeletedAt());
                verify(labelRepository).save(existingLabel);
        }

        @Test
        void deleteLabel_LabelNotFound_ThrowsException() {
                when(projectAccessService.findProjectAndCheckAccess(projectId, true)).thenReturn(project);
                when(labelRepository.findByIdAndProjectIdAndDeletedAtIsNull(labelId, projectId))
                                .thenReturn(Optional.empty());

                AppException ex = assertThrows(AppException.class,
                                () -> labelService.deleteLabel(projectId, labelId));
                assertEquals(ErrorCode.LABEL_NOT_FOUND, ex.getErrorCode());
        }

        // ============================================================
        // GET LABELS BY PROJECT
        // ============================================================

        @Test
        void getLabelsByProject_Success() {
                when(projectAccessService.findProjectAndCheckReadAccess(projectId)).thenReturn(project);
                when(labelRepository.findByProjectIdAndDeletedAtIsNull(projectId)).thenReturn(List.of(new Label()));

                List<LabelResponse> responses = labelService.getLabelsByProject(projectId);

                assertFalse(responses.isEmpty());
                verify(labelRepository).findByProjectIdAndDeletedAtIsNull(projectId);
        }

        @Test
        void getLabelsByProject_ShouldCheckProjectReadAccessBeforeReturningLabels() {
                when(projectAccessService.findProjectAndCheckReadAccess(projectId))
                                .thenThrow(new AppException(ErrorCode.FORBIDDEN));

                assertThrows(AppException.class, () -> labelService.getLabelsByProject(projectId));

                verify(projectAccessService).findProjectAndCheckReadAccess(projectId);
                verify(labelRepository, never()).findByProjectIdAndDeletedAtIsNull(projectId);
        }

        @Test
        void getLabelsByProject_ProjectNotFound_ThrowsException() {
                when(projectAccessService.findProjectAndCheckReadAccess(projectId))
                                .thenThrow(new AppException(ErrorCode.PROJECT_NOT_FOUND));

                AppException ex = assertThrows(AppException.class,
                                () -> labelService.getLabelsByProject(projectId));
                assertEquals(ErrorCode.PROJECT_NOT_FOUND, ex.getErrorCode());
        }

        // ============================================================
        // ACCESS CONTROL
        // ============================================================

        @Test
        void createLabel_ForbiddenForOtherManager() {
                when(projectAccessService.findProjectAndCheckAccess(projectId, true))
                                .thenThrow(new AppException(ErrorCode.FORBIDDEN));

                AppException ex = assertThrows(AppException.class,
                                () -> labelService.createLabel(projectId, new LabelRequest()));
                assertEquals(ErrorCode.FORBIDDEN, ex.getErrorCode());
        }
}
