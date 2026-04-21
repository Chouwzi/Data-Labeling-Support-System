package com.uth.datalabeling.modules.project.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity // đánh dấu đây là bảng trong DB
@Table(name = "project_files") // tên bảng
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProjectFile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    // tự sinh UUID (không cần sequence như id int)
    UUID id;

    String fileName; // tên file gốc (user upload)
    String fileType; // kiểu file (application/pdf, text/plain)
    String filePath; // đường dẫn lưu file trên server
    Long fileSize; // kích thước file (byte)

    @ManyToOne(fetch = FetchType.LAZY) // nhiều file thuộc 1 project
    @JoinColumn(name = "project_id", nullable = false)
    // tạo cột project_id trong DB (foreign key)
    Project project; // liên kết với project (sau này có thể dùng @ManyToOne)
    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    LocalDateTime uploadedAt; // thời điểm upload
}