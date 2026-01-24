import React from 'react';
import { Box, Typography, Button, Paper, TextField, FormControl, InputLabel, Select, MenuItem, Switch, FormControlLabel } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';

export default function Settings() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Settings</Typography>
        <Button variant="contained" color="success" startIcon={<SaveIcon />}>Save Settings</Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Environment Configuration</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField fullWidth label="Python Interpreter Path" defaultValue="C:\Anaconda3\envs\yolo\python.exe" />
          <Button variant="outlined">Browse</Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField fullWidth label="Dataset Configuration (data.yaml)" defaultValue="C:\Projects\PestData\data.yaml" />
          <Button variant="outlined">Browse</Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>App Settings</Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Language</InputLabel>
          <Select label="Language" defaultValue="en">
            <MenuItem value="en">English (US)</MenuItem>
            <MenuItem value="zh">中文 (简体)</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel control={<Switch defaultChecked />} label="Hardware Acceleration (GPU)" />
      </Paper>
    </Box>
  );
}
