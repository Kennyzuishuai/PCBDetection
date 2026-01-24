const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let pythonProcess = null;

// Suppress Electron security warnings in development
if (process.env.NODE_ENV === 'development') {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';
  
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function startPythonBackend() {
  const scriptPath = path.join(__dirname, '../../python-backend/app.py');
  // Try to find the venv python, fallback to system python
  const venvPython = path.join(__dirname, '../../.venv310/Scripts/python.exe');
  
  // You might want to check if venvPython exists, here we just try it or fallback
  const pythonExecutable = venvPython; // Or 'python' if venv is not guaranteed

  console.log(`Starting Python backend: ${pythonExecutable} ${scriptPath}`);

  pythonProcess = spawn(pythonExecutable, [scriptPath], {
    cwd: path.join(__dirname, '../../python-backend'), // Set CWD to python-backend
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`Python: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`Python Error: ${data}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
  });
}

app.whenReady().then(() => {
  startPythonBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});

// Example IPC handler for running Python scripts (legacy/direct invocation)
ipcMain.handle('run-python', async (event, args) => {
    // This is now mostly handled by the Flask server, but kept for reference
    return { status: 'success', message: 'Backend is running on port 5000' };
});
