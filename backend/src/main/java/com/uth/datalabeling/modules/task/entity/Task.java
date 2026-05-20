package com.uth.datalabeling.modules.task.entity;

import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.project.entity.Project;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Thực thể Công việc (Task).
 * Kết nối một mẫu dữ liệu (Sample) với một dự án (Project) và một người gắn nhãn (Annotator).
 */
@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    Project project; // Thuộc dự án nào

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annotator_id")
    User annotator; // Người được giao thực hiện (Annotator)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sample_id", nullable = false)
    DataSample sample; // Mẫu dữ liệu cần gắn nhãn

    @Column(length = 50)
    @Builder.Default
    String status = "PENDING"; // Trạng thái: PENDING, ASSIGNED, IN_PROGRESS, DONE...

    @Column(name = "assigned_at")
    LocalDateTime assignedAt;

    @CreationTimestamp
    @Column(updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;
}
