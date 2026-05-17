package com.uth.datalabeling.modules.integration;

import com.uth.datalabeling.modules.annotation.entity.Annotation;
import com.uth.datalabeling.modules.annotation.entity.AnnotationShapeType;
import com.uth.datalabeling.modules.annotation.repository.AnnotationRepository;
import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.defect.entity.DefectCategory;
import com.uth.datalabeling.modules.defect.repository.DefectCategoryRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Label;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.LabelRepository;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.review.entity.Review;
import com.uth.datalabeling.modules.review.repository.ReviewRepository;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║       FULL DATA LABELING WORKFLOW – INTEGRATION TEST                    ║
 * ║  Real H2 DB · No Mocks · Full actor lifecycle                           ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Architecture note                                                       ║
 * ║  ─────────────────────────────────────────────────────────────────────  ║
 * ║  @DataJpaTest rolls back each test by default.                           ║
 * ║  We disable auto-rollback per-test with                                  ║
 * ║  @Transactional(propagation=NOT_SUPPORTED) so that entities saved        ║
 * ║  in one @Test are visible to the next test in sequence.                  ║
 * ║  Each test re-fetches entities from DB (fresh) to avoid stale state.     ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  Workflow stages (ordered)                                               ║
 * ║  1. SETUP    – Admin creates users & DefectCategories                    ║
 * ║  2. PROJECT  – Manager creates dataset, project, labels                  ║
 * ║  3. GENERATE – Manager generates PENDING tasks                           ║
 * ║  4. ASSIGN   – Manager assigns tasks to annotators                       ║
 * ║  5. ANNOTATE – Annotators save annotations & submit                      ║
 * ║  6. REVIEW   – Reviewer approves/rejects                                 ║
 * ║  7. REWORK   – Manager re-assigns rejected task; annotator fixes it      ║
 * ║  8. FINAL    – Verify project stats, isolation, audit trail              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */
@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:full-workflow-v2;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)   // ← disable per-test rollback
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@DisplayName("Full Data Labeling Workflow – Integration Test")
class FullWorkflowIntegrationTest {

    @Autowired UserRepository           userRepo;
    @Autowired DatasetRepository        datasetRepo;
    @Autowired DataSampleRepository     sampleRepo;
    @Autowired ProjectRepository        projectRepo;
    @Autowired LabelRepository          labelRepo;
    @Autowired TaskRepository           taskRepo;
    @Autowired AnnotationRepository     annotationRepo;
    @Autowired DefectCategoryRepository defectCategoryRepo;
    @Autowired ReviewRepository         reviewRepo;

    // ── IDs persisted across tests ──────────────────────────────────────────
    static UUID adminId, managerId, manager2Id, annotator1Id, annotator2Id, reviewerId;
    static UUID datasetId, sample1Id, sample2Id, sample3Id;
    static UUID projectId, labelStopId, labelYieldId;
    static UUID task1Id, task2Id, task3Id;
    static UUID blurryCatId, wrongBoxCatId;

    // ── Reload helpers (always fresh from DB) ───────────────────────────────
    private User user(UUID id)             { return userRepo.findById(id).orElseThrow(); }
    private Task task(UUID id)             { return taskRepo.findById(id).orElseThrow(); }
    private Label label(UUID id)           { return labelRepo.findById(id).orElseThrow(); }
    private Project project(UUID id)       { return projectRepo.findById(id).orElseThrow(); }
    private DefectCategory defCat(UUID id) { return defectCategoryRepo.findById(id).orElseThrow(); }

    // =======================================================================
    // STAGE 1 – ADMIN bootstraps system
    // =======================================================================

    @Test @Order(1)
    @DisplayName("[ADMIN] Creates all system users")
    void s1_admin_creates_users() {
        adminId      = userRepo.save(u("admin@lab.io",   "Admin",       "ADMIN")).getId();
        managerId    = userRepo.save(u("mgr@lab.io",     "Manager 1",   "MANAGER")).getId();
        manager2Id   = userRepo.save(u("mgr2@lab.io",    "Manager 2",   "MANAGER")).getId();
        annotator1Id = userRepo.save(u("ann1@lab.io",    "Annotator 1", "ANNOTATOR")).getId();
        annotator2Id = userRepo.save(u("ann2@lab.io",    "Annotator 2", "ANNOTATOR")).getId();
        reviewerId   = userRepo.save(u("rev@lab.io",     "Reviewer 1",  "REVIEWER")).getId();

        assertThat(userRepo.count()).isGreaterThanOrEqualTo(6);
        assertThat(user(reviewerId).getRole()).isEqualTo("REVIEWER");
        assertThat(user(annotator1Id).getRole()).isEqualTo("ANNOTATOR");
    }

