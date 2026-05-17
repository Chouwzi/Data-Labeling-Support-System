package com.uth.datalabeling.modules.review.integration;

import com.uth.datalabeling.modules.dataset.entity.DataSample;
import com.uth.datalabeling.modules.dataset.entity.Dataset;
import com.uth.datalabeling.modules.dataset.repository.DataSampleRepository;
import com.uth.datalabeling.modules.dataset.repository.DatasetRepository;
import com.uth.datalabeling.modules.defect.entity.DefectCategory;
import com.uth.datalabeling.modules.defect.repository.DefectCategoryRepository;
import com.uth.datalabeling.modules.iam.entity.User;
import com.uth.datalabeling.modules.iam.repository.UserRepository;
import com.uth.datalabeling.modules.project.entity.Project;
import com.uth.datalabeling.modules.project.repository.ProjectRepository;
import com.uth.datalabeling.modules.review.entity.Review;
import com.uth.datalabeling.modules.review.repository.ReviewRepository;
import com.uth.datalabeling.modules.task.entity.Task;
import com.uth.datalabeling.modules.task.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration Test – Rejection Workflow (Repository Layer, Real H2 DB, No Mocks)
 *
 * Simulated Actors:
 *  - ADMIN     : creates DefectCategory (labels for rejection reasons)
 *  - MANAGER   : creates Project, assigns tasks
 *  - ANNOTATOR : claims a task, changes its status to PENDING_REVIEW (submission)
 *  - REVIEWER  : rejects the image, creates a Review record
 *
 * Each @Nested class represents one stage in the workflow.
 */
@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.datasource.url=jdbc:h2:mem:workflow-test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@DisplayName("Rejection Workflow – Repository Integration Test")
class RejectionWorkflowRepositoryTest {

    // ─── Repos ────────────────────────────────────────────────────────────────
    @Autowired UserRepository userRepository;
    @Autowired DatasetRepository datasetRepository;
    @Autowired DataSampleRepository dataSampleRepository;
    @Autowired ProjectRepository projectRepository;
    @Autowired TaskRepository taskRepository;
    @Autowired DefectCategoryRepository defectCategoryRepository;
    @Autowired ReviewRepository reviewRepository;

    // ─── Shared actors (created in @BeforeEach, reused across @Nested) ────────
    User admin, manager, annotator, reviewer;
    Dataset dataset;
    Project project;
    DataSample sample;
    Task task;
    DefectCategory blurryCategory;

