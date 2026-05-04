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
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">로딩 중...</div>;
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