    @Test @Order(2)
    @DisplayName("[ADMIN] Creates DefectCategories (labels for rejection reasons)")
    void s1_admin_creates_defect_categories() {
        blurryCatId   = defectCategoryRepo.save(DefectCategory.builder().name("Blurry Image").description("Out of focus").build()).getId();
        wrongBoxCatId = defectCategoryRepo.save(DefectCategory.builder().name("Wrong Bounding Box").description("Box is off").build()).getId();

        assertThat(defectCategoryRepo.count()).isEqualTo(2);
        assertThat(defectCategoryRepo.findById(blurryCatId)).isPresent();
    }

    // =======================================================================
    // STAGE 2 – MANAGER creates project infrastructure
    // =======================================================================

    @Test @Order(3)
    @DisplayName("[MANAGER] Creates dataset with 3 samples")
    void s2_manager_creates_dataset() {
        User mgr    = user(managerId);
        Dataset ds  = datasetRepo.save(Dataset.builder().name("Traffic Signs Q1").creator(mgr).build());
        datasetId   = ds.getId();
        sample1Id   = sampleRepo.save(DataSample.builder().dataset(ds).imageUrl("uploads/stop-001.jpg").build()).getId();
        sample2Id   = sampleRepo.save(DataSample.builder().dataset(ds).imageUrl("uploads/yield-002.jpg").build()).getId();
        sample3Id   = sampleRepo.save(DataSample.builder().dataset(ds).imageUrl("uploads/speed-003.jpg").build()).getId();

        assertThat(datasetRepo.findById(datasetId)).isPresent();
        assertThat(sampleRepo.count()).isEqualTo(3);
    }

    @Test @Order(4)
    @DisplayName("[MANAGER] Creates project and labels (Stop Sign, Yield Sign)")
    void s2_manager_creates_project_and_labels() {
        Dataset ds = datasetRepo.findById(datasetId).orElseThrow();
        Project p  = projectRepo.save(Project.builder()
                .name("Traffic Sign Labeling")
                .description("Labeling for autonomous driving")
                .managerId(managerId)
                .dataset(ds)
                .status("ACTIVE")
                .build());
        projectId    = p.getId();
        labelStopId  = labelRepo.save(Label.builder().name("Stop Sign").colorHex("#FF0000").project(p).build()).getId();
        labelYieldId = labelRepo.save(Label.builder().name("Yield Sign").colorHex("#FFFF00").project(p).build()).getId();

        assertThat(project(projectId).getManagerId()).isEqualTo(managerId);
        assertThat(project(projectId).getStatus()).isEqualTo("ACTIVE");
        assertThat(labelRepo.count()).isEqualTo(2);
    }

    // =======================================================================
    // STAGE 3 – MANAGER generates tasks
    // =======================================================================

    @Test @Order(5)
    @DisplayName("[MANAGER] Generates 3 PENDING tasks (one per sample)")
    void s3_manager_generates_tasks() {
        Project p = project(projectId);
        task1Id = taskRepo.save(Task.builder().project(p).sample(sampleRepo.findById(sample1Id).orElseThrow()).status("PENDING").build()).getId();
        task2Id = taskRepo.save(Task.builder().project(p).sample(sampleRepo.findById(sample2Id).orElseThrow()).status("PENDING").build()).getId();
        task3Id = taskRepo.save(Task.builder().project(p).sample(sampleRepo.findById(sample3Id).orElseThrow()).status("PENDING").build()).getId();

        List<Task> pending = taskRepo.findByProjectIdAndStatusIgnoreCase(projectId, "PENDING");
        assertThat(pending).hasSize(3);
    }

    @Test @Order(6)
    @DisplayName("[REVIEWER] No tasks in PENDING_REVIEW queue at task-generation time")
    void s3_review_queue_empty_before_submission() {
        Page<Task> queue = taskRepo.findReviewQueueImages(projectId, null, "PENDING_REVIEW", PageRequest.of(0, 10));
        assertThat(queue.getTotalElements()).isZero();
    }

    // =======================================================================
    // STAGE 4 – MANAGER assigns tasks to annotators
    // =======================================================================

