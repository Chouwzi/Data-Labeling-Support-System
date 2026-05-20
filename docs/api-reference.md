# DLSS API Reference

Base path: `/api/v1`

Authentication uses JWT Bearer tokens. Unless stated otherwise, protected
requests must include:

```http
Authorization: Bearer <access_token>
```

## Authentication

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/login` | Public | Authenticate with email/password and return JWT user context. |

## Users and Groups

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/users` | ADMIN | Create a user account. |
| GET | `/users` | ADMIN, MANAGER | List visible users. |
| GET | `/users/annotators` | ADMIN, MANAGER | List visible annotators. |
| GET | `/users/{userId}` | ADMIN, MANAGER | Get a user by ID. |
| PUT | `/users/{userId}` | ADMIN, MANAGER | Update a visible user. |
| DELETE | `/users/{userId}` | ADMIN | Delete/deactivate user. |
| GET | `/groups` | ADMIN, MANAGER | List visible groups. |
| GET | `/groups/{groupId}/members` | ADMIN, MANAGER | List members of a group. |
| POST | `/groups` | ADMIN | Create a group. |
| PUT | `/groups/{groupId}` | ADMIN, MANAGER | Update a group. |
| DELETE | `/groups/{groupId}` | ADMIN | Delete a group. |

## Projects and Labels

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/projects` | ADMIN, MANAGER | Create project with optional dataset, manager, and labels. |
| GET | `/projects` | ADMIN, MANAGER | List projects visible to current user. |
| GET | `/projects/{id}` | ADMIN, MANAGER, ANNOTATOR, REVIEWER | Get project detail if readable. |
| PUT | `/projects/{id}` | ADMIN, MANAGER | Update project metadata, status, dataset, and labels. |
| PUT | `/projects/{id}/manager` | ADMIN | Assign or clear project manager. |
| PUT | `/projects/{id}/reviewers` | ADMIN, MANAGER | Replace project reviewer assignments. |
| DELETE | `/projects/{id}` | ADMIN, MANAGER | Soft-delete project. |
| GET | `/me/projects` | ANNOTATOR, REVIEWER | List projects assigned to current user. |
| GET | `/projects/{projectId}/statistics` | ADMIN, MANAGER | Get project task statistics. |
| POST | `/projects/{projectId}/labels` | ADMIN, MANAGER | Create label. |
| GET | `/projects/{projectId}/labels` | ADMIN, MANAGER, ANNOTATOR, REVIEWER | List labels. |
| PUT | `/projects/{projectId}/labels/{id}` | ADMIN, MANAGER | Update label. |
| DELETE | `/projects/{projectId}/labels/{id}` | ADMIN, MANAGER | Soft-delete label. |

## Project Files

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/projects/{projectId}/files` | ADMIN, MANAGER | Upload project guideline/supporting file. |
| GET | `/projects/{projectId}/files/{id}` | ADMIN, MANAGER, ANNOTATOR, REVIEWER | Download project file. |

## Datasets and Samples

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/datasets` | ADMIN, MANAGER | Create dataset. |
| GET | `/datasets` | ADMIN, MANAGER | List datasets, with pagination support. |
| GET | `/datasets/{id}` | ADMIN, MANAGER | Get dataset detail. |
| PUT | `/datasets/{id}` | ADMIN, MANAGER | Update dataset. |
| DELETE | `/datasets/{id}` | ADMIN, MANAGER | Soft-delete dataset. |
| GET | `/datasets/{id}/samples` | ADMIN, MANAGER | List dataset image samples. |
| POST | `/datasets/{id}/samples` | ADMIN, MANAGER | Upload files into a dataset as samples. |
| DELETE | `/datasets/{id}/samples/{sampleId}` | ADMIN, MANAGER | Delete sample and dependent tasks/annotations. |

## Images and Uploads

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/images/upload` | ADMIN, MANAGER | Upload image files through active storage strategy. |
| GET | `/uploads/{filename}` | ADMIN, MANAGER, ANNOTATOR, REVIEWER | Serve a stored local upload. |

