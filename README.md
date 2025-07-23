## Inventory Manager (PERN Stack) Documentation

### 1. Project Overview

**Name:** Inventory Manager

**Description:** A web-based application to help businesses manage their inventory in an isolated local environment. Core functionality includes tracking products, categories, stock levels, and full change logs, with role-based access via an admin dashboard.

**Goals:**

- Provide real-time inventory tracking
- Enable CRUD operations for products and categories
- User authentication and role-based access control (RBAC)
- Full audit logs for every database change
- Responsive UI for desktop and mobile

### 2. Objectives & Deliverables

1. **Project Setup & Tooling**

   - Initialize monorepo (backend + frontend)
   - TypeScript configuration (tsconfig)
   - Linting & formatting: ESLint, Prettier
   - Docker development environment

2. **Backend API**

   - Database schema design (PostgreSQL + Sequelize)
   - RESTful endpoints with Express & TypeScript
   - Swagger/OpenAPI setup for API documentation
   - Authentication & custom role middleware (JWT)
   - Validation, error handling, and TDD (Jest)

3. **Frontend Application**

   - React SPA with TypeScript
   - Redux for state management
   - React Router for navigation
   - Admin dashboard for RBAC
   - Forms, tables, and filters
   - TDD with React Testing Library + Jest

4. **Developer Documentation**

   - Setup guide (getting started, Docker)
   - API docs via Swagger UI
   - Code style & commit conventions

### 3. Features & User Stories (Priority Order)

| #   | Feature                   | User Story                                                                 |
| --- | ------------------------- | -------------------------------------------------------------------------- |
| 1   | User Authentication       | As a user, I want to register/login so that I can access the system.       |
| 2   | Role-based Access Control | As an admin, I want to assign roles so that users have appropriate rights. |
| 3   | Product Management        | As a user, I want to add/edit/delete products so I can maintain inventory. |
| 4   | Category Management       | As a user, I want to manage categories for better organization.            |
| 5   | Inventory Adjustments     | As a user, I want to adjust stock levels manually.                         |
| 6   | Reporting & Exports       | As a user, I want to export reports (CSV/PDF).                             |
| 7   | Search & Filters          | As a user, I want to search and filter products.                           |

### 4. Architecture & Tech Stack

- **Database:** PostgreSQL
- **ORM:** Sequelize
- **Backend:** Node.js, Express, TypeScript
- **Authentication:** JSON Web Tokens (JWT) + custom role-auth middleware
- **API Documentation:** Swagger / OpenAPI
- **Frontend:** React, TypeScript, Redux, React Router
- **Testing:** Jest (backend) & React Testing Library (frontend)
- **Containerization:** Docker (dev-only)

### 5. Database Schema (Draft)

- **Users**: id, username, password_hash, role, created_at, updated_at
- **Products**: id, name, sku, category_id, price, quantity, created_at, updated_at
- **Categories**: id, name, description, created_at, updated_at
- **ChangeLogs**: id, table_name, record_id, operation, changed_by, changed_at, change_details

### 6. API Endpoints (Draft)

- **Auth**:

  - `POST /api/auth/register`
  - `POST /api/auth/login`

- **Users**:

  - `GET /api/users`
  - `GET /api/users/:id`
  - `PUT /api/users/:id`
  - `DELETE /api/users/:id`

- **Products**:

  - `GET /api/products`
  - `GET /api/products/:id`
  - `POST /api/products`
  - `PUT /api/products/:id`
  - `DELETE /api/products/:id`

- **Categories**:

  - `GET /api/categories`
  - `POST /api/categories`
  - `PUT /api/categories/:id`
  - `DELETE /api/categories/:id`

- **Logs**:

  - `GET /api/logs` (with filters for table, user, date)

### 7. Frontend Structure (Draft)

```
/src
  /api           # axios instances & Swagger client
  /components    # reusable UI components
  /containers    # connected components (Redux)
  /pages         # page-level views
  /redux         # slices, store, actions
  /routes        # route definitions
  /utils         # helpers, validators
  App.tsx
  index.tsx
```

### 8. Development Plan & Next Steps (TDD-driven)

1. **Setup & Tooling**

   - Scaffold monorepo and Docker
   - Configure TypeScript, ESLint, Prettier
   - Initialize Git and commit conventions

2. **Auth & RBAC** (Test-first)

   - Write Jest tests for auth flows and role middleware
   - Implement register/login and role checks

3. **Products Module** (Test-first)

   - Write tests for CRUD endpoints + DB logs
   - Implement product service, routes, and models

4. **Categories Module** (Test-first)

   - Tests + implementation

5. **Logs Endpoint** (Test-first)
6. **Frontend Authentication Flow** (Test-first)
7. **Product & Category UIs** (Test-first)
8. **Admin Dashboard & RBAC UI** (Test-first)
9. **Reporting & Exports** (Test-first)

_Let me know if this aligns with your priorities or needs further tweaks!_
