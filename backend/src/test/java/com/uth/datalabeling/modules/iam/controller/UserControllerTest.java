package com.uth.datalabeling.modules.iam.controller;

import com.uth.datalabeling.config.SecurityConfig;
import com.uth.datalabeling.modules.iam.dto.request.UserCreationRequest;
import com.uth.datalabeling.modules.iam.dto.request.UserUpdateRequest;
import com.uth.datalabeling.modules.iam.dto.response.UserResponse;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.iam.service.UserService;
import com.uth.datalabeling.security.jwt.JwtAccessDeniedHandler;
import com.uth.datalabeling.security.jwt.JwtAuthenticationEntryPoint;
import com.uth.datalabeling.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
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

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, JwtAuthenticationEntryPoint.class, JwtAccessDeniedHandler.class})
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserService userService;

    // Security config dependencies
    @MockitoBean
    private JwtTokenProvider jwtTokenProvider;

    @MockitoBean
    private UserDetailsService userDetailsService;

    @MockitoBean
    private UserRepository userRepository;

    private UUID userId;
    private String validCreationJson;
    private String validUpdateJson;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        validCreationJson = """
                {
                    "email": "test@example.com",
                    "full_name": "Test Admin",
                    "password": "Password123",
                    "role": "ADMIN",
                    "active": true
                }
                """;

        validUpdateJson = """
                {
                    "email": "test-updated@example.com",
                    "full_name": "Test Admin Updated",
                    "password": "Password123new",
                    "role": "ADMIN",
                    "active": true
                }
                """;

        UserResponse mockResponse = UserResponse.builder()
                .id(userId)
                .email("test@example.com")
                .fullName("Test Admin")
                .role("ANNOTATOR")
                .active(true)
                .build();

        Mockito.when(userService.createUser(any(UserCreationRequest.class))).thenReturn(mockResponse);
        Mockito.when(userService.getAllUsers()).thenReturn(List.of(mockResponse));
        Mockito.when(userService.getUsersByRole("ANNOTATOR")).thenReturn(List.of(mockResponse));
        Mockito.when(userService.getUserById(userId)).thenReturn(mockResponse);
        Mockito.when(userService.updateUser(eq(userId), any(UserUpdateRequest.class))).thenReturn(mockResponse);
        Mockito.doNothing().when(userService).deleteUser(userId);
    }

    // --- POSITIVE TESTS (ROLE = ADMIN) ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUser_WithAdminRole_ReturnsCreated() throws Exception {
        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreationJson))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.email").value("test@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void createUser_WithInvalidRole_ReturnsUnprocessableEntity() throws Exception {
        String invalidRoleJson = validCreationJson.replace("\"ADMIN\"", "\"SUPERUSER\"");

        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRoleJson))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUser_WithInvalidRole_ReturnsUnprocessableEntity() throws Exception {
        String invalidRoleJson = validUpdateJson.replace("\"ADMIN\"", "\"SUPERUSER\"");

        mockMvc.perform(put("/users/" + userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidRoleJson))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllUsers_WithAdminRole_ReturnsList() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].email").value("test@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getUser_WithAdminRole_ReturnsUser() throws Exception {
        mockMvc.perform(get("/users/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.email").value("test@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void updateUser_WithAdminRole_ReturnsUser() throws Exception {
        mockMvc.perform(put("/users/" + userId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validUpdateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.email").value("test@example.com"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void deleteUser_WithAdminRole_ReturnsNoContent() throws Exception {
        mockMvc.perform(delete("/users/" + userId))
                .andExpect(status().isNoContent())
                .andExpect(jsonPath("$.message").value("Người dùng đã được xóa thành công."));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAnnotators_WithAdminRole_ReturnsList() throws Exception {
        mockMvc.perform(get("/users/annotators"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].role").value("ANNOTATOR"));
    }

    // --- NEGATIVE TESTS (ROLE = ANNOTATOR) ---

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void getAllUsers_WithAnnotatorRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ANNOTATOR")
    void createUser_WithAnnotatorRole_ReturnsForbidden() throws Exception {
        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreationJson))
                .andExpect(status().isForbidden());
    }

    // --- UNAUTHENTICATED TESTS ---

    @Test
    void getAllUsers_WithoutAuth_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(get("/users"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void createUser_WithoutAuth_ReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreationJson))
                .andExpect(status().isUnauthorized());
    }
}
