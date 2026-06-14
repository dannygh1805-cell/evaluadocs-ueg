import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { User, CreditCard, Phone } from 'lucide-react';

const TeacherProfileForm = () => {
  const { groupId } = useParams();
  const role = localStorage.getItem('userRole');
  const [formData, setFormData] = useState({ fullName: '', cedula: '', cellphone: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('teachers_registry').upsert({
      group_id: groupId,
      role: role,
      full_name: formData.fullName,
      cedula: formData.cedula,
      cellphone: formData.cellphone,
      created_at: new Date()
    }, { onConflict: 'group_id, role' });

    setLoading(false);

    if (error) {
      alert("Error al guardar datos del docente: " + error.message);
    } else {
      navigate(`/evaluate/${groupId}`);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <div className="surface animate-fade-in" style={{ width: '100%', maxWidth: '500px' }}>
        <div className="text-center mb-8">
          <h1 className="h2 text-primary">Registro de Docente</h1>
          <p className="text-muted">Por favor, ingresa tus datos antes de calificar al grupo {groupId}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Apellidos y Nombres Completos</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.fullName}
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Número de Cédula</label>
            <div style={{ position: 'relative' }}>
              <CreditCard size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.cedula}
                onChange={(e) => setFormData({...formData, cedula: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group mb-8">
            <label className="form-label">Número de Celular</label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="form-control" 
                style={{ paddingLeft: '2.5rem' }}
                value={formData.cellphone}
                onChange={(e) => setFormData({...formData, cellphone: e.target.value})}
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
            {loading ? 'Guardando...' : 'Continuar a la Evaluación'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TeacherProfileForm;
