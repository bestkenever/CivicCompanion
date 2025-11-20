# 📱 CivicCompanion

**Helping people understand public policies — clearly, neutrally, and with real paths to action.**  
Built for the Microsoft Innovation Challenge • Powered by **Azure AI**, **Azure Database**, and **Responsible AI** principles.

---

## 🌟 Overview

CivicCompanion is a mobile-first application designed to break down public policies into simple, accessible explanations and help users understand how those policies affect their daily lives.

Our app follows a simple structure:

1. **Information** — Present the policy clearly  
2. **Explanation** — Interpret the policy in an accessible, personalized way  
3. **Action** — Provide constructive next steps a user can take  

---

## 🚀 Core Features (MVP)

### 📰 Story Feed  
A scrollable feed of short policy-related stories or weekly updates.  
Each story links to a specific policy page.

### 📘 Policy Explanation  
For each policy, users receive:
- **What is this?** (neutral summary)  
- **What this means for you** (role-based, simplified explanation)  
- **Disclaimers** to enforce neutrality and Responsible AI  

### 🧭 Actions You Can Take  
Constructive, non-partisan pathways such as:
- Learn more from official sources  
- Contact representatives  
- Join local info sessions  
- Engage with community or university groups  

### 🌐 Accessibility & Inclusion  
- Multi-language support  
- Adjustable reading level (default / simplified)  
- Neutral system messages with no political framing  

---

## 🛠️ Tech Stack

### **Frontend**
- Mobile application (Flutter or React Native)
- Calls backend endpoints via simple REST APIs

### **Backend** (FastAPI + Python)
Located in `/backend/`, the API exposes three main endpoints:

- `GET /stories`  
- `POST /explain-policy`  
- `POST /take-action`

See `backend/app.py` for full implementation details.

### **Azure Services (Planned for Hackathon Submission)**

#### **Azure OpenAI**
- Used to generate neutral, accessible policy explanations  
- Enforced with a Responsible AI system prompt  
- Accessible through a central wrapper (`azure_client.py`)

#### **Azure Database for PostgreSQL (with pgvector)** *or* **Azure AI Search**
(Team will choose one of the two)
- Stores or indexes policy text  
- Enables fast semantic search for relevant policy chunks  
- Used as the data source for RAG (Retrieval-Augmented Generation)

#### **Azure Functions**
- Backend deployment target  
- Lightweight serverless execution for API endpoints  
- Easy integration with PostgreSQL / AI Search  

---

## 📂 Repository StructureCivicCompanion/
backend/
app.py
models.py
azure_client.py
requirements.txt
mobile/
(your Flutter or React Native project here)

---

## 🔐 Responsible AI

We explicitly follow Microsoft’s Responsible AI guidelines:

- Neutral, non-partisan explanations  
- Accessibility supported in UI and model prompts  
- Clear disclaimers on policy explanations  
- No targeted political persuasion  
- No legal, financial, or medical advice  

The system prompt enforcing these rules is defined in `azure_client.py`.

---

## ▶️ Running the Backend Locally

cd backend
pip install -r requirements.txt
uvicorn app:app --reload
API docs will be automatically available at:

http://127.0.0.1:8000/docs

---

## 🎯 Hackathon Goals: How We Maximize the Judging Criteria

### **✔ Performance (25%)**
- FastAPI + Azure Functions for lightweight responsiveness  
- pgvector / AI Search for instant semantic retrieval  

### **✔ Innovation (25%)**
- Role-based explanations  
- Reading-level adaptation  
- Action suggestions tied to location and user context  

### **✔ Breadth of Azure Services (25%)**
- Azure Database for PostgreSQL  
- Azure AI Search  
- Azure OpenAI  
- Azure Functions  
- Optionally: Power Apps frontend for rapid prototyping  

### **✔ Responsible AI (25%)**
- Neutrality guarantee  
- Structured disclaimers  
- Accessibility features  
- Guardrail system prompt  

---

## 🧑‍🤝‍🧑 Team
(Add your names here)

---

## 📌 Status
Currently in development for the Microsoft Innovation Challenge Hackathon (Nov 2025).

---
