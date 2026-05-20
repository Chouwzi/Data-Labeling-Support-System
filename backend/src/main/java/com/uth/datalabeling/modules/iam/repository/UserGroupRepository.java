package com.uth.datalabeling.modules.iam.repository;

import com.uth.datalabeling.modules.iam.entity.UserGroup;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserGroupRepository extends JpaRepository<UserGroup, UUID> {
  boolean existsByNameIgnoreCase(String name);

  boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);

  List<UserGroup> findAllByManagerId(UUID managerId);

  Optional<UserGroup> findByIdAndManagerId(UUID id, UUID managerId);
}
