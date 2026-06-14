import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Key, UserCircle } from 'lucide-react';

const Login = () => {
  const [code, setCode] = useState('');
  const [role, setRole] = useState('tutor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAccess = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const upperCode = code.trim().toUpperCase();

    try {
      if (role === 'admin') {
        if (upperCode === 'ADMIN-UEG') {
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('groupId', 'ALL');
          navigate('/admin');
        } else {
          setError('Código de administrador incorrecto.');
        }
      } else {
        // Verificar si el grupo existe en la base de datos
        const { data, error: fetchError } = await supabase
          .from('groups')
          .select('id')
          .eq('id', upperCode)
          .single();

        if (fetchError || !data) {
          setError('El código de grupo no existe. Verifica e intenta de nuevo (ej. G-A1).');
        } else {
          localStorage.setItem('userRole', role);
          localStorage.setItem('groupId', upperCode);
          navigate(`/evaluate/${upperCode}`);
        }
      }
    } catch (err) {
      setError('Ocurrió un error al verificar el acceso.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="surface animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-8">
          <h1 className="h2 text-primary">EvaluaDocs</h1>
          <p className="text-muted">Acceso Rápido para Docentes</p>
        </div>

        {error && (
          <div className="form-group">
            <div className="badge badge-danger w-full justify-center py-2 text-center" style={{ width: '100%', display: 'block' }}>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleAccess}>
          <div className="form-group">
            <label className="form-label">Rol del Docente</label>
            <div style={{ position: 'relative' }}>
              <UserCircle size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <select 
                className="form-control" 
                style={{ paddingLeft: '2.5rem', cursor: 'pointer' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="tutor">Docente Tutor</option>
                <option value="guia">Docente Guía</option>
                <option value="revisor">Docente Revisor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>

          <div className="form-group mb-8">
            <label className="form-label">Código de Acceso</label>
            <div style={{ position: 'relative' }}>
              <Key size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem', textTransform: 'uppercase' }}
                placeholder={role === 'admin' ? "Clave secreta" : "Ej. G-A1"}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Ingresar a Calificar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
