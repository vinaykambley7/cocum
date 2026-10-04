# Commonwealth University College of Medicine (CUCOM)
## Official 25-Candidate Daily Reporting & Executive Audit System

An institutional daily operational reporting portal built specifically for **Commonwealth University College of Medicine (CUCOM)**. Features the exact 25 authorized candidate roster, data isolation, automated reporting check, email reminders, executive management dashboard, master audit logs, and institutional Excel & PDF export capabilities.

---

## 🚀 Quick Start in VS Code

### 1. Open in Visual Studio Code
Unzip `cucom-daily-reporting-system.zip` and open the project directory in VS Code:
```bash
# Open directory in VS Code
code .
```

### 2. Install Dependencies
Open the integrated terminal in VS Code (`Ctrl + `` or `Terminal -> New Terminal`) and run:
```bash
npm install
```

### 3. Run the Development Environment
Start both the Frontend (Vite) and Backend (Express + SQLite) servers:
```bash
# Terminal 1: Start Frontend Portal (Port 3000)
npm run dev

# Terminal 2: Start Central SQLite & Email Server (Port 5000)
node server/server.js
```

Open your browser to:
- **Frontend Portal**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Health**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🐙 How to Connect & Push to GitHub

Follow these simple steps in your VS Code terminal to create a GitHub repository:

```bash
# 1. Initialize Git repository
git init

# 2. Stage all project files (ignoring node_modules automatically via .gitignore)
git add .

# 3. Create your initial commit
git commit -m "feat: initial commit of CUCOM 25-candidate daily reporting portal"

# 4. Set main branch
git branch -M main

# 5. Link your GitHub remote repository (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY_NAME.git

# 6. Push code to GitHub
git push -u origin main
```

---

## 👥 Authorized 25-Candidate Master Directory

Every candidate has an authenticated account with password **`123`** (or `cucom123`). Each candidate can only view, fill, and submit their own daily reports.

| # | Candidate Name | Designation / Role | Department | Username | Easy Password |
|:---:|:---|:---|:---|:---:|:---:|
| **1** | Sharon Dowdy | HR | Human Resources | `sharon.dowdy` | `123` |
| **2** | Karlene Mann | Librarian | Library | `karlene.mann` | `123` |
| **3** | Beverley Francis | Registrar Administration | Registrar Administration | `beverley.francis` | `123` |
| **4** | Nakia Entien | Accountant | Finance & Accounts | `nakia.entien` | `123` |
| **5** | Alisia Daniel | Admin Secretary | Administration | `alisia.daniel` | `123` |
| **6** | Venkata Raganath | Registrar Academic | Academic Registrar | `venkata.raganath` | `123` |
| **7** | Laurentia Roberts | Janitor | Housekeeping | `laurentia.roberts` | `123` |
| **8** | Oliver | Van Driver | Transport | `oliver` | `123` |
| **9** | Gopi Anumula | IT Manager | IT | `gopi.anumula` | `123` |
| **10** | M Vijay Kumar | Student Welfare | Student Affairs | `m.vijaykumar` | `123` |
| **11** | N Ngalakshmi | Head of QA & Compliance | Quality Assurance & Compliance | `n.ngalakshmi` | `123` |
| **12** | Shaktivel K.M | Assoc. Prof. of Anatomy & Histology | Faculty - Basic Sciences | `shaktivel.km` | `123` |
| **13** | Syamala Bhupathi | Dean & Professor of Physiology | Dean & Academic Leadership | `syamala.bhupathi` | `123` |
| **14** | Sreevani Namani | Assoc. Prof. of Biochemistry | Faculty - Basic Sciences | `sreevani.namani` | `123` |
| **15** | Akash Patel | Prof. of Clinical Med & Pharmacology | Faculty - Clinical/Pharmacology | `akash.patel` | `123` |
| **16** | Antonia Goodman | Lecturer of Biostatistics | Faculty - Basic Sciences | `antonia.goodman` | `123` |
| **17** | Getta Anantha Praveen | Lecturer of Microbiology | Faculty - Basic Sciences | `getta.praveen` | `123` |
| **18** | Sindhu Sekar | Lecturer of Pharmacology | Faculty - Clinical/Pharmacology | `sindhu.sekar` | `123` |
| **19** | Indumathi Ravi | Simulation Center Lead | Simulation Center | `indumathi.ravi` | `123` |
| **20** | Dr Dev Thivari | Asst. Prof. – Pharmacology & Research | Research & Pharmacology | `dev.thivari` | `123` |
| **21** | Dr Abraham | Lecturer of Anatomy | Faculty - Basic Sciences | `dr.abraham` | `123` |
| **22** | Tabitha | Lecturer of Pathology | Faculty - Basic Sciences | `tabitha` | `123` |
| **23** | Dr Mangal | In-Charge – CU Connect | CU Connect | `dr.mangal` | `123` |
| **24** | Sreenidhi Prakasah | Adjunct Faculty - Community Medicine | Adjunct Faculty | `sreenidhi.prakasah` | `123` |
| **25** | Jyotsna N B | Adjunct Faculty - Biochemistry | Adjunct Faculty | `jyotsna.nb` | `123` |
| **ADMIN** | Dean's Executive Office | Executive Dean & Vice Chancellor | Executive Leadership | `admin` | `123` |

---

## 📋 Operational Daily Report Form Structure

The report form captures:
1. **Report Date**: Automatic calendar picker defaulting to current date.
2. **Locked Candidate Info**: Fixed Submitter Name, Role, and Department.
3. **What Work Did You Do Today?**: High-level primary duties summary.
4. **What Activities Have Been Performed Today?**: Activities narrative breakdown plus operational checklist with status badges (*Done*, *In Progress*, *Pending*) and volume outputs.
5. **Were There Any Issues or Problems Held Today?**: Interactive toggle (*Issues Held* vs *No Issues Held*) and bottleneck notes.
6. **Cash / Revenue Generated & Collected Today**: Specific receipts/deposits collected (or `$0.00 / N/A`) and source breakdown.
7. **Unusual, Extra or Unwanted Activities / Incidents**: Emergency/unwanted occurrences flag, category selection, and comprehensive narrative description.
8. **Top Priority for Tomorrow**: Clear operational commitment for next shift.

---

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Express.js, Node.js SQLite (`node:sqlite` embedded production database)
- **Reporting & Export**: jsPDF, jspdf-autotable, SheetJS (xlsx), HTML2Canvas
- **Scheduling**: Node-cron background reminder scheduler
