import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Key, Users, Lock, UserCheck, Shield, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

const Login = () => {
  const [view, setView] = useState('teacher'); // 'teacher' | 'admin'
  const [activeGroups, setActiveGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(-1);
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
      .select('id, course, evaluations_written(status), teachers_registry(role, full_name)')
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

  const handleGroupSelect = (e) => {
    const id = e.target.value;
    const idx = activeGroups.findIndex(g => g.id === id);
    setSelectedGroupIndex(idx);
    setError(null);
  };

  const currentGroup = selectedGroupIndex >= 0 ? activeGroups[selectedGroupIndex] : null;
  const prevGroup = selectedGroupIndex > 0 ? activeGroups[selectedGroupIndex - 1] : null;
  const nextGroup = selectedGroupIndex >= 0 && selectedGroupIndex < activeGroups.length - 1 ? activeGroups[selectedGroupIndex + 1] : null;
  
  const occupiedRoles = currentGroup ? currentGroup.teachers_registry?.map(t => t.role) || [] : [];

  const handleJoinRole = async (selectedRole) => {
    if (!currentGroup || occupiedRoles.includes(selectedRole) || joining) return;
    setJoining(true);
    setError(null);
    try {
      localStorage.setItem('userRole', selectedRole);
      localStorage.setItem('groupId', currentGroup.id);
      
      await supabase.from('teachers_registry').upsert({
        group_id: currentGroup.id,
        role: selectedRole,
        full_name: `Docente ${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)}`,
        cedula: 'N/A',
        cellphone: 'N/A',
        created_at: new Date()
      }, { onConflict: 'group_id, role' });

      window.dispatchEvent(new Event('authChange'));
      navigate(`/evaluate/${currentGroup.id}`);
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
    const occupant = currentGroup?.teachers_registry?.find(t => t.role === roleKey)?.full_name;

    return (
      <div 
        onClick={() => !isOccupied && handleJoinRole(roleKey)}
        className={`p-3 border rounded text-center transition-all flex flex-col items-center justify-center h-full ${isOccupied ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
        style={{ 
          backgroundColor: isOccupied ? 'var(--bg-app)' : 'var(--bg-surface-hover)',
          borderColor: !isOccupied ? 'var(--color-primary)' : 'var(--border-light)'
        }}
      >
        <div className="mb-2">
          {isOccupied ? <Lock size={24} className="text-muted" /> : <UserCheck size={24} className="text-primary" />}
        </div>
        <div className="font-bold text-sm mb-1">{roleName}</div>
        {isOccupied ? (
          <div className="text-xs text-muted leading-tight truncate w-full px-1" title={occupant}>
            Ocupado
          </div>
        ) : (
          <div className="text-xs font-medium text-success">
            Seleccionar
          </div>
        )}
      </div>
    );
  };

  const renderSideGroup = (group, title, icon) => {
    if (!group) {
      return (
        <div className="h-full border rounded p-4 flex flex-col items-center justify-center opacity-40 text-center" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-app)' }}>
          {icon}
          <p className="text-sm text-muted mt-2">No hay {title.toLowerCase()}</p>
        </div>
      );
    }

    const roles = ['tutor', 'guia', 'revisor'];
    
    return (
      <div className="h-full border rounded p-4 flex flex-col opacity-70" style={{ borderColor: 'var(--border-light)', backgroundColor: 'var(--bg-surface)' }}>
        <div className="text-xs font-bold text-muted uppercase tracking-wider mb-2 flex items-center gap-1">{icon} {title}</div>
        <div className="badge badge-secondary mb-3 self-start">{group.id}</div>
        <div className="text-sm font-medium mb-3">{group.course}</div>
        
        <div className="mt-auto space-y-1">
          {roles.map(r => {
            const found = group.teachers_registry?.find(t => t.role === r);
            return (
              <div key={r} className="flex justify-between items-center text-xs border-b pb-1 last:border-0" style={{ borderColor: 'var(--border-light)' }}>
                <span className="capitalize text-muted">{r}:</span>
                {found ? <span className="font-medium text-success flex items-center gap-1"><UserCheck size={10}/> Unido</span> : <span className="text-warning flex items-center gap-1"><Clock size={10}/> Esp.</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-8">
      <div className="w-full max-w-[600px] animate-fade-in">
        
        {view === 'teacher' ? (
          <>
            <div className="text-center mb-8">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--color-primary)' }}>
                  <Users size={32} />
                </div>
              </div>
              <h1 className="h2 text-primary">Sala de Tribunal</h1>
              <p className="text-muted mt-2">Seleccione el grupo a evaluar y asigne su rol en el tribunal</p>
            </div>

            {error && <div className="badge badge-danger w-full justify-center py-2 text-center mb-6 block max-w-[500px] mx-auto">{error}</div>}

            {/* Layout Simple */}
            <div className="surface shadow-md flex flex-col p-6 rounded-lg border" style={{ borderColor: 'var(--color-primary)' }}>
              <div className="form-group mb-6">
                <label className="form-label font-bold text-center block text-lg mb-4">1. Grupo en Evaluación</label>
                <select 
                  className="form-control text-center text-md py-3" 
                  value={currentGroup?.id || ''}
                  onChange={handleGroupSelect}
                  disabled={loading && activeGroups.length === 0}
                  style={{ backgroundColor: 'var(--bg-surface-hover)', border: '2px solid var(--border-light)' }}
                >
                  <option value="">-- Seleccione un grupo de la cola --</option>
                  {activeGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.id} - {g.course}</option>
                  ))}
                </select>
                {activeGroups.length === 0 && !loading && (
                  <div className="text-warning text-sm mt-3 text-center">No hay grupos habilitados en la cola de evaluación en este momento.</div>
                )}
              </div>

              {currentGroup && (
                <div className="mt-auto animate-fade-in flex flex-col flex-grow">
                  <label className="form-label font-bold mb-4 block text-center">2. Seleccione su Asiento</label>
                  <div className="grid grid-cols-3 gap-3 flex-grow">
                    {renderRoleCard('tutor', 'Tutor')}
                    {renderRoleCard('guia', 'Guía')}
                    {renderRoleCard('revisor', 'Revisor')}
                  </div>
                  {joining && <div className="text-center text-primary text-sm mt-4 font-bold animate-pulse">Ingresando a la sala...</div>}
                </div>
              )}
            </div>

            <div className="mt-10 text-center">
              <button 
                onClick={() => {setView('admin'); setError(null);}} 
                className="text-muted hover:text-primary text-sm flex items-center justify-center gap-1 mx-auto transition-colors bg-transparent border-0 outline-none"
                style={{ backgroundColor: 'transparent', border: 'none', background: 'none' }}
              >
                <Shield size={14} /> ¿Eres Administrador? Ingresa aquí
              </button>
            </div>
          </>
        ) : (
          <div className="max-w-[400px] mx-auto surface p-6 rounded shadow">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="p-3 rounded-full" style={{ backgroundColor: 'var(--bg-surface-hover)', color: 'var(--color-secondary)' }}>
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
                className="text-muted hover:text-primary text-sm flex items-center justify-center gap-1 mx-auto transition-colors bg-transparent border-0 outline-none"
                style={{ backgroundColor: 'transparent', border: 'none', background: 'none' }}
              >
                <Users size={14} /> Volver a Sala de Tribunal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
