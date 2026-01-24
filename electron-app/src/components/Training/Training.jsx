import React, { useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Paper, Grid } from '@mui/material';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function Training() {
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);

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
    }
  }, []);

  const handleStartTraining = () => {
    if (xtermRef.current) {
      xtermRef.current.writeln('\x1b[32m[INFO]\x1b[0m Starting training process...');
      xtermRef.current.writeln('Epoch 1/150');
      // Mock log stream
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        xtermRef.current.writeln(`Progress: ${progress}% - Loss: ${(Math.random() * 0.5).toFixed(4)}`);
        if (progress >= 100) clearInterval(interval);
      }, 500);
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
              <TextField
                fullWidth
                label="Epochs"
                defaultValue="150"
                margin="normal"
                type="number"
              />
              <TextField
                fullWidth
                label="Batch Size"
                defaultValue="16"
                margin="normal"
                type="number"
              />
              <TextField
                fullWidth
                label="Learning Rate"
                defaultValue="0.01"
                margin="normal"
                type="number"
              />
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                sx={{ mt: 3 }}
                onClick={handleStartTraining}
              >
                Start Training
              </Button>
              <Button variant="outlined" color="secondary" fullWidth sx={{ mt: 2 }}>
                Resume Training
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
