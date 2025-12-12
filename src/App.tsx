import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Repairs from './pages/Repairs';
import Inventory from './pages/Inventory';
import Masters from './pages/Masters';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="repairs" element={<Repairs />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="masters" element={<Masters />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
