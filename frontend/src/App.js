import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RackPage from './pages/RackPage';
import DeviceList from './pages/DeviceList';
import DeviceForm from './pages/DeviceForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RackPage />} />
        <Route path="/devices" element={<DeviceList />} />
        <Route path="/devices/new" element={<DeviceForm />} />
        <Route path="/devices/:id/edit" element={<DeviceForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;