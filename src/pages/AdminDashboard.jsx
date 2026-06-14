import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, PlayCircle, Link as LinkIcon, BookOpen, PenTool } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { generateReport } from '../utils/pdfGenerator';

const AdminDashboard = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gestion');

  // Estado para la configuración de un grupo antes de iniciar
  const [configuringGroupId, setConfiguringGroupId] = useState(null);
  const [configData, setConfigData] = useState({ theme: '', plagiarism_percentage: 0, ai_percentage: 0 });

  // Estado para las calificaciones prácticas
  const [practicalScores, setPracticalScores] = useState({}); // { studentId: score }
  
  const fetchGroups = async () => {
    setLoading(true);
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select(`
        *,
        students(id, full_name),
        evaluations_written(status, evaluator_role),
        evaluations_oral(status, evaluator_role, student_id),
        evaluations_practical(status, evaluator_role, student_id, final_score)
      `)
      .order('id');
      
    if (!groupsError && groupsData) {
      setGroups(groupsData);

      // Precargar calificaciones prácticas existentes
      const pScores = {};
      groupsData.forEach(g => {
        g.evaluations_practical?.forEach(ep => {
          pScores[ep.student_id] = ep.final_score;
        });
      });
      setPracticalScores(pScores);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleStartConfig = (group) => {
    setConfiguringGroupId(group.id);
    setConfigData({
      theme: group.theme || '',
      plagiarism_percentage: group.plagiarism_percentage || 0,
      ai_percentage: group.ai_percentage || 0
    });
  };

  const handleStartEvaluation = async (groupId) => {
    if(!window.confirm("¿Estás seguro de iniciar la evaluación? Los docentes ya podrán acceder al grupo.")) return;

    const { error } = await supabase
      .from('groups')
      .update({
        theme: configData.theme,
        plagiarism_percentage: configData.plagiarism_percentage,
        ai_percentage: configData.ai_percentage,
        evaluation_status: 'in_progress'
      })
      .eq('id', groupId);

    if (!error) {
      alert("Evaluación Iniciada.");
      setConfiguringGroupId(null);
      fetchGroups();
    } else {
      alert("Error al iniciar evaluación: " + error.message);
    }
  };

  const handleSavePracticalScores = async (groupId, students) => {
    const promises = students.map(s => {
      const score = practicalScores[s.id] || 0;
      return supabase.from('evaluations_practical').upsert({
        student_id: s.id,
        evaluator_role: 'admin',
        final_score: score,
        status: 'completed',
        updated_at: new Date()
      }, { onConflict: 'student_id, evaluator_role' });
    });

    try {
      await Promise.all(promises);
      alert("Calificaciones prácticas guardadas exitosamente.");
    } catch (e) {
      alert("Error guardando calificaciones: " + e.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando panel de administración...</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="h1 mb-2">Panel de Administrador</h1>
        <p className="text-muted">Control total del flujo de evaluación y proyecto práctico</p>
      </div>

      <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'gestion' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('gestion')}><BookOpen size={18}/> Gestión de Grupos</button>
        <button className={`btn ${activeTab === 'practico' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('practico')}><PenTool size={18}/> Calificación Proyecto Práctico</button>
      </div>

      {activeTab === 'gestion' && (
        <div className="surface mb-8">
          <h2 className="h3 flex items-center gap-2 mb-4">
            <Users size={20} className="text-primary" />
            Control de Acceso a Evaluación ({groups.length} Grupos)
          </h2>
          
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Grupo / Estudiantes</th>
                  <th>Configuración Pre-Evaluación</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.id}>
                    <td style={{ maxWidth: '250px' }}>
                      <span className="badge badge-primary mb-2">{group.id} ({group.course})</span>
                      <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                        {group.students?.map(s => s.full_name).join(', ')}
                      </div>
                    </td>
                    <td>
                      {configuringGroupId === group.id ? (
                        <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded" style={{ backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-light)' }}>
                          <input type="text" className="form-control" placeholder="Tema de Investigación" value={configData.theme} onChange={(e) => setConfigData({...configData, theme: e.target.value})} />
                          <div className="flex gap-2">
                            <input type="number" className="form-control" placeholder="% Plagio" value={configData.plagiarism_percentage} onChange={(e) => setConfigData({...configData, plagiarism_percentage: e.target.value})} title="% Plagio" />
                            <input type="number" className="form-control" placeholder="% IA" value={configData.ai_percentage} onChange={(e) => setConfigData({...configData, ai_percentage: e.target.value})} title="% IA" />
                          </div>
                          <button className="btn btn-success" onClick={() => handleStartEvaluation(group.id)}>Iniciar Evaluación</button>
                          <button className="btn btn-secondary" onClick={() => setConfiguringGroupId(null)}>Cancelar</button>
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.9rem' }}>
                          <div><strong>Tema:</strong> {group.theme || 'No definido'}</div>
                          <div><strong>Plagio:</strong> {group.plagiarism_percentage}% | <strong>IA:</strong> {group.ai_percentage}%</div>
                        </div>
                      )}
                    </td>
                    <td>
                      {group.evaluation_status === 'completed' ? <span className="badge badge-success"><CheckCircle size={12} /> Completado</span> : 
                       group.evaluation_status === 'in_progress' ? <span className="badge badge-warning"><PlayCircle size={12} /> En Progreso</span> :
                       <span className="badge badge-secondary"><Clock size={12} /> Pendiente</span>}
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {group.evaluation_status === 'pending' && configuringGroupId !== group.id && (
                          <button className="btn btn-primary" onClick={() => handleStartConfig(group)}>
                            <PlayCircle size={16} /> Habilitar Docentes
                          </button>
                        )}
                        <button className="btn btn-secondary" onClick={() => generateReport(group, {})}>Descargar Informe</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'practico' && (
        <div className="surface mb-8">
          <h2 className="h3 mb-4">Calificación del Proyecto Práctico (Exclusivo Admin)</h2>
          <p className="text-muted mb-6">Esta calificación se suma a la nota final promedio de cada estudiante.</p>
          
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Grupo</th><th>Estudiantes</th><th style={{ width: '150px' }}>Nota Práctica (0-10)</th><th>Acciones</th></tr></thead>
              <tbody>
                {groups.map(group => (
                  <React.Fragment key={group.id}>
                    <tr style={{ backgroundColor: 'var(--surface-color)' }}><td colSpan="4"><strong>{group.id} - {group.course}</strong></td></tr>
                    {group.students.map(s => (
                      <tr key={s.id}>
                        <td></td>
                        <td>{s.full_name}</td>
                        <td>
                          <input type="number" min="0" max="10" step="0.1" className="form-control" 
                            value={practicalScores[s.id] ?? ''} 
                            onChange={e => setPracticalScores({...practicalScores, [s.id]: e.target.value})} 
                          />
                        </td>
                        <td></td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan="3"></td>
                      <td><button className="btn btn-success" onClick={() => handleSavePracticalScores(group.id, group.students)}>Guardar Práctico {group.id}</button></td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
