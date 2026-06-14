-- ==========================================
-- SCHEMA PARA APLICACIÓN DE CALIFICACIONES (ACTUALIZADO SIN TABLA DE USERS)
-- ==========================================

-- Limpiar base de datos si ya existe
DROP TABLE IF EXISTS public.evaluations_practical CASCADE;
DROP TABLE IF EXISTS public.evaluations_oral CASCADE;
DROP TABLE IF EXISTS public.evaluations_written CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.groups CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Tabla de Grupos / Proyectos
CREATE TABLE public.groups (
    id TEXT PRIMARY KEY, -- Ej: 'G-A1'
    theme TEXT DEFAULT 'Estudio de Caso 2024-2025',
    course TEXT NOT NULL,
    tutor_name TEXT NOT NULL,
    guia_name TEXT NOT NULL,
    revisor_name TEXT NOT NULL,
    penalty_percentage DECIMAL DEFAULT 0.5, -- Cuántos puntos se descuentan por cada % adicional de plagio (> 15%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Estudiantes
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id TEXT REFERENCES public.groups(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Calificaciones del Proyecto Escrito (Grupal por rol de docente)
CREATE TABLE public.evaluations_written (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id TEXT REFERENCES public.groups(id) ON DELETE CASCADE,
    evaluator_role TEXT NOT NULL CHECK (evaluator_role IN ('tutor', 'guia', 'revisor')),
    
    score_intro DECIMAL CHECK (score_intro >= 0 AND score_intro <= 10),
    score_diagnostic DECIMAL CHECK (score_diagnostic >= 0 AND score_diagnostic <= 10),
    score_conceptual DECIMAL CHECK (score_conceptual >= 0 AND score_conceptual <= 10),
    score_development DECIMAL CHECK (score_development >= 0 AND score_development <= 10),
    score_results DECIMAL CHECK (score_results >= 0 AND score_results <= 10),
    score_conclusions DECIMAL CHECK (score_conclusions >= 0 AND score_conclusions <= 10),
    score_writing DECIMAL CHECK (score_writing >= 0 AND score_writing <= 10),
    score_ai_ethics DECIMAL CHECK (score_ai_ethics >= 0 AND score_ai_ethics <= 10),
    score_apa DECIMAL CHECK (score_apa >= 0 AND score_apa <= 10),
    
    plagiarism_percentage DECIMAL DEFAULT 0,
    raw_score DECIMAL,
    final_score DECIMAL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, evaluator_role)
);

-- Tabla de Calificaciones Defensa Oral (Individual por rol docente)
CREATE TABLE public.evaluations_oral (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    evaluator_role TEXT NOT NULL CHECK (evaluator_role IN ('tutor', 'guia', 'revisor')),
    
    score_communication DECIMAL CHECK (score_communication >= 0 AND score_communication <= 10),
    score_knowledge DECIMAL CHECK (score_knowledge >= 0 AND score_knowledge <= 10),
    score_answers DECIMAL CHECK (score_answers >= 0 AND score_answers <= 10),
    score_time DECIMAL CHECK (score_time >= 0 AND score_time <= 10),
    
    final_score DECIMAL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, evaluator_role)
);

-- Tabla de Calificaciones Proyecto Práctico (Individual, solo Tutor)
CREATE TABLE public.evaluations_practical (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    evaluator_role TEXT DEFAULT 'tutor' CHECK (evaluator_role = 'tutor'), 
    final_score DECIMAL CHECK (final_score >= 0 AND final_score <= 10),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, evaluator_role)
);

-- Desactivar temporalmente el RLS para desarrollo sin autenticación
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.students DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations_written DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations_oral DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations_practical DISABLE ROW LEVEL SECURITY;

-- ==========================================
-- CARGA DE DATOS SEMILLA (22 GRUPOS)
-- ==========================================

