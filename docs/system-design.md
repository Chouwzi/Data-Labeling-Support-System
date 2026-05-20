# DLSS System Design

This document describes the current design of the Data Labeling Support System
as implemented in the repository.

## Context

DLSS supports teams that prepare image datasets for computer vision. Managers
create projects, define labels, assign work, and monitor progress. Annotators
draw bounding boxes. Reviewers approve or reject submitted annotations. Admins
manage the platform, users, configuration, and global reporting.

## Diagram Inventory

The project documentation uses diagrams where they clarify a specific view:

| Diagram | Documentation section | Purpose |
| --- | --- | --- |
| Use-case diagram | Requirements / Actor interaction | Shows what each role can do. |
| System context diagram | Architecture context | Shows users and external dependencies around DLSS. |
| Container diagram | Architecture containers | Shows frontend, backend, database, storage, and export boundary. |
| Backend module/component diagram | Building block view | Shows source-level module responsibilities. |
| ERD | Database design | Shows persistent entities and relationships. |
| Task lifecycle state diagram | Workflow / runtime view | Shows status transitions from generated work to reviewed output. |
| Annotation and review flowcharts | Runtime view | Shows representative business workflows. |
| COCO export flowchart | Runtime view / implementation highlight | Shows how export data is selected, transformed, and packaged. |

This placement follows the same separation used by lightweight SRS/SDD
documentation: requirements diagrams explain user intent, architecture diagrams
explain structure, ERDs explain persistence, and flow/sequence diagrams explain
runtime behavior.

## Use-Case View

```mermaid
flowchart LR
    Admin[Administrator]
    Manager[Manager]
    Annotator[Annotator]
    Reviewer[Reviewer]
    System((DLSS))

    Admin --> UC1[Manage users and groups]
    Admin --> UC2[Manage system configuration]
    Admin --> UC3[View audit logs]
    Admin --> UC4[Manage all projects]

    Manager --> UC5[Create and configure projects]
    Manager --> UC6[Manage datasets and labels]
    Manager --> UC7[Generate, assign, and split tasks]
    Manager --> UC8[Monitor dashboards and reports]
    Manager --> UC9[Export COCO data]

    Annotator --> UC10[View assigned projects and tasks]
    Annotator --> UC11[Draw and save bounding boxes]
    Annotator --> UC12[Submit ready images]

    Reviewer --> UC13[Open review queue]
    Reviewer --> UC14[Approve annotations]
    Reviewer --> UC15[Reject annotations with feedback]

    UC1 --> System
    UC2 --> System
    UC3 --> System
    UC4 --> System
    UC5 --> System
    UC6 --> System
    UC7 --> System
    UC8 --> System
    UC9 --> System
    UC10 --> System
    UC11 --> System
    UC12 --> System
    UC13 --> System
    UC14 --> System
    UC15 --> System
```

```mermaid
flowchart LR
    Admin[Admin] --> DLSS[DLSS Web Application]
    Manager[Manager] --> DLSS
    Annotator[Annotator] --> DLSS
    Reviewer[Reviewer] --> DLSS
    DLSS --> Postgres[(PostgreSQL)]
    DLSS --> Uploads[Local or Cloudinary storage]
    DLSS --> COCO[COCO JSON / ZIP export]
```

## Containers

```mermaid
flowchart TB
    Browser[React/Vite Frontend]
    API[Spring Boot REST API]
    Auth[JWT Security Filter]
    DB[(PostgreSQL)]
    Local[(Local Upload Directory)]
    Cloud[(Cloudinary)]
    Zip[COCO JSON / ZIP Export]

    Browser -->|HTTPS/JSON| API
    API --> Auth
    API --> DB
    API -->|storage.strategy=local| Local
    API -->|storage.strategy=cloudinary| Cloud
    API --> Zip
```

| Container | Responsibility |
| --- | --- |
| React frontend | Role-based user interface, routing, forms, dashboards, annotation workspace, review workspace. |
| Spring Boot API | Authentication, authorization, domain workflows, validation, persistence, export packaging. |
| PostgreSQL | Users, groups, projects, datasets, tasks, annotations, reviews, configuration, and audit logs. |
| Storage | Uploaded image files and project files; local filesystem by default, Cloudinary optional. |

## Backend Modules

```mermaid
flowchart LR
    Security[security/jwt + config] --> IAM[iam]
    IAM --> Project[project]
    Project --> Dataset[dataset]
    Project --> Task[task]
    Dataset --> Task
    Task --> Annotation[annotation]
    Task --> Review[review]
    Defect[defect] --> Review
    Project --> Export[export]
    Annotation --> Export
    Task --> Dashboard[dashboard]
    Task --> Analytics[analytics]
    Activity[activitylog] --> Dashboard
    SystemConfig[systemconfig] --> Image[image]
    Image --> Dataset
```

| Module | Responsibility |
| --- | --- |
| `iam` | Auth, user CRUD, group management, user/group scoping. |
| `project` | Project lifecycle, manager/reviewer assignment, labels, files, statistics, access rules. |
| `dataset` | Dataset CRUD, data samples, upload-to-sample workflow, soft delete. |
| `task` | Generate, assign, split, list, workload, and annotator task submission. |
| `annotation` | Read/write normalized bounding-box annotations. |
| `review` | Pending review queue, approve/reject actions, history, review statistics. |
| `defect` | Rejection category taxonomy. |
| `export` | COCO JSON and COCO ZIP export. |
| `dashboard` | Admin and manager dashboard summaries. |
| `analytics` | User and project performance metrics. |
| `activitylog` | Audited API activity capture and query. |
| `systemconfig` | Singleton system configuration settings. |
| `image` | Upload validation, local/cloud storage, and served upload files. |

