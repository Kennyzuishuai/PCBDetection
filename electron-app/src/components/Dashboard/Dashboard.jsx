import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box, LinearProgress, Divider } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import MemoryIcon from '@mui/icons-material/Memory';
import StorageIcon from '@mui/icons-material/Storage';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

// Mock data generator
const generateData = () => {
  const now = new Date().toLocaleTimeString();
  return {
    time: now,
    cpu: Math.floor(Math.random() * 30) + 10,
    memory: Math.floor(Math.random() * 20) + 40,
    gpu: Math.floor(Math.random() * 50) + 20,
  };
};

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({ cpu: 0, memory: 0, gpu: 0 });
  const [specs, setSpecs] = useState({ cpuCores: '-', memTotal: '-', gpuName: 'Loading...' });

  useEffect(() => {
    // Fetch static specs from Electron
    if (window.electron && window.electron.invoke) {
        window.electron.invoke('get-system-specs').then(res => {
            if (res) setSpecs(res);
        });
    }

    const interval = setInterval(() => {
      // Mock data generator for graph (or fetch from /system_stats)
      const newData = generateData();
      // ... existing logic ...
      
      // Optionally fetch real stats from python backend
      fetch('http://localhost:5000/system_stats')
        .then(res => res.json())
        .then(realStats => {
             // If backend is running, overwrite with real CPU/Mem
             newData.cpu = realStats.cpu;
             newData.memory = realStats.memory;
             // GPU usage is harder to get in Python without specific libs, keep mock or 0
        })
        .catch(() => {});

      setData(prev => {
        const newArr = [...prev, newData];
        if (newArr.length > 20) newArr.shift();
        return newArr;
      });
      setStats({
        cpu: newData.cpu,
        memory: newData.memory,
        gpu: newData.gpu
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>System Overview</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 160, position: 'relative', overflow: 'visible', mt: 3 }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              left: 20,
              width: 60,
              height: 60,
              bgcolor: 'info.main',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 3
            }}>
              <MemoryIcon sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Typography color="text.secondary" variant="body2" gutterBottom>CPU Usage</Typography>
              <Typography variant="h4">{typeof stats.cpu === 'number' ? stats.cpu.toFixed(1) : stats.cpu}%</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography color="text.secondary" variant="caption">{specs.cpuCores} Cores Active</Typography>
            </Box>
            <LinearProgress variant="determinate" value={stats.cpu} color="info" sx={{ mt: 1, borderRadius: 1 }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 160, position: 'relative', overflow: 'visible', mt: 3 }}>
             <Box sx={{
              position: 'absolute',
              top: -20,
              left: 20,
              width: 60,
              height: 60,
              bgcolor: 'success.main',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 3
            }}>
              <StorageIcon sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Typography color="text.secondary" variant="body2" gutterBottom>Memory Usage</Typography>
              <Typography variant="h4">{typeof stats.memory === 'number' ? stats.memory.toFixed(1) : stats.memory}%</Typography>
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
               <Typography color="text.secondary" variant="caption">{specs.memTotal} GB Total</Typography>
            </Box>
            <LinearProgress variant="determinate" value={stats.memory} color="success" sx={{ mt: 1, borderRadius: 1 }} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 160, position: 'relative', overflow: 'visible', mt: 3 }}>
            <Box sx={{
              position: 'absolute',
              top: -20,
              left: 20,
              width: 60,
              height: 60,
              bgcolor: 'error.main',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 3
            }}>
              <GraphicEqIcon sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Box sx={{ textAlign: 'right', mt: 1 }}>
              <Typography color="text.secondary" variant="body2" gutterBottom>GPU Status</Typography>
              <Typography variant="h4">Active</Typography>
            </Box>
             <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
               <Typography color="text.secondary" variant="caption">{specs.gpuName}</Typography>
            </Box>
            <LinearProgress variant="determinate" value={100} color="error" sx={{ mt: 1, borderRadius: 1 }} />
          </Paper>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom>Real-time System Performance</Typography>
      <Paper sx={{ p: 2, height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU Usage" />
            <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory Usage" />
            <Line type="monotone" dataKey="gpu" stroke="#ffc658" name="GPU Usage" />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
