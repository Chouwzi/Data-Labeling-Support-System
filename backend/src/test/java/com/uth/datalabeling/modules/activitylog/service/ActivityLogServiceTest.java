package com.uth.datalabeling.modules.activitylog.service;

import com.uth.datalabeling.modules.activitylog.dto.ActivityLogResponse;
import com.uth.datalabeling.modules.activitylog.entity.ActivityLog;
import com.uth.datalabeling.modules.activitylog.repository.ActivityLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ActivityLogServiceTest {

    private ActivityLogRepository repository;
    private ActivityLogService service;

    @BeforeEach
    void setUp() {
        repository = mock(ActivityLogRepository.class);
        service = new ActivityLogService(repository);
    }

    @Test
    void getLogs_ShouldQuerySortedByCreatedAtDescAndMapResponse() {
        UUID userId = UUID.randomUUID();
        ActivityLog log = ActivityLog.builder()
                .userId(userId)
                .action("VIEW_AUDIT_LOGS")
                .endpoint("/api/v1/audit-logs")
                .method("GET")
                .status(200)
                .ipAddress("127.0.0.1")
                .durationMs(15L)
                .entityId(UUID.randomUUID())
                .entityType("USER")
                .oldValue("{\"before\":true}")
                .newValue("{\"after\":true}")
                .createdAt(LocalDateTime.of(2026, 4, 11, 10, 0))
                .build();

        when(repository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(log)));

        List<ActivityLogResponse> responses = service.getLogs(1, 20);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(repository).findAll(pageableCaptor.capture());

        Pageable pageable = pageableCaptor.getValue();
        assertEquals(PageRequest.of(1, 20).getPageNumber(), pageable.getPageNumber());
        assertEquals(PageRequest.of(1, 20).getPageSize(), pageable.getPageSize());
        assertEquals("createdAt: DESC", pageable.getSort().toString());

        assertEquals(1, responses.size());
        ActivityLogResponse response = responses.get(0);
        assertEquals(userId, response.getUserId());
        assertEquals("VIEW_AUDIT_LOGS", response.getAction());
        assertEquals("/api/v1/audit-logs", response.getEndpoint());
        assertEquals("GET", response.getMethod());
        assertEquals(200, response.getStatus());
        assertEquals("127.0.0.1", response.getIpAddress());
        assertEquals(15L, response.getDurationMs());
        assertEquals("USER", response.getEntityType());
        assertNotNull(response.getCreatedAt());
    }
}