## Frontend Areas

| Area | Screens |
| --- | --- |
| Public/Auth | Landing page, login, unauthorized page. |
| Admin | Dashboard, users/groups, system configuration, logs, projects, datasets, upload/images, label taxonomy. |
| Manager | Dashboard, projects, project detail, datasets, groups, reports/progress. |
| Annotator | Project list, task list, annotation workspace, settings. |
| Reviewer | Review queue, completed review view, review workspace. |

## Role and Access Model

| Role | Write access | Read access highlights |
| --- | --- | --- |
| ADMIN | Global user, group, project, dataset, configuration, defect category, and export operations. | All projects, dashboards, audit logs. |
| MANAGER | Own projects, labels, datasets, tasks, task split/assignment, reviewers, export. | Own projects and scoped group users. |
| ANNOTATOR | Assigned task annotations and ready-for-review submission. | Assigned projects, assigned images, labels, previous rejection feedback. |
| REVIEWER | Review approval/rejection and review history. | Review queue and projects visible through group/project assignment rules. |

Important access rules:

- Admins can read and manage all projects.
- Managers can manage projects where `project.manager_id` is their user ID.
- Managers can assign annotators/reviewers in their current group scope.
- Reviewers see queue items through group scope and project review assignment logic.
- Annotators read projects/tasks only when tasks are assigned to them.

## Task Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PENDING: Generate tasks
    PENDING --> ASSIGNED: Assign or split
    ASSIGNED --> IN_PROGRESS: Save without completed annotations
    ASSIGNED --> READY_FOR_REVIEW: Save annotations
    IN_PROGRESS --> READY_FOR_REVIEW: Save annotations
    READY_FOR_REVIEW --> PENDING_REVIEW: Submit ready images
    ASSIGNED --> PENDING_REVIEW: Save with submit=true
    IN_PROGRESS --> PENDING_REVIEW: Save with submit=true
    PENDING_REVIEW --> COMPLETED: Reviewer approves
    PENDING_REVIEW --> REJECTED: Reviewer rejects
    REJECTED --> READY_FOR_REVIEW: Annotator corrects
    REJECTED --> PENDING_REVIEW: Annotator submits correction
```

## Core Runtime Flows

### Project Setup and Task Generation

```mermaid
flowchart TD
    A[Manager/Admin creates dataset] --> B[Upload image samples]
    B --> C[Create project]
    C --> D[Attach dataset]
    D --> E[Create label taxonomy]
    E --> F[Assign manager and reviewers]
    F --> G[Generate tasks from dataset samples]
    G --> H{Duplicate project/sample task?}
    H -->|Yes| I[Skip existing task]
    H -->|No| J[Create PENDING task]
    I --> K[Show created/skipped count]
    J --> K
```

### Annotation and Review Workflow

```mermaid
flowchart TD
    A[Manager assigns or splits PENDING tasks] --> B[Task becomes ASSIGNED]
    B --> C[Annotator opens assigned image]
    C --> D[Annotator saves bounding boxes]
    D --> E{Submit immediately?}
    E -->|No| F[Task becomes READY_FOR_REVIEW]
    E -->|Yes| G[Task becomes PENDING_REVIEW]
    F --> H[Annotator bulk-submits ready images]
    H --> G
    G --> I[Reviewer opens review queue]
    I --> J{Annotation valid?}
    J -->|Yes| K[Create APPROVED review]
    K --> L[Task becomes COMPLETED]
    J -->|No| M[Create REJECTED review with feedback]
    M --> N[Task becomes REJECTED]
    N --> C
```

### COCO Export Workflow

```mermaid
flowchart TD
    A[Manager/Admin requests COCO export] --> B[Validate project access]
    B --> C[Load active project labels]
    C --> D[Map labels to sequential category IDs]
    D --> E[Load COMPLETED tasks with samples]
    E --> F{Sample has valid dimensions?}
    F -->|No| G[Skip image and annotations]
    F -->|Yes| H[Add image record]
    H --> I[Load task annotations]
    I --> J{Label still active?}
    J -->|No| K[Skip annotation]
    J -->|Yes| L[Convert normalized bbox to pixels]
    L --> M[Build COCO annotation]
    G --> N[Return JSON or ZIP]
    K --> N
    M --> N
```

## Project Lifecycle

Projects use these status values:

| Status | Meaning |
| --- | --- |
| `DRAFT` | Created or configured, not actively running yet. |
| `ACTIVE` | Ready for labeling/review work. |
| `ARCHIVED` | Closed for regular updates. |

Allowed transitions:

- `DRAFT -> ACTIVE`
- `DRAFT -> ARCHIVED`
- `ACTIVE -> ARCHIVED`

## COCO Export Design

Managers and admins can export completed project annotations through:

- `GET /api/v1/projects/{projectId}/export/coco`
- `GET /api/v1/projects/{projectId}/export/coco.zip`

The JSON export contains:

- `info`
- `licenses`
- `categories`
- `images`
- `annotations`

The ZIP export contains:

- `annotations/coco.json`
- `export_manifest.json`
- `images/*` for local files that can be resolved from `app.upload.dir`

Export rules:

- Only `COMPLETED` tasks are exported.
- Images without valid dimensions are skipped.
- Normalized bounding boxes are converted to COCO pixel coordinates.
- Deleted labels are not emitted as categories.
- Missing local image files are reported in the manifest instead of failing the JSON export.

## Documentation Standards Applied

- Requirements are written in an SRS-style structure inspired by ISO/IEC/IEEE 29148.
- Architecture sections use the lightweight structure promoted by arc42 and C4.
- Technical writing follows concise, task-oriented developer documentation practices.
