# 🛡️ CyberShield AI: Comprehensive Cybersecurity Suite

CyberShield AI is an advanced, enterprise-grade cybersecurity suite designed to provide real-time protection against web-based threats, including phishing websites, fake login pages, and malicious emails. 

The platform consists of three core integrated components:
1. **Manifest V3 Browser Extension**: Lightweight browser integration for real-time traffic monitoring, DOM analysis, and threat intervention.
2. **FastAPI Backend Server**: High-performance Python backend powering the machine learning predictions, heuristics engines, vulnerability analyzers, and persistent storage.
3. **React SOC Dashboard**: Sleek, modern security operations center dashboard for real-time metric visualization and threat analysis.

---

## 📂 Project Architecture

```directory
Phishing_Detection/
├── backend/                  # FastAPI Web Server
│   ├── app/
│   │   ├── database/         # SQLite & SQLAlchemy DB setup
│   │   │   ├── database.py   # Connection engine & session getter
│   │   │   └── models.py     # ScanHistory & EmailScanHistory schemas
│   │   ├── routes/           # API Routers
│   │   │   ├── scan.py       # URL & Security Vulnerability scan routes
│   │   │   ├── email.py      # Email scanning & summary routes
│   │   │   ├── history.py    # Log history query endpoint
│   │   │   └── dashboard.py  # Dashboard statistics & trends
│   │   ├── services/
│   │   │   └── scanner.py    # Hybrid ML & Heuristic scanner logic
│   │   └── main.py           # FastAPI initialization & middlewares
│   ├── ml/                   # Machine Learning Models
│   │   ├── feature_extractor.py
│   │   └── phishing_model.pkl
│   ├── requirements.txt      # Python dependencies
│   └── phishguard.db         # SQLite persistent database file
├── dashboard/                # React Admin SOC Panel
│   ├── src/
│   │   ├── components/       # Visual widgets & graphs
│   │   │   ├── StatCards.jsx    # Metrics cards (Total, Blocked, Risk)
│   │   │   ├── RecentAlerts.jsx # Live security alerts feed
│   │   │   └── ThreatChart.jsx  # Recharts 7-day trend visualization
│   │   ├── api.js            # Axios backend integration functions
│   │   ├── App.jsx           # Main UI orchestrator
│   │   └── main.jsx          # Entry point
│   ├── vite.config.js
│   └── package.json
└── extension/                # Chrome/Edge Extension
    ├── manifest.json         # Manifest V3 Extension config
    ├── background.js         # Service worker tracking requests
    ├── content.js            # DOM monitoring & form analysis
    ├── popup/                # Popup control panel UI
    └── warning/              # Phishing Warning full-page injection
```

---

## ⚙️ Component Functions & Features

### 1. Manifest V3 Browser Extension

* **Automated URL Scan on Navigation (`background.js`)**:
  * Monitors the browser using `chrome.webNavigation.onCompleted`.
  * Excludes internal URLs (e.g. `chrome://`, `about:`).
  * Automatically shoots a request to the FastAPI server's `/scan-url` endpoint when navigation completes.
  * Caches the results of the last scan in `chrome.storage.local`.
* **DOM Security Scanner (`content.js`)**:
  * Scans web forms in real-time.
  * Identifies password input forms and performs cross-domain security checks (e.g. checks if credentials are submitted to a host different from the hosting page).
  * Flags insecure HTTP actions on an HTTPS page.
* **Warning Overlay (`warning/`)**:
  * Injects a full-screen, un-bypassable warning overlay if a page is classified as `phishing`.
  * Clearly states the threat type, risk score, and recommends safe navigation actions.
* **Extension Heartbeat (`background.js`)**:
  * Sends a ping to `/ping` every 15 seconds to report extension status.

---

### 2. FastAPI Backend Server

