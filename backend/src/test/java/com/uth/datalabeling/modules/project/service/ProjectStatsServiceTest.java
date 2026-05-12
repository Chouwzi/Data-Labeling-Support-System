package com.uth.datalabeling.modules.project.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.common.exception.ErrorCode;
import com.uth.datalabeling.modules.project.dto.response.ProjectStatsResponse;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.task.dto.TaskStatusCountDTO;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class ProjectStatsServiceTest {

  @Mock
  private TaskRepository taskRepository;

  @Mock
  private ProjectRepository projectRepository;

  @InjectMocks
  private ProjectStatsService projectStatsService;

  @Test
  @DisplayName("Lấy thống kê dự án thành công")
  void getProjectStatistics_Success() {
    // Given
    UUID projectId = UUID.randomUUID();
    given(projectRepository.existsById(projectId)).willReturn(true);

    List<TaskStatusCountDTO> mockCounts = List.of(
        new TaskStatusCountDTO("PENDING", 20L),
        new TaskStatusCountDTO("IN_PROGRESS", 30L),
        new TaskStatusCountDTO("DONE", 50L));
    given(taskRepository.countTasksByStatus(projectId)).willReturn(mockCounts);

    // When
    ProjectStatsResponse response = projectStatsService.getProjectStatistics(projectId);

    // Then
    assertThat(response.totalTasks()).isEqualTo(100L);
    assertThat(response.completedTasks()).isEqualTo(50L);
    assertThat(response.pendingTasks()).isEqualTo(20L);
    assertThat(response.completionPercentage()).isEqualTo(50.0);
    assertThat(response.statusDistribution().get("IN_PROGRESS")).isEqualTo(30L);
  }

  @Test
  @DisplayName("Lấy thống kê với dự án không tồn tại - Ném ngoại lệ")
  void getProjectStatistics_ProjectNotFound() {
    // Given
    UUID projectId = UUID.randomUUID();
    given(projectRepository.existsById(projectId)).willReturn(false);

    // When & Then
    AppException exception = assertThrows(AppException.class, () -> {
      projectStatsService.getProjectStatistics(projectId);
    });

    assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.PROJECT_NOT_FOUND);
  }

  @Test
  @DisplayName("Lấy thống kê với dự án chưa có task - Trả về số liệu bằng 0")
  void getProjectStatistics_NoTasks_ReturnsZeroStats() {
    // Given
    UUID projectId = UUID.randomUUID();
    given(projectRepository.existsById(projectId)).willReturn(true);
    given(taskRepository.countTasksByStatus(projectId)).willReturn(List.of());

    // When
    ProjectStatsResponse response = projectStatsService.getProjectStatistics(projectId);

    // Then
    assertThat(response.totalTasks()).isZero();
    assertThat(response.completedTasks()).isZero();
    assertThat(response.pendingTasks()).isZero();
    assertThat(response.completionPercentage()).isZero();
    assertThat(response.statusDistribution()).isEmpty();
  }
}
