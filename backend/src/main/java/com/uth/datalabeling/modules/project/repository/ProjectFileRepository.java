package com.uth.datalabeling.modules.project.repository;

import com.uth.datalabeling.modules.project.entity.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

// JpaRepository giúp bạn có sẵn CRUD:
// save(), findById(), delete(), findAll()...
public interface ProjectFileRepository extends JpaRepository<ProjectFile, UUID> {
}