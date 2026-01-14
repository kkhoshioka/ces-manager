import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Repairs from './pages/Repairs';
import Inventory from './pages/Inventory';
import Masters from './pages/Masters';
import SalesManagement from './pages/dashboard/SalesManagement';
import SupplierMonthlyReport from './pages/dashboard/SupplierMonthlyReport';
import MachineRegistry from './pages/machines/MachineRegistry';
import MachineDetail from './pages/machines/MachineDetail';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import ServerAwakeOverlay from './components/ServerAwakeOverlay';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from './config';


function App() {
  const [isServerReady, setIsServerReady] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Basic ping to wake up server
    const checkServer = async () => {
      try {
        // Try fetch with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout for initial wake up

        const res = await fetch(`${API_BASE_URL}/health`, {
          signal: controller.signal,
          method: 'HEAD' // Lightweight
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          setIsServerReady(true);
          setIsChecking(false);
        } else {
          // If 503 or error, keep retrying
          setTimeout(checkServer, 3000);
        }
      } catch (error) {
        // Network error (server down/waking up)
        console.log('Waiting for server...', error);
        setTimeout(checkServer, 3000);
      }
    };

    checkServer();
  }, []);

  if (isChecking && !isServerReady) {
    return <ServerAwakeOverlay />;
  }

  return (
    <BrowserRouter>
      <ErrorBoundary>
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
              <Route path="reports/supplier-costs" element={<ProtectedRoute allowedRoles={['admin']}><SupplierMonthlyReport /></ProtectedRoute>} />
            </Route>

            {/* Catch all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
