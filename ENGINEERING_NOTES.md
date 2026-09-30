# CampusFind — Senior Mentor Engineering Notes 🎓

> **Tagline:** *"Find it. Verify it. Return it."*  
> **Target Audience:** Technical Evaluators & Hackathon Interviewers  
> **Goal:** Clear, beginner-friendly explanations of every architectural decision, data model, security pattern, and Human-in-the-Loop automation strategy used in CampusFind.

---

## 1. Core Technical Stack Concepts

### 1. What React Does
React is a modern JavaScript library for building user interfaces. Instead of reloading the entire web page on every action, React creates a **Single Page Application (SPA)** using dynamic components. It manages the DOM efficiently using a Virtual DOM, updating only the visual elements that change (like status badges, matching score bars, or dashboard metrics).

### 2. What Flask Does
Flask is a lightweight Python web framework. It acts as our application server. Flask listens for incoming web requests from our React frontend, executes Python business logic (such as running our rule-based matching engine or hashing passwords), queries SQLite database, and sends back structured responses.

### 3. What SQLite Does
SQLite is a fast, file-based relational database management system. Unlike heavy enterprise servers (e.g. PostgreSQL), SQLite stores all application data in a single file (`campusfind.db`). It provides full **ACID compliance** (Atomicity, Consistency, Isolation, Durability) and supports SQL foreign keys to safely maintain relational data.

### 4. What HTTP Is
HTTP (Hypertext Transfer Protocol) is the fundamental protocol used across the World Wide Web. It enables a client (React browser application) to request resources from a server (Flask Python backend).

### 5. What an API Is
API stands for Application Programming Interface. In web development, a REST-style API defines a clear set of URL endpoints that allow frontend code and backend code to talk to each other without needing to know each other's internal implementation details.

### 6. What JSON Is
JSON (JavaScript Object Notation) is a standard lightweight text format for transferring data objects between frontend and backend. Both Python and JavaScript natively convert JSON strings into dictionaries and objects.

---

## 2. Overcoming Manual Bottlenecks: Human-in-the-Loop (HITL) Architecture

### 7. Human-in-the-Loop (HITL) + Fast-Path Verification
**The Bottleneck:** In basic lost & found software, requiring human administrators to manually inspect every single report and claim from scratch creates a severe time bottleneck.

**CampusFind Solution:** We implemented **Human-in-the-Loop (HITL) Hybrid Verification**:
* **AI & Rule Engine Pre-Verification:** The Explainable Matching Engine and Gemini AI pre-evaluate items and calculate a Confidence Score (0-100%).
* **Fast-Path Verification Queue:** Claims scoring ≥ 80% confidence with attached receipt photos are highlighted for **1-click Fast-Path Approval**, reducing Admin review time from 5 minutes to 5 seconds per item.
* **Live Gemini AI Configurator:** Administrators can paste a live `GEMINI_API_KEY` directly in the UI header to switch from offline heuristics to live Google Gemini 1.5 Flash generative AI.

### 8. Immutable System Audit Trail (`AUDIT_LOGS` Table)
**Full Accountability & Security Audit:** Every single action across the item lifecycle is automatically recorded in SQLite:
* `ITEM_REPORTED`: Logged when a student or admin registers a lost/found item.
* `STATUS_UPDATED`: Logged when item status transitions (PENDING → APPROVED → CLAIMED → RETURNED).
* `CLAIM_SUBMITTED`: Logged with claimant name and proof attachment type.
* `CLAIM_VERIFIED`: Logged with admin notes and approval timestamp.

Admins can review the complete, tamper-proof activity history anytime under the **"📜 System Audit Trail"** tab.

### 9. High-Value / Confidential Item Protection (Gold Chain Safeguard)
* Items flagged as `is_valuable` (gold, cash, luxury jewelry) undergo public redaction.
* Public students see `🔒 Found High-Value Item (Secured)` with redacted description to prevent false claims.
* Admins & reporters see unmasked details.
* Candidate match details load cleanly with HTTP 200 security masking so true owners can click "Claim Item" and submit verifiable proof.

### 10. Object Sub-Type Disambiguation (iPhone vs Laptop Fix)
* Evaluates object clusters (`PHONE`, `LAPTOP`, `AUDIO`, `WALLET`, `BAG`, `WATCH`, `JEWELRY`, `CALCULATOR`).
* Applies an **Object Mismatch Penalty (-35 pts)** when conflicting object types (e.g. Phone vs Laptop) share the same parent category (`Electronics`).

---

## 3. System Architecture & Workflows

### 11. Frontend → Backend Communication
```
[User Action in React UI]
       ↓
[Fetch / API Service call in JavaScript]
       ↓
[HTTP Request with Bearer Auth Header]
       ↓
[Flask Backend Route / Handler]
       ↓
[SQLite Database & Audit Logger]
       ↓
[HTTP JSON Response (200 / 201 / 400 / 403)]
       ↓
[React State Update & Re-render]
```

### 12. How the Explainable Smart Matching Algorithm Works
$$\text{Total Score} = \text{Category (25)} + \text{Location (25)} + \text{Date (20)} + \text{Keyword Similarity (30)} + \text{Sub-Type Boost (15)} - \text{Object Penalty (35)}$$

---

## 4. Database Schema

* **`USERS`**: `id`, `name`, `email` (UNIQUE), `password_hash`, `role` ('student'|'admin'), `created_at`
* **`ITEMS`**: `id`, `title`, `description`, `category`, `item_type`, `location`, `item_date`, `contact_info`, `status`, `reported_by`, `image_url`, `is_valuable`, `created_at`, `updated_at`
* **`CLAIMS`**: `id`, `item_id`, `claimant_id`, `evidence`, `image_proof_url`, `status`, `admin_notes`, `created_at`, `updated_at`
* **`AUDIT_LOGS`**: `id`, `item_id`, `actor_name`, `actor_role`, `action`, `details`, `created_at`