    @Test @Order(7)
    @DisplayName("[MANAGER] Assigns task1+task2 → annotator1, task3 → annotator2")
    void s4_manager_assigns_tasks() {
        User ann1 = user(annotator1Id);
        User ann2 = user(annotator2Id);

        Task t1 = task(task1Id);
        t1.setAnnotator(ann1); t1.setStatus("ASSIGNED"); t1.setAssignedAt(LocalDateTime.now());
        taskRepo.save(t1);

        Task t2 = task(task2Id);
        t2.setAnnotator(ann1); t2.setStatus("ASSIGNED"); t2.setAssignedAt(LocalDateTime.now());
        taskRepo.save(t2);

        Task t3 = task(task3Id);
        t3.setAnnotator(ann2); t3.setStatus("ASSIGNED"); t3.setAssignedAt(LocalDateTime.now());
        taskRepo.save(t3);

        assertThat(task(task1Id).getAnnotator().getId()).isEqualTo(annotator1Id);
        assertThat(task(task2Id).getAnnotator().getId()).isEqualTo(annotator1Id);
        assertThat(task(task3Id).getAnnotator().getId()).isEqualTo(annotator2Id);
    }

    @Test @Order(8)
    @DisplayName("[MANAGER] ASSIGNED tasks are NOT in review queue")
    void s4_assigned_tasks_not_in_review_queue() {
        Page<Task> q = taskRepo.findReviewQueueImages(projectId, null, "PENDING_REVIEW", PageRequest.of(0, 10));
        assertThat(q.getTotalElements()).isZero();
    }

    @Test @Order(9)
    @DisplayName("[MANAGER2] Cannot see manager1's tasks (queue isolation by managerId)")
    void s4_manager2_isolated_queue() {
        Page<Task> q = taskRepo.findReviewQueueImages(null, manager2Id, "PENDING_REVIEW", PageRequest.of(0, 10));
        assertThat(q.getTotalElements()).isZero();
    }

    // =======================================================================
    // STAGE 5 – ANNOTATORS label images and submit
    // =======================================================================

    @Test @Order(10)
    @DisplayName("[ANNOTATOR1] Starts task1 → IN_PROGRESS")
    void s5_annotator1_starts_task1() {
        Task t = task(task1Id);
        t.setStatus("IN_PROGRESS");
        taskRepo.save(t);

        assertThat(task(task1Id).getStatus()).isEqualTo("IN_PROGRESS");
    }

    @Test @Order(11)
    @DisplayName("[ANNOTATOR1] Saves bounding-box annotation for Stop Sign on task1")
    void s5_annotator1_annotates_task1() {
        annotationRepo.save(Annotation.builder()
                .task(task(task1Id))
                .label(label(labelStopId))
                .createdBy(user(annotator1Id))
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .geometry(Map.of("x", 0.1, "y", 0.2, "width", 0.3, "height", 0.4))
                .isAiGenerated(false)
                .build());

        assertThat(annotationRepo.findByTaskIdOrderByCreatedAtAsc(task1Id)).hasSize(1);
    }

    @Test @Order(12)
    @DisplayName("[ANNOTATOR1] Submits task1 → PENDING_REVIEW")
    void s5_annotator1_submits_task1() {
        Task t = task(task1Id);
        t.setStatus("PENDING_REVIEW");
        taskRepo.save(t);

        assertThat(task(task1Id).getStatus()).isEqualTo("PENDING_REVIEW");
    }

    @Test @Order(13)
    @DisplayName("[ANNOTATOR1] Annotates and submits task2 (Yield Sign)")
    void s5_annotator1_annotates_and_submits_task2() {
        annotationRepo.save(Annotation.builder()
                .task(task(task2Id))
                .label(label(labelYieldId))
                .createdBy(user(annotator1Id))
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .geometry(Map.of("x", 0.05, "y", 0.1, "width", 0.4, "height", 0.5))
                .isAiGenerated(false)
                .build());
        Task t2 = task(task2Id);
        t2.setStatus("PENDING_REVIEW");
        taskRepo.save(t2);

        assertThat(task(task2Id).getStatus()).isEqualTo("PENDING_REVIEW");
        assertThat(annotationRepo.findByTaskIdOrderByCreatedAtAsc(task2Id)).hasSize(1);
    }

    @Test @Order(14)
    @DisplayName("[ANNOTATOR2] Submits task3 without annotations (empty submit)")
    void s5_annotator2_submits_task3_empty() {
        Task t3 = task(task3Id);
        t3.setStatus("PENDING_REVIEW");
        taskRepo.save(t3);

        assertThat(task(task3Id).getStatus()).isEqualTo("PENDING_REVIEW");
        assertThat(annotationRepo.findByTaskIdOrderByCreatedAtAsc(task3Id)).isEmpty();
    }

