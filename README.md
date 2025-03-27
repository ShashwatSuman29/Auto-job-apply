
# 🚀 AutoApply - AI-Powered Job Auto-Apply System

## 📌 Overview

AutoApply is a **SaaS web application** designed to help job seekers **track, manage, and automate job applications** efficiently. The platform provides an **AI-powered job application automation system** that auto-applies to jobs based on user-defined preferences, eliminating the tedious manual application process.

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, TailwindCSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Atlas)
- **Automation:** Puppeteer
- **AI Integration:** OpenAI API
- **Real-Time Updates:** MongoDB Change Streams, WebSockets
- **Security:** bcrypt.js for credential hashing

---

## ✨ Features & Functionality

### **1️⃣ Job Tracking Dashboard**
> A dashboard that allows users to **add, view, edit, and delete** job applications.

**Job Application Data Includes:**
- Company Name
- Job Title
- Application Date
- Job Status (Applied, Interview Scheduled, Offer Received, Rejected)
- Notes (Additional details)

**Functionalities:**
- **Search & Filter** jobs by company, title, or status.
- Display job applications in a **table format**.
- **Edit & Delete** job entries.
- **Dark/Light Mode Toggle** for accessibility.
- Store job applications in **MongoDB Atlas**.

---

### **2️⃣ Secure Credential Storage**
> Securely store job portal login credentials.

**Fields:**
- **Job Portal Name** (LinkedIn, Indeed, etc.)
- **Email/Username**
- **Password** (Stored securely using **bcrypt.js**)

**Functionalities:**
- **Add, edit, and delete** credentials.
- Passwords are **hashed and securely stored in MongoDB**.
- **Show/hide password toggle** for UX enhancement.
- **Copy to clipboard** button for quick access.

---

### **3️⃣ Auto-Apply Feature (AI + Puppeteer)**
> Automate job applications using AI & Puppeteer.

**How It Works:**
1. Users enter **job search criteria** (role, location, salary range).
2. System scrapes **job listings from LinkedIn/Indeed** using **Puppeteer**.
3. Auto-fills and submits applications.
4. Stores applied jobs in **MongoDB** and updates **Job Tracker**.

**Enhancements:**
- **AI-generated cover letters** using OpenAI API.
- **Automation history & analytics**.
- **Real-time updates** for job application status.

---

### **4️⃣ AI-Powered Success Predictor 🚀**
> Predicts the chances of securing an interview.

**How It Works:**
- Compares the **user’s resume** with job descriptions.
- Uses **historical application success rates** to **predict interview chances**.
- Suggests **improvements for resume and cover letter**.

**UI & Features:**
- Displays a **success score (0-100%)** next to each job.
- AI-generated recommendations for **boosting application success**.

---

### **5️⃣ Real-Time Notifications & Alerts**
> Stay updated with application progress and reminders.

**Features:**
- **Notify users** when an **application status changes**.
- Set **reminders for follow-ups**.
- Use **MongoDB Change Streams** for real-time updates.
- Show **alerts** on the dashboard.

---

## 🔧 Installation & Setup

### **1. Clone the Repository**
```sh
git clone https://github.com/yourusername/autoapply.git
cd autoapply
