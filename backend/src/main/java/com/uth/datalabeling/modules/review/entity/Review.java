package com.uth.datalabeling.modules.review.entity;

import com.uth.datalabeling.modules.defect.entity.DefectCategory;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.task.entity.Task;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reviews")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "defect_category_id")
    DefectCategory defectCategory;

    @Column(columnDefinition = "TEXT")
    String comments;

    @Column(nullable = false, length = 50)
    String action;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    LocalDateTime updatedAt;
}