    @Test @Order(15)
    @DisplayName("[ANNOTATOR2] Cannot overwrite task1 (ownership: task1 belongs to annotator1)")
    void s5_annotator2_cannot_own_task1() {
        assertThat(task(task1Id).getAnnotator().getId()).isEqualTo(annotator1Id);
        assertThat(task(task1Id).getAnnotator().getId()).isNotEqualTo(annotator2Id);
    }

    // =======================================================================
    // STAGE 6 – REVIEWER reviews the queue
    // =======================================================================

    @Test @Order(16)
    @DisplayName("[REVIEWER] Sees exactly 3 tasks in PENDING_REVIEW queue")
    void s6_reviewer_sees_full_queue() {
        Page<Task> queue = taskRepo.findReviewQueueImages(projectId, null, "PENDING_REVIEW", PageRequest.of(0, 10));
        assertThat(queue.getTotalElements()).isEqualTo(3);
        assertThat(queue.getContent()).extracting(Task::getStatus).containsOnly("PENDING_REVIEW");
    }

    @Test @Order(17)
    @DisplayName("[REVIEWER] Approves task1 → COMPLETED; removed from queue")
    void s6_reviewer_approves_task1() {
        Task t = task(task1Id);
        t.setStatus("COMPLETED");
        taskRepo.save(t);

        assertThat(task(task1Id).getStatus()).isEqualTo("COMPLETED");
        Page<Task> queue = taskRepo.findReviewQueueImages(projectId, null, "PENDING_REVIEW", PageRequest.of(0, 10));
        assertThat(queue.getTotalElements()).isEqualTo(2);
    }

    @Test @Order(18)
    @DisplayName("[REVIEWER] Rejects task2 with category 'Wrong Bounding Box' + comment")
    void s6_reviewer_rejects_task2_with_category() {
        Review r = reviewRepo.save(Review.builder()
                .task(task(task2Id))
                .reviewer(user(reviewerId))
                .defectCategory(defCat(wrongBoxCatId))
                .comments("Bounding box coordinates are far off the actual sign")
                .action("REJECTED")
                .build());
        Task t2 = task(task2Id);
        t2.setStatus("REJECTED");
        taskRepo.save(t2);

        Review saved = reviewRepo.findById(r.getId()).orElseThrow();
        assertThat(saved.getAction()).isEqualTo("REJECTED");
        assertThat(saved.getDefectCategory().getId()).isEqualTo(wrongBoxCatId);
        assertThat(task(task2Id).getStatus()).isEqualTo("REJECTED");
        assertThat(taskRepo.findReviewQueueImages(projectId, null, "PENDING_REVIEW", PageRequest.of(0, 10)).getTotalElements()).isEqualTo(1);
    }

    @Test @Order(19)
    @DisplayName("[REVIEWER] Rejects task3 with comment only (no category)")
    void s6_reviewer_rejects_task3_no_annotations() {
        Review r = reviewRepo.save(Review.builder()
                .task(task(task3Id))
                .reviewer(user(reviewerId))
                .defectCategory(null)
                .comments("No annotations provided at all")
                .action("REJECTED")
                .build());
        Task t3 = task(task3Id);
        t3.setStatus("REJECTED");
        taskRepo.save(t3);

        assertThat(reviewRepo.findById(r.getId()).orElseThrow().getDefectCategory()).isNull();
        assertThat(task(task3Id).getStatus()).isEqualTo("REJECTED");
        assertThat(taskRepo.findReviewQueueImages(projectId, null, "PENDING_REVIEW", PageRequest.of(0, 10)).getTotalElements()).isZero();
    }

    // =======================================================================
    // STAGE 7 – Re-work cycle after rejection
    // =======================================================================

    @Test @Order(20)
    @DisplayName("[MANAGER] Re-assigns rejected task2 back to annotator1 for rework")
    void s7_manager_reassigns_rejected_task() {
        Task t2 = task(task2Id);
        t2.setStatus("ASSIGNED");
        t2.setAssignedAt(LocalDateTime.now());
        taskRepo.save(t2);

        assertThat(task(task2Id).getStatus()).isEqualTo("ASSIGNED");
        assertThat(task(task2Id).getAnnotator().getId()).isEqualTo(annotator1Id);
    }