#### 🛡️ Threat Analysis & Scanning (`app/routes/scan.py`)
* **`POST /scan-url`**:
  * **Machine Learning Analysis**: Extracts 30 features from the URL (length, subdomain counts, special characters, entropy) and feeds them into a trained `scikit-learn` model (`phishing_model.pkl`).
  * **Heuristic Fallback**: If the model is not initialized, it evaluates the risk score based on:
    * Scheme check (non-HTTPS yields higher risk).
    * URL Length (>75 characters raises risk).
    * Subdomain count and presence of IP-based domain names.
    * Matches against common phishing keywords (`login`, `secure`, `banking`, etc.).
  * **Persistent Logging**: Saves scan details (URL, classification, risk score) to the SQLite DB.
* **`POST /analyze-security`**:
  * Performs target network assessments directly from the server.
  * **Port Scanner**: Probes standard system ports: `21` (FTP), `22` (SSH), `80` (HTTP), `443` (HTTPS), `3306` (MySQL), and `3389` (RDP).
  * **Security Header Check**: Validates the presence of response headers:
    * `Strict-Transport-Security` (HSTS)
    * `X-Frame-Options` (Clickjacking defense)
    * `X-Content-Type-Options` (MIME sniffing defense)
    * `Content-Security-Policy` (CSP injection protection)

#### 📧 Email Scanner (`app/routes/email.py`)
* **`POST /scan-email`**:
  * **Keyword Analytics**: Scans body texts for urgency words ('urgent', 'verify your account', 'password reset').
  * **Embedded Link Extraction**: Parses all URLs found inside the body text and evaluates them for suspicious patterns (like IP-based subdomains).
  * **Sender Verification**: Flags unaligned sender domains (like `@admin-support`).
  * **NLP Summary**: Summarizes the core message using an extractive NLP utility.
* **`GET /email-history`**:
  * Retrieves all past email scan results.

#### 📊 Dashboard Stats (`app/routes/dashboard.py`)
* **`GET /stats/summary`**:
  * Aggregates stats: total URL count, phishing blocks, suspicious domains, and total emails scanned.
  * Computes system-wide Active Risk level ("High", "Medium", "Low") based on the running average of the last 10 URL scans.
* **`GET /stats/recent`**:
  * Returns the latest threats flagged as `phishing` or `suspicious`.
* **`GET /stats/trends`**:
  * Compiles trend metrics for the last 7 days to display in the frontend charts.

#### 💓 Health & Connection (`app/main.py`)
* **`GET /health`**: Standard API ping test.
* **`POST /ping`**: Captures heartbeat from the active browser extensions.
* **`GET /extension-status`**: Confirms if an extension ping has been received in the last 120 seconds.

---

### 3. React SOC Dashboard

* **Real-time Monitoring (`src/App.jsx`)**:
  * Fetches information from the FastAPI backend and auto-refreshes every 30 seconds.
  * Shows a flashing green "System Active" banner if the Chrome extension's heartbeat is registered by the backend.
* **Visual Components**:
  * **`StatCards.jsx`**: Displays overall counters like total URLs, blocked domains, scanned emails, and active risk.
  * **`ThreatChart.jsx`**: Renders custom visual line/area charts using `recharts` to map out the weekly threat progression.
  * **`RecentAlerts.jsx`**: Live-updated sidebar detailing recent threat detections, their exact URL, risk score, and category.

---

## 🚀 Installation & Running Locally

### 1. Start the FastAPI Backend
Make sure Python 3.8+ is installed on your computer.

```powershell
# Navigate to the backend folder
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
.\venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Launch the backend
uvicorn app.main:app --reload
```
*The API will be available at `http://localhost:8000`.*

### 2. Start the React SOC Dashboard
Make sure Node.js (v16+) is installed.

```powershell
# Open a new terminal and navigate to the dashboard
cd dashboard

# Install node dependencies
npm install

# Launch Vite development server
npm run dev
```
*The Dashboard UI will be available at `http://localhost:5173`.*

### 3. Load the Browser Extension
1. Open Google Chrome or Microsoft Edge.
2. Go to the extensions management page (`chrome://extensions/` or `edge://extensions/`).
3. Enable **Developer mode** in the upper right.
4. Click **Load unpacked** in the upper left.
5. Select the `extension/` directory of this project.
6. The extension is now active and connecting to your local server!
