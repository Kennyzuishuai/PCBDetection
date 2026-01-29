import React, { useEffect, useRef, useState } from 'react';
import { Box, Typography, TextField, Button, Paper, Grid, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function Training() {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);

  // Configuration State
  const [config, setConfig] = useState({
    epochs: 150,
    batchSize: 32,
    lr: 0.01,
    model: 'yolov8s.pt'
  });

  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    if (terminalRef.current && !xtermRef.current) {
      const term = new Terminal({
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
        },
        rows: 20,
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();
      
      term.writeln('Ready for training...');
      xtermRef.current = term;

      // Handle resize
      const handleResize = () => fitAddon.fit();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartTraining = async () => {
    if (!xtermRef.current) return;
    const term = xtermRef.current;

    term.writeln('\r\n\x1b[36m[INFO]\x1b[0m Initiating training sequence...');
    
    try {
      setIsTraining(true);
      const response = await fetch('http://localhost:5000/train', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          epochs: Number(config.epochs),
          batch: Number(config.batchSize),
          model: config.model
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'started') {
        term.writeln(`\x1b[32m[SUCCESS]\x1b[0m Training started successfully!`);
        term.writeln(`   PID: ${data.pid}`);
        term.writeln(`   Model: ${config.model}`);
        term.writeln(`   Epochs: ${config.epochs}`);
        term.writeln(`   Batch Size: ${config.batchSize}`);
        term.writeln(`   Device: GPU (cuda:0)`); // Based on our backend enforcement
        term.writeln('\x1b[90m(Check server logs for detailed progress...)\x1b[0m');
      } else if (data.status === 'already_training') {
        term.writeln('\x1b[33m[WARN]\x1b[0m Training is already in progress.');
      } else {
        term.writeln(`\x1b[31m[ERROR]\x1b[0m Failed to start training: ${data.error}`);
        setIsTraining(false);
      }
    } catch (error) {
      term.writeln(`\x1b[31m[ERROR]\x1b[0m Network/Server Error: ${error.message}`);
      setIsTraining(false);
    }
  };

  const handleStopTraining = async () => {
    if (!xtermRef.current) return;
    const term = xtermRef.current;

    try {
      const response = await fetch('http://localhost:5000/stop_training', { method: 'POST' });
      const data = await response.json();
      if (data.status === 'stopped') {
        term.writeln('\x1b[31m[STOP]\x1b[0m Training stopped by user.');
        setIsTraining(false);
      } else {
        term.writeln(`\x1b[33m[INFO]\x1b[0m ${data.status}`);
      }
    } catch (e) {
      term.writeln(`\x1b[31m[ERROR]\x1b[0m Could not stop training: ${e.message}`);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Model Training</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Configuration</Typography>
            <Box component="form" noValidate autoComplete="off">
              
              {/* Model Selection */}
              <FormControl fullWidth margin="normal">
                <InputLabel id="model-select-label">Model</InputLabel>
                <Select
                  labelId="model-select-label"
                  id="model-select"
                  value={config.model}
                  label="Model"
                  name="model"
                  onChange={handleChange}
                >
                  <MenuItem value="yolov8n.pt">YOLOv8 Nano (yolov8n.pt)</MenuItem>
                  <MenuItem value="yolov8s.pt">YOLOv8 Small (yolov8s.pt)</MenuItem>
                  <MenuItem value="yolov8m.pt">YOLOv8 Medium (yolov8m.pt)</MenuItem>
                  <MenuItem value="yolov8l.pt">YOLOv8 Large (yolov8l.pt)</MenuItem>
                  <MenuItem value="yolov8x.pt">YOLOv8 XLarge (yolov8x.pt)</MenuItem>
                  <MenuItem value="best.pt">Custom Best (models/best.pt)</MenuItem>
                </Select>
              </FormControl>

              <TextField
                fullWidth
                label="Epochs"
                name="epochs"
                value={config.epochs}
                onChange={handleChange}
                margin="normal"
                type="number"
              />
              <TextField
                fullWidth
                label="Batch Size"
                name="batchSize"
                value={config.batchSize}
                onChange={handleChange}
                margin="normal"
                type="number"
              />
              <TextField
                fullWidth
                label="Learning Rate"
                name="lr"
                value={config.lr}
                onChange={handleChange}
                margin="normal"
                type="number"
              />
              
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 3 }}
                onClick={handleStartTraining}
                disabled={isTraining}
              >
                {isTraining ? 'Training in Progress...' : 'Start Training'}
              </Button>
              
              <Button 
                variant="outlined" 
                color="secondary" 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={handleStopTraining}
                disabled={!isTraining}
              >
                Stop Training
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0, height: '500px', backgroundColor: '#1e1e1e', overflow: 'hidden' }}>
             <div ref={terminalRef} style={{ width: '100%', height: '100%' }} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
