import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateReport = (groupData, evaluationData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const primaryColor = [37, 99, 235];
  const secondaryColor = [241, 245, 249];

  const getTeacherName = (role) => {
    const t = groupData.teachers_registry?.find(t => t.role === role);
    return (t && t.full_name) ? String(t.full_name) : `Docente ${role}`;
  };

  const getTeacherPhone = (role) => {
    const t = groupData.teachers_registry?.find(t => t.role === role);
    return (t && t.cellphone) ? String(t.cellphone) : 'N/A';
  };

  // Titulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Unidad Educativa Guayaquil', 105, 15, { align: 'center' });
  doc.text('Informe de Calificación de Estudio de Caso', 105, 22, { align: 'center' });

  // 1. Datos Informativos
  autoTable(doc, {
    startY: 30,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: 255 },
    body: [
      ['Fecha de informe', new Date().toLocaleDateString(), 'Nº De informe', `18D02-UEG-2024-2025-${groupData.id.split('-')[1] || '01'}`]
    ]
  });

  // 2. Responsables
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    theme: 'grid',
    head: [['Funcionarios', 'Nombres', 'Contacto']],
    headStyles: { fillColor: secondaryColor, textColor: 0 },
    body: [
      ['Docente Tutor', getTeacherName('tutor'), getTeacherPhone('tutor')],
      ['Docente Guía', getTeacherName('guia'), getTeacherPhone('guia')],
      ['Docente Revisor', getTeacherName('revisor'), getTeacherPhone('revisor')],
    ]
  });

  // 3. Dirigido a
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    theme: 'grid',
    head: [['Informe dirigido a', 'Nombres', 'Cargo']],
    headStyles: { fillColor: secondaryColor, textColor: 0 },
    body: [
      ['Rector(a)', 'Msc. Roberto Galarza', 'Autoridad Institucional']
    ]
  });

  // 4. Tema y estudiantes
  const studentsBody = (groupData.students || []).map((s, i) => [`Estudiante ${i+1}`, s.full_name || '']);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    theme: 'grid',
    body: [
      ['TEMA', { content: groupData.theme || 'Estudio de Caso 2024-2025', colSpan: 2 }],
      ['CURSO', { content: '3 BGU A', colSpan: 2 }],
      ...studentsBody
    ]
  });

  let currentY = doc.lastAutoTable.finalY + 10;

  // Funcion para imprimir parrafos justificados
  const printParagraph = (title, text) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, 14, currentY);
    currentY += 5;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitText = doc.splitTextToSize(text, 180);
    doc.text(splitText, 14, currentY, { align: 'justify' });
    currentY += (splitText.length * 4) + 5;
  };

  printParagraph('1. ANTECEDENTES', 'De acuerdo con el Acuerdo Ministerial MINEDUC-MINEDUC-2023-00031-A, que establece los lineamientos para el desarrollo del Proyecto de Grado como proceso de evaluación final para los estudiantes de tercero de Bachillerato General Unificado (BGU), la Unidad Educativa Guayaquil ha implementado la modalidad de Estudio de Caso como estrategia para promover el pensamiento crítico, el trabajo colaborativo y la solución de problemas contextualizados.\n\nCon base en lo dispuesto en el numeral 6.3.1 de los "Lineamientos para la elaboración del Proyecto de Grado 2024-2025", se asignó a los estudiantes la ejecución de un proyecto práctico vinculado a su entorno institucional, un estudio de caso escrito que documente la problemática abordada, y una presentación oral que evidencie el dominio del tema y la comunicación efectiva.\n\nLas autoridades institucionales, en cumplimiento de lo establecido, conformaron la Comisión Calificadora encargada de evaluar los tres componentes del proyecto de manera integral, objetiva y bajo criterios técnicos establecidos por el Ministerio de Educación.');
  printParagraph('2. ALCANCE', 'Este informe está dirigido a la Mgs. Roberto Galarza, rector de la Unidad Educativa Guayaquil y tiene como objetivo presentar el proceso y los resultados de la evaluación integral del Proyecto de Grado desarrollado por los estudiantes de tercero de BGU, a través de la aplicación de la matriz de calificación correspondiente a cada componente del proyecto.');
  printParagraph('3. OBJETIVOS', '- Informar a la autoridad institucional sobre el proceso de evaluación del Proyecto de Grado.\n- Verificar el cumplimiento de los lineamientos establecidos por el Ministerio de Educación.\n- Emitir la calificación final con base en las evidencias del trabajo práctico, escrito y expositivo.');
  printParagraph('4. DESARROLLO O ANÁLISIS', 'Durante el proceso de evaluación del Proyecto de Grado, la Comisión Calificadora aplicó rúbricas específicas correspondientes a cada fase del proyecto: la parte práctica, el estudio de caso escrito y la exposición oral. Las calificaciones se asignaron en base a rúbricas previamente estructuradas con criterios objetivos y rangos de valoración que van del 1 al 10 por aspecto, tal como lo indican los lineamientos ministeriales. Este proceso permitió evaluar integralmente las competencias desarrolladas por los estudiantes en el transcurso del proyecto.');

  // RESULTADOS
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RESULTADO DE EVALUACIÓN PROYECTO DE GRADO', 14, currentY);
  
  const resultsBody = (groupData.students || []).map((student, index) => {
    // Promedio Escrito
    const evW = groupData.evaluations_written || [];
    let sumW = 0;
    evW.forEach(e => {
       const sumFields = Number(e.score_introduccion||0) + Number(e.score_antecedentes||0) + Number(e.score_definicion_problema||0) + Number(e.score_justificacion||0) + Number(e.score_objetivos||0) + Number(e.score_marco_conceptual||0) + Number(e.score_marco_metodologico||0) + Number(e.score_resultados||0) + Number(e.score_analisis||0) + Number(e.score_conclusiones||0) + Number(e.score_recomendaciones||0) + Number(e.score_referencias||0) + Number(e.score_anexos||0) + Number(e.score_formato||0);
       sumW += (sumFields / 14);
    });
    const avgWritten = evW.length ? (sumW / evW.length) : 0;

    // Promedio Oral
    const evO = student.evaluations_oral || [];
    let sumO = 0;
    evO.forEach(e => {
       const sumFields = Number(e.score_communication||0) + Number(e.score_knowledge||0) + Number(e.score_answers||0) + Number(e.score_time||0);
       sumO += (sumFields / 4);
    });
    const avgOral = evO.length ? (sumO / evO.length) : 0;

    // Promedio Practico
    const evP = student.evaluations_practical || [];
    let sumP = 0;
    evP.forEach(e => sumP += Number(e.final_score || 0));
    const avgPractical = evP.length ? (sumP / evP.length) : 10.0;

    const notaFinal = ((avgWritten + avgOral + avgPractical) / 3).toFixed(2);

    return [`Estudiante ${index + 1}`, student.full_name || 'N/A', avgPractical.toFixed(2), avgWritten.toFixed(2), avgOral.toFixed(2), notaFinal];
  });

  autoTable(doc, {
    startY: currentY + 5,
    theme: 'grid',
    head: [['', 'Estudiante', 'P. Práctico', 'P. Escrito', 'P. Oral', 'NOTA DE GRADO']],
    headStyles: { fillColor: primaryColor, textColor: 255 },
    body: resultsBody
  });

  currentY = doc.lastAutoTable.finalY + 10;

  printParagraph('5. CONCLUSIONES', 'Luego de aplicar el proceso de evaluación integral, se concluye que los proyectos presentados por los estudiantes de tercero de Bachillerato reflejan un alto nivel de pertinencia y compromiso. La modalidad del estudio de caso permitió vincular la realidad institucional con soluciones prácticas. En términos generales, los estudiantes mostraron avances significativos en la elaboración del informe escrito y a nivel práctico evidenciaron comprensión clara del entorno.');
  printParagraph('6. RECOMENDACIONES', 'Con base en los hallazgos del proceso de evaluación, se recomienda fortalecer la continuidad de proyectos prácticos como mecanismo para desarrollar competencias integradas en los estudiantes. Se sugiere reforzar el acompañamiento docente en la planificación, redacción y revisión de los estudios de caso escritos, asegurando que los estudiantes cuenten con una guía efectiva durante todo el proceso.');

  // Firmas
  if (currentY > 230) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DESARROLLO DEL DOCUMENTO (Miembros de la Comisión Evaluación)', 14, currentY);
  currentY += 25;

  doc.line(20, currentY, 80, currentY);
  doc.text(getTeacherName('tutor'), 50, currentY + 5, { align: 'center' });
  doc.text('Docente Tutor', 50, currentY + 10, { align: 'center' });

  doc.line(120, currentY, 180, currentY);
  doc.text(getTeacherName('guia'), 150, currentY + 5, { align: 'center' });
  doc.text('Docente Guía', 150, currentY + 10, { align: 'center' });

  currentY += 30;

  doc.line(70, currentY, 130, currentY);
  doc.text(getTeacherName('revisor'), 100, currentY + 5, { align: 'center' });
  doc.text('Docente Revisor', 100, currentY + 10, { align: 'center' });

  doc.save(`INFORME_${groupData.id}_UEG.pdf`);
};
