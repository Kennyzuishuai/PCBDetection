import React, { useState, useRef } from 'react';
import { Box, Typography, Button, Paper, Grid, Slider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel, ToggleButton, ToggleButtonGroup, Switch, FormControlLabel, TextField, Stack } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FolderIcon from '@mui/icons-material/Folder';
import StopIcon from '@mui/icons-material/Stop';
import SettingsSuggestIcon from '@mui/icons-material/SettingsSuggest';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TagIcon from '@mui/icons-material/Tag';
import CategoryIcon from '@mui/icons-material/Category';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';

export default function Testing() {
  const [confidence, setConfidence] = useState(0.5);
  const [mode, setMode] = useState('idle'); // idle, image, camera, video
  const [imageSrc, setImageSrc] = useState(null);
  const [results, setResults] = useState([]);
  
  const [fps, setFps] = useState(15);
  const [quality, setQuality] = useState('MED');
  const [nativeFps, setNativeFps] = useState(false);

  const fileInputRef = useRef(null);

  const handleImageSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setMode('image');
    // Display preview immediately
    setImageSrc(URL.createObjectURL(file));

    // Send to backend
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.image) {
        setImageSrc(data.image);
      }
      if (data.detections) {
        setResults(data.detections);
      }
    } catch (error) {
      console.error("Prediction failed:", error);
    }
  };

  const handleCameraToggle = () => {
    if (mode === 'camera') {
      setMode('idle');
      setImageSrc(null);
      fetch('http://localhost:5000/stop_camera').catch(console.error);
    } else {
      setMode('camera');
      // The backend handles the stream. We just point the img src to it.
      // Add timestamp to prevent caching
      setImageSrc(`http://localhost:5000/video_feed?conf=${confidence}&t=${Date.now()}`);
    }
  };

  // Update camera confidence live
  const handleConfidenceChange = (e, val) => {
      setConfidence(val);
      if (mode === 'camera') {
           // For MJPEG, we might need to re-request or let the backend handle it via some side-channel?
           // The current implementation passes conf as query param. 
           // Changing src forces reconnect. A bit heavy but works.
           // Better way: separate API to update global config in backend.
           // For now, let's just debounce or accept the flicker.
           // Or actually, updating src causes flicker. 
           // Let's assume we implement a separate /set_conf endpoint later.
           setImageSrc(`http://localhost:5000/video_feed?conf=${val}&t=${Date.now()}`);
      }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px - 48px)', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom>Inference & Testing</Typography>
      <Grid container spacing={3} sx={{ flexGrow: 1, height: '100%', minHeight: 0 }}>
        {/* Main Display Area */}
        <Grid item xs={12} md={8} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Paper sx={{ 
            flexGrow: 1, 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            bgcolor: 'black', 
            overflow: 'hidden', 
            minHeight: 0,
            mb: 2 
          }}>
            {imageSrc ? (
              <img src={imageSrc} alt="Result" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <Typography color="grey.500">No Image/Video Selected</Typography>
            )}
          </Paper>
          <TableContainer component={Paper} sx={{ height: 200, flexShrink: 0 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Class</TableCell>
                  <TableCell>Confidence</TableCell>
                  <TableCell>Coordinates (x,y,w,h)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.length > 0 ? (
                  results.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{row.class}</TableCell>
                      <TableCell>{(row.confidence * 100).toFixed(1)}%</TableCell>
                      <TableCell>{`[${row.bbox.map(n => Math.round(n)).join(', ')}]`}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center">No records found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Controls */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Input Source</Typography>
            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel>Select Model</InputLabel>
              <Select label="Select Model" defaultValue="yolov8s.pt">
                <MenuItem value="yolov8s.pt">yolov8s.pt (Standard)</MenuItem>
                <MenuItem value="best.pt">best.pt (Custom)</MenuItem>
              </Select>
            </FormControl>
            
            <input 
              type="file" 
              accept="image/*" 
              hidden 
              ref={fileInputRef} 
              onChange={handleImageSelect} 
            />
            <Button 
              variant="outlined" 
              startIcon={<ImageIcon />} 
              fullWidth 
              sx={{ mb: 1 }}
              onClick={() => fileInputRef.current.click()}
            >
              Select Image
            </Button>
            
            <Button variant="outlined" startIcon={<VideocamIcon />} fullWidth sx={{ mb: 1 }}>Select Video</Button>
            
            <Button 
              variant={mode === 'camera' ? "contained" : "outlined"} 
              color={mode === 'camera' ? "error" : "primary"}
              startIcon={mode === 'camera' ? <StopIcon /> : <CameraAltIcon />} 
              fullWidth 
              sx={{ mb: 1 }}
              onClick={handleCameraToggle}
            >
              {mode === 'camera' ? "Stop Camera" : "Open Camera"}
            </Button>
            
            <Button variant="outlined" startIcon={<FolderIcon />} fullWidth>Batch Folder</Button>
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SettingsSuggestIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Inference Settings</Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Video Frame Rate (FPS): {fps}</Typography>
                    <FormControlLabel 
                        control={<Switch size="small" checked={nativeFps} onChange={(e) => setNativeFps(e.target.checked)} />} 
                        label={<Typography variant="caption">Native FPS</Typography>} 
                    />
                </Box>
                <Slider
                    disabled={nativeFps}
                    value={fps}
                    onChange={(e, val) => setFps(val)}
                    min={1}
                    max={30}
                    step={1}
                    valueLabelDisplay="auto"
                    marks={[{value: 1, label: '1'}, {value: 15, label: '15'}, {value: 30, label: '30'}]}
                />
            </Box>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>Detection Quality (Resolution & Precision)</Typography>
                <ToggleButtonGroup
                    color="primary"
                    value={quality}
                    exclusive
                    onChange={(e, val) => val && setQuality(val)}
                    fullWidth
                    size="small"
                >
                    <ToggleButton value="LOW">LOW</ToggleButton>
                    <ToggleButton value="MED">MED</ToggleButton>
                    <ToggleButton value="HIGH">HIGH</ToggleButton>
                    <ToggleButton value="MAX" sx={{ color: 'error.main' }}>MAX</ToggleButton>
                </ToggleButtonGroup>
            </Box>

            <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>Camera Confidence Threshold: {confidence}</Typography>
                <Slider
                    value={confidence}
                    onChange={(e, val) => setConfidence(val)}
                    onChangeCommitted={handleConfidenceChange} 
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    valueLabelDisplay="auto"
                    marks={[{value: 0.1, label: '0.1'}, {value: 0.5, label: '0.5'}, {value: 1.0, label: '1.0'}]}
                />
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Detailed Results</Typography>
            
            {/* Inference Time */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <AccessTimeIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">Inference Time</Typography>
                </Box>
                <Typography variant="h6" color="error.main" sx={{ pl: 3.5 }}>--</Typography>
            </Box>

            {/* Object Count */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TagIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">Object Count</Typography>
                </Box>
                <Typography variant="h6" color="text.primary" sx={{ pl: 3.5 }}>--</Typography>
            </Box>

            {/* Top Class & Conf */}
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <CategoryIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">Top Class & Conf</Typography>
                </Box>
                <Typography variant="h6" color="info.main" sx={{ pl: 3.5 }}>--</Typography>
            </Box>

            {/* Coordinates (ROI) */}
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <GpsFixedIcon sx={{ color: 'text.secondary', mr: 1, fontSize: 20 }} />
                    <Typography variant="body2" color="text.secondary">Coordinates (ROI)</Typography>
                </Box>
                <TextField 
                    fullWidth 
                    variant="filled" 
                    size="small" 
                    value="Waiting for input..." 
                    InputProps={{ 
                        readOnly: true, 
                        style: { fontFamily: 'monospace', fontSize: '0.9rem' } 
                    }} 
                />
            </Box>

            {/* Buttons */}
            <Stack direction="row" spacing={2}>
                <Button 
                    variant="contained" 
                    color="inherit" 
                    startIcon={<SaveIcon />} 
                    fullWidth
                    sx={{ bgcolor: 'action.selected', color: 'text.primary', '&:hover': { bgcolor: 'action.focus' } }}
                >
                    Save
                </Button>
                <Button 
                    variant="outlined" 
                    color="error" 
                    startIcon={<ClearIcon />} 
                    fullWidth
                >
                    Clear
                </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
