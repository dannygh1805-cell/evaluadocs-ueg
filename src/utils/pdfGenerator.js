import jsPDF from 'jspdf';
import 'jspdf-autotable';

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
  doc.autoTable({
    startY: 35,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    body: [
      ['Fecha de informe', new Date().toLocaleDateString(), 'Nº De Informe', `18D02-UEG-2024-2025-${Math.floor(Math.random()*1000)}`],
      ['Tema', { content: groupData.theme, colSpan: 3 }],
      ['Curso', { content: groupData.course, colSpan: 3 }]
    ]
  });

  // Comisión Calificadora
  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    theme: 'grid',
    head: [['Cargo', 'Nombre']],
    headStyles: { fillColor: secondaryColor, textColor: 0 },
    body: [
      ['Docente Tutor', groupData.tutor],
      ['Docente Guía', groupData.guia],
      ['Docente Revisor', groupData.revisor],
    ]
  });

  // Resultados por Estudiante
  doc.setFont('helvetica', 'bold');
  doc.text('RESULTADO DE EVALUACIÓN PROYECTO DE GRADO', 14, doc.lastAutoTable.finalY + 15);
  
  const studentResultsBody = groupData.students.map((student, index) => {
    // Aquí se calcularían las notas finales en base a evaluationData
    // evaluationData contendría las notas promedio de los 3 docentes
    const notaFinal = "9.50"; // Simulado
    return [`Estudiante ${index + 1}`, student, notaFinal];
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 20,
    theme: 'grid',
    head: [['', 'Nombre del Estudiante', 'Nota de Grado (0-10)']],
    headStyles: { fillColor: primaryColor, textColor: 255 },
    body: studentResultsBody
  });

  // Área para firmas físicas
  const signatureY = doc.lastAutoTable.finalY + 50;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Líneas de firma
  doc.line(20, signatureY, 80, signatureY);
  doc.text(groupData.tutor, 50, signatureY + 5, { align: 'center' });
  doc.text('Docente Tutor', 50, signatureY + 10, { align: 'center' });

  doc.line(130, signatureY, 190, signatureY);
  doc.text(groupData.guia, 160, signatureY + 5, { align: 'center' });
  doc.text('Docente Guía', 160, signatureY + 10, { align: 'center' });

  const signatureY2 = signatureY + 40;
  doc.line(75, signatureY2, 135, signatureY2);
  doc.text(groupData.revisor, 105, signatureY2 + 5, { align: 'center' });
  doc.text('Docente Revisor', 105, signatureY2 + 10, { align: 'center' });

  // Guardar PDF
  doc.save(`INFORME_${groupData.id}_UEG.pdf`);
};
