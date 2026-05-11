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
    String name;

    @Column(length = 1000)
    String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creator_id")
    User creator;

    @OneToMany(mappedBy = "dataset", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    List<DataSample> dataSamples = new ArrayList<>();

    @CreationTimestamp
    @Column(updatable = false)
    LocalDateTime createdAt;

    @UpdateTimestamp
    LocalDateTime updatedAt;
}
