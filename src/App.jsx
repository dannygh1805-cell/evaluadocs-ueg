import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EvaluationPanel from './pages/EvaluationPanel';
import Navbar from './components/Navbar';

function App() {
  // TODO: Agregar lógica real de autenticación usando Supabase
  const isAuthenticated = true; // temporal
  const userRole = 'admin'; // 'admin', 'tutor', 'guia', 'revisor'

  return (
    <HashRouter>
      {isAuthenticated && <Navbar userRole={userRole} />}
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Rutas Protegidas */}
            <Route 
              path="/admin" 
              element={isAuthenticated && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/evaluate/:groupId" 
              element={isAuthenticated && userRole !== 'admin' ? <EvaluationPanel role={userRole} /> : <Navigate to="/login" />} 
            />
            
            {/* Redirección por defecto */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? (userRole === 'admin' ? '/admin' : '/evaluate/default-group') : '/login'} />} 
            />
          </Routes>
        </div>
      </main>
    </HashRouter>
  );
}

export default App;
