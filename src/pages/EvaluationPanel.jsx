import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Save, AlertTriangle } from 'lucide-react';

const EvaluationPanel = ({ role }) => {
  const { groupId } = useParams();
  const [activeTab, setActiveTab] = useState('escrito'); // 'escrito', 'oral', 'practico'

  // Simulación de estudiantes
  const students = [
    { id: 's1', name: 'ABRIL CORDOVA CESAR JULIAN' },
    { id: 's2', name: 'AGUIZA CAIZA GUILMAR ALEXANDER' },
    { id: 's3', name: 'CAIZA CANDO DENIS JAIR' }
  ];

  // Estado del formulario
  const [plagiarismPercent, setPlagiarismPercent] = useState(0);

  const handleSave = () => {
    if (window.confirm("¿Está seguro que desea guardar y finalizar estas calificaciones?")) {
      alert("Calificaciones guardadas exitosamente.");
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="h2 mb-2">Calificación de Proyecto</h1>
        <p className="text-muted">Grupo: {groupId} | Su rol: <span style={{ textTransform: 'capitalize', fontWeight: 'bold' }}>{role}</span></p>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex gap-4 mb-6" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem' }}>
        <button 
          className={`btn ${activeTab === 'escrito' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('escrito')}
        >
          Proyecto Escrito (Grupal)
        </button>
        <button 
          className={`btn ${activeTab === 'oral' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('oral')}
        >
          Defensa Oral (Individual)
        </button>
        {role === 'tutor' && (
          <button 
            className={`btn ${activeTab === 'practico' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('practico')}
          >
            Proyecto Práctico (Individual)
          </button>
        )}
      </div>

      <div className="surface mb-8">
        {activeTab === 'escrito' && (
          <div>
            <h2 className="h3 mb-4">Rúbrica: Proyecto Escrito</h2>
            <div className="mb-6 p-4" style={{ backgroundColor: 'var(--color-warning-bg)', borderRadius: 'var(--radius-md)' }}>
              <h3 className="h3 flex items-center gap-2 text-warning mb-2" style={{ fontSize: '1rem' }}>
                <AlertTriangle size={18} /> Control de Plagio e Inteligencia Artificial
              </h3>
              <p className="text-muted mb-4" style={{ fontSize: '0.875rem' }}>
                Ingrese el porcentaje detectado por la herramienta anti-plagio. Si es mayor a 15%, se aplicará una penalización automática a la nota final del documento escrito.
              </p>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  className="form-control" 
                  style={{ width: '100px' }} 
                  value={plagiarismPercent}
                  onChange={(e) => setPlagiarismPercent(e.target.value)}
                />
                <span>% de Similitud / IA</span>
              </div>
            </div>

            {/* Simulación de Rúbrica */}
            <div className="table-container mb-6">
              <table className="table">
                <thead>
                  <tr>
                    <th>Criterio de Evaluación</th>
                    <th style={{ width: '150px' }}>Calificación (0-10)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Introducción:</strong> Presenta el tema, la problemática y la relevancia del estudio.</td>
                    <td><input type="number" min="0" max="10" step="0.5" className="form-control" placeholder="0-10" /></td>
                  </tr>
                  <tr>
                    <td><strong>Marco Conceptual:</strong> Define conceptos clave, teorías o normas relacionadas con el tema.</td>
                    <td><input type="number" min="0" max="10" step="0.5" className="form-control" placeholder="0-10" /></td>
                  </tr>
                  {/* Otros criterios irían aquí */}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'oral' && (
          <div>
            <h2 className="h3 mb-4">Rúbrica: Defensa Oral</h2>
            <p className="text-muted mb-4">Califique a cada estudiante de forma individual.</p>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Comunicación (0-10)</th>
                    <th>Conocimiento (0-10)</th>
                    <th>Respuestas (0-10)</th>
                    <th>Manejo Tiempo (0-10)</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 500 }}>{student.name}</td>
                      <td><input type="number" min="0" max="10" className="form-control" placeholder="0-10" /></td>
                      <td><input type="number" min="0" max="10" className="form-control" placeholder="0-10" /></td>
                      <td><input type="number" min="0" max="10" className="form-control" placeholder="0-10" /></td>
                      <td><input type="number" min="0" max="10" className="form-control" placeholder="0-10" /></td>
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
            <p className="text-muted mb-4">Calificación directa sobre la ejecución del proyecto práctico.</p>
            
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th style={{ width: '200px' }}>Calificación Práctica (0-10)</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(student => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: 500 }}>{student.name}</td>
                      <td><input type="number" min="0" max="10" step="0.1" className="form-control" placeholder="0-10" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        <div className="mt-8 flex justify-end">
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={18} /> Guardar Calificaciones
          </button>
        </div>
      </div>
    </div>
  );
};

export default EvaluationPanel;
