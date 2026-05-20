package com.uth.datalabeling.modules.iam.repository;

import com.uth.datalabeling.modules.iam.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
  boolean existsByEmail(String email);

  Optional<User> findByEmail(String email);

  List<User> findAllByRole(String role);

  List<User> findAllByGroupId(UUID groupId);

  List<User> findAllByRoleAndGroupId(String role, UUID groupId);

  long countByGroupId(UUID groupId);

  long countByActiveTrue();

  long countByRole(String role);
}
