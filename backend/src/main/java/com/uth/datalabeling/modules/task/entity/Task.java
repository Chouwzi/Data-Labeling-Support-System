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
    Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "annotator_id")
    User annotator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sample_id", nullable = false)
    DataSample sample;

    @Column(length = 50)
    @Builder.Default
    String status = "PENDING";

    @CreationTimestamp
    @Column(updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;
}