-- 3° BGU A
INSERT INTO public.groups (id, course, tutor_name, guia_name, revisor_name) VALUES
('G-A1', '3 BGU A', 'Héctor Pérez', 'CRESPO BÉLGICA', 'Geovana Aldaz'),
('G-A2', '3 BGU A', 'Pamela Sánchez', 'PÉREZ HÉCTOR', 'Gavilanes Omar'),
('G-A3', '3 BGU A', 'Héctor Pérez', 'LEÓN LORENA', 'Sonia Cuenca'),
('G-A4', '3 BGU A', 'Héctor Pérez', 'SÁNCHEZ PAMELA', 'Guachichulca Raquel'),
('G-A5', '3 BGU A', 'Héctor Pérez', 'GAMBOA DIANA', 'Gavilanes Daniel'),
('G-A6', '3 BGU A', 'Héctor Pérez', 'CHATO JUAN', 'León Lorena'),
('G-A7', '3 BGU A', 'Héctor Pérez', 'GAVILANES DANIEL', 'Fabara Gabriela'),
('G-A8', '3 BGU A', 'Héctor Pérez', 'MASABANDA NARCIZA', 'Crespo Bélgica'),
('G-A9', '3 BGU A', 'Héctor Pérez', 'GAVILANES OMAR', 'Gamboa Diana'),
('G-A10', '3 BGU A', 'Héctor Pérez', 'FABARA GABRIELA', 'Masabanda Narciza'),
('G-A11', '3 BGU A', 'Héctor Pérez', 'GUACHICHULCA RAQUEL', 'Chato Juan');

-- 3° BGU B
INSERT INTO public.groups (id, course, tutor_name, guia_name, revisor_name) VALUES
('G-B1', '3 BGU B', 'Pamela Sánchez', 'CRESPO BÉLGICA', 'Masabanda Narciza'),
('G-B2', '3 BGU B', 'Pamela Sánchez', 'PÉREZ HÉCTOR', 'León Lorena'),
('G-B3', '3 BGU B', 'Pamela Sánchez', 'LEÓN LORENA', 'Gamboa Diana'),
('G-B4', '3 BGU B', 'Héctor Pérez', 'GAMBOA DIANA', 'Sonia Cuenca'),
('G-B5', '3 BGU B', 'Pamela Sánchez', 'CHATO JUAN', 'Gavilanes Omar'),
('G-B6', '3 BGU B', 'Pamela Sánchez', 'GAVILANES DANIEL', 'Guachichulca Raquel'),
('G-B7', '3 BGU B', 'Pamela Sánchez', 'SÁNCHEZ PAMELA', 'Crespo Bélgica'),
('G-B8', '3 BGU B', 'Pamela Sánchez', 'GAVILANES OMAR', 'Fabara Gabriela'),
('G-B9', '3 BGU B', 'Pamela Sánchez', 'FABARA GABRIELA', 'Geovana Aldaz'),
('G-B10', '3 BGU B', 'Pamela Sánchez', 'GUACHICHULCA RAQUEL', 'Chato Juan'),
('G-B11', '3 BGU B', 'Pamela Sánchez', 'MASABANDA NARCIZA', 'Gavilanes Daniel');

-- Insertar Estudiantes (3 BGU A)
INSERT INTO public.students (group_id, full_name) VALUES
('G-A1', 'MORENO QUINATOA JORGE BRYAN'), ('G-A1', 'CHERREZ BUÑAY ANA PAULA'), ('G-A1', 'TIBANLOMBO MANOBANDA KEVIN ALEXANDER'),
('G-A2', 'SANCHEZ BAYAS SHIRLEY ODALIS'), ('G-A2', 'GUALI VILLAGOMEZ EMILY MONSERRATH'), ('G-A2', 'FREIRE YAULI JOFFRE LEONARDO'),
('G-A3', 'VEGA VEGA MIRIAM ESTEFANIA'), ('G-A3', 'MALIZA TIPAN LENIN MATEO'), ('G-A3', 'BAEZ GAHUIN ELVIS GERARDO'),
('G-A4', 'PALLO PASTUÑA PRISCILA JOHANNA'), ('G-A4', 'GARCES PAREDES HERNAN DAVID'), ('G-A4', 'MUÑOZ GUAMAN EVELYN ABIGAIL'),
('G-A5', 'AGUALONGO MOPOSITA JUSTIN ALEXANDER'), ('G-A5', 'SINCHIGALO CAIZA CELIDA NATALIA'), ('G-A5', 'GANAN LLUILEMA DIOSELIN ANAHI'),
('G-A6', 'HERNANDEZ CHAGLLA MAITE ANAHI'), ('G-A6', 'SOLIS PEREZ BRYAN JAVIER'), ('G-A6', 'BOLIVAR DASILVA ANGELA CRISTINA'),
('G-A7', 'MASAQUIZA JEREZ RAIZA SIZARINA'), ('G-A7', 'OCAMPO SAIGUA EMILY VALERIA'), ('G-A7', 'SANCHEZ MALDONADO PAUL SEBASTIAN'),
('G-A8', 'GUAMANQUISPE ANDACHI ANTHONY JAVIER'), ('G-A8', 'VERDESOTO SANCHEZ SHIRLEY TATIANA'), ('G-A8', 'CHACHIPANTA PUALACIN WILLIAM PATRICIO'),
('G-A9', 'MAYANZA BETUN ANTHONY DAVID'), ('G-A9', 'ANASICHA MARCATOMA CRISTIAN FRAY'), ('G-A9', 'SEVILLA FIALLOS SHEYLA MAHOLY'),
('G-A10', 'TARCO CACHUPUD DARWIN DAMIAN'), ('G-A10', 'MOLINA COBO SAMANTHA DANAE'), ('G-A10', 'OÑA LANDAZURI IAN FERNANDO'),
('G-A11', 'GARCIA PEREZ LEONARDO STEVEN'), ('G-A11', 'DIAS QUINCHE LENN ARIEL'), ('G-A11', 'SANTILLAN JORDAN DANIEL ROBERTO');

