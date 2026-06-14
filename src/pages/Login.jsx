import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Lock, Mail } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Simulación temporal mientras no tengamos base de datos con usuarios
    setTimeout(() => {
      setLoading(false);
      // Redirigimos por defecto a admin para probar (luego esto se adaptará con JWT de supabase)
      navigate('/admin');
    }, 1000);

    /* Lógica real (descomentar cuando haya datos):
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      // Obtener el rol del usuario desde la tabla public.users
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();
        
      if (userData?.role === 'admin') {
        navigate('/admin');
      } else {
        // Redirigir a la vista de sus grupos asignados
        navigate('/evaluate/groups');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    */
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="surface animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center mb-8">
          <h1 className="h2 text-primary">EvaluaDocs</h1>
          <p className="text-muted">Sistema de Calificación de Defensas de Grado</p>
        </div>

        {error && (
          <div className="form-group">
            <div className="badge badge-danger w-full justify-center py-2" style={{ width: '100%' }}>
              {error}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Correo Institucional</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="email" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }}
                placeholder="docente@educacion.gob.ec"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group mb-8">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
