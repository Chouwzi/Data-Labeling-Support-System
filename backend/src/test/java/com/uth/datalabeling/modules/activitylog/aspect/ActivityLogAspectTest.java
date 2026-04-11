package com.uth.datalabeling.modules.activitylog.aspect;

import com.uth.datalabeling.modules.activitylog.annotation.LogActivity;
import com.uth.datalabeling.modules.activitylog.entity.ActivityLog;
import com.uth.datalabeling.modules.activitylog.repository.ActivityLogRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.reflect.MethodSignature;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ActivityLogAspectTest {

  private ActivityLogRepository activityLogRepository;
  private UserRepository userRepository;
  private ActivityLogAspect aspect;

  @BeforeEach
  void setUp() {
    activityLogRepository = mock(ActivityLogRepository.class);
    userRepository = mock(UserRepository.class);
    aspect = new ActivityLogAspect(activityLogRepository, userRepository);
  }

  @AfterEach
  void tearDown() {
    RequestContextHolder.resetRequestAttributes();
    SecurityContextHolder.clearContext();
  }

  @Test
  void logActivity_ShouldPersistAuditLogWithOldAndNewValues() throws Throwable {
    UUID userId = UUID.randomUUID();
    UUID entityId = UUID.randomUUID();
    User user = User.builder()
        .id(userId)
        .email("admin@example.com")
        .fullName("Admin")
        .password("secret")
        .role("ADMIN")
        .active(true)
        .build();

    when(userRepository.findByEmail("admin@example.com")).thenReturn(java.util.Optional.of(user));
    when(userRepository.findById(entityId)).thenReturn(java.util.Optional.of(user));
    when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/users/" + entityId);
    MockHttpServletResponse response = new MockHttpServletResponse();
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));

    Authentication authentication = new UsernamePasswordAuthenticationToken(
        "admin@example.com",
        "password",
        List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
    SecurityContextHolder.getContext().setAuthentication(authentication);

    ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
    MethodSignature signature = mock(MethodSignature.class);
    Method method = DummyTarget.class.getDeclaredMethod("updateUser", UUID.class);
    LogActivity annotation = method.getAnnotation(LogActivity.class);

    when(joinPoint.getArgs()).thenReturn(new Object[] { entityId });
    when(joinPoint.getSignature()).thenReturn(signature);
    when(signature.getParameterNames()).thenReturn(new String[] { "userId" });
    when(joinPoint.proceed()).thenReturn("ok");
    when(signature.getMethod()).thenReturn(method);

    Object result = aspect.logActivity(joinPoint, annotation);

    assertEquals("ok", result);

    ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
    verify(activityLogRepository).save(captor.capture());

    ActivityLog saved = captor.getValue();
    assertEquals(userId, saved.getUserId());
    assertEquals("UPDATE_USER", saved.getAction());
    assertEquals("/api/v1/users/" + entityId, saved.getEndpoint());
    assertEquals("GET", saved.getMethod());
    assertEquals(200, saved.getStatus());
    assertEquals(entityId, saved.getEntityId());
    assertEquals("USER", saved.getEntityType());
    assertNotNull(saved.getOldValue());
    assertNotNull(saved.getNewValue());
    assertNotNull(saved.getCreatedAt());
  }

  @Test
  void logActivity_WhenAuthenticatedUserMissing_ShouldStillSaveLogWithNullUserId() throws Throwable {
    UUID entityId = UUID.randomUUID();
    when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

    MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/users/" + entityId);
    MockHttpServletResponse response = new MockHttpServletResponse();
    RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(request, response));

    ProceedingJoinPoint joinPoint = mock(ProceedingJoinPoint.class);
    MethodSignature signature = mock(MethodSignature.class);
    Method method = DummyTarget.class.getDeclaredMethod("updateUser", UUID.class);
    LogActivity annotation = method.getAnnotation(LogActivity.class);

    when(joinPoint.getArgs()).thenReturn(new Object[] { entityId });
    when(joinPoint.getSignature()).thenReturn(signature);
    when(signature.getParameterNames()).thenReturn(new String[] { "userId" });
    when(joinPoint.proceed()).thenReturn("ok");
    when(signature.getMethod()).thenReturn(method);

    Object result = aspect.logActivity(joinPoint, annotation);

    assertEquals("ok", result);
    ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
    verify(activityLogRepository).save(captor.capture());
    assertEquals(null, captor.getValue().getUserId());
  }

  private static class DummyTarget {
    @LogActivity(action = "UPDATE_USER", entityType = "USER", entityIdParam = "userId")
    public void updateUser(UUID userId) {
    }
  }
}