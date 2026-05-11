package com.uth.datalabeling.modules.dataset.entity;

import com.uth.datalabeling.modules.iam.entity.User;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Thực thể Tập dữ liệu (Dataset).
 * Chứa danh sách các mẫu dữ liệu (DataSample) để dùng cho các dự án gắn nhãn.
 */
@Entity
@Table(name = "datasets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Dataset {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    UUID id;

    @Column(nullable = false)
    String name; // Tên tập dữ liệu

    @Column(length = 1000)
    String description; // Mô tả tập dữ liệu

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    User creator; // Người tạo tập dữ liệu

    @OneToMany(mappedBy = "dataset", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<DataSample> dataSamples = new ArrayList<>(); // Danh sách các mẫu dữ liệu

    @CreationTimestamp
    @Column(updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;
}
