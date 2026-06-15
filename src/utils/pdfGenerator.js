import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReport = (groupData, evaluationData) => {
  const doc = new jsPDF();
  
  // Colores y Fuentes
  const primaryColor = [37, 99, 235]; // Azul similar al UI
  const secondaryColor = [241, 245, 249]; // Gris claro

  // Título Institucional
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.text('Unidad Educativa Guayaquil', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Informe de Calificación de Estudio de Caso', 105, 28, { align: 'center' });
  
  // Datos Informativos Básicos
  autoTable(doc, {
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    body: [
      ['Fecha de informe', new Date().toLocaleDateString(), 'Nº De Informe', `18D02-UEG-2024-2025-${Math.floor(Math.random()*1000)}`],
      ['Tema', { content: groupData.theme || 'N/A', colSpan: 3 }],
      ['Curso', { content: groupData.course || 'N/A', colSpan: 3 }]
    ]
  });

  const getTeacherName = (role) => {
    const t = groupData.teachers_registry?.find(t => t.role === role);
    return (t && t.full_name) ? String(t.full_name) : `Docente ${role}`;
  };

  let currentY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 10 : 55;

  // Comisión Calificadora
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['Cargo', 'Nombre']],
    headStyles: { fillColor: secondaryColor, textColor: 0 },
    body: [
      ['Docente Tutor', getTeacherName('tutor')],
      ['Docente Guía', getTeacherName('guia')],
      ['Docente Revisor', getTeacherName('revisor')],
    ]
  });

  currentY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 15 : currentY + 30;

  // Resultados por Estudiante
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTADO DE EVALUACIÓN PROYECTO DE GRADO', 14, currentY);
  
  const studentResultsBody = groupData.students.map((student, index) => {
    // Promedio Escrito
    const evW = groupData.evaluations_written || [];
    let sumW = 0;
    evW.forEach(e => {
       const sumFields = Number(e.score_introduccion || 0) + Number(e.score_antecedentes || 0) + Number(e.score_definicion_problema || 0) + Number(e.score_justificacion || 0) + Number(e.score_objetivos || 0) + Number(e.score_marco_conceptual || 0) + Number(e.score_marco_metodologico || 0) + Number(e.score_resultados || 0) + Number(e.score_analisis || 0) + Number(e.score_conclusiones || 0) + Number(e.score_recomendaciones || 0) + Number(e.score_referencias || 0) + Number(e.score_anexos || 0) + Number(e.score_formato || 0);
       sumW += (sumFields / 14);
    });
    const avgWritten = evW.length ? (sumW / evW.length) : 0;

    // Promedio Oral
    const evO = student.evaluations_oral || [];
    let sumO = 0;
    evO.forEach(e => {
       const sumFields = Number(e.score_communication || 0) + Number(e.score_knowledge || 0) + Number(e.score_answers || 0) + Number(e.score_time || 0);
       sumO += (sumFields / 4);
    });
    const avgOral = evO.length ? (sumO / evO.length) : 0;

    const notaFinal = ((avgWritten + avgOral) / 2).toFixed(2);

    return [`Estudiante ${index + 1}`, student.full_name || 'N/A', avgWritten.toFixed(2), avgOral.toFixed(2), notaFinal];
  });

  currentY = currentY + 5;
  autoTable(doc, {
    startY: currentY,
    theme: 'grid',
    head: [['', 'Nombre del Estudiante', 'P. Escrito', 'P. Oral', 'Nota Final']],
    headStyles: { fillColor: primaryColor, textColor: 255 },
    body: studentResultsBody
  });

  // Área para firmas físicas
  const signatureY = (doc.lastAutoTable && doc.lastAutoTable.finalY) ? doc.lastAutoTable.finalY + 30 : currentY + 50;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Líneas de firma
  doc.line(20, signatureY, 80, signatureY);
  doc.text(getTeacherName('tutor'), 50, signatureY + 5, { align: 'center' });
  doc.text('Docente Tutor', 50, signatureY + 10, { align: 'center' });

  doc.line(130, signatureY, 190, signatureY);
  doc.text(getTeacherName('guia'), 160, signatureY + 5, { align: 'center' });
  doc.text('Docente Guía', 160, signatureY + 10, { align: 'center' });

  const signatureY2 = signatureY + 40;
  doc.line(75, signatureY2, 135, signatureY2);
  doc.text(getTeacherName('revisor'), 105, signatureY2 + 5, { align: 'center' });
  doc.text('Docente Revisor', 105, signatureY2 + 10, { align: 'center' });

  // Guardar PDF
  doc.save(`INFORME_${groupData.id}_UEG.pdf`);
};
