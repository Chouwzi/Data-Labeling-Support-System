package com.uth.datalabeling.activitylog.entity;


import java.time.LocalDateTime;
import java.util.UUID;


import jakarta.persistence.*;


import lombok.*;


@Entity
@Table(name = "activity_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityLog {


    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;


    @Column(name = "user_id")
    private UUID userId;


    private String action;


    private String endpoint;


    private String method;


    @Column(name = "ip_address")
    private String ipAddress;


    private Integer status;


    private Long duration;


    @Column(name = "entity_id")
    private Long entityId;


    @Column(name = "entity_type")
    private String entityType;


    @Column(name = "created_at")
    private LocalDateTime createdAt;
}

