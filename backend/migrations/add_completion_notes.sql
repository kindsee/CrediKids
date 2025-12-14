-- Agregar columna completion_notes a task_completions
-- Fecha: 2025-12-14

USE credikids_db;

ALTER TABLE task_completions 
ADD COLUMN completion_notes TEXT AFTER completed_at;

-- Verificar que la columna se agregó correctamente
DESCRIBE task_completions;
