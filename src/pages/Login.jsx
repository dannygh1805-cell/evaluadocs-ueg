import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Key, UserCircle, Users, Lock, UserCheck, Shield } from 'lucide-react';

const Login = () => {
  const [view, setView] = useState('teacher'); // 'teacher' | 'admin'
  const [activeGroups, setActiveGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState('');
  const [occupiedRoles, setOccupiedRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState(null);
  const [adminCode, setAdminCode] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchActiveGroups();
  }, []);

  const fetchActiveGroups = async () => {
    setLoading(true);
    const { data, error: fetchError } = await supabase
      .from('groups')
      .select('id, course, evaluations_written(status)')
      .eq('evaluation_status', 'in_progress');
    if (!fetchError && data) {
      const pendingGroups = data.filter(g => {
        const completedCount = g.evaluations_written?.filter(e => e.status === 'completed').length || 0;
        return completedCount < 3;
      });
      pendingGroups.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
      setActiveGroups(pendingGroups);
    }
    setLoading(false);
  };

  const handleGroupSelect = async (e) => {
    const groupId = e.target.value;
    setSelectedGroup(groupId);
    setError(null);
    if (!groupId) {
      setOccupiedRoles([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('teachers_registry').select('role').eq('group_id', groupId);
    if (data) {
      setOccupiedRoles(data.map(t => t.role));
    }
    setLoading(false);
  };

  const handleJoinRole = async (selectedRole) => {
    if (occupiedRoles.includes(selectedRole) || joining) return;
    setJoining(true);
    setError(null);
    try {
      localStorage.setItem('userRole', selectedRole);
      localStorage.setItem('groupId', selectedGroup);
      
      await supabase.from('teachers_registry').upsert({
        group_id: selectedGroup,
        role: selectedRole,
        full_name: `Docente ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`,
        cedula: 'N/A',
        cellphone: 'N/A',
        created_at: new Date()
      }, { onConflict: 'group_id, role' });

      window.dispatchEvent(new Event('authChange'));
      navigate(`/evaluate/${selectedGroup}`);
    } catch (e) {
      setError("Error al unirse: " + e.message);
    } finally {
      setJoining(false);
    }
  };

  const handleAdminAccess = (e) => {
    e.preventDefault();
    if (adminCode.trim().toUpperCase() === 'ADMIN-UEG') {
      localStorage.setItem('userRole', 'admin');
      localStorage.setItem('groupId', 'ALL');
      window.dispatchEvent(new Event('authChange'));
      navigate('/admin');
    } else {
      setError('Clave de administrador incorrecta.');
    }
  };

  const renderRoleCard = (roleKey, roleName) => {
    const isOccupied = occupiedRoles.includes(roleKey);
    return (
      <div 
        onClick={() => !isOccupied && handleJoinRole(roleKey)}
        className={`p-4 border rounded text-center transition-all ${isOccupied ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:shadow'}`}
        style={{ 
          backgroundColor: isOccupied ? 'var(--bg-app)' : 'var(--bg-surface)',
          borderColor: !isOccupied ? 'var(--color-success)' : 'var(--border-light)'
        }}
      >
        <div className="flex justify-center mb-2">
          {isOccupied ? <Lock size={28} className="text-muted" /> : <UserCheck size={28} className="text-success" />}
        </div>
        <div className="font-bold text-sm mb-1">{roleName}</div>
        <div className="text-xs font-medium" style={{color: isOccupied ? 'var(--color-danger)' : 'var(--color-success)'}}>
          {isOccupied ? 'Asiento Ocupado' : 'Asiento Libre'}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4">
      <div className="surface animate-fade-in w-full" style={{ maxWidth: '450px' }}>
        
        {view === 'teacher' ? (
          <>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="bg-blue-100 p-3 rounded-full text-primary">
                  <Users size={32} />
                </div>
              </div>
              <h1 className="h2 text-primary">Sala de Tribunal</h1>
              <p className="text-muted mt-2">Seleccione un grupo y ocupe su asiento</p>
            </div>

            {error && <div className="badge badge-danger w-full justify-center py-2 text-center mb-4 block">{error}</div>}

            <div className="form-group mb-6">
              <label className="form-label font-bold">1. Seleccionar Grupo en Evaluación</label>
              <select 
                className="form-control" 
                value={selectedGroup}
                onChange={handleGroupSelect}
                disabled={loading && activeGroups.length === 0}
              >
                <option value="">-- Seleccione un grupo --</option>
                {activeGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.id} - {g.course}</option>
                ))}
              </select>
              {activeGroups.length === 0 && !loading && (
                <div className="text-warning text-xs mt-2">No hay grupos habilitados para evaluar en este momento.</div>
              )}
            </div>

            {selectedGroup && (
              <div className="mb-6 animate-fade-in">
                <label className="form-label font-bold mb-3 block">2. Seleccione su Asiento</label>
                {loading ? (
                  <div className="text-center text-muted text-sm py-4">Verificando asientos disponibles...</div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {renderRoleCard('tutor', 'Tutor')}
                    {renderRoleCard('guia', 'Guía')}
                    {renderRoleCard('revisor', 'Revisor')}
                  </div>
                )}
                {joining && <div className="text-center text-primary text-sm mt-3 font-bold">Ingresando a la sala...</div>}
              </div>
            )}

            <div className="mt-8 text-center border-t pt-4" style={{ borderColor: 'var(--border-light)' }}>
              <button 
                onClick={() => {setView('admin'); setError(null);}} 
                className="text-muted hover:text-primary text-sm flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <Shield size={14} /> ¿Eres Administrador? Ingresa aquí
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="bg-slate-100 p-3 rounded-full text-secondary">
                  <Shield size={32} />
                </div>
              </div>
              <h1 className="h2 text-secondary">Administración</h1>
              <p className="text-muted mt-2">Acceso a la sala de control</p>
            </div>

            {error && <div className="badge badge-danger w-full justify-center py-2 text-center mb-4 block">{error}</div>}

            <form onSubmit={handleAdminAccess}>
              <div className="form-group mb-6">
                <label className="form-label">Clave Secreta</label>
                <div style={{ position: 'relative' }}>
                  <Key size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
                  <input 
                    type="password" 
                    className="form-control" 
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Contraseña de admin"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Ingresar al Panel
              </button>
            </form>

            <div className="mt-8 text-center border-t pt-4" style={{ borderColor: 'var(--border-light)' }}>
              <button 
                onClick={() => {setView('teacher'); setError(null);}} 
                className="text-muted hover:text-primary text-sm flex items-center justify-center gap-1 mx-auto transition-colors"
              >
                <Users size={14} /> Volver a Sala de Tribunal
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
