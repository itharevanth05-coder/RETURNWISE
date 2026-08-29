# RETURNWISE – Autonomous E-Commerce Returns Investigator

**RETURNWISE** is an AI-powered returns investigation and decision-support system designed to protect merchant retail margins, eliminate return abuse (wardrobing, counterfeit swaps, and wardrobing fraud), and safeguard customer lifetime value.

---

## 🌟 Key Capabilities

1. **Multi-Model AI/ML Classification**:
   - **Return-Reason NLP Classifier**: Discrepancy detection between customer claims and comments.
   - **Customer Behavior Model**: Return rate velocity, bracket purchasing, and wardrobing pattern scoring.
   - **Product-Defect Pattern Model**: Manufacturing batch defect clustering and vendor failure rates.
   - **Return-Abuse Risk Model (Ensemble/XGBoost)**: Calibrated $P(\text{Abuse})$ score outputting **Legitimate**, **Potential Abuse**, or **Uncertain**.
   - **Resale-Value Prediction Model**: Item condition and category salvage recovery estimation.

2. **Deterministic Decision & Loss Engine (No LLM Financial Math)**:
   - Evaluates pure mathematical expected loss across 5 candidate policies:
     - `APPROVE`: Instant full refund for trusted buyers.
     - `INSPECT`: Mandatory physical intake and serial verification before reimbursement.
     - `EXCHANGE`: Margin-protective replacement unit for verified defects.
     - `RESTRICT`: Preventative store credit or strict policy enforcement.
     - `ESCALATE`: Dedicated fraud investigator routing.
   - Computes weighted net cost incorporating direct inventory loss and customer friction penalties.
   - Benchmarks savings against standard 30-day naive baseline policies.

3. **Autonomous Agent & What-If Simulation**:
   - Gathers structured multi-dimensional evidence signals.
   - Generates transparent, human-in-the-loop audit trails.
   - Supports live **decision rerunning** after customer or product history updates.
   - Counterfactual simulator for stress-testing policy parameters.

---

## 🚀 Architecture & Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **ML / Analytics**: scikit-learn, XGBoost, Pandas, NumPy
- **Database**: SQLite (SQLAlchemy ORM, PostgreSQL-ready)
- **Frontend**: React 19, Vite, Recharts, Lucide Icons, Modern Dark UI

---

## 🛠️ Quickstart Guide

### 1. Backend Setup & Run

```bash
# From RETURNWISE/backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup & Run

```bash
# From RETURNWISE/frontend
npm install
npm run dev
```
- Dashboard UI: `http://localhost:5173`

### 3. Running Backend Tests

```bash
# From RETURNWISE/backend
pytest
```
