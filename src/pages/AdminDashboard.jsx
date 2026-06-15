import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, Clock, PlayCircle, Link as LinkIcon, BookOpen, PenTool } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { generateReport } from '../utils/pdfGenerator';

const AdminDashboard = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gestion');
  const [searchTerm, setSearchTerm] = useState('');

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
        teachers_registry(role),
        students(id, full_name, evaluations_oral(*), evaluations_practical(*)),
        evaluations_written(*)
      `)
      .order('id');
      
    if (!groupsError && groupsData) {
      setGroups(groupsData);

      // Precargar calificaciones prácticas existentes
      const pScores = {};
      groupsData.forEach(g => {
        g.students?.forEach(s => {
          s.evaluations_practical?.forEach(ep => {
            pScores[s.id] = ep.final_score;
          });
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

  const handleResetEvaluation = async (groupId) => {
    if(!window.confirm("¿Estás seguro de reiniciar esta evaluación? Esto borrará la sala de espera y las calificaciones actuales para este grupo.")) return;

    try {
      // 1. Borrar docentes de la sala de espera
      await supabase.from('teachers_registry').delete().eq('group_id', groupId);
      // 2. Borrar calificaciones escritas
      await supabase.from('evaluations_written').delete().eq('group_id', groupId);
      // 3. Borrar calificaciones orales
      const { data: groupStudents } = await supabase.from('students').select('id').eq('group_id', groupId);
      if (groupStudents && groupStudents.length > 0) {
        const studentIds = groupStudents.map(s => s.id);
        await supabase.from('evaluations_oral').delete().in('student_id', studentIds);
      }
      // 4. Resetear estado a pendiente
      await supabase.from('groups').update({ evaluation_status: 'pending' }).eq('id', groupId);
      
      alert("Evaluación reiniciada con éxito.");
      fetchGroups();
    } catch (error) {
      alert("Error al reiniciar evaluación: " + error.message);
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

  const getTeacherStatus = (group, roleName) => {
    const roleMap = { 'Tutor': 'tutor', 'Guía': 'guia', 'Revisor': 'revisor' };
    const dbRole = roleMap[roleName];
    
    const ev = group.evaluations_written?.find(e => e.evaluator_role === dbRole);
    if (ev?.status === 'completed') return <span className="text-success" style={{ fontSize: '0.85rem', display: 'block' }}>✅ {roleName} finalizó</span>;
    
    const inWaiting = group.teachers_registry?.find(t => t.role === dbRole);
    if (inWaiting) return <span className="text-warning" style={{ fontSize: '0.85rem', display: 'block' }}>⏳ {roleName} evaluando...</span>;
    
    return <span className="text-muted" style={{ fontSize: '0.85rem', display: 'block' }}>❌ {roleName} inactivo</span>;
  };

  const isGroupFullyCompleted = (group) => {
    return group.evaluations_written?.filter(e => e.status === 'completed').length === 3;
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
          <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
            <h2 className="h3 flex items-center gap-2 m-0">
              <Users size={20} className="text-primary" />
              Control de Acceso a Evaluación ({groups.length} Grupos)
            </h2>
            <input 
              type="text" 
              className="form-control" 
              placeholder="🔍 Buscar por grupo, curso o estudiante..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ maxWidth: '350px' }}
            />
          </div>
          
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
                {groups.filter(g => 
                  g.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  g.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  g.students?.some(s => s.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
                ).map((group) => (
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
                      {group.evaluation_status === 'pending' ? (
                        <span className="badge badge-secondary"><Clock size={12} /> Pendiente</span>
                      ) : isGroupFullyCompleted(group) ? (
                        <span className="badge badge-success"><CheckCircle size={12} /> Completado</span>
                      ) : (
                        <span className="badge badge-warning"><PlayCircle size={12} /> En Progreso</span>
                      )}
                      
                      {group.evaluation_status !== 'pending' && !isGroupFullyCompleted(group) && (
                        <div className="mt-2 p-2 bg-gray-50 rounded" style={{ border: '1px solid var(--border-light)' }}>
                          {getTeacherStatus(group, 'Tutor')}
                          {getTeacherStatus(group, 'Guía')}
                          {getTeacherStatus(group, 'Revisor')}
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-col gap-2">
                        {group.evaluation_status === 'pending' && configuringGroupId !== group.id && (
                          <button className="btn btn-primary" onClick={() => handleStartConfig(group)}>
                            <PlayCircle size={16} /> Habilitar Docentes
                          </button>
                        )}
                        {group.evaluation_status !== 'pending' && (
                          <button className="btn btn-danger" onClick={() => handleResetEvaluation(group.id)}>
                            Reiniciar Evaluación
                          </button>
                        )}
                        <button 
                          className="btn btn-secondary" 
                          disabled={!isGroupFullyCompleted(group)}
                          title={!isGroupFullyCompleted(group) ? "Debe estar completado por los 3 docentes" : ""}
                          onClick={() => generateReport(group, {})}
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
