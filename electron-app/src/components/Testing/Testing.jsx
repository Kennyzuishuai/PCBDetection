import React, { useState, useRef } from 'react';
import { Box, Typography, Button, Paper, Grid, Slider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FolderIcon from '@mui/icons-material/Folder';
import StopIcon from '@mui/icons-material/Stop';

export default function Testing() {
  const [confidence, setConfidence] = useState(0.5);
  const [mode, setMode] = useState('idle'); // idle, image, camera, video
  const [imageSrc, setImageSrc] = useState(null);
  const [results, setResults] = useState([]);
  
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
    <Box>
      <Typography variant="h4" gutterBottom>Inference & Testing</Typography>
      <Grid container spacing={3}>
        {/* Main Display Area */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ width: '100%', height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'black', overflow: 'hidden' }}>
            {imageSrc ? (
              <img src={imageSrc} alt="Result" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <Typography color="grey.500">No Image/Video Selected</Typography>
            )}
          </Paper>
          <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 200 }}>
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
            <Typography variant="h6" gutterBottom>Inference Settings</Typography>
            <Typography gutterBottom>Camera Confidence Threshold: {confidence}</Typography>
            <Slider
              value={confidence}
              onChangeCommitted={handleConfidenceChange} 
              min={0.1}
              max={1.0}
              step={0.05}
              valueLabelDisplay="auto"
            />
            {/* Note: onChangeCommitted is better to avoid spamming the backend on drag */}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
