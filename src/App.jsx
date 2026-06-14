import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import EvaluationPanel from './pages/EvaluationPanel';
import Navbar from './components/Navbar';

function App() {
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [groupId, setGroupId] = useState(localStorage.getItem('groupId'));

  // Sincronizar el estado con el localStorage (para cuando se actualiza desde Login)
  useEffect(() => {
    const handleStorageChange = () => {
      setUserRole(localStorage.getItem('userRole'));
      setGroupId(localStorage.getItem('groupId'));
    };
    
    // Polling simple para detectar login (ya que localStorage cambia en la misma pestaña)
    const interval = setInterval(handleStorageChange, 500);
    return () => clearInterval(interval);
  }, []);

  const isAuthenticated = !!userRole;

  return (
    <HashRouter>
      {isAuthenticated && <Navbar userRole={userRole} groupId={groupId} />}
      <main className="main-content">
        <div className="container">
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route 
              path="/admin" 
              element={isAuthenticated && userRole === 'admin' ? <AdminDashboard /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="/evaluate/:groupId" 
              element={isAuthenticated && userRole !== 'admin' ? <EvaluationPanel /> : <Navigate to="/login" />} 
            />
            
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? (userRole === 'admin' ? '/admin' : `/evaluate/${groupId}`) : '/login'} />} 
            />
          </Routes>
        </div>
      </main>
    </HashRouter>
  );
}

export default App;
