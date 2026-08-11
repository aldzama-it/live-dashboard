# Live Dashboard All Division — AI Agent Instructions

## 1. Project Overview

Project name: **Live Dashboard All Division**

This project is a company dashboard application designed to display data and dashboards from all divisions to top management.

### Primary Users

* **Top Management** — primarily view dashboard information.
* **Division PIC** — input and update data related to their division.
* **Admin** — full system access, including user management and RBAC.

### Technology Stack

* Laravel
* React
* MySQL

---

# 2. Core Development Principles

## 2.1 Inspect Before Coding

**Always inspect the existing project before making any code changes.**

Before implementing a task, analyze the relevant:

* Project structure
* Existing components
* Existing pages
* Existing API endpoints
* Services and business logic
* Database structure
* Existing migrations
* Existing data flow
* Existing UI patterns
* Existing dependencies
* Related implementation

Do not immediately create new files or components before checking whether the required functionality already exists.

---

## 2.2 Follow Existing Patterns

Follow the existing project patterns, architecture, conventions, and implementation style whenever possible.

Do not introduce a different pattern simply because it is personally preferred or considered newer.

However:

> Follow the existing pattern unless the existing pattern is clearly problematic.

If an existing pattern is clearly problematic and fixing it would have a significant impact, report the issue and explain the proposed solution before making the change.

---

# 3. UI Architecture

## 3.1 Reusable UI Templates

The project uses reusable UI templates.

Common UI elements such as:

* KPI Card
* Chart
* Chart Container
* Table
* Data Table
* Status Badge
* Card
* Filter
* Modal
* Page Header

should be implemented as reusable components.

### Important Rule

**Do not create a new UI component just because the data being displayed is different.**

For example, if an existing `KPICard` template already exists, use that template for:

* Total Laptop
* Total Project
* Active Project
* Revenue
* Employee Count
* Other KPIs

The visual template should remain consistent.

The primary difference should be the **data and data source**, not the UI implementation.

### Example

Do NOT create:

```text
LaptopKPICard
ProjectKPICard
RevenueKPICard
EmployeeKPICard
```

if they can all use the existing:

```text
KPICard
```

Instead, reuse the existing component and provide the appropriate data.

---

# 4. Data Source Resolution

When the user requests a new KPI, chart, table, or other data visualization:

1. Find the existing UI template.
2. Inspect the existing data flow.
3. Search for an existing API/service that provides the required data.
4. Inspect the relevant database tables and relationships.
5. Determine the appropriate data source.
6. Reuse existing APIs/services when appropriate.
7. Only create new data access logic if the required data is not already available.

### Data Source Rule

If the correct data source is clear:

> Use it.

If there are multiple possible data sources or the correct source is unclear:

> Do not guess. Report the findings and ask the user which source should be used.

---

# 5. Business Logic

## 5.1 Never Guess Business Logic

Codex must **not independently determine or assume business logic**.

This includes, but is not limited to:

* KPI definitions
* KPI formulas
* Business calculations
* Status definitions
* Status transitions
* Business rules
* Data interpretation
* Aggregation rules
* Filtering rules
* What constitutes "active", "completed", "pending", etc.

If the requested business meaning is not explicitly defined or can be interpreted in multiple ways:

1. Inspect the existing implementation and data.
2. Report what was found.
3. Explain the possible interpretations if relevant.
4. Ask the user to confirm the correct definition.
5. Do not implement the ambiguous logic until the definition is confirmed.

### Example

If the user requests:

> "Show Active Project"

and the database does not contain an explicit `active` status, do not automatically decide that `pending` means `active`.

Instead, report the available data and ask the user to define what "Active Project" means.

---

# 6. Change Planning

## 6.1 Files That Need Modification

Codex may modify any files necessary to complete the requested task.

However, **before coding**, identify:

* Which files will be changed
* Why each file needs to be changed
* Whether any new files will be created
* Whether any database changes are required

Example:

```text
Implementation Plan

1. resources/js/components/KPICard.jsx
   Reason: Reuse the existing KPI Card template.

2. resources/js/pages/Engineering.jsx
   Reason: Add the new KPI configuration to the Engineering dashboard.

3. app/Http/Controllers/EngineeringController.php
   Reason: Provide the required KPI data.

4. database/migrations/xxxx_add_xxx.php
   Reason: Add the required database field.
```

Do not hide significant file changes from the user.

---

# 7. Large Changes Require Approval

For small and clearly defined changes, after inspecting the project, Codex may proceed with implementation.

For **large, risky, architectural, or wide-impact changes**, Codex must:

1. Analyze the current implementation.
2. Explain the problem.
3. Explain the proposed solution.
4. List the files/components/database areas that will be affected.
5. Explain the potential impact.
6. **Wait for user approval.**
7. Only begin implementation after approval.

Examples of changes that should normally require approval:

* Major architecture changes
* Authentication changes
* RBAC changes
* Major database restructuring
* Large refactoring
* Changing core data flow
* Replacing major libraries
* Removing major functionality
* Changes affecting multiple modules/divisions

---

# 8. Refactoring Rules

Small and safe refactoring that is directly relevant to the requested task is allowed.

Examples:

* Removing obvious duplication
* Improving a small local implementation
* Reusing an existing helper
* Cleaning up a small component while working on it

However:

> Large or architectural refactoring requires reporting and user approval before implementation.

Do not use a feature request as an excuse to perform unrelated large-scale refactoring.

---

# 9. Unexpected Bugs and Problems

If Codex discovers an unrelated problem while working on a task:

### Small and Safe Bug

A small, clearly understood, low-risk bug may be fixed directly if:

* The fix is safe.
* The fix is localized.
* The fix does not change unrelated business behavior.
* The fix does not significantly expand the scope.

