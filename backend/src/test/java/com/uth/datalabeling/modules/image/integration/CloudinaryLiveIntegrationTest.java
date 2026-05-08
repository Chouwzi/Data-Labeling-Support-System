package com.uth.datalabeling.modules.image.integration;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.uth.datalabeling.modules.image.strategy.CloudinaryImageStorageStrategyImpl;
import io.github.cdimascio.dotenv.Dotenv;
import io.github.cdimascio.dotenv.DotenvException;
import org.junit.jupiter.api.*;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * LIVE Cloudinary Integration Tests
 *
 * These tests make REAL network calls to Cloudinary.
 * They are automatically skipped unless CLOUDINARY_URL is set in the environment
 * or in the project's .env file.
 *
 * What is tested:
 *  1. Upload a real image → verify Cloudinary responds with a valid secure_url
 *  2. Verify the uploaded asset exists via Admin API (resource() lookup)
 *  3. Retrieve the image URL via HTTP GET → verify 200 OK response
 *  4. Delete the test asset (cleanup)
 *  5. Verify deletion – resource() now throws / returns not-found
 *
 * Cleanup: All test assets are tagged 'ltj-test' for easy bulk deletion if a test fails.
 */
@Tag("integration")
@DisplayName("Cloudinary LIVE Integration Tests")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class CloudinaryLiveIntegrationTest {

    private static Cloudinary cloudinary;
    private static boolean cloudinaryAvailable = false;

    /** Tracks all public_ids uploaded during this test run for cleanup. */
    private static final List<String> uploadedPublicIds = new ArrayList<>();

    // ============================================================
    // Setup & Teardown
    // ============================================================

    @BeforeAll
    static void initCloudinary() {
        String cloudinaryUrl = resolveCloudinaryUrl();
        if (cloudinaryUrl == null || cloudinaryUrl.contains("<your_api_key>") || cloudinaryUrl.equals("cloudinary://key:secret@cloudname")) {
            System.out.println("[CloudinaryLiveTest] CLOUDINARY_URL not configured – all live tests will be skipped.");
            return;
        }
        try {
            cloudinary = new Cloudinary(cloudinaryUrl);
            // Quick connectivity check: ping the API
            cloudinary.api().ping(ObjectUtils.emptyMap());
            cloudinaryAvailable = true;
            System.out.println("[CloudinaryLiveTest] Cloudinary connection established ✔");
        } catch (Exception e) {
            System.out.println("[CloudinaryLiveTest] Cloudinary unreachable: " + e.getMessage() + " – tests will be skipped.");
        }
    }

    @AfterAll
    static void cleanup() {
        if (!cloudinaryAvailable || uploadedPublicIds.isEmpty()) return;
        System.out.println("[CloudinaryLiveTest] Cleaning up " + uploadedPublicIds.size() + " test asset(s)...");
        for (String publicId : uploadedPublicIds) {
            try {
                Map<?, ?> result = cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("invalidate", true));
                System.out.println("[CloudinaryLiveTest] Deleted: " + publicId + " → " + result.get("result"));
            } catch (Exception e) {
                System.out.println("[CloudinaryLiveTest] Failed to delete " + publicId + ": " + e.getMessage());
            }
        }
    }

    // ============================================================
    // Test 1: Real upload → valid secure_url returned
    // ============================================================

    @Test
    @Order(1)
    @DisplayName("1. Upload a REAL PNG image (from httpbin.org) → Cloudinary returns valid secure_url")
    void testRealUpload_ReturnsSecureUrl() throws Exception {
        assumeCloudinaryAvailable();

        String publicId = testPublicId("upload-real-png");
        byte[] pngBytes = loadRealImageBytes(); // real PNG from test resources

        System.out.println("[CloudinaryLiveTest] Uploading REAL PNG: " + pngBytes.length + " bytes");

        Map<?, ?> result = cloudinary.uploader().upload(pngBytes,
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "tags", "ltj-test",
                        "resource_type", "image"
                ));

        uploadedPublicIds.add(publicId);

        String secureUrl = (String) result.get("secure_url");
        assertNotNull(secureUrl, "secure_url must not be null");
        assertTrue(secureUrl.startsWith("https://"), "secure_url must use HTTPS");
        assertTrue(secureUrl.contains("cloudinary.com"), "secure_url must be a Cloudinary URL");
        assertEquals(publicId, result.get("public_id"), "public_id must match what we sent");
        assertEquals("image", result.get("resource_type"));
        assertEquals("png", result.get("format"), "format must be png");

        Long cloudBytes = result.get("bytes") instanceof Number n ? n.longValue() : 0L;
        assertTrue(cloudBytes > 0, "Cloudinary must report file size > 0, got: " + cloudBytes);

        System.out.println("[CloudinaryLiveTest] ✔ Uploaded REAL PNG: " + secureUrl
                + " | size=" + cloudBytes + " bytes"
                + " | format=" + result.get("format")
                + " | width=" + result.get("width") + "x" + result.get("height"));
    }

    // ============================================================
    // Test 2: Admin API resource() verifies asset exists
    // ============================================================

    @Test
    @Order(2)
    @DisplayName("2. Admin API resource() confirms uploaded asset exists in Cloudinary")
    void testAdminApi_ResourceExists() throws Exception {
        assumeCloudinaryAvailable();

        // Upload a fresh asset for this test
        String publicId = testPublicId("admin-verify");
        byte[] pngBytes = buildMinimalPng();

        cloudinary.uploader().upload(pngBytes,
                ObjectUtils.asMap("public_id", publicId, "tags", "ltj-test"));
        uploadedPublicIds.add(publicId);

        // Admin API lookup
        Map<?, ?> resource = cloudinary.api().resource(publicId, ObjectUtils.emptyMap());

        assertNotNull(resource, "resource() must return non-null for existing asset");
        assertEquals(publicId, resource.get("public_id"), "public_id must match");
        assertNotNull(resource.get("secure_url"), "secure_url must be present in resource details");
        assertNotNull(resource.get("bytes"), "bytes must be present in resource details");

        System.out.println("[CloudinaryLiveTest] Admin API confirmed: public_id=" + resource.get("public_id")
                + ", bytes=" + resource.get("bytes"));
    }

    // ============================================================
    // Test 3: HTTP GET on the secure_url → 200 OK (asset accessible)
    // ============================================================

    @Test
    @Order(3)
    @DisplayName("3. Uploaded image URL is publicly accessible (HTTP GET → 200 OK)")
    void testUploadedUrl_IsAccessible_Via_HttpGet() throws Exception {
        assumeCloudinaryAvailable();

        String publicId = testPublicId("http-access");
        byte[] pngBytes = buildMinimalPng();

        Map<?, ?> uploadResult = cloudinary.uploader().upload(pngBytes,
                ObjectUtils.asMap("public_id", publicId, "tags", "ltj-test"));
        uploadedPublicIds.add(publicId);

        String secureUrl = (String) uploadResult.get("secure_url");
        assertNotNull(secureUrl);

        // Perform real HTTP GET
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(secureUrl))
                .GET()
                .build();
        HttpResponse<Void> response = client.send(request, HttpResponse.BodyHandlers.discarding());

        assertEquals(200, response.statusCode(),
                "Cloudinary URL must return HTTP 200. Got: " + response.statusCode() + " for URL: " + secureUrl);
        System.out.println("[CloudinaryLiveTest] HTTP GET " + secureUrl + " → " + response.statusCode());
    }

    // ============================================================
    // Test 4: CloudinaryImageStorageStrategyImpl with REAL Cloudinary
    // ============================================================

    @Test
    @Order(4)
    @DisplayName("4. CloudinaryImageStorageStrategyImpl.upload() → real PNG upload, verify result map fields")
    void testStrategy_RealUpload_ReturnsCorrectResultMap() throws Exception {
        assumeCloudinaryAvailable();

        CloudinaryImageStorageStrategyImpl strategy = new CloudinaryImageStorageStrategyImpl(cloudinary);
        org.springframework.test.util.ReflectionTestUtils.setField(strategy, "activeStrategy", "cloudinary");

        byte[] pngBytes = loadRealImageBytes(); // use REAL downloaded PNG
        MockMultipartFile file = new MockMultipartFile("file", "real-test.png", "image/png", pngBytes);

        System.out.println("[CloudinaryLiveTest] Strategy uploading REAL PNG: " + pngBytes.length + " bytes");

        Map<String, Object> result = strategy.upload(file);

        // Track for cleanup
        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = (Map<String, Object>) result.get("metadata");
        if (metadata != null && metadata.get("public_id") != null) {
            uploadedPublicIds.add((String) metadata.get("public_id"));
        }

        assertAll("Strategy result map must contain all required keys with valid values",
                () -> assertNotNull(result.get("filePath"), "filePath must not be null"),
                () -> assertTrue(((String) result.get("filePath")).startsWith("https://"),
                        "filePath must be HTTPS Cloudinary URL"),
                () -> assertEquals("image/png", result.get("format"),
                        "format must be the MIME type from file.getContentType()"),
                () -> assertNotNull(result.get("sizeBytes"), "sizeBytes must not be null"),
                () -> assertTrue((Long) result.get("sizeBytes") > 1000L,
                        "sizeBytes must be > 1000 for a real image, got: " + result.get("sizeBytes")),
                () -> assertNotNull(result.get("metadata"), "metadata map must not be null"),
                () -> assertNotNull(metadata.get("public_id"), "metadata.public_id must be present"),
                () -> assertNotNull(metadata.get("secure_url"), "metadata.secure_url must be present"),
                () -> assertNotNull(metadata.get("width"), "metadata.width must be present"),
                () -> assertNotNull(metadata.get("height"), "metadata.height must be present")
        );

        System.out.println("[CloudinaryLiveTest] ✔ Strategy result:"
                + " filePath=" + result.get("filePath")
                + " | sizeBytes=" + result.get("sizeBytes")
                + " | format=" + result.get("format")
                + " | width=" + metadata.get("width") + "x" + metadata.get("height"));
    }

    // ============================================================
    // Test 5: Delete → resource() throws (asset no longer exists)
    // ============================================================

    @Test
    @Order(5)
    @DisplayName("5. After destroy(), Admin API resource() throws exception (asset deleted)")
    void testDestroy_ThenResourceLookup_Throws() throws Exception {
        assumeCloudinaryAvailable();

        String publicId = testPublicId("destroy-test");
        byte[] pngBytes = buildMinimalPng();

        cloudinary.uploader().upload(pngBytes,
                ObjectUtils.asMap("public_id", publicId, "tags", "ltj-test"));
        // Do NOT add to uploadedPublicIds – we'll delete it manually in the test

        // Delete
        Map<?, ?> destroyResult = cloudinary.uploader().destroy(publicId,
                ObjectUtils.asMap("invalidate", true));
        assertEquals("ok", destroyResult.get("result"),
                "destroy() must return 'ok' for a valid public_id");
        System.out.println("[CloudinaryLiveTest] Destroy result: " + destroyResult.get("result"));

        // Verify it's gone: Admin API should throw
        Exception notFoundException = assertThrows(Exception.class,
                () -> cloudinary.api().resource(publicId, ObjectUtils.emptyMap()),
                "resource() must throw when the asset has been deleted");
        System.out.println("[CloudinaryLiveTest] Post-delete resource() threw: "
                + notFoundException.getClass().getSimpleName() + " – " + notFoundException.getMessage());
    }

    // ============================================================
    // Test 6: Upload invalid file bytes → Cloudinary rejects
    // ============================================================

    @Test
    @Order(6)
    @DisplayName("6. Uploading non-image bytes → Cloudinary throws exception")
    void testUpload_InvalidBytes_ThrowsException() {
        assumeCloudinaryAvailable();

        // Random garbage bytes that are definitely not an image
        byte[] garbage = {0x00, 0x01, 0x02, 0x03, 0x04};

        assertThrows(Exception.class, () -> {
            cloudinary.uploader().upload(garbage,
                    ObjectUtils.asMap("public_id", testPublicId("invalid-bytes"),
                            "tags", "ltj-test"));
        }, "Cloudinary must reject clearly invalid file bytes");

        System.out.println("[CloudinaryLiveTest] Cloudinary correctly rejected invalid bytes.");
    }

    // ============================================================
    // Test 7: Upload JPEG thật tải từ internet
    // ============================================================

    @Test
    @Order(7)
    @DisplayName("7. Download a JPEG from internet then upload to Cloudinary → verify roundtrip")
    void testRealJpeg_DownloadAndUpload_Roundtrip() throws Exception {
        assumeCloudinaryAvailable();

        // Download a real JPEG from a reliable public source
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest downloadReq = HttpRequest.newBuilder()
                .uri(URI.create("https://httpbin.org/image/jpeg"))
                .GET()
                .build();
        HttpResponse<byte[]> downloadResp = client.send(downloadReq, HttpResponse.BodyHandlers.ofByteArray());
        assertEquals(200, downloadResp.statusCode(), "Download from httpbin must return 200");

        byte[] jpegBytes = downloadResp.body();
        assertTrue(jpegBytes.length > 100, "Downloaded JPEG must be > 100 bytes, got: " + jpegBytes.length);

        // Verify JPEG magic bytes: 0xFF 0xD8
        assertEquals((byte) 0xFF, jpegBytes[0], "First byte must be 0xFF (JPEG magic)");
        assertEquals((byte) 0xD8, jpegBytes[1], "Second byte must be 0xD8 (JPEG magic)");

        System.out.println("[CloudinaryLiveTest] Downloaded real JPEG: " + jpegBytes.length + " bytes");

        // Upload to Cloudinary via Strategy
        CloudinaryImageStorageStrategyImpl strategy = new CloudinaryImageStorageStrategyImpl(cloudinary);
        org.springframework.test.util.ReflectionTestUtils.setField(strategy, "activeStrategy", "cloudinary");

        MockMultipartFile file = new MockMultipartFile(
                "file", "real-download.jpg", "image/jpeg", jpegBytes);

        Map<String, Object> result = strategy.upload(file);

        // Track for cleanup
        @SuppressWarnings("unchecked")
        Map<String, Object> metadata = (Map<String, Object>) result.get("metadata");
        if (metadata != null && metadata.get("public_id") != null) {
            uploadedPublicIds.add((String) metadata.get("public_id"));
        }

        String filePath = (String) result.get("filePath");
        assertNotNull(filePath, "filePath must not be null");
        assertTrue(filePath.startsWith("https://"), "filePath must be HTTPS");
        assertEquals("image/jpeg", result.get("format"), "format must be image/jpeg");

        // Retrieve via HTTP GET → must be 200 OK
        HttpRequest getReq = HttpRequest.newBuilder()
                .uri(URI.create(filePath))
                .GET()
                .build();
        HttpResponse<Void> getResp = client.send(getReq, HttpResponse.BodyHandlers.discarding());
        assertEquals(200, getResp.statusCode(),
                "Uploaded JPEG must be publicly accessible. Got: " + getResp.statusCode());

        System.out.println("[CloudinaryLiveTest] ✔ JPEG roundtrip complete:"
                + " downloaded=" + jpegBytes.length + " bytes"
                + " | uploaded to=" + filePath
                + " | HTTP GET=" + getResp.statusCode());
    }

    // ============================================================
    // Helpers
    // ============================================================

    private void assumeCloudinaryAvailable() {
        org.junit.jupiter.api.Assumptions.assumeTrue(
                cloudinaryAvailable,
                "Skipping: Cloudinary not available or CLOUDINARY_URL not configured."
        );
    }

    /**
     * Resolves CLOUDINARY_URL from:
     * 1. System environment variable
     * 2. Project .env file (backend/.env)
     */
    private static String resolveCloudinaryUrl() {
        // 1. Check system env first
        String envVar = System.getenv("CLOUDINARY_URL");
        if (envVar != null && !envVar.isBlank()) {
            return envVar;
        }
        // 2. Load from dotenv
        try {
            Dotenv dotenv = Dotenv.configure()
                    .directory("./")        // relative to working directory (backend/)
                    .ignoreIfMissing()
                    .load();
            String val = dotenv.get("CLOUDINARY_URL");
            return (val != null && !val.isBlank()) ? val : null;
        } catch (DotenvException e) {
            return null;
        }
    }

    /** Generates a unique test public_id using UUID suffix to avoid collisions. */
    private String testPublicId(String prefix) {
        return "ltj-test/" + prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    /**
     * Loads the REAL PNG image downloaded from httpbin.org.
     * Falls back to buildMinimalPng() if the file is not on the classpath.
     */
    private byte[] loadRealImageBytes() throws IOException {
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("test-sample.png")) {
            if (is != null) {
                byte[] bytes = is.readAllBytes();
                System.out.println("[CloudinaryLiveTest] Loaded real PNG from classpath: " + bytes.length + " bytes");
                return bytes;
            }
        }
        System.out.println("[CloudinaryLiveTest] test-sample.png not found, falling back to minimal PNG");
        return buildMinimalPng();
    }

    /**
     * Returns the 16-byte minimal PNG signature + IHDR chunk header.
     * Apache Tika and Cloudinary both recognise this as a valid PNG.
     */
    private byte[] buildMinimalPng() {
        return new byte[]{
                // PNG signature
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                // IHDR chunk length
                0x00, 0x00, 0x00, 0x0D,
                // IHDR chunk type
                0x49, 0x48, 0x44, 0x52,
                // Width: 1
                0x00, 0x00, 0x00, 0x01,
                // Height: 1
                0x00, 0x00, 0x00, 0x01,
                // Bit depth: 8, Color type: 2 (RGB), Compression: 0, Filter: 0, Interlace: 0
                0x08, 0x02, 0x00, 0x00, 0x00,
                // IHDR CRC
                (byte) 0x90, 0x77, 0x53, (byte) 0xDE,
                // IDAT chunk (minimal compressed row)
                0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54,
                0x08, (byte) 0xD7, 0x63, (byte) 0xF8, (byte) 0xCF, (byte) 0xC0, 0x00, 0x00,
                0x00, 0x02, 0x00, 0x01,
                // CRC
                (byte) 0xE2, 0x21, (byte) 0xBC, 0x33,
                // IEND
                0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, (byte) 0xAE, 0x42, 0x60, (byte) 0x82
        };
    }
}
