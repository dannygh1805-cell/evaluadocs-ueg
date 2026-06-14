import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const EvaluationPanel = () => {
  const { groupId } = useParams();
  const role = localStorage.getItem('userRole') || 'tutor';
  const [activeTab, setActiveTab] = useState('escrito');
  
  const [groupData, setGroupData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [writtenScores, setWrittenScores] = useState({
    score_intro: 0, score_diagnostic: 0, score_conceptual: 0, score_development: 0,
    score_results: 0, score_conclusions: 0, score_writing: 0, score_ai_ethics: 0, score_apa: 0,
    plagiarism_percentage: 0
  });

  const [oralScores, setOralScores] = useState({}); // { studentId: { communication:0, knowledge:0, answers:0, time:0 } }
  const [practicalScores, setPracticalScores] = useState({}); // { studentId: score }
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get Group
      const { data: gData } = await supabase.from('groups').select('*').eq('id', groupId).single();
      if (gData) setGroupData(gData);

      // Get Students
      const { data: sData } = await supabase.from('students').select('*').eq('group_id', groupId);
      if (sData) {
        setStudents(sData);
        // Initialize state objects
        const oScores = {};
        const pScores = {};
        sData.forEach(s => {
          oScores[s.id] = { score_communication: 0, score_knowledge: 0, score_answers: 0, score_time: 0 };
          pScores[s.id] = 0;
        });
        setOralScores(oScores);
        setPracticalScores(pScores);
      }

      // TODO: Fetch existing evaluations if any
      
      setLoading(false);
    };

    if (groupId) fetchData();
  }, [groupId]);

  const handleSave = async () => {
    if (!window.confirm("¿Está seguro que desea guardar estas calificaciones?")) return;

    try {
      if (activeTab === 'escrito') {
        await supabase.from('evaluations_written').upsert({
          group_id: groupId,
          evaluator_role: role,
          ...writtenScores,
          status: 'completed',
          updated_at: new Date()
        }, { onConflict: 'group_id, evaluator_role' });
      } else if (activeTab === 'oral') {
        const oralPromises = students.map(s => {
          return supabase.from('evaluations_oral').upsert({
            student_id: s.id,
            evaluator_role: role,
            ...oralScores[s.id],
            status: 'completed',
            updated_at: new Date()
          }, { onConflict: 'student_id, evaluator_role' });
        });
        await Promise.all(oralPromises);
      } else if (activeTab === 'practico' && role === 'tutor') {
        const practPromises = students.map(s => {
          return supabase.from('evaluations_practical').upsert({
            student_id: s.id,
            evaluator_role: 'tutor',
            final_score: practicalScores[s.id],
            status: 'completed',
            updated_at: new Date()
          }, { onConflict: 'student_id, evaluator_role' });
        });
        await Promise.all(practPromises);
      }
      
      alert("Calificaciones guardadas exitosamente en Supabase.");
    } catch (error) {
      alert("Error al guardar calificaciones: " + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando rúbrica...</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="h2 mb-2">Calificación de Proyecto: {groupData?.course}</h1>
        <p className="text-muted">Grupo: {groupId} | Su rol: <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{role}</span></p>
      </div>

      <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'escrito' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('escrito')}>Proyecto Escrito</button>
        <button className={`btn ${activeTab === 'oral' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('oral')}>Defensa Oral</button>
        {role === 'tutor' && (
          <button className={`btn ${activeTab === 'practico' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('practico')}>Proyecto Práctico</button>
        )}
      </div>

      <div className="surface mb-8">
        {activeTab === 'escrito' && (
          <div>
            <h2 className="h3 mb-4">Rúbrica: Proyecto Escrito</h2>
            <div className="mb-6 p-4" style={{ backgroundColor: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)' }}>
              <h3 className="h3 flex items-center gap-2 text-warning mb-2" style={{ fontSize: '1rem' }}><AlertTriangle size={18} /> Control de Plagio / IA</h3>
              <div className="flex items-center gap-4">
                <input type="number" min="0" max="100" className="form-control" style={{ width: '100px' }} 
                  value={writtenScores.plagiarism_percentage}
                  onChange={(e) => setWrittenScores({...writtenScores, plagiarism_percentage: e.target.value})} />
                <span>% de Similitud / IA</span>
              </div>
            </div>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio de Evaluación</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Introducción:</strong> Presenta el tema, problemática y relevancia.</td><td><input type="number" min="0" max="10" step="0.5" className="form-control" value={writtenScores.score_intro} onChange={e => setWrittenScores({...writtenScores, score_intro: e.target.value})} /></td></tr>
                  <tr><td><strong>Diagnóstico del Contexto:</strong> Analiza el entorno institucional.</td><td><input type="number" min="0" max="10" step="0.5" className="form-control" value={writtenScores.score_diagnostic} onChange={e => setWrittenScores({...writtenScores, score_diagnostic: e.target.value})} /></td></tr>
                  {/* Simplificado para la demostración, el docente ingresa sus puntos */}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'oral' && (
          <div>
            <h2 className="h3 mb-4">Rúbrica: Defensa Oral</h2>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Estudiante</th><th>Comunicación</th><th>Conocimiento</th><th>Respuestas</th><th>Tiempo</th></tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                      <td><input type="number" min="0" max="10" className="form-control" value={oralScores[s.id]?.score_communication || ''} onChange={e => setOralScores({...oralScores, [s.id]: {...oralScores[s.id], score_communication: e.target.value}})} /></td>
                      <td><input type="number" min="0" max="10" className="form-control" value={oralScores[s.id]?.score_knowledge || ''} onChange={e => setOralScores({...oralScores, [s.id]: {...oralScores[s.id], score_knowledge: e.target.value}})} /></td>
                      <td><input type="number" min="0" max="10" className="form-control" value={oralScores[s.id]?.score_answers || ''} onChange={e => setOralScores({...oralScores, [s.id]: {...oralScores[s.id], score_answers: e.target.value}})} /></td>
                      <td><input type="number" min="0" max="10" className="form-control" value={oralScores[s.id]?.score_time || ''} onChange={e => setOralScores({...oralScores, [s.id]: {...oralScores[s.id], score_time: e.target.value}})} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'practico' && role === 'tutor' && (
          <div>
            <h2 className="h3 mb-4">Calificación: Proyecto Práctico</h2>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Estudiante</th><th style={{ width: '200px' }}>Calificación Práctica</th></tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                      <td><input type="number" min="0" max="10" step="0.1" className="form-control" value={practicalScores[s.id] || ''} onChange={e => setPracticalScores({...practicalScores, [s.id]: e.target.value})} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <button className="btn btn-primary" onClick={handleSave}><Save size={18} /> Guardar Calificaciones</button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationPanel;
