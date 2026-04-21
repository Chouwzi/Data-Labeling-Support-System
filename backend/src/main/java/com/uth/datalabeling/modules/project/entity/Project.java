package com.uth.datalabeling.modules.project.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Thực thể Dự án.
 */
@Entity
@Table(name = "projects")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false)
    String name;

    @Column(length = 500)
    String description;

    String guidelineUrl;

    @Column(nullable = false)
    UUID managerId;

    UUID datasetId;

    @Column(nullable = false)
    String status;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<Label> labels = new ArrayList<>();

    // Chống xung đột dữ liệu (Optimistic Locking)
    @Version
    Integer version;

    @CreationTimestamp
    @Column(updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;

    @Column(updatable = false)
    UUID createdBy;

    UUID updatedBy;

    // Soft delete timestamp
    LocalDateTime deletedAt;
}
