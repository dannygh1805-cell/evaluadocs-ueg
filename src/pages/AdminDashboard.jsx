import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, CheckCircle, Clock, PlayCircle, Link as LinkIcon, BookOpen, PenTool, Trash2, Edit2, Plus, X, Eye } from 'lucide-react';
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

  // Estados para CRUD de Estudiantes
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStudentName, setEditingStudentName] = useState('');
  const [addingToGroupId, setAddingToGroupId] = useState(null);
  const [newStudentName, setNewStudentName] = useState('');
  
  // Estado para modal de resumen
  const [summaryGroup, setSummaryGroup] = useState(null);

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

  // Funciones CRUD Estudiantes
  const handleDeleteStudent = async (studentId, studentName) => {
    if(!window.confirm(`¿Seguro que deseas eliminar a ${studentName}? Las notas asociadas se borrarán.`)) return;
    try {
      await supabase.from('evaluations_oral').delete().eq('student_id', studentId);
      await supabase.from('evaluations_practical').delete().eq('student_id', studentId);
      await supabase.from('students').delete().eq('id', studentId);
      fetchGroups();
    } catch(e) { alert("Error eliminando: " + e.message); }
  };

  const handleUpdateStudent = async (studentId) => {
    if(!editingStudentName.trim()) return;
    try {
      await supabase.from('students').update({ full_name: editingStudentName }).eq('id', studentId);
      setEditingStudentId(null);
      fetchGroups();
    } catch(e) { alert("Error editando: " + e.message); }
  };

  const handleAddStudent = async (groupId) => {
    if(!newStudentName.trim()) return;
    try {
      await supabase.from('students').insert({ group_id: groupId, full_name: newStudentName });
      setAddingToGroupId(null);
      setNewStudentName('');
      fetchGroups();
    } catch(e) { alert("Error añadiendo: " + e.message); }
  };

  const calculateWrittenAvg = (evaluation) => {
    if(!evaluation) return 0;
    const scores = [
      evaluation.score_introduccion, evaluation.score_antecedentes, evaluation.score_definicion_problema,
      evaluation.score_justificacion, evaluation.score_objetivos, evaluation.score_marco_conceptual,
      evaluation.score_marco_metodologico, evaluation.score_resultados, evaluation.score_analisis,
      evaluation.score_conclusiones, evaluation.score_recomendaciones, evaluation.score_referencias,
      evaluation.score_anexos, evaluation.score_formato
    ];
    return (scores.reduce((a,b) => a + Number(b||0), 0) / 14).toFixed(2);
  };

  const calculatePenalty = (group) => {
    let penalty = 0;
    const plagio = Number(group.plagiarism_percentage || 0);
    const ai = Number(group.ai_percentage || 0);
    if (plagio > 15) penalty += Math.ceil((plagio - 15) / 5) * 0.25;
    if (ai > 15) penalty += Math.ceil((ai - 15) / 5) * 0.25;
    return penalty;
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
                  <tr key={group.id} onDoubleClick={() => isGroupFullyCompleted(group) && setSummaryGroup(group)} className={isGroupFullyCompleted(group) ? "cursor-pointer hover:bg-gray-50" : ""}>
                    <td style={{ maxWidth: '300px' }}>
                      <span className="badge badge-primary mb-2">{group.id} ({group.course})</span>
                      <div className="text-muted mb-2" style={{ fontSize: '0.75rem', fontWeight: 500, backgroundColor: '#f8fafc', padding: '6px', borderRadius: '4px', borderLeft: '2px solid #38bdf8' }}>
                        <div className="mb-1">Tutor: {group.tutor_name || 'N/A'}</div>
                        <div className="mb-1">Guía: {group.guia_name || 'N/A'}</div>
                        <div>Revisor: {group.revisor_name || 'N/A'}</div>
                      </div>
                      <div className="text-muted mt-2">
                        {group.students?.map(s => (
                          <div key={s.id} className="flex items-center justify-between gap-2 mb-1 p-1 hover:bg-gray-100 rounded" style={{fontSize: '0.85rem'}}>
                            {editingStudentId === s.id ? (
                              <div className="flex gap-1 w-full">
                                <input type="text" className="form-control p-1 text-sm h-8" value={editingStudentName} onChange={e => setEditingStudentName(e.target.value)} autoFocus />
                                <button className="btn btn-success p-1 h-8" onClick={() => handleUpdateStudent(s.id)}><CheckCircle size={14}/></button>
                                <button className="btn btn-secondary p-1 h-8" onClick={() => setEditingStudentId(null)}><X size={14}/></button>
                              </div>
                            ) : (
                              <>
                                <span>{s.full_name}</span>
                                <div className="flex gap-1">
                                  <button className="text-primary hover:text-blue-700" onClick={() => { setEditingStudentId(s.id); setEditingStudentName(s.full_name); }} title="Editar Nombre"><Edit2 size={14}/></button>
                                  <button className="text-danger hover:text-red-700" onClick={() => handleDeleteStudent(s.id, s.full_name)} title="Eliminar Estudiante"><Trash2 size={14}/></button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {addingToGroupId === group.id ? (
                          <div className="flex gap-1 mt-2">
                            <input type="text" className="form-control p-1 text-sm h-8" placeholder="Nombres Completos..." value={newStudentName} onChange={e => setNewStudentName(e.target.value)} autoFocus />
                            <button className="btn btn-success p-1 h-8" onClick={() => handleAddStudent(group.id)}><Plus size={14}/></button>
                            <button className="btn btn-secondary p-1 h-8" onClick={() => {setAddingToGroupId(null); setNewStudentName('');}}><X size={14}/></button>
                          </div>
                        ) : (
                          <button className="text-primary mt-2 text-sm flex items-center gap-1 hover:underline" onClick={() => setAddingToGroupId(group.id)}>
                            <Plus size={14}/> Agregar Estudiante
                          </button>
                        )}
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
                        {isGroupFullyCompleted(group) && (
                          <button className="btn btn-primary" style={{backgroundColor: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd'}} onClick={() => setSummaryGroup(group)}>
                            <Eye size={16} className="mr-1 inline"/> Ver Resumen
                          </button>
                        )}
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

      {/* Modal de Resumen */}
      {summaryGroup && createPortal(
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="surface p-6 overflow-y-auto max-h-[90vh]" style={{ width: '100%', maxWidth: '800px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="h2 text-primary">Resumen General: Grupo {summaryGroup.id}</h2>
              <button onClick={() => setSummaryGroup(null)} className="btn btn-secondary p-2"><X size={20}/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-primary">Promedio Proyecto Escrito</h3>
                <div className="space-y-2 text-sm">
                  {['tutor', 'guia', 'revisor'].map(role => {
                    const ev = summaryGroup.evaluations_written?.find(e => e.evaluator_role === role);
                    const avg = ev ? calculateWrittenAvg(ev) : '0.00';
                    const tName = summaryGroup[`${role}_name`] || 'N/A';
                    return <div key={role} className="flex justify-between border-b pb-1"><span>{role.charAt(0).toUpperCase() + role.slice(1)} ({tName}):</span> <strong>{avg} / 10.00</strong></div>;
                  })}
                </div>
                {(() => {
                  const penalty = calculatePenalty(summaryGroup);
                  const writtenAvgRaw = ['tutor', 'guia', 'revisor'].reduce((acc, role) => {
                    const ev = summaryGroup.evaluations_written?.find(e => e.evaluator_role === role);
                    return acc + Number(ev ? calculateWrittenAvg(ev) : 0);
                  }, 0) / 3;
                  const writtenAvgNum = Math.max(0, writtenAvgRaw - penalty);
                  return (
                    <>
                      {penalty > 0 && (
                        <div className="flex justify-between text-danger font-bold mt-2 text-sm border-t pt-2">
                          <span>Penalización (Plagio/IA > 15%):</span>
                          <span>-{penalty.toFixed(2)} pts</span>
                        </div>
                      )}
                      <div className="flex justify-between text-success font-bold mt-4 text-lg">
                        <span>General Escrito:</span> 
                        <span>{writtenAvgNum.toFixed(2)} / 10.00</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            <h3 className="font-bold text-lg mb-2 text-primary">Promedios Individuales (Oral + Práctico + Final)</h3>
            <div className="table-container">
              <table className="table mb-0">
                <thead>
                  <tr className="bg-gray-50">
                    <th>Estudiante</th>
                    <th>Oral (T / G / R)</th>
                    <th>P. Escrito</th>
                    <th>P. Oral</th>
                    <th>P. Práctico</th>
                    <th>Nota Final</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryGroup.students?.map(student => {
                    const oralEvs = student.evaluations_oral || [];
                    const getOralForRole = (role) => {
                      const o = oralEvs.find(e => e.evaluator_role === role);
                      if(!o) return 0;
                      return (Number(o.score_communication||0) + Number(o.score_knowledge||0) + Number(o.score_answers||0) + Number(o.score_time||0))/4;
                    };
                    const tO = getOralForRole('tutor');
                    const gO = getOralForRole('guia');
                    const rO = getOralForRole('revisor');
                    const avgOral = ((tO + gO + rO)/3);
                    
                    const pScores = student.evaluations_practical || [];
                    const pTotal = pScores.reduce((acc, p) => acc + Number(p.final_score || 0), 0);
                    const avgPractical = pScores.length ? pTotal / pScores.length : 0.0;

                    const penalty = calculatePenalty(summaryGroup);
                    const writtenAvgRaw = ['tutor', 'guia', 'revisor'].reduce((acc, role) => {
                        const ev = summaryGroup.evaluations_written?.find(e => e.evaluator_role === role);
                        return acc + Number(ev ? calculateWrittenAvg(ev) : 0);
                      }, 0) / 3;
                    const writtenAvgNum = Math.max(0, writtenAvgRaw - penalty);

                    const finalScore = ((writtenAvgNum + avgOral + avgPractical) / 3).toFixed(2);
                    
                    return (
                      <tr key={student.id}>
                        <td className="font-medium">{student.full_name}</td>
                        <td className="text-muted" style={{fontSize:'0.85rem'}}>
                          T: {tO.toFixed(2)} | G: {gO.toFixed(2)} | R: {rO.toFixed(2)}
                        </td>
                        <td className="font-bold">{writtenAvgNum.toFixed(2)}</td>
                        <td className="font-bold">{avgOral.toFixed(2)}</td>
                        <td className="font-bold text-primary">{avgPractical.toFixed(2)}</td>
                        <td className="text-success font-bold" style={{fontSize:'1.1em'}}>
                          {finalScore} / 10.00
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 text-right">
              <button className="btn btn-primary" onClick={() => setSummaryGroup(null)}>Cerrar Resumen</button>
            </div>
          </div>
        </div>
      , document.body)}

    </div>
  );
};

export default AdminDashboard;
