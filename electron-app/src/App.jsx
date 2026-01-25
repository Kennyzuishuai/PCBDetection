import React, { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, AppBar, CssBaseline } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ModelTrainingIcon from '@mui/icons-material/ModelTraining';
import BugReportIcon from '@mui/icons-material/BugReport'; // For Testing
import SettingsIcon from '@mui/icons-material/Settings';

// Components (Placeholders for now)
import Dashboard from './components/Dashboard/Dashboard';
import Training from './components/Training/Training';
import Testing from './components/Testing/Testing';
import Settings from './components/Settings/Settings';

const drawerWidth = 240;

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'training':
        return <Training />;
      case 'testing':
        return <Testing />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            PCB Defect Detection System
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton selected={currentTab === 'dashboard'} onClick={() => setCurrentTab('dashboard')}>
                <ListItemIcon><DashboardIcon /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={currentTab === 'training'} onClick={() => setCurrentTab('training')}>
                <ListItemIcon><ModelTrainingIcon /></ListItemIcon>
                <ListItemText primary="Training" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={currentTab === 'testing'} onClick={() => setCurrentTab('testing')}>
                <ListItemIcon><BugReportIcon /></ListItemIcon>
                <ListItemText primary="Testing" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton selected={currentTab === 'settings'} onClick={() => setCurrentTab('settings')}>
                <ListItemIcon><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'auto' }}>
        <Toolbar />
        {renderContent()}
      </Box>
    </Box>
  );
}

export default App;
