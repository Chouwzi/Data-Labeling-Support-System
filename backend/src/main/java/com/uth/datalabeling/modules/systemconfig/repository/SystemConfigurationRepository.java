package com.uth.datalabeling.modules.systemconfig.repository;

import com.uth.datalabeling.modules.systemconfig.entity.SystemConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemConfigurationRepository extends JpaRepository<SystemConfiguration, Integer> {
}
