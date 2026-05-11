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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

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
        String json = """
                {
                    "taskIds": ["%s"],
                    "annotatorId": "%s"
                }
                """.formatted(UUID.randomUUID(), UUID.randomUUID());

        mockMvc.perform(put("/projects/" + projectId + "/tasks/assign")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk());
        
        Mockito.verify(taskService).assignTasks(any());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getTasks_Success() throws Exception {
        UUID projectId = UUID.randomUUID();
        mockMvc.perform(get("/projects/" + projectId + "/tasks"))
                .andExpect(status().isOk());
    }
}
