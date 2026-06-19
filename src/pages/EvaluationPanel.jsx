import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [teachersCount, setTeachersCount] = useState(0);
  const [view, setView] = useState('evaluation'); // 'evaluation' | 'summary'
  
  const [fillValue, setFillValue] = useState('');

  // 14 Parámetros del Proyecto Escrito
  const initialWrittenScores = {
    score_introduccion: '', score_antecedentes: '', score_definicion_problema: '', score_justificacion: '', score_objetivos: '',
    score_marco_conceptual: '', score_marco_metodologico: '', score_resultados: '', score_analisis: '',
    score_conclusiones: '', score_recomendaciones: '',
    score_referencias: '', score_anexos: '', score_formato: ''
  };
  const [writtenScores, setWrittenScores] = useState(() => {
    const saved = localStorage.getItem(`draft_w_${groupId}_${role}`);
    return saved ? JSON.parse(saved) : initialWrittenScores;
  });

  const [oralScores, setOralScores] = useState({}); // { studentId: { communication:0, knowledge:0, answers:0, time:0 } }
  
  // Estados para el contacto del docente
  const [teacherCellphone, setTeacherCellphone] = useState('');
  const [hasPhone, setHasPhone] = useState(true); // Inicializado en true para no parpadear antes de cargar
  const [phoneInput, setPhoneInput] = useState('');
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Get Group
      const { data: gData } = await supabase.from('groups').select('*').eq('id', groupId).single();
      if (gData) {
        setGroupData(gData);

        // Determinar el nombre real del docente según su rol actual
        let teacherName = '';
        if (role === 'tutor') teacherName = gData.tutor_name;
        else if (role === 'guia') teacherName = gData.guia_name;
        else if (role === 'revisor') teacherName = gData.revisor_name;

        if (teacherName) {
          // Obtener el registro actual
          const { data: currentReg } = await supabase.from('teachers_registry')
            .select('*')
            .eq('group_id', groupId)
            .eq('role', role)
            .maybeSingle();

          const currentPhone = currentReg?.cellphone;
          const currentFullName = currentReg?.full_name;

          // Si el nombre en el registro es genérico, actualizarlo con el real
          if (currentReg && (!currentFullName || currentFullName.startsWith('Docente '))) {
            await supabase.from('teachers_registry')
              .update({ full_name: teacherName })
              .eq('id', currentReg.id);
          }

          if (!currentPhone || currentPhone === 'N/A' || currentPhone.trim() === '') {
            // Buscar si ya ingresó su teléfono en algún grupo previo
            const { data: existingRegs } = await supabase.from('teachers_registry')
              .select('cellphone')
              .eq('full_name', teacherName)
              .neq('cellphone', 'N/A')
              .neq('cellphone', '')
              .not('cellphone', 'is', null)
              .order('created_at', { ascending: false });

            if (existingRegs && existingRegs.length > 0) {
              const autofilledPhone = existingRegs[0].cellphone;
              // Auto-llenar en la base de datos
              await supabase.from('teachers_registry')
                .update({ cellphone: autofilledPhone, full_name: teacherName })
                .eq('group_id', groupId)
                .eq('role', role);
              
              setTeacherCellphone(autofilledPhone);
              setHasPhone(true);
            } else {
              setTeacherCellphone('');
              setHasPhone(false);
            }
          } else {
            setTeacherCellphone(currentPhone);
            setHasPhone(true);
          }
        }
      }

      // Get Students
      const { data: sData } = await supabase.from('students').select('*, evaluations_practical(*)').eq('group_id', groupId);
      if (sData) {
        setStudents(sData);
        // Initialize oral scores with draft recovery
        const savedO = localStorage.getItem(`draft_o_${groupId}_${role}`);
        if (savedO) {
          setOralScores(JSON.parse(savedO));
        } else {
          const oScores = {};
          sData.forEach(s => {
            oScores[s.id] = { score_communication: '', score_knowledge: '', score_answers: '', score_time: '' };
          });
          setOralScores(oScores);
        }
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

      // Check teachers initially
      const { count } = await supabase.from('teachers_registry')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);
      setTeachersCount(count || 0);

      setLoading(false);
    };

    if (groupId) {
      fetchData();
      
      const interval = setInterval(async () => {
        const { count } = await supabase.from('teachers_registry')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId);
        setTeachersCount(count || 0);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [groupId, role]);

  // Autoguardado en local storage cada vez que cambia
  useEffect(() => {
    localStorage.setItem(`draft_w_${groupId}_${role}`, JSON.stringify(writtenScores));
  }, [writtenScores, groupId, role]);

  useEffect(() => {
    localStorage.setItem(`draft_o_${groupId}_${role}`, JSON.stringify(oralScores));
  }, [oralScores, groupId, role]);

  const handleScoreChange = (setter, currentObj, field, val) => {
    let numStr = val;
    if (numStr !== '') {
      if (Number(numStr) > 10) numStr = '10';
      if (Number(numStr) < 0) numStr = '0';
    }
    setter({ ...currentObj, [field]: numStr });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
      const index = inputs.indexOf(e.target);
      if (index > -1 && index < inputs.length - 1) inputs[index + 1].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
      const index = inputs.indexOf(e.target);
      if (index > 0) inputs[index - 1].focus();
    }
  };

  const fillEmptyScores = () => {
    if (fillValue === '' || Number(fillValue) < 0 || Number(fillValue) > 10) {
      alert("Por favor ingrese una nota válida (0-10) en la casilla de Autorelleno.");
      return;
    }
    
    if (activeTab === 'escrito') {
      const newScores = { ...writtenScores };
      Object.keys(newScores).forEach(k => {
        if (newScores[k] === '') newScores[k] = fillValue;
      });
      setWrittenScores(newScores);
    } else {
      const newOral = { ...oralScores };
      students.forEach(s => {
        if (!newOral[s.id]) newOral[s.id] = { score_communication: '', score_knowledge: '', score_answers: '', score_time: '' };
        ['score_communication', 'score_knowledge', 'score_answers', 'score_time'].forEach(k => {
          if (newOral[s.id][k] === '') newOral[s.id][k] = fillValue;
        });
      });
      setOralScores(newOral);
    }
  };

  const validateForm = () => {
    // 1. Validar parámetros escritos
    const wValues = Object.values(writtenScores);
    if (wValues.some(v => v === '' || v === null || Number(v) < 0 || Number(v) > 10)) {
      alert("⚠️ Acción denegada: Debe calificar TODOS los 14 parámetros del Proyecto Escrito con valores entre 0 y 10 antes de enviar.");
      return false;
    }

    // 2. Validar parámetros orales
    for (const student of students) {
      const oScore = oralScores[student.id];
      if (!oScore) {
        alert(`⚠️ Acción denegada: Falta evaluar la Defensa Oral de ${student.full_name}.`);
        return false;
      }
      const oVals = [oScore.score_communication, oScore.score_knowledge, oScore.score_answers, oScore.score_time];
      if (oVals.some(v => v === '' || v === null || Number(v) < 0 || Number(v) > 10)) {
        alert(`⚠️ Acción denegada: Debe completar todas las calificaciones de Defensa Oral para ${student.full_name} con valores entre 0 y 10.`);
        return false;
      }
    }
    return true;
  };

  const handleSaveInit = async () => {
    if (!validateForm()) return;
    finalizeSave();
  };

  const finalizeSave = async () => {
    if (!window.confirm("¿Está seguro que desea FINALIZAR y enviar estas calificaciones? No podrá modificarlas después.")) return;

    try {
      await supabase.from('evaluations_written').upsert({
        group_id: groupId,
        evaluator_role: role,
        ...writtenScores,
        status: 'completed',
        updated_at: new Date()
      }, { onConflict: 'group_id, evaluator_role' });

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
      
      setView('summary');
    } catch (error) {
      alert("Error al enviar calificaciones: " + error.message);
    }
  };

  const handleSavePhone = async (e) => {
    e.preventDefault();
    if (!phoneInput.trim() || phoneInput.trim().length < 9) {
      alert("Por favor ingrese un número de teléfono válido (mínimo 9 dígitos).");
      return;
    }

    setIsSavingPhone(true);
    try {
      let teacherName = '';
      if (role === 'tutor') teacherName = groupData?.tutor_name;
      else if (role === 'guia') teacherName = groupData?.guia_name;
      else if (role === 'revisor') teacherName = groupData?.revisor_name;

      const { error } = await supabase.from('teachers_registry')
        .update({ cellphone: phoneInput.trim(), full_name: teacherName || `Docente ${role}` })
        .eq('group_id', groupId)
        .eq('role', role);

      if (error) {
        alert("Error al registrar teléfono: " + error.message);
      } else {
        setTeacherCellphone(phoneInput.trim());
        setHasPhone(true);
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setIsSavingPhone(false);
    }
  };

  const calculateWrittenTotal = () => {
    const scores = Object.values(writtenScores).map(Number);
    const sum = scores.reduce((a, b) => a + b, 0);
    return (sum / 14).toFixed(2);
  };

  const handleFinish = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('groupId');
    // Limpiar borradores al terminar
    localStorage.removeItem(`draft_w_${groupId}_${role}`);
    localStorage.removeItem(`draft_o_${groupId}_${role}`);
    window.dispatchEvent(new Event('authChange'));
    window.location.hash = '#/login';
  };

  if (loading) return <div className="p-8 text-center">Cargando rúbrica para el grupo {groupId}...</div>;

  if (!hasPhone) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="surface p-8 text-center" style={{ maxWidth: '500px', width: '100%' }}>
          <h2 className="h2 text-primary mb-4">Registro de Contacto</h2>
          <p className="text-muted mb-6">
            Estimado docente, para poder firmar y registrar sus calificaciones en el informe final, por favor ingrese su número celular de contacto. <strong>Solo se le solicitará esta única vez.</strong>
          </p>
          <form onSubmit={handleSavePhone} className="space-y-4 text-left">
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label font-semibold">Número de Celular</label>
              <input
                type="text"
                required
                placeholder="Ej: 0987654321"
                className="form-control text-lg text-center"
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                style={{ letterSpacing: '0.05em' }}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary w-full py-3 text-md font-bold" disabled={isSavingPhone}>
              {isSavingPhone ? 'Guardando...' : 'Confirmar y Registrarse'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (teachersCount < 3) {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="surface text-center p-8" style={{ maxWidth: '500px', width: '100%' }}>
          <h2 className="h2 text-primary mb-4">Sala de Espera</h2>
          <p className="text-muted mb-6">
            La evaluación es en conjunto. Esperando a que el resto del tribunal ingrese al sistema...
          </p>
          <div className="badge badge-warning mb-4 flex justify-center" style={{ fontSize: '1.2rem', padding: '1rem', width: '100%' }}>
            Docentes Listos: {teachersCount} / 3
          </div>
          <div className="spinner mt-4" style={{ margin: '0 auto', border: '4px solid var(--border-light)', borderTop: '4px solid var(--primary-color)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (view === 'summary') {
    return (
      <div className="animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="surface text-center p-8" style={{ maxWidth: '600px', width: '100%' }}>
          <div className="flex justify-center mb-4 text-success">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 className="h2 text-primary mb-2">¡Evaluación Enviada con Éxito!</h2>
          <p className="text-muted mb-6">Tus calificaciones para el Grupo {groupId} han sido registradas en el sistema.</p>
          
          <div className="surface bg-gray-50 mb-8 p-6 text-left" style={{ border: '1px solid var(--border-light)', borderRadius: '8px' }}>
            <h3 className="h4 mb-4 text-primary">Resumen de tu Evaluación</h3>
            <div className="flex justify-between items-center mb-2" style={{ fontSize: '1.1rem' }}>
              <span className="text-muted">Promedio Proyecto Escrito:</span>
              <strong>{calculateWrittenTotal()} / 10.00</strong>
            </div>
            <div className="text-muted" style={{ fontSize: '0.9rem' }}>
              (Suma de 14 parámetros ponderada)
            </div>
            
            <hr style={{ margin: '1rem 0', borderColor: 'var(--border-light)' }} />
            
            <h4 className="font-medium mb-2 text-muted">Defensa Oral (Promedios Individuales):</h4>
            {students.map(s => {
              const oScore = oralScores[s.id] || {};
              const sum = (Number(oScore.score_communication || 0) + Number(oScore.score_knowledge || 0) + Number(oScore.score_answers || 0) + Number(oScore.score_time || 0));
              const avg = (sum / 4).toFixed(2);
              return (
                <div key={s.id} className="flex justify-between items-center mb-1 text-sm">
                  <span>{s.full_name}</span>
                  <strong>{avg} / 10.00</strong>
                </div>
              );
            })}
          </div>

          <button className="btn btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }} onClick={handleFinish}>
            Aceptar y Salir
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in relative">

      <div className="mb-8 surface" style={{ borderLeft: '4px solid var(--primary-color)' }}>
        <h1 className="h2 mb-1">Evaluación del Grupo: <span className="text-primary">{groupId}</span></h1>
        <p className="text-muted mb-2">Tema: <strong>{groupData?.theme || 'No asignado'}</strong></p>
        <p className="text-muted text-sm mb-3">
          Tutor: {groupData?.tutor_name || 'N/A'} | Guía: {groupData?.guia_name || 'N/A'} | Revisor: {groupData?.revisor_name || 'N/A'}
        </p>
        <div className="flex gap-4 mt-2">
          <span className="badge badge-warning"><AlertTriangle size={14}/> Plagio Detectado: {groupData?.plagiarism_percentage}%</span>
          <span className="badge badge-warning"><AlertTriangle size={14}/> IA Detectada: {groupData?.ai_percentage}%</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mb-6 justify-between items-center" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
        <div className="flex gap-4">
          <button className={`btn ${activeTab === 'escrito' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('escrito')}><FileText size={18}/> Rúbrica Proyecto Escrito</button>
          <button className={`btn ${activeTab === 'oral' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab('oral')}><FileText size={18}/> Rúbrica Defensa Oral</button>
        </div>
        
        {/* Autorelleno */}
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
          <span className="text-sm font-medium text-gray-700">Autorellenar vacíos:</span>
          <input 
            type="number" 
            min="0" max="10" step="0.1" 
            className="form-control" 
            style={{ width: '80px', padding: '0.25rem 0.5rem' }}
            placeholder="Nota"
            value={fillValue}
            onChange={e => {
              let val = e.target.value;
              if (val !== '' && Number(val) > 10) val = '10';
              setFillValue(val);
            }}
          />
          <button className="btn btn-secondary text-sm" style={{ padding: '0.3rem 0.8rem' }} onClick={fillEmptyScores}>
            Aplicar
          </button>
        </div>
      </div>

      <div className="surface mb-8">
        {activeTab === 'escrito' && (
          <div>
            <h2 className="h3 mb-4 text-primary">Primera Parte: Diseño de la Investigación</h2>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Introducción:</strong> Presenta el tema, problemática y relevancia.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_introduccion} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_introduccion', e.target.value)} /></td></tr>
                  <tr><td><strong>Antecedentes:</strong> Contexto histórico y teórico del problema.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_antecedentes} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_antecedentes', e.target.value)} /></td></tr>
                  <tr><td><strong>Definición del Problema:</strong> Planteamiento claro y preciso.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_definicion_problema} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_definicion_problema', e.target.value)} /></td></tr>
                  <tr><td><strong>Justificación:</strong> Razones que motivan la investigación.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_justificacion} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_justificacion', e.target.value)} /></td></tr>
                  <tr><td><strong>Objetivos:</strong> Objetivo General y específicos alcanzables.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_objetivos} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_objetivos', e.target.value)} /></td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="h3 mb-4 text-primary">Segunda Parte: Desarrollo</h2>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Marco Conceptual:</strong> Conceptos fundamentales y su relación.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_marco_conceptual} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_marco_conceptual', e.target.value)} /></td></tr>
                  <tr><td><strong>Marco Metodológico:</strong> Tipo de investigación, población y técnica.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_marco_metodologico} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_marco_metodologico', e.target.value)} /></td></tr>
                  <tr><td><strong>Resultados:</strong> Exposición clara de los hallazgos.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_resultados} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_resultados', e.target.value)} /></td></tr>
                  <tr><td><strong>Análisis de Resultados:</strong> Interpretación y contrastación lógica.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_analisis} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_analisis', e.target.value)} /></td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="h3 mb-4 text-primary">Tercera Parte: Conclusiones</h2>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Conclusiones:</strong> Resumen de hallazgos principales en base a objetivos.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_conclusiones} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_conclusiones', e.target.value)} /></td></tr>
                  <tr><td><strong>Recomendaciones:</strong> Sugerencias prácticas y aplicables.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_recomendaciones} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_recomendaciones', e.target.value)} /></td></tr>
                </tbody>
              </table>
            </div>

            <h2 className="h3 mb-4 text-primary">Cuarta Parte: Referencias y Anexos</h2>
            <div className="table-container mb-6">
              <table className="table">
                <thead><tr><th>Criterio</th><th style={{ width: '150px' }}>Calificación (0-10)</th></tr></thead>
                <tbody>
                  <tr><td><strong>Referencias:</strong> Formato APA 7ma Edición.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_referencias} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_referencias', e.target.value)} /></td></tr>
                  <tr><td><strong>Anexos:</strong> Evidencias, fotos, herramientas aplicadas.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_anexos} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_anexos', e.target.value)} /></td></tr>
                  <tr><td><strong>Formato General:</strong> Márgenes, interlineado, numeración, redacción.</td><td><input type="number" min="0" max="10" step="0.1" className="form-control" value={writtenScores.score_formato} onKeyDown={handleKeyDown} onChange={e => handleScoreChange(setWrittenScores, writtenScores, 'score_formato', e.target.value)} /></td></tr>
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
                      <td style={{ minWidth: '220px' }}>
                        <div style={{ fontWeight: 500 }}>{s.full_name}</div>
                        <div className="text-muted" style={{fontSize: '0.75rem', marginTop: '4px'}}>
                          Práctico: <span className="font-bold text-primary">{s.evaluations_practical && s.evaluations_practical.length > 0 ? s.evaluations_practical[0].final_score + ' / 10' : 'Pendiente de Admin'}</span>
                        </div>
                      </td>
                      {['score_communication', 'score_knowledge', 'score_answers', 'score_time'].map(key => (
                        <td key={key}>
                          <input 
                            type="number" 
                            min="0" max="10" step="0.1" 
                            className="form-control" 
                            value={oralScores[s.id]?.[key] || ''} 
                            onKeyDown={handleKeyDown}
                            onChange={(e) => {
                              const currentObj = oralScores[s.id] || {};
                              let numStr = e.target.value;
                              if (numStr !== '') {
                                if (Number(numStr) > 10) numStr = '10';
                                if (Number(numStr) < 0) numStr = '0';
                              }
                              setOralScores({...oralScores, [s.id]: {...currentObj, [key]: numStr}});
                            }} 
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <button className="btn btn-success" onClick={handleSaveInit} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
            <Save size={20} className="mr-2" /> Finalizar y Enviar Evaluación
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationPanel;
