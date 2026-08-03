import express from 'express';
import path from 'path';
import { spawn } from 'child_process';
import { createServer as createViteServer } from 'vite';

let pythonProcess: any = null;

function startPythonBackend() {
  const pythonScript = path.join(process.cwd(), 'python_backend', 'app.py');
  console.log(`Starting Python Database Backend at ${pythonScript}...`);
  pythonProcess = spawn('python3', [pythonScript], {
    stdio: 'inherit',
    env: process.env,
  });

  pythonProcess.on('error', (err: any) => {
    console.error('Failed to start Python backend process:', err);
  });

  pythonProcess.on('exit', (code: number, signal: string) => {
    console.log(`Python backend process exited with code ${code}, signal ${signal}`);
  });
}

async function startServer() {
  startPythonBackend();

  // Give Python server 1 second to bind to port 5000
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Proxy all /api/* routes directly to the Python Backend Server running on port 5000
  app.use('/api', async (req, res) => {
    const pythonUrl = `http://127.0.0.1:5000/api${req.url}`;
    try {
      const options: RequestInit = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
        options.body = JSON.stringify(req.body);
      }

      const pyResponse = await fetch(pythonUrl, options);
      const data = await pyResponse.json();
      res.status(pyResponse.status).json(data);
    } catch (err: any) {
      console.error(`Error proxying request to Python backend (${pythonUrl}):`, err);
      res.status(500).json({ error: `Python backend error: ${err?.message || 'Connection failed'}` });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart AI Database Assistant server running on http://0.0.0.0:${PORT} (Python backend proxied on 5000)`);
  });
}

startServer();
