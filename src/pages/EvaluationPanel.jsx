import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Save, AlertTriangle, FileText } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

const EvaluationPanel = () => {
  const { groupId } = useParams();
  const role = localStorage.getItem('userRole') || 'tutor';
  const [activeTab, setActiveTab] = useState('escrito');
  
  const [groupData, setGroupData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // 14 Parámetros del Proyecto Escrito
  const initialWrittenScores = {
    score_introduccion: 0, score_antecedentes: 0, score_definicion_problema: 0, score_justificacion: 0, score_objetivos: 0,
    score_marco_conceptual: 0, score_marco_metodologico: 0, score_resultados: 0, score_analisis: 0,
    score_conclusiones: 0, score_recomendaciones: 0,
    score_referencias: 0, score_anexos: 0, score_formato: 0
  };
  const [writtenScores, setWrittenScores] = useState(initialWrittenScores);

  const [oralScores, setOralScores] = useState({}); // { studentId: { communication:0, knowledge:0, answers:0, time:0 } }
  
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
        // Initialize oral scores
        const oScores = {};
        sData.forEach(s => {
          oScores[s.id] = { score_communication: 0, score_knowledge: 0, score_answers: 0, score_time: 0 };
        });
        setOralScores(oScores);
      }

      // Obtener la evaluación existente del docente si ya había guardado algo
      const { data: wData } = await supabase.from('evaluations_written')
        .select('*').eq('group_id', groupId).eq('evaluator_role', role).single();
      if (wData) {
        setWrittenScores({
          score_introduccion: wData.score_introduccion, score_antecedentes: wData.score_antecedentes, score_definicion_problema: wData.score_definicion_problema, score_justificacion: wData.score_justificacion, score_objetivos: wData.score_objetivos,
          score_marco_conceptual: wData.score_marco_conceptual, score_marco_metodologico: wData.score_marco_metodologico, score_resultados: wData.score_resultados, score_analisis: wData.score_analisis,
          score_conclusiones: wData.score_conclusiones, score_recomendaciones: wData.score_recomendaciones,
          score_referencias: wData.score_referencias, score_anexos: wData.score_anexos, score_formato: wData.score_formato
        });
      }

      setLoading(false);
    };

    if (groupId) fetchData();
  }, [groupId, role]);

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
        alert("Rúbrica escrita guardada exitosamente.");
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
        alert("Rúbrica de defensa oral guardada exitosamente.");
      }
    } catch (error) {
      alert("Error al guardar calificaciones: " + error.message);
    }
  };

  if (loading) return <div className="p-8 text-center">Cargando rúbrica para el grupo {groupId}...</div>;

  return (
    <div className="animate-fade-in">
      <div className="mb-8 surface" style={{ borderLeft: '4px solid var(--primary-color)' }}>
        <h1 className="h2 mb-2">Evaluación del Grupo: <span className="text-primary">{groupId}</span></h1>
        <p className="text-muted mb-2">Tema: <strong>{groupData?.theme || 'No asignado'}</strong></p>
        <div className="flex gap-4 mt-2">
          <span className="badge badge-warning"><AlertTriangle size={14}/> Plagio Detectado: {groupData?.plagiarism_percentage}%</span>
          <span className="badge badge-warning"><AlertTriangle size={14}/> IA Detectada: {groupData?.ai_percentage}%</span>
        </div>
      </div>

      <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
        <button className={`btn ${activeTab === 'escrito' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('escrito')}><FileText size={18}/> Rúbrica Proyecto Escrito</button>
        <button className={`btn ${activeTab === 'oral' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('oral')}><FileText size={18}/> Rúbrica Defensa Oral</button>
      </div>

      <div className="surface mb-8">
        {activeTab === 'escrito' && (
          <div>
            <h2 className="h3 mb-4 text-primary">Primera Parte: Diseño de la Investigación</h2>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Introducción:</strong> Presenta el tema, problemática y relevancia.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_introduccion} onChange={e => setWrittenScores({...writtenScores, score_introduccion: e.target.value})} /></td></tr>
                  <tr><td><strong>Antecedentes:</strong> Contexto histórico y teórico del problema.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_antecedentes} onChange={e => setWrittenScores({...writtenScores, score_antecedentes: e.target.value})} /></td></tr>
                  <tr><td><strong>Definición del Problema:</strong> Planteamiento claro y preciso.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_definicion_problema} onChange={e => setWrittenScores({...writtenScores, score_definicion_problema: e.target.value})} /></td></tr>
                  <tr><td><strong>Justificación:</strong> Razones que motivan la investigación.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_justificacion} onChange={e => setWrittenScores({...writtenScores, score_justificacion: e.target.value})} /></td></tr>
                  <tr><td><strong>Objetivos:</strong> Objetivo General y específicos alcanzables.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_objetivos} onChange={e => setWrittenScores({...writtenScores, score_objetivos: e.target.value})} /></td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="h3 mb-4 text-primary">Segunda Parte: Desarrollo</h2>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Marco Conceptual:</strong> Conceptos fundamentales y su relación.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_marco_conceptual} onChange={e => setWrittenScores({...writtenScores, score_marco_conceptual: e.target.value})} /></td></tr>
                  <tr><td><strong>Marco Metodológico:</strong> Tipo de investigación, población y técnica.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_marco_metodologico} onChange={e => setWrittenScores({...writtenScores, score_marco_metodologico: e.target.value})} /></td></tr>
                  <tr><td><strong>Resultados:</strong> Exposición clara de los hallazgos.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_resultados} onChange={e => setWrittenScores({...writtenScores, score_resultados: e.target.value})} /></td></tr>
                  <tr><td><strong>Análisis de Resultados:</strong> Interpretación y contrastación lógica.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_analisis} onChange={e => setWrittenScores({...writtenScores, score_analisis: e.target.value})} /></td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="h3 mb-4 text-primary">Tercera Parte: Conclusiones</h2>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Conclusiones:</strong> Resumen de hallazgos principales en base a objetivos.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_conclusiones} onChange={e => setWrittenScores({...writtenScores, score_conclusiones: e.target.value})} /></td></tr>
                  <tr><td><strong>Recomendaciones:</strong> Sugerencias prácticas y aplicables.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_recomendaciones} onChange={e => setWrittenScores({...writtenScores, score_recomendaciones: e.target.value})} /></td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="h3 mb-4 text-primary">Cuarta Parte: Referencias y Anexos</h2>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Referencias:</strong> Formato APA 7ma Edición.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_referencias} onChange={e => setWrittenScores({...writtenScores, score_referencias: e.target.value})} /></td></tr>
                  <tr><td><strong>Anexos:</strong> Evidencias, fotos, herramientas aplicadas.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_anexos} onChange={e => setWrittenScores({...writtenScores, score_anexos: e.target.value})} /></td></tr>
                  <tr><td><strong>Formato General:</strong> Márgenes, interlineado, numeración, redacción.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_formato} onChange={e => setWrittenScores({...writtenScores, score_formato: e.target.value})} /></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'oral' && (
          <div>
            <h2 className="h3 mb-4 text-primary">Rúbrica: Defensa Oral (Individual)</h2>
            <p className="text-muted mb-4">Califique el desempeño individual de cada estudiante durante la defensa.</p>
            <div className="table-container">
              <table className="table">
                <thead><tr><th>Estudiante</th><th>Comunicación (0-10)</th><th>Conocimiento (0-10)</th><th>Respuestas (0-10)</th><th>Tiempo (0-10)</th></tr></thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                      <td><input type="number" min="0" max="10" step="0.1" className="form-control" value={oralScores[s.id]?.score_communication || ''} onChange={e => setOralScores({...oralScores, [s.id]: {...oralScores[s.id], score_communication: e.target.value}})} /></td>
                      <td><input type="number" min="0" max="10" step="0.1" className="form-control" value={oralScores[s.id]?.score_knowledge || ''} onChange={e => setOralScores({...oralScores, [s.id]: {...oralScores[s.id], score_knowledge: e.target.value}})} /></td>
                      <td><input type="number" min="0" max="10" step="0.1" className="form-control" value={oralScores[s.id]?.score_answers || ''} onChange={e => setOralScores({...oralScores, [s.id]: {...oralScores[s.id], score_answers: e.target.value}})} /></td>
                      <td><input type="number" min="0" max="10" step="0.1" className="form-control" value={oralScores[s.id]?.score_time || ''} onChange={e => setOralScores({...oralScores, [s.id]: {...oralScores[s.id], score_time: e.target.value}})} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <button className="btn btn-success" onClick={handleSave} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
            <Save size={20} className="mr-2" /> Guardar Calificaciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationPanel;