## Tasks and Annotation Work

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| POST | `/projects/{projectId}/tasks/generate` | ADMIN, MANAGER | Generate tasks from dataset samples. |
| GET | `/projects/{projectId}/tasks` | ADMIN, MANAGER, ANNOTATOR | List project tasks, optionally filtered by status. |
| PUT | `/projects/{projectId}/tasks/assign` | ADMIN, MANAGER | Assign selected tasks to an annotator. |
| GET | `/projects/{projectId}/tasks/workload` | ADMIN, MANAGER | Get project workload by annotator/reviewer. |
| POST | `/projects/{projectId}/tasks/split` | ADMIN, MANAGER | Split pending tasks equally or by percentage. |
| GET | `/projects/{projectId}/workload` | ADMIN, MANAGER | Get workload summary. |
| GET | `/me/assigned-images` | ANNOTATOR | List current annotator assigned images. |
| POST | `/me/assigned-images/projects/{projectId}/submit-ready` | ANNOTATOR | Submit all ready images in a project. |
| POST | `/me/projects/{projectId}/tasks/submit-ready` | ANNOTATOR | Submit ready tasks for current annotator/project. |
| GET | `/tasks/{taskId}/annotations` | ADMIN, MANAGER, ANNOTATOR, REVIEWER | Read annotations for a task. |
| PUT | `/tasks/{taskId}/annotations` | ADMIN, ANNOTATOR | Replace annotations for a task. |

## Review

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/review-queue/images` | ADMIN, MANAGER, REVIEWER | List pending review images. |
| POST | `/review-queue/images/{taskId}/reject` | ADMIN, MANAGER, REVIEWER | Reject a pending-review task. |
| POST | `/review-queue/images/{taskId}/approve` | ADMIN, MANAGER, REVIEWER | Approve a pending-review task. |
| GET | `/review-queue/completed` | ADMIN, MANAGER, REVIEWER | List review history, optionally by status/annotator. |
| GET | `/review-queue/stats` | ADMIN, MANAGER, REVIEWER | Get review statistics for a date range. |
| GET | `/defect-categories` | ADMIN, MANAGER, REVIEWER | List rejection categories. |
| GET | `/defect-categories/{id}` | ADMIN, MANAGER, REVIEWER | Get rejection category. |
| POST | `/defect-categories` | ADMIN | Create rejection category. |
| PUT | `/defect-categories/{id}` | ADMIN | Update rejection category. |
| DELETE | `/defect-categories/{id}` | ADMIN | Delete rejection category. |

## Dashboards and Analytics

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/dashboard/manager` | MANAGER | Manager dashboard summary. |
| GET | `/dashboard/admin` | ADMIN | Admin dashboard summary. |
| GET | `/admin/users/performance` | ADMIN, MANAGER | Visible user performance metrics. |
| GET | `/projects/{projectId}/performance` | ADMIN, MANAGER | Project-specific performance metrics. |
| GET | `/me/performance` | ANNOTATOR, REVIEWER | Current user's performance metrics. |

## Export

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/projects/{projectId}/export/coco` | ADMIN, MANAGER | Export completed annotations as COCO JSON. |
| GET | `/projects/{projectId}/export/coco.zip` | ADMIN, MANAGER | Export COCO JSON, manifest, and resolvable local images as ZIP. |

## Administration

| Method | Path | Roles | Purpose |
| --- | --- | --- | --- |
| GET | `/audit-logs` | ADMIN | Query activity logs. |
| GET | `/system-config` | Authenticated users | Read system configuration. |
| PUT | `/system-config` | ADMIN | Update system configuration. |

## Response Conventions

Most API responses are wrapped in the shared `ApiResponse` envelope. Paginated
responses use the shared `PageResponse` shape:

```json
{
  "current_page": 0,
  "total_pages": 1,
  "page_size": 20,
  "total_elements": 1,
  "data": []
}
```

The backend uses snake_case JSON serialization through Jackson configuration.