    // ─────────────────────────────────────────────────────────────────────────
    // SETUP: persist base actors shared across all nested test classes
    // ─────────────────────────────────────────────────────────────────────────
    @BeforeEach
    void setupActors() {
        // STEP 0 – persist the four main actors
        admin    = userRepository.save(makeUser("admin@test.com",    "Admin",    "ADMIN"));
        manager  = userRepository.save(makeUser("manager@test.com",  "Manager",  "MANAGER"));
        annotator= userRepository.save(makeUser("ann@test.com",      "Annotator","ANNOTATOR"));
        reviewer = userRepository.save(makeUser("rev@test.com",      "Reviewer", "REVIEWER"));

        // STEP 1 (ADMIN) – create a DefectCategory
        blurryCategory = defectCategoryRepository.save(
                DefectCategory.builder().name("Blurry Image").description("The image is out of focus").build());

        // STEP 2 (MANAGER) – create project + dataset + sample + task
        dataset = datasetRepository.save(Dataset.builder().name("Traffic Dataset").creator(manager).build());
        sample  = dataSampleRepository.save(DataSample.builder().dataset(dataset).imageUrl("uploads/traffic-001.jpg").build());
        project = projectRepository.save(Project.builder().name("Traffic Signs").managerId(manager.getId()).dataset(dataset).status("ACTIVE").build());
        task    = taskRepository.save(Task.builder().project(project).sample(sample).annotator(annotator).status("ASSIGNED").build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 1 – ADMIN creates DefectCategory
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Stage 1 – ADMIN manages DefectCategory")
    class AdminManagesDefectCategories {

        @Test
        @DisplayName("Admin creates a DefectCategory; it is persisted with an auto-generated ID")
        void admin_creates_defect_category_successfully() {
            assertThat(blurryCategory.getId()).isNotNull();
            assertThat(defectCategoryRepository.findById(blurryCategory.getId())).isPresent();
        }

        @Test
        @DisplayName("Admin can update DefectCategory name/description")
        void admin_can_update_defect_category() {
            blurryCategory.setName("Out of Focus");
            blurryCategory.setDescription("Updated description");
            DefectCategory updated = defectCategoryRepository.save(blurryCategory);

            assertThat(updated.getName()).isEqualTo("Out of Focus");
            assertThat(updated.getDescription()).isEqualTo("Updated description");
        }

        @Test
        @DisplayName("Admin can delete a DefectCategory when no reviews reference it")
        void admin_can_delete_unreferenced_defect_category() {
            DefectCategory unused = defectCategoryRepository.save(
                    DefectCategory.builder().name("Wrong Label").description("Labelled incorrectly").build());

            defectCategoryRepository.delete(unused);

            assertThat(defectCategoryRepository.findById(unused.getId())).isEmpty();
        }

        @Test
        @DisplayName("All DefectCategories can be listed")
        void admin_can_list_all_defect_categories() {
            defectCategoryRepository.save(DefectCategory.builder().name("Duplicate Box").description("Overlapping boxes").build());

            List<DefectCategory> all = defectCategoryRepository.findAll();
            // At minimum our blurryCategory + newly added one
            assertThat(all).hasSizeGreaterThanOrEqualTo(2);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 2 – MANAGER setup (project, task)
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Stage 2 – MANAGER sets up project and tasks")
    class ManagerSetsUpProject {

        @Test
        @DisplayName("Manager's project exists, is ACTIVE, and belongs to the manager")
        void manager_creates_project_correctly() {
            Optional<Project> found = projectRepository.findById(project.getId());
            assertThat(found).isPresent();
            assertThat(found.get().getManagerId()).isEqualTo(manager.getId());
            assertThat(found.get().getStatus()).isEqualTo("ACTIVE");
        }

        @Test
        @DisplayName("Task is created in ASSIGNED status and linked to annotator")
        void manager_assigns_task_to_annotator() {
            Optional<Task> found = taskRepository.findById(task.getId());
            assertThat(found).isPresent();
            assertThat(found.get().getStatus()).isEqualTo("ASSIGNED");
            assertThat(found.get().getAnnotator().getId()).isEqualTo(annotator.getId());
        }

        @Test
        @DisplayName("Task does NOT appear in PENDING_REVIEW queue while still ASSIGNED")
        void assigned_task_not_in_review_queue() {
            Page<Task> queue = taskRepository.findReviewQueueImages(project.getId(), null, "PENDING_REVIEW", PageRequest.of(0, 10));
            assertThat(queue.getTotalElements()).isZero();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 3 – ANNOTATOR submits work (changes status to PENDING_REVIEW)
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Stage 3 – ANNOTATOR submits work for review")
    class AnnotatorSubmitsWork {

        @Test
        @DisplayName("After annotator submits, task status becomes PENDING_REVIEW")
        void annotator_submits_task_successfully() {
            // Simulate annotator completing and submitting work
            task.setStatus("PENDING_REVIEW");
            taskRepository.save(task);

            Task reloaded = taskRepository.findById(task.getId()).orElseThrow();
            assertThat(reloaded.getStatus()).isEqualTo("PENDING_REVIEW");
        }

        @Test
        @DisplayName("After submission, task appears in reviewer's queue")
        void submitted_task_appears_in_review_queue() {
            task.setStatus("PENDING_REVIEW");
            taskRepository.save(task);

            Page<Task> queue = taskRepository.findReviewQueueImages(project.getId(), null, "PENDING_REVIEW", PageRequest.of(0, 10));
            assertThat(queue.getTotalElements()).isEqualTo(1);
            assertThat(queue.getContent().getFirst().getId()).isEqualTo(task.getId());
        }

        @Test
        @DisplayName("Tasks in non-PENDING_REVIEW status do NOT appear in review queue")
        void only_pending_review_tasks_appear_in_queue() {
            // task is still ASSIGNED – queue must remain empty
            Page<Task> queue = taskRepository.findReviewQueueImages(project.getId(), null, "PENDING_REVIEW", PageRequest.of(0, 10));
            assertThat(queue.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("Manager can only see pending tasks in their own projects (managerId filter)")
        void manager_review_queue_scoped_to_own_projects() {
            task.setStatus("PENDING_REVIEW");
            taskRepository.save(task);

            // Another manager with a different project should see 0
            User manager2 = userRepository.save(makeUser("mgr2@test.com", "Manager 2", "MANAGER"));
            Page<Task> queue = taskRepository.findReviewQueueImages(null, manager2.getId(), "PENDING_REVIEW", PageRequest.of(0, 10));
            assertThat(queue.getTotalElements()).isZero();

            // Original manager sees 1
            Page<Task> myQueue = taskRepository.findReviewQueueImages(null, manager.getId(), "PENDING_REVIEW", PageRequest.of(0, 10));
            assertThat(myQueue.getTotalElements()).isEqualTo(1);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 4 – REVIEWER rejects image (happy path + all edge cases)
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Stage 4 – REVIEWER rejects image")
    class ReviewerRejectsImage {

        @BeforeEach
        void annotatorSubmits() {
            // Pre-condition: annotator must have submitted before reviewer can act
            task.setStatus("PENDING_REVIEW");
            taskRepository.save(task);
        }

        @Test
        @DisplayName("Reviewer rejects with a DefectCategory and comment – Review record is persisted correctly")
        void reviewer_rejects_with_category_and_comment() {
            Review review = reviewRepository.save(Review.builder()
                    .task(task)
                    .reviewer(reviewer)
                    .defectCategory(blurryCategory)
                    .comments("Image is completely blurry, cannot label")
                    .action("REJECTED")
                    .build());

            task.setStatus("REJECTED");
            taskRepository.save(task);

            // Verify review record
            Review saved = reviewRepository.findById(review.getId()).orElseThrow();
            assertThat(saved.getAction()).isEqualTo("REJECTED");
            assertThat(saved.getComments()).isEqualTo("Image is completely blurry, cannot label");
            assertThat(saved.getDefectCategory().getId()).isEqualTo(blurryCategory.getId());
            assertThat(saved.getReviewer().getId()).isEqualTo(reviewer.getId());
            assertThat(saved.getTask().getId()).isEqualTo(task.getId());

            // Verify task status changed
            Task rejectedTask = taskRepository.findById(task.getId()).orElseThrow();
            assertThat(rejectedTask.getStatus()).isEqualTo("REJECTED");
        }

        @Test
        @DisplayName("Reviewer rejects with comment ONLY (no DefectCategory) – Review still persisted")
        void reviewer_rejects_with_comment_only_no_category() {
            Review review = reviewRepository.save(Review.builder()
                    .task(task)
                    .reviewer(reviewer)
                    .defectCategory(null)   // <-- no category selected
                    .comments("Generic quality issue")
                    .action("REJECTED")
                    .build());

            task.setStatus("REJECTED");
            taskRepository.save(task);

            Review saved = reviewRepository.findById(review.getId()).orElseThrow();
            assertThat(saved.getDefectCategory()).isNull();
            assertThat(saved.getComments()).isEqualTo("Generic quality issue");
            assertThat(taskRepository.findById(task.getId()).orElseThrow().getStatus()).isEqualTo("REJECTED");
        }

        @Test
        @DisplayName("Rejected task no longer appears in PENDING_REVIEW queue")
        void rejected_task_removed_from_review_queue() {
            task.setStatus("REJECTED");
            taskRepository.save(task);

            Page<Task> queue = taskRepository.findReviewQueueImages(project.getId(), null, "PENDING_REVIEW", PageRequest.of(0, 10));
            assertThat(queue.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("Multiple reviews on different tasks are correctly separated by reviewer")
        void multiple_reviews_are_independently_tracked() {
            // A second task submitted by the same annotator
            DataSample sample2 = dataSampleRepository.save(DataSample.builder().dataset(dataset).imageUrl("uploads/traffic-002.jpg").build());
            Task task2 = taskRepository.save(Task.builder().project(project).sample(sample2).annotator(annotator).status("PENDING_REVIEW").build());

            Review review1 = reviewRepository.save(Review.builder().task(task).reviewer(reviewer).action("REJECTED").comments("Too blurry").build());
            Review review2 = reviewRepository.save(Review.builder().task(task2).reviewer(reviewer).defectCategory(blurryCategory).action("REJECTED").comments("Wrong angle").build());

            task.setStatus("REJECTED");
            task2.setStatus("REJECTED");
            taskRepository.saveAll(List.of(task, task2));

            assertThat(reviewRepository.findById(review1.getId()).orElseThrow().getTask().getId()).isEqualTo(task.getId());
            assertThat(reviewRepository.findById(review2.getId()).orElseThrow().getTask().getId()).isEqualTo(task2.getId());

            // Queue is now empty for this project
            Page<Task> queue = taskRepository.findReviewQueueImages(project.getId(), null, "PENDING_REVIEW", PageRequest.of(0, 10));
            assertThat(queue.getTotalElements()).isZero();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STAGE 5 – EDGE CASES & IDEMPOTENCY
    // ─────────────────────────────────────────────────────────────────────────
    @Nested
    @DisplayName("Stage 5 – Edge Cases")
    class EdgeCases {

        @Test
        @DisplayName("Looking up a non-existent DefectCategory ID returns empty Optional")
        void lookup_nonexistent_defect_category_returns_empty() {
            Optional<DefectCategory> result = defectCategoryRepository.findById(java.util.UUID.randomUUID());
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Looking up a non-existent Task ID returns empty Optional")
        void lookup_nonexistent_task_returns_empty() {
            Optional<Task> result = taskRepository.findById(java.util.UUID.randomUUID());
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("COMPLETED task does NOT appear in PENDING_REVIEW queue")
        void completed_task_not_in_review_queue() {
            task.setStatus("COMPLETED");
            taskRepository.save(task);

            Page<Task> queue = taskRepository.findReviewQueueImages(project.getId(), null, "PENDING_REVIEW", PageRequest.of(0, 10));
            assertThat(queue.getTotalElements()).isZero();
        }

        @Test
        @DisplayName("Review is correctly linked to DefectCategory via FK; category lookup via review works")
        void review_links_correctly_to_defect_category() {
            task.setStatus("PENDING_REVIEW");
            taskRepository.save(task);

            Review review = reviewRepository.save(Review.builder()
                    .task(task)
                    .reviewer(reviewer)
                    .defectCategory(blurryCategory)
                    .action("REJECTED")
                    .build());

            Review loaded = reviewRepository.findById(review.getId()).orElseThrow();
            // Re-fetch the category via the review
            DefectCategory linkedCategory = defectCategoryRepository.findById(loaded.getDefectCategory().getId()).orElseThrow();
            assertThat(linkedCategory.getName()).isEqualTo("Blurry Image");
        }

        @Test
        @DisplayName("Different projects have independent review queues (IDOR protection at repo level)")
        void different_projects_have_isolated_queues() {
            // Project B owned by manager but different tasks
            DataSample sampleB = dataSampleRepository.save(DataSample.builder().dataset(dataset).imageUrl("uploads/b.jpg").build());
            Project projectB = projectRepository.save(Project.builder().name("Project B").managerId(manager.getId()).dataset(dataset).status("ACTIVE").build());
            taskRepository.save(Task.builder().project(projectB).sample(sampleB).annotator(annotator).status("PENDING_REVIEW").build());

            task.setStatus("PENDING_REVIEW");
            taskRepository.save(task);

            // Each project queue is isolated
            Page<Task> queueA = taskRepository.findReviewQueueImages(project.getId(), null, "PENDING_REVIEW", PageRequest.of(0, 10));
            Page<Task> queueB = taskRepository.findReviewQueueImages(projectB.getId(), null, "PENDING_REVIEW", PageRequest.of(0, 10));

            assertThat(queueA.getTotalElements()).isEqualTo(1);
            assertThat(queueA.getContent().getFirst().getProject().getId()).isEqualTo(project.getId());
            assertThat(queueB.getTotalElements()).isEqualTo(1);
            assertThat(queueB.getContent().getFirst().getProject().getId()).isEqualTo(projectB.getId());
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────
    private User makeUser(String email, String name, String role) {
        return User.builder()
                .email(email)
                .fullName(name)
                .password("Password1!")   // >= 8 chars to satisfy @Size(min=8)
                .role(role)
                .build();
    }
}
