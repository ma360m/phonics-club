-- Allow quizzes to be placed at the end of a module as well as under a lesson.

ALTER TABLE public.course_quizzes
  ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_course_quizzes_module
  ON public.course_quizzes (module_id, sort_order);

COMMENT ON COLUMN public.course_quizzes.module_id IS
  'Optional module placement. If lesson_id is null and module_id is set, the quiz appears at the end of that module.';

NOTIFY pgrst, 'reload schema';
