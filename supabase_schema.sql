-- ==========================================
-- SCHEMA PARA APLICACIÓN DE CALIFICACIONES
-- ==========================================

-- Tabla de Usuarios (Docentes y Admin)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'tutor', 'guia', 'revisor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Grupos / Proyectos
CREATE TABLE public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    theme TEXT NOT NULL,
    course TEXT NOT NULL,
    tutor_id UUID REFERENCES public.users(id),
    guia_id UUID REFERENCES public.users(id),
    revisor_id UUID REFERENCES public.users(id),
    penalty_percentage DECIMAL DEFAULT 0.5, -- Cuántos puntos se descuentan por cada % adicional de plagio (> 15%)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Estudiantes
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Calificaciones del Proyecto Escrito (Grupal por docente)
-- Cada docente evalúa al grupo completo
CREATE TABLE public.evaluations_written (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    -- Criterios de evaluación (1 a 10)
    score_intro DECIMAL CHECK (score_intro >= 0 AND score_intro <= 10),
    score_diagnostic DECIMAL CHECK (score_diagnostic >= 0 AND score_diagnostic <= 10),
    score_conceptual DECIMAL CHECK (score_conceptual >= 0 AND score_conceptual <= 10),
    score_development DECIMAL CHECK (score_development >= 0 AND score_development <= 10),
    score_results DECIMAL CHECK (score_results >= 0 AND score_results <= 10),
    score_conclusions DECIMAL CHECK (score_conclusions >= 0 AND score_conclusions <= 10),
    score_writing DECIMAL CHECK (score_writing >= 0 AND score_writing <= 10),
    score_ai_ethics DECIMAL CHECK (score_ai_ethics >= 0 AND score_ai_ethics <= 10),
    score_apa DECIMAL CHECK (score_apa >= 0 AND score_apa <= 10),
    -- Datos adicionales
    plagiarism_percentage DECIMAL DEFAULT 0,
    -- Nota calculada antes de penalización
    raw_score DECIMAL,
    -- Nota final (con penalización si plagio > 15%)
    final_score DECIMAL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, evaluator_id)
);

-- Tabla de Calificaciones Defensa Oral (Individual por docente)
-- Cada docente evalúa a cada estudiante individualmente
CREATE TABLE public.evaluations_oral (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    -- Criterios de evaluación (1 a 10)
    score_communication DECIMAL CHECK (score_communication >= 0 AND score_communication <= 10),
    score_knowledge DECIMAL CHECK (score_knowledge >= 0 AND score_knowledge <= 10),
    score_answers DECIMAL CHECK (score_answers >= 0 AND score_answers <= 10),
    score_time DECIMAL CHECK (score_time >= 0 AND score_time <= 10),
    -- Nota promedio calculada
    final_score DECIMAL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, evaluator_id)
);

-- Tabla de Calificaciones Proyecto Práctico (Individual, solo Tutor)
CREATE TABLE public.evaluations_practical (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES public.users(id) ON DELETE CASCADE, -- Debe ser el tutor del grupo
    final_score DECIMAL CHECK (final_score >= 0 AND final_score <= 10),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(student_id, evaluator_id)
);

-- RLS (Row Level Security) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations_written ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations_oral ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations_practical ENABLE ROW LEVEL SECURITY;

-- Políticas temporales para facilidad de desarrollo (Permitir todo si está logueado)
CREATE POLICY "Enable read access for authenticated users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on groups" ON public.groups FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for admin users on students" ON public.students FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users on evaluations_written" ON public.evaluations_written FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users on evaluations_oral" ON public.evaluations_oral FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable all access for authenticated users on evaluations_practical" ON public.evaluations_practical FOR ALL TO authenticated USING (true);
