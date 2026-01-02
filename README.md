
# VeritasStream 🔍🛡️

> **Production-Grade AI Log Investigation Framework**
> *Distributed Microservices | Immutable Chain of Custody | Real-time Anomaly Detection*

VeritasStream is a forensic analysis platform designed to ingest, secure, and analyze massive log files (10GB+) without crashing. It replaces traditional, memory-heavy forensic tools with a streaming microservices architecture, ensuring evidence integrity through a cryptographically signed Chain of Custody.

---

## 🏗️ Architecture

The system follows a distributed event-driven architecture to handle heavy computational loads:

* **API Gateway (Node.js):** Handles secure multipart file uploads and enforces authentication.
* **Security Layer:** Implements a "Chain of Custody" ledger that cryptographically signs every file access and modification.
* **Storage (MinIO):** S3-compatible object storage for massive evidence files (supports streaming).
* **Message Broker (RabbitMQ):** Decouples upload from analysis to prevent blocking the UI.
* **Database (MongoDB):** Time-series collections for log entries and standard collections for case management.
* **Caching (Redis):** Handles session management and real-time job progress tracking.

---

## 🚀 Getting Started

### Prerequisites
* Docker & Docker Compose
* Node.js v18+ (for local development)

### 1. Infrastructure Setup
Spin up the entire production-grade stack (MongoDB, Redis, MinIO, RabbitMQ) with a single command:

```bash
docker-compose up -d

```

### 2. Backend Initialization

The API Gateway serves as the entry point for the system.

```bash
cd backend
npm install
npm run dev

```

* **Health Check:** `http://localhost:5000/health`
* **Database Status:** Auto-connects to the Dockerized MongoDB instance.

---

## 🔐 Security Features (In Progress)

* **Immutable Evidence:** Original log files are hashed (SHA-256) upon arrival and stored in WORM (Write Once Read Many) compliant storage.
* **Chain of Custody:** A dedicated ledger records every `UPLOAD`, `ACCESS`, and `ANALYSIS` event, signed with an HMAC secret to prevent tampering.

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
| --- | --- | --- |
| **Backend** | Node.js, Express | API Gateway & Orchestration |
| **AI Engine** | Python, Pandas, Scikit-Learn | Log Parsing & Anomaly Detection |
| **Database** | MongoDB (TimeSeries) | High-volume log storage |
| **Queue** | RabbitMQ | Async task processing |
| **Storage** | MinIO | S3-compatible object storage |
| **Cache** | Redis | Real-time status updates |

---

## 📝 Roadmap

* [x] **Phase 1:** Infrastructure Setup (Docker Compose)
* [x] **Phase 2:** Backend Skeleton & Database Connection
* [x] **Phase 3:** Git Repository Initialization
* [ ] **Phase 4:** Secure File Upload & Chain of Custody Implementation
* [ ] **Phase 5:** AI Worker (Python) Implementation
* [ ] **Phase 6:** Frontend Dashboard (React)

---


```
