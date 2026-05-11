package com.uth.datalabeling.security;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.dataset.controller.DatasetController;
import com.uth.datalabeling.modules.dataset.service.DatasetService;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.controller.ProjectController;
import com.uth.datalabeling.modules.project.service.ProjectService;
import com.uth.datalabeling.modules.task.controller.TaskController;
import com.uth.datalabeling.modules.task.service.TaskService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({ProjectController.class, DatasetController.class, TaskController.class})
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
public class RBACSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProjectService projectService;

    @MockitoBean
    private DatasetService datasetService;

    @MockitoBean
    private TaskService taskService;

    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    // --- PROJECT CONTROLLER TESTS ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void getProjectById_Admin_Ok() throws Exception {
        mockMvc.perform(get("/projects/" + UUID.randomUUID()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getProjectById_Annotator_Ok() throws Exception {
        mockMvc.perform(get("/projects/" + UUID.randomUUID()))
                .andExpect(status().isOk());
    }

    @Test
    void getProjectById_Public_Unauthorized() throws Exception {
        mockMvc.perform(get("/projects/" + UUID.randomUUID()))
                .andExpect(status().isUnauthorized());
    }

    // --- DATASET CONTROLLER TESTS ---

    @Test
    @WithMockUser(roles = "MANAGER")
    void getAllDatasets_Manager_Ok() throws Exception {
        mockMvc.perform(get("/datasets"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getAllDatasets_Annotator_Forbidden() throws Exception {
        mockMvc.perform(get("/datasets"))
                .andExpect(status().isForbidden());
    }

    // --- TASK CONTROLLER TESTS ---

    @Test
    @WithMockUser(roles = "MANAGER")
    void generateTasks_Manager_Ok() throws Exception {
        mockMvc.perform(post("/projects/" + UUID.randomUUID() + "/tasks/generate")
                        .param("datasetId", UUID.randomUUID().toString()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void generateTasks_Annotator_Forbidden() throws Exception {
        mockMvc.perform(post("/projects/" + UUID.randomUUID() + "/tasks/generate")
                        .param("datasetId", UUID.randomUUID().toString()))
                .andExpect(status().isForbidden());
    }
}
