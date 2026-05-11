package com.uth.datalabeling.modules.project.entity;

import com.uth.datalabeling.modules.dataset.entity.Dataset;
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
    String name; // Tên dự án

    @Column(length = 500)
    String description; // Mô tả dự án

    String guidelineUrl; // Link tài liệu hướng dẫn

    @Column(nullable = false)
    UUID managerId; // ID của quản lý dự án

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dataset_id")
    Dataset dataset; // Tập dữ liệu được liên kết với dự án

    @Column(nullable = false)
    String status; // Trạng thái dự án: ACTIVE, COMPLETED, ARCHIVED...

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
