package com.uth.datalabeling.modules.task.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.task.service.TaskService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.mockito.ArgumentCaptor;

@WebMvcTest(TaskController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
public class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    @Test
    @WithMockUser(roles = "MANAGER")
    void generateTasks_Success() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID datasetId = UUID.randomUUID();

        mockMvc.perform(post("/projects/" + projectId + "/tasks/generate")
                        .param("datasetId", datasetId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Công việc đã được tạo thành công từ tập dữ liệu."));
        
        Mockito.verify(taskService).generateTasksFromDataset(eq(projectId), eq(datasetId));
    }

    @Test
    @WithMockUser(roles = "MANAGER")
    void assignTasks_Success() throws Exception {
        UUID projectId = UUID.randomUUID();
        UUID taskId = UUID.randomUUID();
        UUID annotatorId = UUID.randomUUID();
        String json = """
                {
                    "task_ids": ["%s"],
                    "annotator_id": "%s"
                }
                """.formatted(taskId, annotatorId);

        mockMvc.perform(put("/projects/" + projectId + "/tasks/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());

        ArgumentCaptor<com.uth.datalabeling.modules.task.dto.request.TaskAssignRequest> requestCaptor =
                ArgumentCaptor.forClass(com.uth.datalabeling.modules.task.dto.request.TaskAssignRequest.class);
        verify(taskService).assignTasks(requestCaptor.capture());
        assertEquals(List.of(taskId), requestCaptor.getValue().getTaskIds());
        assertEquals(annotatorId, requestCaptor.getValue().getAnnotatorId());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getTasks_Success() throws Exception {
        UUID projectId = UUID.randomUUID();
        mockMvc.perform(get("/projects/" + projectId + "/tasks"))
                .andExpect(status().isOk());
    }
}
