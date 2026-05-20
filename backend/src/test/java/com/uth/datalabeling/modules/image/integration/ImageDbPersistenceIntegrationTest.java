package com.uth.datalabeling.modules.image.integration;

import com.uth.datalabeling.modules.image.entity.FileMetadata;
import com.uth.datalabeling.modules.image.repository.FileMetadataRepository;
import com.uth.datalabeling.modules.image.strategy.CloudinaryImageStorageStrategyImpl;
import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * DB Persistence Integration Test — verifies that after a real Cloudinary upload,
 * the FileMetadata record is correctly saved in the PostgreSQL database.
 *
 * Requirements:
 *  - Docker PostgreSQL running at localhost:5432 (datalabeling DB)
 *  - CLOUDINARY_URL set in backend/.env
 *
 * Auto-skips if either dependency is missing.
 */
@Tag("db-integration")
@DisplayName("DB Persistence — FileMetadata saved after Cloudinary upload")
@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ImageDbPersistenceIntegrationTest {

    @Autowired
    private FileMetadataRepository fileMetadataRepository;

    @Autowired(required = false)
    private CloudinaryImageStorageStrategyImpl cloudinaryStrategy;

    private static boolean cloudinaryAvailable = false;
    private static String resolvedCloudinaryUrl = null;

    // ──────────────────────────────────────────────────────────────
    // Dynamic property injection — override datasource with real PG
    // ──────────────────────────────────────────────────────────────

    @DynamicPropertySource
    static void overrideProperties(DynamicPropertyRegistry registry) {
        // Load from .env
        resolvedCloudinaryUrl = resolveFromEnv("CLOUDINARY_URL");
        String dbUrl      = resolveFromEnv("DB_URL");
        String dbUsername = resolveFromEnv("DB_USERNAME");
        String dbPassword = resolveFromEnv("DB_PASSWORD");

        if (dbUrl != null) {
            registry.add("spring.datasource.url",      () -> dbUrl);
            registry.add("spring.datasource.username", () -> dbUsername != null ? dbUsername : "postgres");
            registry.add("spring.datasource.password", () -> dbPassword != null ? dbPassword : "");
            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
            registry.add("spring.jpa.properties.hibernate.dialect",
                         () -> "org.hibernate.dialect.PostgreSQLDialect");
            registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
            registry.add("spring.flyway.enabled",     () -> "false");
        }

        if (resolvedCloudinaryUrl != null) {
            registry.add("CLOUDINARY_URL", () -> resolvedCloudinaryUrl);
            cloudinaryAvailable = true;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Test 1: Upload real PNG → DB record created with correct URL
    // ──────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    @DisplayName("1. Upload real PNG → FileMetadata row saved with correct file_path (Cloudinary URL)")
    void upload_RealPng_SavesFileMetadata_WithCorrectUrl() throws Exception {
        assumeBothAvailable();

        long countBefore = fileMetadataRepository.count();
        byte[] pngBytes  = loadRealImageBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "db-test-upload.png", "image/png", pngBytes);

        // Upload via strategy
        Map<String, Object> result = cloudinaryStrategy.upload(file);
        String uploadedUrl = (String) result.get("filePath");

        // Manually save metadata (simulating ImageService)
        FileMetadata saved = fileMetadataRepository.save(
                FileMetadata.builder()
                        .fileName("db-test-upload.png")
                        .filePath(uploadedUrl)
                        .format("image/png")
                        .sizeBytes((Long) result.get("sizeBytes"))
                        .metadata((Map<String, Object>) result.get("metadata"))
                        .build()
        );

        // ── Assert DB record ──
        assertNotNull(saved.getId(), "Saved record must have a generated UUID");

        FileMetadata fromDb = fileMetadataRepository.findById(saved.getId())
                .orElseThrow(() -> new AssertionError("Record not found in DB after save!"));

        assertAll("FileMetadata DB record must match uploaded data",
                () -> assertEquals("db-test-upload.png", fromDb.getFileName(),
                        "fileName must be saved correctly"),
                () -> assertEquals(uploadedUrl, fromDb.getFilePath(),
                        "filePath must be the Cloudinary HTTPS URL"),
                () -> assertTrue(fromDb.getFilePath().startsWith("https://"),
                        "filePath in DB must be an HTTPS URL, got: " + fromDb.getFilePath()),
                () -> assertTrue(fromDb.getFilePath().contains("cloudinary.com"),
                        "filePath must be a Cloudinary URL"),
                () -> assertEquals("image/png", fromDb.getFormat(),
                        "format must be image/png"),
                () -> assertTrue(fromDb.getSizeBytes() > 1000L,
                        "sizeBytes must be > 1000 for real image, got: " + fromDb.getSizeBytes()),
                () -> assertNotNull(fromDb.getCreatedAt(),
                        "createdAt must be auto-set by @CreationTimestamp"),
                () -> assertNotNull(fromDb.getMetadata(),
                        "metadata JSONB must not be null for Cloudinary uploads")
        );

        // ── Assert metadata JSONB fields ──
        Map<String, Object> meta = fromDb.getMetadata();
        assertAll("JSONB metadata must contain Cloudinary-specific fields",
                () -> assertNotNull(meta.get("public_id"),  "metadata.public_id must be present"),
                () -> assertNotNull(meta.get("secure_url"), "metadata.secure_url must be present"),
                () -> assertEquals(fromDb.getFilePath(), meta.get("secure_url"),
                        "metadata.secure_url must equal filePath"),
                () -> assertNotNull(meta.get("width"),  "metadata.width must be present"),
                () -> assertNotNull(meta.get("height"), "metadata.height must be present"),
                () -> assertNotNull(meta.get("format"), "metadata.format (raw Cloudinary) must be present")
        );

        long countAfter = fileMetadataRepository.count();
        assertEquals(countBefore + 1, countAfter, "Row count must increase by exactly 1");

        System.out.println("[DbPersistenceTest] ✔ Test 1 PASS:");
        System.out.println("  id         = " + fromDb.getId());
        System.out.println("  fileName   = " + fromDb.getFileName());
        System.out.println("  filePath   = " + fromDb.getFilePath());
        System.out.println("  format     = " + fromDb.getFormat());
        System.out.println("  sizeBytes  = " + fromDb.getSizeBytes());
        System.out.println("  createdAt  = " + fromDb.getCreatedAt());
        System.out.println("  metadata   = " + meta.keySet());

        // ── Cleanup: delete test record & Cloudinary asset ──
        fileMetadataRepository.deleteById(saved.getId());
        tryDeleteCloudinaryAsset(meta.get("public_id").toString());
        System.out.println("[DbPersistenceTest] ✔ Cleanup done");
    }

    // ──────────────────────────────────────────────────────────────
    // Test 2: Upload 3 files → 3 rows saved, each with unique UUID
    // ──────────────────────────────────────────────────────────────

    @Test
    @Order(2)
    @DisplayName("2. Upload 3 files → exactly 3 DB rows saved with unique UUIDs and correct URLs")
    void upload_ThreeFiles_SavesThreeRows_WithUniqueIds() throws Exception {
        assumeBothAvailable();

        long countBefore = fileMetadataRepository.count();
        byte[] pngBytes = loadRealImageBytes();

        String[] names = {"file-a.png", "file-b.png", "file-c.png"};
        List<UUID> savedIds = new java.util.ArrayList<>();

        for (String name : names) {
            MockMultipartFile file = new MockMultipartFile("file", name, "image/png", pngBytes);
            Map<String, Object> result = cloudinaryStrategy.upload(file);

            FileMetadata saved = fileMetadataRepository.save(
                    FileMetadata.builder()
                            .fileName(name)
                            .filePath((String) result.get("filePath"))
                            .format("image/png")
                            .sizeBytes((Long) result.get("sizeBytes"))
                            .metadata((Map<String, Object>) result.get("metadata"))
                            .build()
            );
            savedIds.add(saved.getId());

            // Clean up Cloudinary asset
            Map<String, Object> meta = (Map<String, Object>) result.get("metadata");
            if (meta != null && meta.get("public_id") != null) {
                tryDeleteCloudinaryAsset(meta.get("public_id").toString());
            }
        }

        long countAfter = fileMetadataRepository.count();
        assertEquals(countBefore + 3, countAfter, "Exactly 3 new rows must be inserted");

        // Verify each row exists with a unique ID
        assertEquals(3, savedIds.stream().distinct().count(), "All 3 UUIDs must be unique");

        for (int i = 0; i < names.length; i++) {
            UUID id = savedIds.get(i);
            FileMetadata row = fileMetadataRepository.findById(id).orElseThrow();
            assertEquals(names[i], row.getFileName(), "fileName[" + i + "] must match");
            assertTrue(row.getFilePath().startsWith("https://"), "filePath[" + i + "] must be HTTPS");
        }

        System.out.println("[DbPersistenceTest] ✔ Test 2 PASS: 3 rows saved with IDs " + savedIds);

        // Cleanup DB rows
        savedIds.forEach(fileMetadataRepository::deleteById);
    }

    // ──────────────────────────────────────────────────────────────
    // Test 3: URL in DB is reachable via HTTP GET
    // ──────────────────────────────────────────────────────────────

    @Test
    @Order(3)
    @DisplayName("3. URL saved in DB → HTTP GET returns 200 (publicly accessible)")
    void savedUrl_IsAccessibleViaHttpGet() throws Exception {
        assumeBothAvailable();

        byte[] pngBytes = loadRealImageBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "url-access-test.png", "image/png", pngBytes);
        Map<String, Object> result = cloudinaryStrategy.upload(file);

        String uploadedUrl = (String) result.get("filePath");
        FileMetadata saved = fileMetadataRepository.save(
                FileMetadata.builder()
                        .fileName("url-access-test.png")
                        .filePath(uploadedUrl)
                        .format("image/png")
                        .sizeBytes((Long) result.get("sizeBytes"))
                        .metadata((Map<String, Object>) result.get("metadata"))
                        .build()
        );

        // Read URL from DB (not from memory — simulate real retrieval)
        String urlFromDb = fileMetadataRepository.findById(saved.getId())
                .orElseThrow()
                .getFilePath();

        System.out.println("[DbPersistenceTest] Accessing URL from DB: " + urlFromDb);

        // HTTP GET the URL stored in DB
        HttpClient httpClient = HttpClient.newHttpClient();
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(urlFromDb))
                .GET()
                .build();
        HttpResponse<Void> resp = httpClient.send(req, HttpResponse.BodyHandlers.discarding());

        assertEquals(200, resp.statusCode(),
                "URL saved in DB must be publicly accessible, got HTTP " + resp.statusCode());

        System.out.println("[DbPersistenceTest] ✔ Test 3 PASS: URL from DB returns HTTP 200");

        // Cleanup
        fileMetadataRepository.deleteById(saved.getId());
        Map<String, Object> meta = (Map<String, Object>) result.get("metadata");
        if (meta != null && meta.get("public_id") != null) {
            tryDeleteCloudinaryAsset(meta.get("public_id").toString());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Test 4: DB row survives a fresh findAll() query (not just flush)
    // ──────────────────────────────────────────────────────────────

    @Test
    @Order(4)
    @DisplayName("4. Saved row appears in findAll() — persistent across JPA context")
    void savedRow_AppearsInFindAll() throws Exception {
        assumeBothAvailable();

        byte[] pngBytes = loadRealImageBytes();
        MockMultipartFile file = new MockMultipartFile(
                "file", "findall-test.png", "image/png", pngBytes);
        Map<String, Object> result = cloudinaryStrategy.upload(file);

        FileMetadata saved = fileMetadataRepository.save(
                FileMetadata.builder()
                        .fileName("findall-test.png")
                        .filePath((String) result.get("filePath"))
                        .format("image/png")
                        .sizeBytes((Long) result.get("sizeBytes"))
                        .metadata((Map<String, Object>) result.get("metadata"))
                        .build()
        );

        UUID savedId = saved.getId();

        // Query via findAll — should include our newly saved record
        List<FileMetadata> all = fileMetadataRepository.findAll();
        boolean found = all.stream().anyMatch(fm -> fm.getId().equals(savedId));

        assertTrue(found, "Saved record must appear in findAll() results. ID=" + savedId);
        System.out.println("[DbPersistenceTest] ✔ Test 4 PASS: row found in findAll() — ID=" + savedId);

        // Cleanup
        fileMetadataRepository.deleteById(savedId);
        Map<String, Object> meta = (Map<String, Object>) result.get("metadata");
        if (meta != null && meta.get("public_id") != null) {
            tryDeleteCloudinaryAsset(meta.get("public_id").toString());
        }
    }

    // ──────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────

    private void assumeBothAvailable() {
        String dbUrl = resolveFromEnv("DB_URL");
        org.junit.jupiter.api.Assumptions.assumeTrue(
                cloudinaryAvailable && dbUrl != null,
                "Skipping: requires both CLOUDINARY_URL and PostgreSQL configured in backend/.env"
        );
    }

    private byte[] loadRealImageBytes() throws Exception {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("test-sample.png")) {
            if (is != null) {
                byte[] bytes = is.readAllBytes();
                System.out.println("[DbPersistenceTest] Loaded real PNG: " + bytes.length + " bytes");
                return bytes;
            }
        }
        // Fallback: download from httpbin
        HttpClient client = HttpClient.newHttpClient();
        HttpResponse<byte[]> resp = client.send(
                HttpRequest.newBuilder().uri(URI.create("https://httpbin.org/image/png")).GET().build(),
                HttpResponse.BodyHandlers.ofByteArray()
        );
        return resp.body();
    }

    private void tryDeleteCloudinaryAsset(String publicId) {
        try {
            if (cloudinaryStrategy != null && publicId != null) {
                // Access Cloudinary via reflection to get the Cloudinary bean
                var field = CloudinaryImageStorageStrategyImpl.class.getDeclaredField("cloudinary");
                field.setAccessible(true);
                var cloudinary = (com.cloudinary.Cloudinary) field.get(cloudinaryStrategy);
                cloudinary.uploader().destroy(publicId, com.cloudinary.utils.ObjectUtils.emptyMap());
                System.out.println("[DbPersistenceTest] Cloudinary cleanup: deleted " + publicId);
            }
        } catch (Exception e) {
            System.out.println("[DbPersistenceTest] Cloudinary cleanup warning: " + e.getMessage());
        }
    }

    private static String resolveFromEnv(String key) {
        String val = System.getenv(key);
        if (val != null && !val.isBlank()) return val;
        try {
            Dotenv dotenv = Dotenv.configure().directory("./").ignoreIfMissing().load();
            val = dotenv.get(key);
            return (val != null && !val.isBlank()) ? val : null;
        } catch (DotenvException e) {
            return null;
        }
    }
}
