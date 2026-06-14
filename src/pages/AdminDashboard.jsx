import React, { useState } from 'react';
import { Users, FileText, CheckCircle, Clock, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateReport } from '../utils/pdfGenerator';

const AdminDashboard = () => {
  const navigate = useNavigate();
  // Datos simulados (mock)
  const [groups, setGroups] = useState([
    {
      id: 'g1',
      theme: 'Implementación de un sistema de videovigilancia...',
      course: '3 BGU A',
      students: ['ABRIL CORDOVA CESAR JULIAN', 'AGUIZA CAIZA GUILMAR ALEXANDER', 'CAIZA CANDO DENIS JAIR'],
      tutor: 'Msc. Viviana Bassante',
      guia: 'Msc. Ligia Villacrés',
      revisor: 'Msc. Sandra Salazar',
      status: 'pending', // 'pending' | 'completed'
    },
    {
      id: 'g2',
      theme: 'Análisis del impacto ambiental en el entorno educativo...',
      course: '3 BGU B',
      students: ['GOMEZ LOPEZ ANA', 'RUIZ MARTINEZ LUIS'],
      tutor: 'Msc. Carlos Ruiz',
      guia: 'Msc. Ligia Villacrés',
      revisor: 'Msc. Sandra Salazar',
      status: 'completed',
    }
  ]);

  const [penaltyConfig, setPenaltyConfig] = useState(0.5); // 0.5 puntos por % extra de plagio

  const handleGeneratePDF = (group) => {
    generateReport(group, {}); // Pasar group y simulador de evaluationData
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="h1 mb-0">Panel de Administrador</h1>
          <p className="text-muted">Gestión de grupos, rúbricas y generación de informes</p>
        </div>
        <button className="btn btn-primary">
          <Settings size={18} /> Configurar Penalización
        </button>
      </div>

      <div className="surface mb-8">
        <h2 className="h3 flex items-center gap-2">
          <Users size={20} className="text-primary" />
          Grupos Asignados
        </h2>
        
        <div className="table-container mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Tema del Proyecto</th>
                <th>Curso</th>
                <th>Docentes Asignados</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{group.theme.substring(0, 50)}...</div>
                    <div className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {group.students.length} estudiantes
                    </div>
                  </td>
                  <td>{group.course}</td>
                  <td style={{ fontSize: '0.8rem' }}>
                    <div><strong className="text-primary">T:</strong> {group.tutor}</div>
                    <div><strong className="text-primary">G:</strong> {group.guia}</div>
                    <div><strong className="text-primary">R:</strong> {group.revisor}</div>
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
                    <div className="flex gap-2">
                      <button 
                        className="btn btn-secondary btn-icon" 
                        title="Simular Calificación (Ir como docente)"
                        onClick={() => navigate(`/evaluate/${group.id}`)}
                      >
                        <FileText size={18} />
                      </button>
                      <button 
                        className="btn btn-primary" 
                        disabled={group.status !== 'completed'}
                        onClick={() => handleGeneratePDF(group)}
                      >
                        Generar Informe
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
