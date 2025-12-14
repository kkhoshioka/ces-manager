import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Repairs from './pages/Repairs';
import Inventory from './pages/Inventory';
import Masters from './pages/Masters';
import MachineRegistry from './pages/machines/MachineRegistry';
import MachineDetail from './pages/machines/MachineDetail';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="repairs" element={<ProtectedRoute allowedRoles={['admin', 'staff']}><Repairs /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute allowedRoles={['admin']}><Inventory /></ProtectedRoute>} />
            <Route path="masters" element={<ProtectedRoute allowedRoles={['admin']}><Masters /></ProtectedRoute>} />
            <Route path="machines" element={<ProtectedRoute allowedRoles={['admin']}><MachineRegistry /></ProtectedRoute>} />
            <Route path="machines/:id" element={<ProtectedRoute allowedRoles={['admin']}><MachineDetail /></ProtectedRoute>} />
          </Route>

          {/* Catch all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
