package com.uth.datalabeling.modules.project.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.*;

import com.uth.datalabeling.common.response.PageResponse;
import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.project.constant.ProjectStatus;
import com.uth.datalabeling.modules.project.dto.request.LabelRequest;
import com.uth.datalabeling.modules.project.dto.request.ProjectCreateRequest;
import com.uth.datalabeling.modules.project.dto.request.ProjectUpdateRequest;
import com.uth.datalabeling.modules.project.dto.response.LabelResponse;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

/**
 * Kiểm thử đơn vị cho ProjectService.
 */
@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    ProjectRepository projectRepository;

    @Mock
    ProjectAccessService projectAccessService;

    @Mock
    ProjectMapper projectMapper;

    @InjectMocks
    ProjectService projectService;

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
                .status(ProjectStatus.DRAFT)
                .managerId(mockManager.getId())
                .labels(new ArrayList<>(Collections.singletonList(
                        Label.builder().name("OldLabel").colorHex("#000000").build())))
                .build();
    }

    @Test
    void createProject_Success() {
        ProjectCreateRequest request = ProjectCreateRequest.builder().name("Dự án mới").build();

        Project mappedProject = new Project();
        Project savedProject = Project.builder().id(projectId).status(ProjectStatus.DRAFT).build();

        when(projectRepository.existsByNameAndDeletedAtIsNull("Dự án mới")).thenReturn(false);
        when(projectAccessService.getCurrentUser()).thenReturn(mockManager);
        when(projectMapper.toProject(request)).thenReturn(mappedProject);
        when(projectRepository.saveAndFlush(any(Project.class))).thenReturn(savedProject);
        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(savedProject));
        when(projectMapper.toProjectResponse(any())).thenReturn(ProjectResponse.builder().name("Dự án mới").build());

        ProjectResponse response = projectService.createProject(request);

        assertNotNull(response);
        assertEquals(ProjectStatus.DRAFT, mappedProject.getStatus());
        verify(projectRepository).saveAndFlush(any());
    }

    @Test
    void createProject_DuplicateName_ThrowsConflict() {
        ProjectCreateRequest request = ProjectCreateRequest.builder().name("Dự án mới").build();
        when(projectRepository.existsByNameAndDeletedAtIsNull("Dự án mới")).thenReturn(true);

        AppException ex = assertThrows(AppException.class, () -> projectService.createProject(request));

        assertEquals(ErrorCode.PROJECT_ALREADY_EXISTS, ex.getErrorCode());
        verify(projectRepository, never()).saveAndFlush(any(Project.class));
    }

    @Test
    void updateProject_Success_WithLabelSync() {
        ProjectUpdateRequest request = ProjectUpdateRequest.builder()
                .name("Tên cập nhật")
                .labels(Collections.singletonList(new LabelRequest("NewLabel", "#FFFFFF")))
                .build();

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(existingProject);
        when(projectAccessService.getCurrentUser()).thenReturn(mockManager);
        when(projectRepository.existsByNameAndIdNotAndDeletedAtIsNull("Tên cập nhật", projectId)).thenReturn(false);

        when(projectMapper.toLabel(any())).thenAnswer(invocation -> {
            LabelRequest arg = invocation.getArgument(0);
            return Label.builder().name(arg.getName()).colorHex(arg.getColorHex()).build();
        });

        when(projectRepository.saveAndFlush(any(Project.class))).thenReturn(existingProject);
        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(existingProject));
        when(projectMapper.toProjectResponse(any())).thenReturn(new ProjectResponse());

        projectService.updateProject(projectId, request);

        verify(projectRepository).saveAndFlush(existingProject);
        assertEquals(1, existingProject.getLabels().size());
        assertEquals("NewLabel", existingProject.getLabels().get(0).getName());
    }

    @Test
    void updateProject_InvalidStatusTransition_FromArchivedToDraft_ThrowsConflict() {
        existingProject.setStatus(ProjectStatus.ARCHIVED);
        ProjectUpdateRequest request = ProjectUpdateRequest.builder()
                .status(ProjectStatus.DRAFT)
                .build();

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(existingProject);

        AppException ex = assertThrows(AppException.class, () -> projectService.updateProject(projectId, request));

        assertEquals(ErrorCode.CONFLICT, ex.getErrorCode());
        verify(projectRepository, never()).saveAndFlush(any(Project.class));
    }

    @Test
    void updateProject_InvalidStatusValue_ThrowsValidationError() {
        ProjectUpdateRequest request = ProjectUpdateRequest.builder()
                .status("INVALID")
                .build();

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(existingProject);

        AppException ex = assertThrows(AppException.class, () -> projectService.updateProject(projectId, request));

        assertEquals(ErrorCode.VALIDATION_ERROR, ex.getErrorCode());
        verify(projectRepository, never()).saveAndFlush(any(Project.class));
    }

    @Test
    void updateProject_ValidStatusTransition_FromDraftToActive_Success() {
        existingProject.setStatus(ProjectStatus.DRAFT);
        ProjectUpdateRequest request = ProjectUpdateRequest.builder()
                .status("active")
                .build();

        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(existingProject);
        when(projectAccessService.getCurrentUser()).thenReturn(mockManager);
        doAnswer(invocation -> {
            Project target = invocation.getArgument(0);
            ProjectUpdateRequest source = invocation.getArgument(1);
            target.setStatus(source.getStatus());
            return null;
        }).when(projectMapper).updateProject(any(Project.class), any(ProjectUpdateRequest.class));
        when(projectRepository.saveAndFlush(any(Project.class))).thenReturn(existingProject);
        when(projectRepository.findByIdAndDeletedAtIsNull(projectId)).thenReturn(Optional.of(existingProject));
        when(projectMapper.toProjectResponse(any())).thenReturn(ProjectResponse.builder().build());

        projectService.updateProject(projectId, request);

        assertEquals(ProjectStatus.ACTIVE, existingProject.getStatus());
        verify(projectRepository).saveAndFlush(existingProject);
    }

    @Test
    void updateProject_ForbiddenForOtherManager() {
        when(projectAccessService.findProjectAndCheckAccess(projectId))
                .thenThrow(new AppException(ErrorCode.FORBIDDEN));

        assertThrows(AppException.class, () -> projectService.updateProject(projectId, new ProjectUpdateRequest()));
    }

    @Test
    void deleteProject_Success() {
        when(projectAccessService.findProjectAndCheckAccess(projectId)).thenReturn(existingProject);
        when(projectAccessService.getCurrentUser()).thenReturn(mockManager);

        projectService.deleteProject(projectId);

        assertNotNull(existingProject.getDeletedAt());
        verify(projectRepository).save(existingProject);
    }

    @Test
    void getMyAssignedProjects_ReturnsOnlyProjectsAssignedToCurrentAnnotator() {
        User annotator = User.builder()
                .id(UUID.randomUUID())
                .email("annotator@test.com")
                .role("ANNOTATOR")
                .build();
        Project assignedProject = Project.builder()
                .id(UUID.randomUUID())
                .name("Assigned Project")
                .labels(new ArrayList<>())
                .build();
        ProjectResponse assignedResponse = ProjectResponse.builder()
                .id(assignedProject.getId())
                .name("Assigned Project")
                .build();
        PageRequest pageable = PageRequest.of(0, 10);

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(projectRepository.findAssignedProjectsForAnnotator(annotator.getId(), pageable))
                .thenReturn(new PageImpl<>(List.of(assignedProject), pageable, 1));
        when(projectMapper.toProjectResponse(assignedProject)).thenReturn(assignedResponse);

        PageResponse<ProjectResponse> response = projectService.getMyAssignedProjects(pageable);

        assertEquals(1, response.getTotalElements());
        assertEquals("Assigned Project", response.getData().get(0).getName());
        verify(projectRepository).findAssignedProjectsForAnnotator(annotator.getId(), pageable);
    }

    @Test
    void getMyAssignedProjects_FiltersSoftDeletedLabelsFromResponse() {
        User annotator = User.builder()
                .id(UUID.randomUUID())
                .email("annotator@test.com")
                .role("ANNOTATOR")
                .build();
        Label activeLabel = Label.builder()
                .id(UUID.randomUUID())
                .name("Active")
                .colorHex("#00ff00")
                .build();
        Label deletedLabel = Label.builder()
                .id(UUID.randomUUID())
                .name("Deleted")
                .colorHex("#ff0000")
                .deletedAt(java.time.LocalDateTime.now())
                .build();
        Project assignedProject = Project.builder()
                .id(UUID.randomUUID())
                .name("Assigned Project")
                .labels(new ArrayList<>(List.of(activeLabel, deletedLabel)))
                .build();
        PageRequest pageable = PageRequest.of(0, 10);

        when(projectAccessService.getCurrentUser()).thenReturn(annotator);
        when(projectRepository.findAssignedProjectsForAnnotator(annotator.getId(), pageable))
                .thenReturn(new PageImpl<>(List.of(assignedProject), pageable, 1));
        when(projectMapper.toProjectResponse(assignedProject)).thenReturn(ProjectResponse.builder()
                .id(assignedProject.getId())
                .name("Assigned Project")
                .build());
        when(projectMapper.toLabelResponse(activeLabel)).thenReturn(LabelResponse.builder()
                .id(activeLabel.getId())
                .name("Active")
                .colorHex("#00ff00")
                .build());

        PageResponse<ProjectResponse> response = projectService.getMyAssignedProjects(pageable);

        assertEquals(1, response.getData().get(0).getLabels().size());
        assertEquals("Active", response.getData().get(0).getLabels().get(0).getName());
        verify(projectMapper, never()).toLabelResponse(deletedLabel);
    }

    @Test
    void getProjectById_UsesReadAccessGuardForAnnotatorReadableProject() {
        when(projectAccessService.findProjectAndCheckReadAccess(projectId)).thenReturn(existingProject);
        when(projectMapper.toProjectResponse(existingProject)).thenReturn(ProjectResponse.builder()
                .id(projectId)
                .name(existingProject.getName())
                .build());

        ProjectResponse response = projectService.getProjectById(projectId);

        assertEquals(projectId, response.getId());
        verify(projectAccessService).findProjectAndCheckReadAccess(projectId);
        verify(projectAccessService, never()).findProjectAndCheckAccess(projectId);
    }
}