    @Test @Order(21)
    @DisplayName("[ANNOTATOR1] Deletes old annotation and saves corrected one on task2")
    void s7_annotator1_reworks_task2() {
        // Delete stale annotation
        List<Annotation> old = annotationRepo.findByTaskIdOrderByCreatedAtAsc(task2Id);
        annotationRepo.deleteAll(old);
        annotationRepo.flush();

        // Save corrected bounding box
        annotationRepo.save(Annotation.builder()
                .task(task(task2Id))
                .label(label(labelYieldId))
                .createdBy(user(annotator1Id))
                .shapeType(AnnotationShapeType.BOUNDING_BOX)
                .geometry(Map.of("x", 0.2, "y", 0.3, "width", 0.2, "height", 0.2))
                .isAiGenerated(false)
                .build());

        Task t2 = task(task2Id);
        t2.setStatus("PENDING_REVIEW");
        taskRepo.save(t2);

        assertThat(annotationRepo.findByTaskIdOrderByCreatedAtAsc(task2Id)).hasSize(1);
        assertThat(task(task2Id).getStatus()).isEqualTo("PENDING_REVIEW");
    }

    @Test @Order(22)
    @DisplayName("[REVIEWER] Approves reworked task2 – final approval")
    void s7_reviewer_approves_reworked_task2() {
        Task t2 = task(task2Id);
        t2.setStatus("COMPLETED");
        taskRepo.save(t2);

        assertThat(task(task2Id).getStatus()).isEqualTo("COMPLETED");
        assertThat(taskRepo.findReviewQueueImages(projectId, null, "PENDING_REVIEW", PageRequest.of(0, 10)).getTotalElements()).isZero();
    }

    // =======================================================================
    // STAGE 8 – Final state audit
    // =======================================================================

    @Test @Order(23)
    @DisplayName("[MANAGER] Final stats: 2 COMPLETED, 1 REJECTED")
    void s8_final_task_distribution() {
        List<Task> all = taskRepo.findByProjectId(projectId);
        long completed = all.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();
        long rejected  = all.stream().filter(t -> "REJECTED".equals(t.getStatus())).count();
        assertThat(completed).isEqualTo(2);
        assertThat(rejected).isEqualTo(1);
    }

    @Test @Order(24)
    @DisplayName("[ADMIN] Audit trail: 2 Review records (both REJECTED)")
    void s8_review_audit_trail() {
        List<Review> reviews = reviewRepo.findAll();
        assertThat(reviews).hasSize(2);
        assertThat(reviews).extracting(Review::getAction).containsOnly("REJECTED");
    }

    @Test @Order(25)
    @DisplayName("[MANAGER] Annotations exist only on completed tasks; task3 has none")
    void s8_annotations_on_completed_tasks() {
        assertThat(annotationRepo.findByTaskIdOrderByCreatedAtAsc(task1Id)).hasSize(1);
        assertThat(annotationRepo.findByTaskIdOrderByCreatedAtAsc(task2Id)).hasSize(1); // reworked
        assertThat(annotationRepo.findByTaskIdOrderByCreatedAtAsc(task3Id)).isEmpty();
    }

    @Test @Order(26)
    @DisplayName("[ADMIN] Project isolation: manager2's tasks don't mix with manager1's")
    void s8_project_isolation_between_managers() {
        User mgr2 = user(manager2Id);
        Dataset ds2 = datasetRepo.save(Dataset.builder().name("Dataset B").creator(mgr2).build());
        DataSample s = sampleRepo.save(DataSample.builder().dataset(ds2).imageUrl("uploads/other.jpg").build());
        Project p2 = projectRepo.save(Project.builder().name("Project B").managerId(manager2Id).dataset(ds2).status("ACTIVE").build());
        taskRepo.save(Task.builder().project(p2).sample(s).status("PENDING_REVIEW").build());

        // Manager2 sees only their own pending task
        Page<Task> q2 = taskRepo.findReviewQueueImages(null, manager2Id, "PENDING_REVIEW", PageRequest.of(0, 10));
        assertThat(q2.getTotalElements()).isEqualTo(1);
        assertThat(q2.getContent().getFirst().getProject().getManagerId()).isEqualTo(manager2Id);

        // Manager1 has 0 pending tasks (all processed)
        Page<Task> q1 = taskRepo.findReviewQueueImages(null, managerId, "PENDING_REVIEW", PageRequest.of(0, 10));
        assertThat(q1.getTotalElements()).isZero();
    }

    @Test @Order(27)
    @DisplayName("[ADMIN] Can delete unused DefectCategory (blurryCategory was never referenced)")
    void s8_admin_deletes_unused_defect_category() {
        defectCategoryRepo.deleteById(blurryCatId);
        assertThat(defectCategoryRepo.findById(blurryCatId)).isEmpty();
        // wrongBoxCategory is referenced by a review – should still exist
        assertThat(defectCategoryRepo.findById(wrongBoxCatId)).isPresent();
    }

    // ── Builder helpers ─────────────────────────────────────────────────────

    private User u(String email, String name, String role) {
        return User.builder().email(email).fullName(name).password("Password1!").role(role).build();
    }
}
