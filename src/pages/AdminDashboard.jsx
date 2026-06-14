import React, { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, Clock, Settings, Edit3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { generateReport } from '../utils/pdfGenerator';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingTheme, setEditingTheme] = useState('');

  const fetchGroups = async () => {
    setLoading(true);
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select(`
        *,
        students(id, full_name),
        evaluations_written(status, evaluator_role),
        evaluations_oral(status, evaluator_role, student_id),
        evaluations_practical(status, evaluator_role, student_id)
      `)
      .order('id');
      
    if (!groupsError && groupsData) {
      // Calcular estado simulado por ahora (si las 3 areas tienen algo completado)
      const formatted = groupsData.map(g => {
        const isCompleted = g.evaluations_written.length > 0; // Simplificado para la vista
        return {
          ...g,
          status: isCompleted ? 'completed' : 'pending'
        };
      });
      setGroups(formatted);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleSaveTheme = async (groupId) => {
    const { error } = await supabase
      .from('groups')
      .update({ theme: editingTheme })
      .eq('id', groupId);
      
    if (!error) {
      setGroups(groups.map(g => g.id === groupId ? { ...g, theme: editingTheme } : g));
      setEditingGroupId(null);
    } else {
      alert("Error al actualizar el tema");
    }
  };

  const startEditingTheme = (group) => {
    setEditingGroupId(group.id);
    setEditingTheme(group.theme);
  };

  const handleGeneratePDF = (group) => {
    // Simular evaluación data para el PDF
    generateReport(group, {}); 
  };

  if (loading) return <div className="p-8 text-center">Cargando datos...</div>;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="h1 mb-0">Panel de Administrador</h1>
          <p className="text-muted">Gestión de 22 grupos, rúbricas y generación de informes</p>
        </div>
        <button className="btn btn-primary">
          <Settings size={18} /> Configurar Penalización Global
        </button>
      </div>

      <div className="surface mb-8">
        <h2 className="h3 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Grupos Asignados ({groups.length})
        </h2>
        
        <div className="table-container mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Código / Tema del Proyecto</th>
                <th>Curso</th>
                <th>Docentes Asignados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td style={{ maxWidth: '300px' }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="badge badge-primary">{group.id}</span>
                    </div>
                    {editingGroupId === group.id ? (
                      <div className="flex gap-2 mt-2">
                        <textarea 
                          className="form-control" 
                          value={editingTheme} 
                          onChange={(e) => setEditingTheme(e.target.value)}
                          rows="2"
                        />
                        <button className="btn btn-success" onClick={() => handleSaveTheme(group.id)}>Guardar</button>
                      </div>
                    ) : (
                      <div style={{ fontWeight: 500, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <span>{group.theme}</span>
                        <button className="btn btn-icon btn-secondary" onClick={() => startEditingTheme(group)} title="Editar Tema">
                          <Edit3 size={14} />
                        </button>
                      </div>
                    )}
                    <div className="text-muted mt-2" style={{ fontSize: '0.8rem' }}>
                      {group.students?.map(s => s.full_name).join(', ')}
                    </div>
                  </td>
                  <td>{group.course}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    <div><strong className="text-primary">T:</strong> {group.tutor_name}</div>
                    <div><strong className="text-primary">G:</strong> {group.guia_name}</div>
                    <div><strong className="text-primary">R:</strong> {group.revisor_name}</div>
                  </td>
                  <td>
                    {group.status === 'completed' ? (
                      <span className="badge badge-success gap-2">
                        <CheckCircle size={12} /> Completado
                      </span>
                    ) : (
                      <span className="badge badge-warning gap-2">
                        <Clock size={12} /> Pendiente
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex flex-col gap-2">
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleGeneratePDF(group)}
                      >
                        Descargar Informe
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