### Large or Risky Problem

If the discovered issue is:

* Large
* Architectural
* Potentially destructive
* Business-critical
* Security-related
* Affecting multiple modules
* Likely to require significant changes

then:

> Do not fix it automatically.

Instead:

1. Report the problem.
2. Explain its impact.
3. Explain the possible action.
4. Ask the user what action should be taken.

---

# 10. Database Migration Rules

## 10.1 Never Modify Existing Migrations

**Never modify an existing migration that has already been created.**

Any database schema change must be implemented through a **new migration**.

This includes:

* Adding columns
* Removing columns
* Modifying columns
* Creating tables
* Removing tables
* Adding indexes
* Removing indexes
* Adding relationships
* Changing constraints

### Required Pattern

If the existing migration is:

```text
2026_08_01_000001_create_projects_table.php
```

and a new column is required, do NOT edit the old migration.

Create a new migration:

```text
2026_08_07_000002_add_status_to_projects_table.php
```

This rule exists to keep database changes traceable and safe for team-based development.

---

# 11. Team-Based Development

This project is developed collaboratively by a team.

Therefore:

* Avoid unnecessary changes to existing files.
* Preserve existing implementation whenever possible.
* Do not overwrite unrelated work.
* Do not remove code simply because it is unfamiliar.
* Inspect current changes before making broad modifications.
* Keep changes focused on the requested task.
* Avoid introducing unnecessary dependencies.
* Maintain compatibility with the existing project structure.

Assume that other team members may be working on the project simultaneously.

---

# 12. Git Rules

## 12.1 Push

Codex must **never push commits to the remote repository by itself**.

Do not run:

```bash
git push
```

unless the user explicitly changes this instruction and requests it.

---

## 12.2 Commit Workflow

When the user asks Codex to create a commit:

### Step 1 — Inspect Changes

First inspect the current Git state, including:

```bash
git status
```

and the relevant diffs.

Read and understand the **unstaged and staged changes** before creating commits.

Do not blindly commit all changes.

### Step 2 — Group Changes by Context

Do not assume that all modified files belong in one commit.

Group changes based on their actual purpose.

For example:

```text
Commit 1:
KPI dashboard implementation

Commit 2:
UI component cleanup

Commit 3:
Database migration
```

if those are genuinely separate changes.

### Step 3 — Semantic Commit Message

Use GitHub-style semantic commit messages:

```text
type(scope): description
```

Examples:

```text
feat(dashboard): add engineering performance KPI
fix(asset): correct laptop availability calculation
refactor(ui): reuse shared KPI card component
docs(readme): update local development instructions
```

### Commit Message Rules

* Use **English**.
* Use one sentence for the description.
* Do not use bullet points.
* Keep the description reasonably concise.
* Focus on the context/purpose of the change.
* Do not attempt to mention every modified file in the commit message.
* The commit type and scope should accurately represent the change.

### Step 4 — Provide Commands

After determining the appropriate commit grouping, provide the user with the exact commands to run:

```bash
git add <files>
git commit -m "type(scope): description"
```

If multiple commits are appropriate, provide separate commands for each commit.

**Do not push the commits.**

---

# 13. General Scope Rule

Always prioritize:

1. Correctness
2. Existing project consistency
3. Business logic accuracy
4. Reusability
5. Maintainability
6. Minimal and focused changes

Do not optimize for writing the most code.

Optimize for making the **smallest correct change that fits the existing architecture**.

---

# 14. Required Behavior Summary

Before implementing a task, Codex should follow this sequence:

```text
User Request
     ↓
Inspect Existing Project
     ↓
Find Existing Components / Patterns
     ↓
Find Existing API / Service
     ↓
Inspect Database / Data Source
     ↓
Validate Business Logic
     ↓
Determine Required Files
     ↓
Explain Implementation Plan
     ↓
Is the Change Large / Risky?
     ├── YES → Ask for Approval
     │             ↓
     │          Wait
     │             ↓
     │        Implement
     │
     └── NO → Implement
                  ↓
             Verify Changes
                  ↓
              Report Result
```

### Most Important Rules

1. **Inspect before coding.**
2. **Reuse existing UI templates.**
3. **Do not duplicate components unnecessarily.**
4. **Find and analyze the data source before implementation.**
5. **Never guess business logic.**
6. **Explain files and reasons before coding.**
7. **Large changes require approval before implementation.**
8. **Small and safe refactoring is allowed.**
9. **Large unrelated bugs must be reported before fixing.**
10. **Never modify existing migrations; always create a new migration.**
11. **Follow existing patterns unless they are clearly problematic.**
12. **Never push Git commits automatically.**
13. **When asked to commit, inspect changes, group them by context, use semantic English commit messages, and provide the Git commands.**
14. **Keep changes focused, maintainable, reusable, and safe for team development.**

---

# 15. How to Run the Project

Follow these steps to run the project locally across its different services.

### 15.1 Backend (Laravel) - `dashboard-all-division` directory

1. Navigate to the backend directory:
   ```bash
   cd dashboard-all-division
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```
4. Generate the application key:
   ```bash
   php artisan key:generate
   ```
5. Configure your `.env` file with the correct database credentials.
6. Run database migrations and seeders:
   ```bash
   php artisan migrate --seed
   ```
7. Start the local development server:
   ```bash
   php artisan serve
   ```

### 15.2 Frontend (React) - `frontend` directory

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 15.3 NLP Service (Python) - `nlp-service` directory

1. Navigate to the NLP service directory:
   ```bash
   cd nlp-service
   ```
2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # On Windows use: venv\Scripts\activate
   # On macOS/Linux use: source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the NLP processor:
   ```bash
   python nlp_processor.py
   ```
