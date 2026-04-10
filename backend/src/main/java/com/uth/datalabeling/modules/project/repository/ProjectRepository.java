package com.uth.datalabeling.modules.project.repository;

import java.util.Optional;
import java.util.UUID;

import com.uth.datalabeling.modules.project.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {
    boolean existsByNameAndDeletedAtIsNull(String name);

    Optional<Project> findByIdAndDeletedAtIsNull(UUID id);
}