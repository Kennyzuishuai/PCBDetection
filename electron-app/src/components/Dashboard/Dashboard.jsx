import React, { useEffect, useState } from 'react';
import { Grid, Paper, Typography, Box } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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

  useEffect(() => {
    const interval = setInterval(() => {
      const newData = generateData();
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
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>CPU Usage</Typography>
            <Typography component="p" variant="h3">{stats.cpu}%</Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>8 Cores Active</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>Memory Usage</Typography>
            <Typography component="p" variant="h3">{stats.memory}%</Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>16 GB Total</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Typography component="h2" variant="h6" color="primary" gutterBottom>GPU Status</Typography>
            <Typography component="p" variant="h3">Active</Typography>
            <Typography color="text.secondary" sx={{ flex: 1 }}>NVIDIA RTX 3060</Typography>
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
