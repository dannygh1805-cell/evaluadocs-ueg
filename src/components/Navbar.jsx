import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BookOpen } from 'lucide-react';

const Navbar = ({ userRole }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // TODO: Implementar logout en Supabase
    navigate('/login');
  };

  const getRoleLabel = () => {
    switch (userRole) {
      case 'admin': return 'Administrador';
      case 'tutor': return 'Tutor';
      case 'guia': return 'Guía';
      case 'revisor': return 'Revisor';
      default: return 'Usuario';
    }
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <div className="navbar-brand">
          <BookOpen className="text-primary" size={24} />
          <span>EvaluaDocs UEG</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="badge badge-success">{getRoleLabel()}</span>
          <button onClick={handleLogout} className="btn btn-secondary btn-icon" title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
