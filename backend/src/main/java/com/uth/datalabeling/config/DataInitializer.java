package com.uth.datalabeling.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Data Initializer - Tạo users mặc định khi ứng dụng khởi động
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createUserIfNotExists(
            "admin@gmail.com",
            "Admin User",
            "admin123",
            "ADMIN"
        );

        createUserIfNotExists(
            "staff@gmail.com",
            "Staff User",
            "staff123",
            "STAFF"
        );

        createUserIfNotExists(
            "manager@gmail.com",
            "Manager User",
            "manager123",
            "MANAGER"
        );

        createUserIfNotExists(
            "annotator@gmail.com",
            "Annotator User",
            "annotator123",
            "ANNOTATOR"
        );

        createUserIfNotExists(
            "reviewer@gmail.com",
            "Reviewer User",
            "reviewer123",
            "REVIEWER"
        );

        log.info("Data initialization completed!");
    }

    private void createUserIfNotExists(String email, String fullName, String password, String role) {
        if (!userRepository.existsByEmail(email)) {
            User user = User.builder()
                .email(email)
                .fullName(fullName)
                .password(passwordEncoder.encode(password))
                .role(role)
                .active(true)
                .build();
            userRepository.save(user);
            log.info("Created user: {} with role: {}", email, role);
        } else {
            log.debug("User already exists: {}", email);
        }
    }
}
