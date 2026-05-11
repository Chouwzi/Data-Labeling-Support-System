package com.uth.datalabeling.modules.iam.service;

import com.uth.datalabeling.common.exception.AppException;
import com.uth.datalabeling.modules.iam.dto.request.UserCreationRequest;
import com.uth.datalabeling.modules.iam.dto.response.UserResponse;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.mapper.UserMapper;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserMapper userMapper;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User user;
    private UserResponse userResponse;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = User.builder()
                .id(userId)
                .email("test@example.com")
                .role("ANNOTATOR")
                .password("password")
                .active(true)
                .build();

        userResponse = UserResponse.builder()
                .id(userId)
                .email("test@example.com")
                .role("ANNOTATOR")
                .active(true)
                .build();
    }

    @Test
    void getUsersByRole_Success() {
        when(userRepository.findAllByRole("ANNOTATOR")).thenReturn(List.of(user));
        when(userMapper.toUserResponse(user)).thenReturn(userResponse);

        List<UserResponse> result = userService.getUsersByRole("ANNOTATOR");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("ANNOTATOR", result.get(0).getRole());
    }

    @Test
    void createUser_Success() {
        UserCreationRequest request = new UserCreationRequest();
        request.setEmail("new@example.com");
        request.setPassword("password");

        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userMapper.toUser(any())).thenReturn(user);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed_password");
        when(userRepository.save(any())).thenReturn(user);
        when(userMapper.toUserResponse(any())).thenReturn(userResponse);

        UserResponse result = userService.createUser(request);

        assertNotNull(result);
        verify(userRepository).save(any());
    }

    @Test
    void getUserById_Success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userMapper.toUserResponse(user)).thenReturn(userResponse);

        UserResponse result = userService.getUserById(userId);

        assertNotNull(result);
        assertEquals(userId, result.getId());
    }
}
