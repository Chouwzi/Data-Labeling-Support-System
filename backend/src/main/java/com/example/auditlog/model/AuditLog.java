package com.example.auditlog.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter @Setter @NoLongerArgsConstructor // Dùng Lombok cho chuyên nghiệp
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String action;      
    private String username;    
    private String ipAddress;   
    
    @Column(name = "created_at")
    private LocalDateTime timestamp = LocalDateTime.now();
}