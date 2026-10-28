# Smart AI Database Assistant

A full-stack AI database assistant featuring a React + Vite frontend, Express proxy server, Python 3 SQLite database backend, and Gemini 3.6 Flash text-to-SQL engine.

## System Architecture

- **Frontend**: React 18, Tailwind CSS v4, Motion, Lucide icons.
- **Backend Service**: Express (`server.ts`) which spawns and proxies API requests to the Python SQLite Engine.
- **Python Database Engine**: Python (`python_backend/app.py`), using standard Python 3 standard library (`sqlite3`, `http.server`, `urllib`).

---

## Prerequisites

- **Node.js**: v18.x or higher
- **Python**: 3.8 or higher (uses standard library `sqlite3`, no external pip packages required)

---

## Quick Start (Local Setup)

1. **Clone or download the project folder**:
   ```bash
   git clone <repository-url>
   cd smart-ai-database-assistant
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the project root or export `GEMINI_API_KEY` in your terminal:
   ```bash
   cp .env.example .env
   # Open .env and set your Gemini API key:
   # GEMINI_API_KEY="your_actual_gemini_api_key"
   ```

4. **Start the Application**:
   ```bash
   npm run dev
   ```

5. **Access the App**:
   Open your browser and navigate to `http://localhost:3000`.

---

## Production Build & Run

To test the production build locally:

```bash
# Build frontend and compile Express server
npm run build

# Start production server
npm start
```