-- Insertar Estudiantes (3 BGU B)
INSERT INTO public.students (group_id, full_name) VALUES
('G-B1', 'PUCUNA CHATO EVELYN NOEMY'), ('G-B1', 'GUARANGA PILLAJO SARA MAYLI'), ('G-B1', 'TOAQUIZA CHALUISA ANDERSON JOSUE'),
('G-B2', 'MORENO BARONA MILEY JASLENE'), ('G-B2', 'CAIZA LARA JOSELYN ADRIANA'), ('G-B2', 'PEREZ BAYAS CELESTE ANAHI'),
('G-B3', 'SOLORZANO APONTE KARELYS JAMILETH'), ('G-B3', 'COCHA LOGRO JOFFRE JORDY'), ('G-B3', 'NUÑEZ SOLIS DAYANA MONSERRATH'),
('G-B4', 'CHOCO AMANCHA LIZ ALEJANDRA'), ('G-B4', 'MELENA TITUAÑA EDUARDO ALEXANDER'), ('G-B4', 'ALLAS PUNINA HENRY RENAN'),
('G-B5', 'LOGRO GUANOQUIZA NELLY JEANETH'), ('G-B5', 'PANATA FREIRE JOSELYN SALEM'), ('G-B5', 'ILAQUICHE VEGA ANAHI VANESSA'),
('G-B6', 'CAJILEMA YUQUILEMA BLANCA JENIFER'), ('G-B6', 'RIVERA NUÑEZ JESUS OMAR'), ('G-B6', 'TOAPANTA VERDUGO ALEJANDRA SCARLETT'),
('G-B7', 'GUALAN AGUAGALLO FABIAN ENRIQUE'), ('G-B7', 'MORALES YANSAPANTA KERLY ESTEFANIA'), ('G-B7', 'CALLE SIGUENCIA KIMBERLY MAITE'),
('G-B8', 'OJEDA MORALES MOISES ARIEL'), ('G-B8', 'SULCA TISALEMA ARLETTE GRACIELA'), ('G-B8', 'CHACHA CHUQUE ASHLEY CAMILA'),
('G-B9', 'QUINATOA CHACHIPANTA EDISON ALEXANDER'), ('G-B9', 'BENAVIDES VALENCIA CARLOS ABRAHAM'), ('G-B9', 'PALLO CHALUISA JOEL STALIN'), ('G-B9', 'YACHIL CHACHIPANTA LIZBETH SARA'),
('G-B10', 'SISA ASHQUI MARJORIE ESTEFANIA'), ('G-B10', 'PEREZ ACOSTA CESAR ARMANDO'), ('G-B10', 'URQUIZA YUQUILEMA DIEGO ALEXIS'), ('G-B10', 'ZURITA ORTIZ EDUARD HENRY'),
('G-B11', 'NUÑEZ SANCHEZ MATIAS ADRIAN'), ('G-B11', 'PACA ACAN LIZBETH GRACIELA'), ('G-B11', 'SUPE NUÑEZ KERLY JULIETTE');
