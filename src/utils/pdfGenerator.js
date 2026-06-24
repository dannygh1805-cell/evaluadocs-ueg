import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { selloBase64 } from '../assets/selloBase64';

export const generateReport = (groupData, evaluationData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setLineHeightFactor(1.35);
  const headerColor = [220, 224, 230]; // Gris claro profesional para tablas
  const textColor = 0; // Negro

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getTeacherName = (role) => {
    let name = 'N/A';
    if (role === 'tutor') name = groupData.tutor_name || 'N/A';
    if (role === 'guia') name = groupData.guia_name || 'N/A';
    if (role === 'revisor') name = groupData.revisor_name || 'N/A';
    return name === 'N/A' ? name : toTitleCase(name);
  };

  const getTeacherPhone = (role) => {
    const t = groupData.teachers_registry?.find(t => t.role === role);
    return (t && t.cellphone) ? String(t.cellphone) : 'N/A';
  };

  // Dibujar encabezado difuminado (gradiente de celeste a blanco)
  for (let i = 0; i < 35; i++) {
    // Celeste pastel a Blanco
    const r = Math.round(190 + ((255 - 190) * (i / 35)));
    const g = Math.round(225 + ((255 - 225) * (i / 35)));
    const b = Math.round(245 + ((255 - 245) * (i / 35)));
    doc.setFillColor(r, g, b);
    doc.rect(0, i, 210, 1.5, 'F');
  }

  // Insertar Sello Institucional
  if (selloBase64) {
    doc.addImage(selloBase64, 'PNG', 14, 5, 22, 22);
  }

  // Titulo
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(30, 58, 138); // Azul oscuro
  doc.text('Unidad Educativa Guayaquil', 105, 12, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(textColor);
  doc.text('Informe de Calificación de Estudio de Caso', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Año Lectivo: 2025 - 2026', 105, 23, { align: 'center' });

  // 1. Datos Informativos
  autoTable(doc, {
    startY: 32,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold' },
    body: [
      ['Fecha de informe', new Date().toLocaleDateString(), 'Nº De informe', `18D02-UEG-V-2025-2026-${groupData.id.replace('G-', '')}`],
      ['Fecha de sustentación oral', { content: new Date().toLocaleString('es-EC', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }), colSpan: 3 }]
    ]
  });

  // 2. Responsables
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 3,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    head: [['Funcionarios', 'Nombres', 'Contacto']],
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold' },
    body: [
      ['Docente Tutor', getTeacherName('tutor'), getTeacherPhone('tutor')],
      ['Docente Guía', getTeacherName('guia'), getTeacherPhone('guia')],
      ['Docente Revisor', getTeacherName('revisor'), getTeacherPhone('revisor')],
    ]
  });

  // 3. Dirigido a
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 3,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    head: [['Informe dirigido a', 'Nombres', 'Cargo']],
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold' },
    body: [
      ['Rector(a)', 'Mgs. Roberto Galarza', 'Autoridad Institucional']
    ]
  });

  // 4. Tema y estudiantes
  const studentsBody = (groupData.students || []).map((s, i) => [`Estudiante ${i+1}`, s.full_name || '']);
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 3,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    body: [
      ['TEMA', { content: groupData.theme || 'Estudio de Caso 2024-2025', colSpan: 2 }],
      ['CURSO', { content: groupData.course || 'N/A', colSpan: 2 }],
      ...studentsBody
    ]
  });

  let currentY = doc.lastAutoTable.finalY + 8;

  // Funcion para imprimir parrafos justificados
  const printParagraph = (title, text) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(title, 14, currentY);
    currentY += 4;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    
    // Mejorar la justificación de texto calculando las dimensiones reales
    const dimensions = doc.getTextDimensions(text, { maxWidth: 182 });
    doc.text(text, 14, currentY, { maxWidth: 182, align: 'justify' });
    currentY += dimensions.h + 3;
  };

  printParagraph('1. ANTECEDENTES', 'De acuerdo con el Acuerdo Ministerial MINEDUC-MINEDUC-2024-00031-A, de 22 de mayo de 2024, que regula los procesos de evaluación educativa y organizacionales de las instituciones educativas del Sistema Nacional de Educación, y con el Instructivo de Evaluación Estudiantil vigente para el régimen Sierra-Amazonía del año lectivo 2025-2026, que en su anexo de Evaluación Final de Bachillerato establece los lineamientos para el desarrollo del Proyecto de Grado como proceso de evaluación final para los estudiantes de tercero de Bachillerato General Unificado (BGU), la Unidad Educativa Guayaquil ha implementado la modalidad de Estudio de Caso como estrategia para promover el pensamiento crítico, el trabajo colaborativo y la solución de problemas contextualizados.\n\nCon base en lo dispuesto en el numeral 6.3.1 de los "Lineamientos para la elaboración del Proyecto de Grado vigentes para el presente ciclo lectivo 2025-2026", se asignó a los estudiantes la ejecución de un proyecto práctico vinculado a su entorno institucional, un estudio de caso escrito que documente la problemática abordada, y una presentación oral que evidencie el dominio del tema y la comunicación efectiva.\n\nLas autoridades institucionales, en cumplimiento de lo establecido, conformaron la Comisión Calificadora encargada de evaluar los tres componentes del proyecto de manera integral, objetiva y bajo criterios técnicos establecidos por el Ministerio de Educación.');
  printParagraph('2. ALCANCE', 'Este informe está dirigido a Mgs. Roberto Galarza, rector de la Unidad Educativa Guayaquil y tiene como objetivo presentar el proceso y los resultados de la evaluación integral del Proyecto de Grado desarrollado por los estudiantes de tercero de BGU, a través de la aplicación de la matriz de calificación correspondiente a cada componente del proyecto.');
  printParagraph('3. OBJETIVOS', '- Informar a la autoridad institucional sobre el proceso de evaluación del Proyecto de Grado.\n- Verificar el cumplimiento de los lineamientos establecidos por el Ministerio de Educación.\n- Emitir la calificación final con base en las evidencias del trabajo práctico, escrito y expositivo.');
  printParagraph('4. DESARROLLO O ANÁLISIS', 'Durante el proceso de evaluación del Proyecto de Grado, la Comisión Calificadora aplicó rúbricas específicas correspondientes a cada fase del proyecto: la parte práctica, el estudio de caso escrito y la exposición oral. Las calificaciones se asignaron en base a rúbricas previamente estructuradas con criterios objetivos y rangos de valoración que van del 1 al 10 por aspect, tal como lo indican los lineamientos ministeriales. Este proceso permitió evaluar integralmente las competencias desarrolladas por los estudiantes en el transcurso del proyecto.');

  // RESULTADOS (Forzar inicio en la página 2 para consistencia de 2 páginas)
  doc.addPage();
  currentY = 20;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('RESULTADO DE EVALUACIÓN PROYECTO DE GRADO', 14, currentY);
  
  const plagio = Number(groupData.plagiarism_percentage || 0);
  const ai = Number(groupData.ai_percentage || 0);
  let penalty = 0;
  if (plagio > 15) penalty += Math.ceil((plagio - 15) / 5) * 0.25;
  if (ai > 15) penalty += Math.ceil((ai - 15) / 5) * 0.25;
  
  const resultsBody = (groupData.students || []).map((student, index) => {
    // Promedio Escrito
    const evW = groupData.evaluations_written || [];
    let sumW = 0;
    evW.forEach(e => {
       const sumFields = Number(e.score_introduccion||0) + Number(e.score_antecedentes||0) + Number(e.score_definicion_problema||0) + Number(e.score_justificacion||0) + Number(e.score_objetivos||0) + Number(e.score_marco_conceptual||0) + Number(e.score_marco_metodologico||0) + Number(e.score_resultados||0) + Number(e.score_analisis||0) + Number(e.score_conclusiones||0) + Number(e.score_recomendaciones||0) + Number(e.score_referencias||0) + Number(e.score_anexos||0) + Number(e.score_formato||0);
       sumW += (sumFields / 14);
    });
    const avgWrittenRaw = evW.length ? (sumW / evW.length) : 0;
    const avgWritten = Math.max(0, avgWrittenRaw - penalty);

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
    const avgPractical = evP.length ? (sumP / evP.length) : 0.0;

    const notaFinal = ((avgWritten + avgOral + avgPractical) / 3).toFixed(2);

    return [`Estudiante ${index + 1}`, student.full_name || 'N/A', avgPractical.toFixed(2), avgWritten.toFixed(2), avgOral.toFixed(2), notaFinal];
  });

  autoTable(doc, {
    startY: currentY + 5,
    theme: 'grid',
    head: [['', 'Estudiante', 'P. Práctico', 'P. Escrito', 'P. Oral', 'NOTA DE GRADO']],
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 22, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 16, halign: 'center' },
      5: { cellWidth: 32, halign: 'center' }
    },
    body: resultsBody
  });

  currentY = doc.lastAutoTable.finalY + 10;

  // Nota Metodológica
  printParagraph('NOTA METODOLÓGICA', 'La Nota de Grado corresponde al promedio simple de los tres componentes evaluados (Parte Práctica, Parte Escrita y Parte Oral), conforme a los criterios de valoración establecidos en la normativa ministerial vigente.');

  // Algoritmo de Conclusiones Dinámicas
  const getQualitativeDescriptor = (score) => {
    const val = Number(score);
    if (val >= 9.00) return 'domina los aprendizajes requeridos (DAR)';
    if (val >= 7.00) return 'alcanza los aprendizajes requeridos (AAR)';
    if (val >= 4.01) return 'está próximo a alcanzar los aprendizajes requeridos (PAAR)';
    return 'no alcanza los aprendizajes requeridos (NAAR)';
  };

  const studentResults = (groupData.students || []).map(student => {
    const evW = groupData.evaluations_written || [];
    let sumW = 0;
    evW.forEach(e => {
       const sumFields = Number(e.score_introduccion||0) + Number(e.score_antecedentes||0) + Number(e.score_definicion_problema||0) + Number(e.score_justificacion||0) + Number(e.score_objetivos||0) + Number(e.score_marco_conceptual||0) + Number(e.score_marco_metodologico||0) + Number(e.score_resultados||0) + Number(e.score_analisis||0) + Number(e.score_conclusiones||0) + Number(e.score_recomendaciones||0) + Number(e.score_referencias||0) + Number(e.score_anexos||0) + Number(e.score_formato||0);
       sumW += (sumFields / 14);
     });
    const avgWrittenRaw = evW.length ? (sumW / evW.length) : 0;
    const avgWritten = Math.max(0, avgWrittenRaw - penalty);

    const evO = student.evaluations_oral || [];
    let sumO = 0;
    evO.forEach(e => {
       const sumFields = Number(e.score_communication||0) + Number(e.score_knowledge||0) + Number(e.score_answers||0) + Number(e.score_time||0);
       sumO += (sumFields / 4);
     });
    const avgOral = evO.length ? (sumO / evO.length) : 0;

    const evP = student.evaluations_practical || [];
    let sumP = 0;
    evP.forEach(e => sumP += Number(e.final_score || 0));
    const avgPractical = evP.length ? (sumP / evP.length) : 0.0;

    const notaFinal = (avgWritten + avgOral + avgPractical) / 3;

    return {
      fullName: student.full_name || 'N/A',
      avgWritten,
      avgOral,
      avgPractical,
      notaFinal
    };
  });

  const groupAvg = studentResults.length ? (studentResults.reduce((acc, s) => acc + s.notaFinal, 0) / studentResults.length) : 0;
  const groupDescriptor = getQualitativeDescriptor(groupAvg);

  const avgGroupWritten = studentResults.length ? (studentResults.reduce((acc, s) => acc + s.avgWritten, 0) / studentResults.length) : 0;
  const avgGroupOral = studentResults.length ? (studentResults.reduce((acc, s) => acc + s.avgOral, 0) / studentResults.length) : 0;
  const avgGroupPractical = studentResults.length ? (studentResults.reduce((acc, s) => acc + s.avgPractical, 0) / studentResults.length) : 0;

  let lowestComponentLabel = '';
  const minVal = Math.min(avgGroupWritten, avgGroupOral, avgGroupPractical);
  if (minVal === avgGroupWritten) lowestComponentLabel = 'la Parte Escrita (Proyecto Escrito)';
  else if (minVal === avgGroupOral) lowestComponentLabel = 'la Parte Oral (Defensa)';
  else lowestComponentLabel = 'la Parte Práctica (Proyecto Práctico)';

  const groupConclusion = `Con base en los resultados obtenidos, el curso ${groupData.course || 'N/A'}, grupo ${groupData.id || 'N/A'} alcanzó un promedio de ${groupAvg.toFixed(2)} en la Nota de Grado, lo que evidencia que el grupo ${groupDescriptor}. El componente con menor desempeño relativo fue ${lowestComponentLabel}, por lo que se recomienda reforzar este aspecto en futuras generaciones.`;

  const individualConclusions = studentResults.map(s => {
    const components = [
      { label: 'la parte práctica (Proyecto Práctico)', val: s.avgPractical },
      { label: 'el componente escrito (Proyecto Escrito)', val: s.avgWritten },
      { label: 'la defensa oral (Exposición)', val: s.avgOral }
    ];
    components.sort((a, b) => b.val - a.val);
    const bestComponent = components[0].label;
    const worstComponent = components[2].label;
    const diff = components[0].val - components[2].val;
    
    let txt = `${s.fullName} obtuvo una Nota de Grado de ${s.notaFinal.toFixed(2)}, lo cual indica que ${getQualitativeDescriptor(s.notaFinal)}. Su mejor desempeño se registró en ${bestComponent};`;
    if (diff >= 1.0) {
      txt += ` se sugiere reforzar ${worstComponent}.`;
    } else {
      txt += ` manteniéndose un rendimiento equilibrado en los demás componentes.`;
    }
    return txt;
  }).join('\n\n');

  const finalConclusionsText = `${groupConclusion}\n\n${individualConclusions}`;

  printParagraph('5. CONCLUSIONES', finalConclusionsText);

  printParagraph('6. RECOMENDACIONES', 'Con base en los hallazgos del proceso de evaluación, se recomienda fortalecer la continuidad de proyectos prácticos como mecanismo para desarrollar competencias integradas en los estudiantes. Se sugiere reforzar el acompañamiento docente en la planificación, redacción y revisión de los estudios de caso escritos, asegurando que los estudiantes cuenten con una guía efectiva durante todo el proceso.');

  // Firmas
  if (currentY > 190) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('DESARROLLO DEL DOCUMENTO (Miembros de la Comisión Calificadora)', 14, currentY);
  currentY += 10;

  // Fila de Comisión Calificadora (3 columnas simétricas)
  // Tutor
  doc.line(18, currentY, 68, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(getTeacherName('tutor'), 43, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Tutor', 43, currentY + 10, { align: 'center' });

  // Guía
  doc.line(80, currentY, 130, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(getTeacherName('guia'), 105, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Guía', 105, currentY + 10, { align: 'center' });

  // Revisor
  doc.line(142, currentY, 192, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(getTeacherName('revisor'), 167, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Revisor', 167, currentY + 10, { align: 'center' });

  currentY += 20;

  // AUTORIZACIÓN, APROBACIÓN Y RECEPCIÓN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('AUTORIZACIÓN, APROBACIÓN Y RECEPCIÓN', 14, currentY);
  currentY += 8;

  // Textos explicativos superiores
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Revisado y aprobado por:', 60, currentY, { align: 'center' });
  doc.text('Recibido por:', 150, currentY, { align: 'center' });

  // Espacio para la firma (12mm)
  currentY += 12;

  // Fila de Autoridades (2 columnas simétricas)
  // Vicerrectora
  doc.line(35, currentY, 85, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Lic. Sonia Cuenca', 60, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Vicerrectora (E)', 60, currentY + 10, { align: 'center' });

  // Rector
  doc.line(125, currentY, 175, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Mgs. Roberto Galarza', 150, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Rector(a)', 150, currentY + 10, { align: 'center' });
  doc.text('Fecha: ___________________', 150, currentY + 15, { align: 'center' });

  const courseStr = (groupData.course || '').replace(/ /g, '_').toUpperCase();
  const surnames = groupData.students ? groupData.students.map(s => s.full_name.split(' ')[0].toUpperCase()).join('_') : 'ESTUDIANTES';
  doc.save(`${courseStr}_${surnames}_2025_2026.pdf`);
};

export const generateCourseSummaryReport = (courseName, courseGroups) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setLineHeightFactor(1.35);

  const headerColor = [220, 224, 230]; // Gris claro profesional
  const textColor = 0;

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // Encontrar el tutor dominante del curso
  const getCourseTutor = (groupsList) => {
    const counts = {};
    let maxCount = 0;
    let tutorName = 'Sin asignar';
    groupsList.forEach(g => {
      if (g.tutor_name && g.tutor_name !== 'Sin asignar') {
        const cleaned = g.tutor_name.trim();
        counts[cleaned] = (counts[cleaned] || 0) + 1;
        if (counts[cleaned] > maxCount) {
          maxCount = counts[cleaned];
          tutorName = cleaned;
        }
      }
    });
    return toTitleCase(tutorName);
  };

  const getQualitativeDescriptor = (score) => {
    const val = Number(score);
    if (val >= 9.00) return 'DAR';
    if (val >= 7.00) return 'AAR';
    if (val >= 4.01) return 'PAAR';
    return 'NAAR';
  };

  const studentList = [];

  courseGroups.forEach(group => {
    const plagio = Number(group.plagiarism_percentage || 0);
    const ai = Number(group.ai_percentage || 0);
    let penalty = 0;
    if (plagio > 15) penalty += Math.ceil((plagio - 15) / 5) * 0.25;
    if (ai > 15) penalty += Math.ceil((ai - 15) / 5) * 0.25;

    const evW = group.evaluations_written || [];
    let sumW = 0;
    evW.forEach(e => {
       const sumFields = Number(e.score_introduccion||0) + Number(e.score_antecedentes||0) + Number(e.score_definicion_problema||0) + Number(e.score_justificacion||0) + Number(e.score_objetivos||0) + Number(e.score_marco_conceptual||0) + Number(e.score_marco_metodologico||0) + Number(e.score_resultados||0) + Number(e.score_analisis||0) + Number(e.score_conclusiones||0) + Number(e.score_recomendaciones||0) + Number(e.score_referencias||0) + Number(e.score_anexos||0) + Number(e.score_formato||0);
       sumW += (sumFields / 14);
    });
    const avgWrittenRaw = evW.length ? (sumW / evW.length) : 0;
    const avgWritten = Math.max(0, avgWrittenRaw - penalty);

    (group.students || []).forEach(student => {
      const evO = student.evaluations_oral || [];
      let sumO = 0;
      evO.forEach(e => {
         const sumFields = Number(e.score_communication||0) + Number(e.score_knowledge||0) + Number(e.score_answers||0) + Number(e.score_time||0);
         sumO += (sumFields / 4);
      });
      const avgOral = evO.length ? (sumO / evO.length) : 0;

      const evP = student.evaluations_practical || [];
      let sumP = 0;
      evP.forEach(e => sumP += Number(e.final_score || 0));
      const avgPractical = evP.length ? (sumP / evP.length) : 0.0;

      const notaFinal = (avgWritten + avgOral + avgPractical) / 3;

      studentList.push({
        name: student.full_name || 'N/A',
        groupId: group.id,
        notaFinal: Number(notaFinal.toFixed(2))
      });
    });
  });

  // Ordenar alfabéticamente
  studentList.sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));

  // Dibujar encabezado difuminado
  for (let i = 0; i < 35; i++) {
    const r = Math.round(190 + ((255 - 190) * (i / 35)));
    const g = Math.round(225 + ((255 - 225) * (i / 35)));
    const b = Math.round(245 + ((255 - 245) * (i / 35)));
    doc.setFillColor(r, g, b);
    doc.rect(0, i, 210, 1.5, 'F');
  }

  // Insertar Sello
  if (selloBase64) {
    doc.addImage(selloBase64, 'PNG', 14, 5, 22, 22);
  }

  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(30, 58, 138); // Azul oscuro
  doc.text('Unidad Educativa Guayaquil', 105, 12, { align: 'center' });
  doc.setFontSize(11);
  doc.setTextColor(textColor);
  doc.text('Resumen de Calificaciones de Estudio de Caso por Curso', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Año Lectivo: 2025 - 2026', 105, 23, { align: 'center' });

  // Datos informativos
  const tutorName = getCourseTutor(courseGroups);
  autoTable(doc, {
    startY: 32,
    theme: 'grid',
    styles: { fontSize: 8.5, cellPadding: 1.5 },
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold' },
    body: [
      ['Curso / Grado', courseName, 'Fecha de reporte', new Date().toLocaleDateString()],
      ['Docente Tutor', tutorName, 'Rector(a)', 'Mgs. Roberto Galarza']
    ]
  });

  // Tabla de estudiantes y calificaciones
  const tableBody = studentList.map((s, idx) => [
    idx + 1,
    s.name,
    s.groupId,
    s.notaFinal.toFixed(2),
    getQualitativeDescriptor(s.notaFinal)
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 5,
    theme: 'grid',
    head: [['Nº', 'Estudiante', 'Grupo', 'Nota de Grado', 'Escala']],
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 9, cellPadding: 2 },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 25, halign: 'center' }
    },
    body: tableBody
  });

  let currentY = doc.lastAutoTable.finalY + 25;
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // Firma del Tutor
  doc.line(70, currentY, 130, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(tutorName, 100, currentY + 5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Tutor', 100, currentY + 10, { align: 'center' });

  const courseStr = courseName.replace(/ /g, '_').toUpperCase();
  doc.save(`ACTA_DE_CALIFICACIONES_${courseStr}_2025_2026.pdf`);
};

export const generateGroupWrittenRubricPdf = (groupData) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setLineHeightFactor(1.35);
  const headerColor = [220, 224, 230];
  const textColor = 0;

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getTeacherName = (role) => {
    let name = 'N/A';
    if (role === 'tutor') name = groupData.tutor_name || 'N/A';
    if (role === 'guia') name = groupData.guia_name || 'N/A';
    if (role === 'revisor') name = groupData.revisor_name || 'N/A';
    return name === 'N/A' ? name : toTitleCase(name);
  };

  // Dibujar encabezado difuminado
  for (let i = 0; i < 35; i++) {
    const r = Math.round(190 + ((255 - 190) * (i / 35)));
    const g = Math.round(225 + ((255 - 225) * (i / 35)));
    const b = Math.round(245 + ((255 - 245) * (i / 35)));
    doc.setFillColor(r, g, b);
    doc.rect(0, i, 210, 1.5, 'F');
  }

  if (selloBase64) {
    doc.addImage(selloBase64, 'PNG', 14, 5, 22, 22);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Unidad Educativa Guayaquil', 105, 12, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(textColor);
  doc.text('Rúbrica de Calificación - Proyecto Escrito (Estudio de Caso)', 105, 18, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Año Lectivo: 2025 - 2026', 105, 23, { align: 'center' });

  // Datos informativos
  autoTable(doc, {
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.2 },
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold' },
    body: [
      ['Grupo / Código', groupData.id, 'Curso / Paralelo', groupData.course || 'N/A'],
      ['Tema de Caso', { content: groupData.theme || 'Estudio de Caso 2024-2025', colSpan: 3 }],
      ['Docente Tutor', getTeacherName('tutor'), 'Docente Guía', getTeacherName('guia')],
      ['Docente Revisor', getTeacherName('revisor'), 'Fecha de reporte', new Date().toLocaleDateString()]
    ]
  });

  const criteria = [
    { key: 'score_introduccion', label: 'Introducción', desc: 'Presenta el tema, problemática y relevancia.' },
    { key: 'score_antecedentes', label: 'Antecedentes', desc: 'Contexto histórico y teórico del problema.' },
    { key: 'score_definicion_problema', label: 'Definición del Problema', desc: 'Planteamiento claro y preciso.' },
    { key: 'score_justificacion', label: 'Justificación', desc: 'Razones que motivan la investigación.' },
    { key: 'score_objetivos', label: 'Objetivos', desc: 'Objetivo General y específicos alcanzables.' },
    { key: 'score_marco_conceptual', label: 'Marco Conceptual', desc: 'Conceptos fundamentales y su relación.' },
    { key: 'score_marco_metodologico', label: 'Marco Metodológico', desc: 'Tipo de investigación, población y técnica.' },
    { key: 'score_resultados', label: 'Resultados', desc: 'Exposición clara de los hallazgos.' },
    { key: 'score_analisis', label: 'Análisis de Resultados', desc: 'Interpretación y contrastación lógica.' },
    { key: 'score_conclusiones', label: 'Conclusiones', desc: 'Resumen de hallazgos principales en base a objetivos.' },
    { key: 'score_recomendaciones', label: 'Recomendaciones', desc: 'Sugerencias prácticas y aplicables.' },
    { key: 'score_referencias', label: 'Referencias', desc: 'Formato APA 7ma Edición.' },
    { key: 'score_anexos', label: 'Anexos', desc: 'Evidencias, fotos, herramientas aplicadas.' },
    { key: 'score_formato', label: 'Formato General', desc: 'Márgenes, interlineado, numeración, redacción.' }
  ];

  const getScore = (role, key) => {
    const ev = groupData.evaluations_written?.find(e => e.evaluator_role === role);
    return ev && ev[key] !== undefined && ev[key] !== null ? Number(ev[key]) : null;
  };

  const rows = criteria.map((c, idx) => {
    const tutorScore = getScore('tutor', c.key);
    const guiaScore = getScore('guia', c.key);
    const revisorScore = getScore('revisor', c.key);

    const scores = [tutorScore, guiaScore, revisorScore].filter(v => v !== null);
    const avg = scores.length ? (scores.reduce((acc, v) => acc + v, 0) / scores.length) : 0;

    return [
      idx + 1,
      c.label,
      c.desc,
      tutorScore !== null ? tutorScore.toFixed(2) : '-',
      guiaScore !== null ? guiaScore.toFixed(2) : '-',
      revisorScore !== null ? revisorScore.toFixed(2) : '-',
      avg.toFixed(2)
    ];
  });

  const writtenEvaluations = groupData.evaluations_written || [];
  const getWrittenAvgForRole = (role) => {
    const ev = writtenEvaluations.find(e => e.evaluator_role === role);
    if (!ev) return null;
    const sum = criteria.reduce((acc, c) => acc + Number(ev[c.key] || 0), 0);
    return sum / 14;
  };

  const tAvg = getWrittenAvgForRole('tutor');
  const gAvg = getWrittenAvgForRole('guia');
  const rAvg = getWrittenAvgForRole('revisor');

  const allAvgs = [tAvg, gAvg, rAvg].filter(v => v !== null);
  const totalAvgRaw = allAvgs.length ? (allAvgs.reduce((acc, v) => acc + v, 0) / allAvgs.length) : 0;

  const plagio = Number(groupData.plagiarism_percentage || 0);
  const ai = Number(groupData.ai_percentage || 0);
  let penalty = 0;
  if (plagio > 15) penalty += Math.ceil((plagio - 15) / 5) * 0.25;
  if (ai > 15) penalty += Math.ceil((ai - 15) / 5) * 0.25;

  const finalWrittenScore = Math.max(0, totalAvgRaw - penalty);

  rows.push([
    '',
    'PROMEDIO CRITERIOS',
    'Promedio simple antes de penalización',
    tAvg !== null ? tAvg.toFixed(2) : '-',
    gAvg !== null ? gAvg.toFixed(2) : '-',
    rAvg !== null ? rAvg.toFixed(2) : '-',
    totalAvgRaw.toFixed(2)
  ]);

  if (penalty > 0) {
    rows.push([
      '',
      'PENALIZACIÓN',
      `Descuento por Plagio (${plagio}%) / IA (${ai}%) > 15%`,
      '',
      '',
      '',
      `-${penalty.toFixed(2)}`
    ]);
  }

  rows.push([
    '',
    'NOTA TOTAL ESCRITA',
    'Promedio final del Proyecto Escrito (máx 10.00)',
    '',
    '',
    '',
    finalWrittenScore.toFixed(2)
  ]);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 4,
    theme: 'grid',
    head: [['Nº', 'Criterio', 'Indicador de Logro', 'Tutor', 'Guía', 'Revisor', 'Promedio']],
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 7.2, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 32, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    },
    body: rows,
    didParseCell: function (data) {
      const rowCount = data.table.body.length;
      const isSummaryRow = data.row.index >= rowCount - (penalty > 0 ? 3 : 2);
      if (isSummaryRow) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 247, 250];
        if (data.column.index === 6 && data.row.index === rowCount - 1) {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fillColor = [220, 252, 231];
        }
      }
    }
  });

  let currentY = doc.lastAutoTable.finalY + 12;
  if (currentY > 245) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('FIRMAS DE RESPONSABILIDAD', 14, currentY);
  currentY += 14;

  // Fila de Firmas (3 columnas simétricas)
  doc.line(18, currentY, 68, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(getTeacherName('tutor'), 43, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Tutor', 43, currentY + 8, { align: 'center' });

  doc.line(80, currentY, 130, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(getTeacherName('guia'), 105, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Guía', 105, currentY + 8, { align: 'center' });

  doc.line(142, currentY, 192, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(getTeacherName('revisor'), 167, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Revisor', 167, currentY + 8, { align: 'center' });

  const groupName = groupData.id.replace(/ /g, '_').toUpperCase();
  doc.save(`RUBRICA_ESCRITO_${groupName}_2025_2026.pdf`);
};

export const generateStudentRubricPdf = (groupData, student) => {
  const doc = new jsPDF('p', 'mm', 'a4');
  doc.setLineHeightFactor(1.35);
  const headerColor = [220, 224, 230];
  const textColor = 0;

  const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getTeacherName = (role) => {
    let name = 'N/A';
    if (role === 'tutor') name = groupData.tutor_name || 'N/A';
    if (role === 'guia') name = groupData.guia_name || 'N/A';
    if (role === 'revisor') name = groupData.revisor_name || 'N/A';
    return name === 'N/A' ? name : toTitleCase(name);
  };

  // Dibujar encabezado difuminado
  for (let i = 0; i < 35; i++) {
    const r = Math.round(190 + ((255 - 190) * (i / 35)));
    const g = Math.round(225 + ((255 - 225) * (i / 35)));
    const b = Math.round(245 + ((255 - 245) * (i / 35)));
    doc.setFillColor(r, g, b);
    doc.rect(0, i, 210, 1.5, 'F');
  }

  if (selloBase64) {
    doc.addImage(selloBase64, 'PNG', 14, 5, 22, 22);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138);
  doc.text('Unidad Educativa Guayaquil', 105, 12, { align: 'center' });
  doc.setFontSize(10.5);
  doc.setTextColor(textColor);
  doc.text('Rúbrica de Calificación Individual - Proyecto de Grado', 105, 18, { align: 'center' });
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Año Lectivo: 2025 - 2026', 105, 23, { align: 'center' });

  // Datos informativos
  autoTable(doc, {
    startY: 30,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.2 },
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold' },
    body: [
      ['Estudiante', student.full_name || 'N/A', 'Grupo / Código', groupData.id],
      ['Curso / Paralelo', groupData.course || 'N/A', 'Tema de Caso', { content: groupData.theme || 'Estudio de Caso 2024-2025', colSpan: 1 }],
      ['Docente Tutor', getTeacherName('tutor'), 'Docente Guía', getTeacherName('guia')],
      ['Docente Revisor', getTeacherName('revisor'), 'Fecha de reporte', new Date().toLocaleDateString()]
    ]
  });

  // 1. Calificación Escrita
  const plagio = Number(groupData.plagiarism_percentage || 0);
  const ai = Number(groupData.ai_percentage || 0);
  let penalty = 0;
  if (plagio > 15) penalty += Math.ceil((plagio - 15) / 5) * 0.25;
  if (ai > 15) penalty += Math.ceil((ai - 15) / 5) * 0.25;

  const evW = groupData.evaluations_written || [];
  let sumW = 0;
  evW.forEach(e => {
     const sumFields = Number(e.score_introduccion||0) + Number(e.score_antecedentes||0) + Number(e.score_definicion_problema||0) + Number(e.score_justificacion||0) + Number(e.score_objetivos||0) + Number(e.score_marco_conceptual||0) + Number(e.score_marco_metodologico||0) + Number(e.score_resultados||0) + Number(e.score_analisis||0) + Number(e.score_conclusiones||0) + Number(e.score_recomendaciones||0) + Number(e.score_referencias||0) + Number(e.score_anexos||0) + Number(e.score_formato||0);
     sumW += (sumFields / 14);
  });
  const avgWrittenRaw = evW.length ? (sumW / evW.length) : 0;
  const avgWritten = Math.max(0, avgWrittenRaw - penalty);

  // 2. Calificación Práctica
  const evP = student.evaluations_practical || [];
  let sumP = 0;
  evP.forEach(e => sumP += Number(e.final_score || 0));
  const avgPractical = evP.length ? (sumP / evP.length) : 0.0;

  // 3. Rúbrica Oral
  const oralEvs = student.evaluations_oral || [];
  const getOralScore = (role, key) => {
    const o = oralEvs.find(e => e.evaluator_role === role);
    return o && o[key] !== undefined && o[key] !== null ? Number(o[key]) : null;
  };

  const oralCriteria = [
    { key: 'score_communication', label: 'Comunicación y estructura', desc: 'Claridad, volumen, postura y vocabulario.' },
    { key: 'score_knowledge', label: 'Dominio y conocimiento del tema', desc: 'Seguridad y profundidad al explicar.' },
    { key: 'score_answers', label: 'Respuestas a preguntas', desc: 'Precisión al responder inquietudes.' },
    { key: 'score_time', label: 'Uso del tiempo', desc: 'Cumplimiento del tiempo establecido (10-15 min).' }
  ];

  const oralRows = oralCriteria.map((c, idx) => {
    const tVal = getOralScore('tutor', c.key);
    const gVal = getOralScore('guia', c.key);
    const rVal = getOralScore('revisor', c.key);
    const vals = [tVal, gVal, rVal].filter(v => v !== null);
    const avg = vals.length ? (vals.reduce((acc, v) => acc + v, 0) / vals.length) : 0;

    return [
      idx + 1,
      c.label,
      c.desc,
      tVal !== null ? tVal.toFixed(2) : '-',
      gVal !== null ? gVal.toFixed(2) : '-',
      rVal !== null ? rVal.toFixed(2) : '-',
      avg.toFixed(2)
    ];
  });

  const getOralAvgForRole = (role) => {
    const ev = oralEvs.find(e => e.evaluator_role === role);
    if (!ev) return null;
    const sum = Number(ev.score_communication||0) + Number(ev.score_knowledge||0) + Number(ev.score_answers||0) + Number(ev.score_time||0);
    return sum / 4;
  };

  const tOralAvg = getOralAvgForRole('tutor');
  const gOralAvg = getOralAvgForRole('guia');
  const rOralAvg = getOralAvgForRole('revisor');

  const allOralAvgs = [tOralAvg, gOralAvg, rOralAvg].filter(v => v !== null);
  const totalOralAvg = allOralAvgs.length ? (allOralAvgs.reduce((acc, v) => acc + v, 0) / allOralAvgs.length) : 0;

  oralRows.push([
    '',
    'PROMEDIO DEFENSAS ORALES',
    'Promedio de la sustentación oral (máx 10.00)',
    tOralAvg !== null ? tOralAvg.toFixed(2) : '-',
    gOralAvg !== null ? gOralAvg.toFixed(2) : '-',
    rOralAvg !== null ? rOralAvg.toFixed(2) : '-',
    totalOralAvg.toFixed(2)
  ]);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('I. DETALLE DE CALIFICACIÓN DE LA SUSTENTACIÓN ORAL (DEFENSA)', 14, doc.lastAutoTable.finalY + 6);

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    theme: 'grid',
    head: [['Nº', 'Criterio Oral', 'Indicador de Evaluación', 'Tutor', 'Guía', 'Revisor', 'Promedio']],
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 7.5, cellPadding: 1 },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 15, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 15, halign: 'center' },
      6: { cellWidth: 18, halign: 'center', fontStyle: 'bold' }
    },
    body: oralRows,
    didParseCell: function (data) {
      if (data.row.index === oralRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 247, 250];
        if (data.column.index === 6) {
          data.cell.styles.textColor = [30, 58, 138];
        }
      }
    }
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('II. RESUMEN DE COMPONENTES Y NOTA DE GRADO FINAL', 14, doc.lastAutoTable.finalY + 7);

  const finalGrade = (avgWritten + totalOralAvg + avgPractical) / 3;

  const getQualitativeDescriptor = (score) => {
    const val = Number(score);
    if (val >= 9.00) return 'Domina los aprendizajes requeridos (DAR)';
    if (val >= 7.00) return 'Alcanza los aprendizajes requeridos (AAR)';
    if (val >= 4.01) return 'Próximo a alcanzar los aprendizajes requeridos (PAAR)';
    return 'No alcanza los aprendizajes requeridos (NAAR)';
  };

  const summaryRows = [
    ['1. Parte Práctica (Proyecto Práctico)', 'Evaluación individual del desarrollo práctico', avgPractical.toFixed(2), '33.33%'],
    ['2. Parte Escrita (Proyecto Escrito - Grupal)', 'Evaluación integral del manuscrito final', avgWritten.toFixed(2), '33.33%'],
    ['3. Parte Oral (Sustentación / Defensa)', 'Evaluación individual de la exposición y preguntas', totalOralAvg.toFixed(2), '33.33%'],
    ['NOTA DE GRADO FINAL', 'Promedio simple de los tres componentes (máx 10.00)', finalGrade.toFixed(2), '100%'],
    ['ESCALA CUALITATIVA', getQualitativeDescriptor(finalGrade), '', '']
  ];

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 9,
    theme: 'grid',
    head: [['Componente de Evaluación', 'Descripción / Criterio General', 'Calificación', 'Porcentaje']],
    headStyles: { fillColor: headerColor, textColor: textColor, fontStyle: 'bold', halign: 'center' },
    styles: { fontSize: 8, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 20, halign: 'center' }
    },
    body: summaryRows,
    didParseCell: function (data) {
      const rowCount = data.table.body.length;
      if (data.row.index >= rowCount - 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [245, 247, 250];
        if (data.row.index === rowCount - 2) {
          if (data.column.index === 2) {
            data.cell.styles.textColor = [22, 101, 52];
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.fontSize = 9.5;
          }
        } else if (data.row.index === rowCount - 1) {
          if (data.column.index === 1) {
            data.cell.styles.textColor = [30, 58, 138];
          }
        }
      }
    }
  });

  let currentY = doc.lastAutoTable.finalY + 12;
  if (currentY > 245) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('FIRMAS DE RESPONSABILIDAD', 14, currentY);
  currentY += 14;

  // Fila de Firmas (3 columnas simétricas)
  doc.line(18, currentY, 68, currentY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(getTeacherName('tutor'), 43, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Tutor', 43, currentY + 8, { align: 'center' });

  doc.line(80, currentY, 130, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(getTeacherName('guia'), 105, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Guía', 105, currentY + 8, { align: 'center' });

  doc.line(142, currentY, 192, currentY);
  doc.setFont('helvetica', 'bold');
  doc.text(getTeacherName('revisor'), 167, currentY + 4, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text('Docente Revisor', 167, currentY + 8, { align: 'center' });

  const studentNameStr = student.full_name.replace(/ /g, '_').toUpperCase();
  doc.save(`RUBRICA_INDIVIDUAL_${studentNameStr}_2025_2026.pdf`);
};

