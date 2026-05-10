import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RackPage from './pages/RackPage';
import DeviceList from './pages/DeviceList';
import DeviceForm from './pages/DeviceForm';
import SnapshotPage from './pages/SnapshotPage';
import LoginPage from './pages/LoginPage';
import UserManagePage from './pages/UserManagePage';
import { AuthProvider, useAuth } from './context/AuthContext';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3" style={{ backgroundColor: '#F4F6FA' }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
        <circle cx="14" cy="14" r="11" stroke="#E2E8F0" strokeWidth="3" />
        <path d="M14 3a11 11 0 0 1 11 11" stroke="#003DA5" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="text-sm text-gray-400 font-medium">로딩 중...</span>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<PrivateRoute><RackPage /></PrivateRoute>} />
          <Route path="/devices" element={<PrivateRoute><DeviceList /></PrivateRoute>} />
          <Route path="/devices/new" element={<PrivateRoute><DeviceForm /></PrivateRoute>} />
          <Route path="/devices/:id/edit" element={<PrivateRoute><DeviceForm /></PrivateRoute>} />
          <Route path="/snapshots" element={<PrivateRoute><SnapshotPage /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute><UserManagePage /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;