# DLSS Testing and Validation

This document defines the recommended validation approach for DLSS after code
or documentation changes.

## Automated Backend Coverage

The backend contains tests for:

| Area | Representative tests |
| --- | --- |
| Application boot | `DatalabelingApplicationTests` |
| Security | `RBACSecurityTest`, controller security tests |
| Users and groups | `UserServiceTest`, `UserControllerTest` |
| Projects and labels | `ProjectServiceTest`, `ProjectControllerTest`, `LabelServiceTest`, `ProjectAccessServiceTest` |
| Datasets | `DatasetServiceTest`, `DatasetControllerTest` |
| Images and storage | `ImageServiceTest`, `ImageValidatorTest`, local/Cloudinary strategy tests |
| Tasks | `TaskServiceTest`, `TaskControllerTest`, `AssignedImageControllerTest` |
| Annotations | `AnnotationServiceTest`, `AnnotationControllerTest`, `AnnotationRepositoryTest` |
| Review workflow | `ReviewQueueServiceTest`, `ReviewQueueControllerTest`, rejection integration tests |
| COCO export | `CocoExportServiceTest`, `CocoExportControllerTest`, `CocoExportIntegrationTest` |
| Dashboards | `DashboardServiceTest`, `DashboardControllerTest` |
| Activity logs | `ActivityLogServiceTest`, `ActivityLogControllerTest`, `ActivityLogAspectTest` |

## Backend Commands

Compile:

```bash
cd backend
./mvnw -q -DskipTests compile
```

Run all tests:

```bash
cd backend
./mvnw test
```

Run high-value workflow tests:

```bash
cd backend
./mvnw -q "-Dtest=FullWorkflowIntegrationTest,CocoExportIntegrationTest,ReviewQueueServiceTest,TaskServiceTest,DatasetServiceTest" test
```

## Frontend Commands

Lint:

```bash
cd frontend
npm run lint
```

Build:

```bash
cd frontend
npm run build
```

## Manual Validation Workflow

Use Swagger UI at:

```text
http://localhost:8080/api/v1/swagger-ui/index.html
```

Recommended workflow:

1. Log in through `/auth/login` and authorize Swagger with the returned token.
2. Create or select manager, annotator, and reviewer users.
3. Create a group and assign scoped users.
4. Create a dataset.
5. Upload image samples to the dataset.
6. Create a project with a manager, dataset, labels, and reviewers.
7. Generate tasks from dataset samples.
8. Split or assign tasks to annotators.
9. Log in as annotator and save bounding-box annotations.
10. Submit ready images for review.
11. Log in as reviewer and approve/reject pending images.
12. Export COCO JSON and ZIP as manager/admin.
13. Confirm audit logs and dashboard summaries reflect the workflow.

## Acceptance Scenarios

| ID | Scenario | Expected result |
| --- | --- | --- |
| AUTH-01 | Valid user logs in. | JWT and user role context are returned. |
| AUTH-02 | Invalid credentials are submitted. | Request is rejected. |
| IAM-01 | Admin creates group and users. | Users appear with correct roles and group membership. |
| PROJ-01 | Manager creates project with dataset and labels. | Project is created in `DRAFT` with active labels. |
| PROJ-02 | Admin assigns project manager and reviewers. | Project response includes manager name and reviewers. |
| DATA-01 | Manager uploads image samples. | Samples include file path and metadata including dimensions when available. |
| TASK-01 | Manager generates tasks from dataset. | One task exists per project/sample pair; duplicates are skipped. |
| TASK-02 | Manager splits tasks evenly. | Pending tasks are distributed and become `ASSIGNED`. |
| ANN-01 | Annotator saves valid bounding box. | Annotation is saved and task becomes `READY_FOR_REVIEW` or `PENDING_REVIEW`. |
| ANN-02 | Bounding box exceeds image boundary. | Request fails with validation error. |
| REVIEW-01 | Reviewer approves pending review task. | Review action is `APPROVED`; task becomes `COMPLETED`. |
| REVIEW-02 | Reviewer rejects pending review task. | Review action is `REJECTED`; task becomes `REJECTED` with comment/category. |
| EXPORT-01 | Manager exports project COCO JSON. | Only `COMPLETED` tasks are included. |
| EXPORT-02 | Completed task has no valid dimensions. | Image and annotations are skipped. |
| EXPORT-03 | Manager exports ZIP package. | ZIP includes `annotations/coco.json`, `export_manifest.json`, and available local images. |
| DASH-01 | Manager opens dashboard after workflow. | Counts reflect task pipeline and quality snapshot. |
| AUDIT-01 | Admin checks audit logs. | Recent logged API actions are visible. |

## Documentation Validation Checklist

- Confluence TOC points to headings within the DLSS page.
- Role descriptions match `@PreAuthorize` usage and service-level access checks.
- API list matches backend controller mappings.
- Database schema matches migrations/entities, especially current table names.
- Task lifecycle includes `READY_FOR_REVIEW`.
- COCO export documentation states `COMPLETED` only.
- Repository docs and Confluence report use the same terminology.
- Use-case, context/container, ERD, lifecycle, and runtime flow diagrams are present in the appropriate sections.
