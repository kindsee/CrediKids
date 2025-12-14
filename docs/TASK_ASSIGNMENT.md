# Sistema de Asignación de Tareas - CrediKids

## 📋 Descripción General

El sistema de asignación masiva permite al administrador asignar tareas a uno o múltiples usuarios en intervalos de fechas con configuraciones específicas según la frecuencia.

## 🚀 Características Principales

### 1. Asignación Masiva
- **Múltiples usuarios**: Asignar la misma tarea a varios usuarios simultáneamente
- **Intervalos de fechas**: Definir fecha de inicio y fin para las asignaciones
- **Múltiples asignaciones por día**: Una tarea puede asignarse varias veces al mismo usuario el mismo día

### 2. Frecuencias de Asignación

#### 📅 Diaria (Daily)
Asigna la tarea en días específicos de la semana dentro del rango de fechas.

**Parámetros:**
- `weekdays`: Array de días de la semana (0=Lunes, 6=Domingo)
  - Ejemplo: `[0, 1, 2, 3, 4]` = Lunes a Viernes
- `times_per_day`: Número de veces que se asigna la tarea por día
  - Ejemplo: `2` = La tarea se asigna 2 veces cada día seleccionado

**Caso de Uso:**
- Tareas diarias como "Hacer la cama" (1 vez al día)
- Tareas múltiples como "Lavar los platos" (2-3 veces al día)

**Ejemplo de Request:**
```json
{
  "task_id": 1,
  "user_ids": [2, 3],
  "start_date": "2025-12-14",
  "end_date": "2025-12-31",
  "frequency": "daily",
  "weekdays": [0, 1, 2, 3, 4],
  "times_per_day": 2
}
```

**Resultado:**
- Usuario 2: 2 asignaciones por día de Lunes a Viernes (14-31 Dic)
- Usuario 3: 2 asignaciones por día de Lunes a Viernes (14-31 Dic)
- Total: ~72 asignaciones (18 días × 2 usuarios × 2 veces/día)

#### 📆 Semanal (Weekly)
Asigna la tarea en un día específico de la semana, en semanas específicas del mes.

**Parámetros:**
- `weekday`: Día de la semana (0=Lunes, 6=Domingo)
  - Ejemplo: `2` = Miércoles
- `weeks`: Array de semanas del mes (1-4)
  - Ejemplo: `[1, 3]` = Primera y tercera semana

**Caso de Uso:**
- Tareas semanales como "Sacar la basura" cada Lunes
- Tareas quincenales como "Limpiar habitación" en semanas 2 y 4

**Ejemplo de Request:**
```json
{
  "task_id": 2,
  "user_ids": [2],
  "start_date": "2025-12-01",
  "end_date": "2026-02-28",
  "frequency": "weekly",
  "weekday": 0,
  "weeks": [1, 2, 3, 4]
}
```

**Resultado:**
- Usuario 2: 1 asignación cada Lunes de cada semana del mes
- Total: ~12 asignaciones (3 meses × ~4 Lunes/mes)

#### 📅 Mensual (Monthly)
Asigna la tarea en un día específico del mes, en meses específicos.

**Parámetros:**
- `day_of_month`: Día del mes (1-31)
  - Ejemplo: `15` = Día 15 de cada mes
- `months`: Array de meses (1=Enero, 12=Diciembre)
  - Ejemplo: `[1, 3, 5, 7, 9, 11]` = Meses impares

**Caso de Uso:**
- Tareas mensuales como "Revisar cuarto" el día 1 de cada mes
- Tareas trimestrales como "Limpieza profunda" cada 3 meses

**Ejemplo de Request:**
```json
{
  "task_id": 3,
  "user_ids": [2, 3, 4],
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "frequency": "monthly",
  "day_of_month": 1,
  "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}
```

**Resultado:**
- Usuario 2: 1 asignación el día 1 de cada mes
- Usuario 3: 1 asignación el día 1 de cada mes
- Usuario 4: 1 asignación el día 1 de cada mes
- Total: 36 asignaciones (12 meses × 3 usuarios)

## 🔧 API Endpoint

### POST `/api/tasks/assign/bulk`
Requiere rol de administrador.

**Request Body:**
```json
{
  "task_id": 1,              // ID de la tarea (requerido)
  "user_ids": [2, 3],        // Array de IDs de usuarios (requerido)
  "start_date": "2025-12-14", // Fecha de inicio YYYY-MM-DD (requerido)
  "end_date": "2025-12-31",   // Fecha de fin YYYY-MM-DD (requerido)
  "frequency": "daily",       // daily|weekly|monthly (requerido)
  
  // Para frequency="daily"
  "weekdays": [0, 1, 2, 3, 4], // Días de semana (opcional, default: todos)
  "times_per_day": 1,          // Veces por día (opcional, default: 1)
  
  // Para frequency="weekly"
  "weekday": 0,                // Día de semana (opcional, default: 0=Lunes)
  "weeks": [1, 2, 3, 4],       // Semanas del mes (opcional, default: todas)
  
  // Para frequency="monthly"
  "day_of_month": 1,           // Día del mes (opcional, default: 1)
  "months": [1, 2, ..., 12]    // Meses (opcional, default: todos)
}
```

**Response Success (201):**
```json
{
  "message": "150 assignments created successfully",
  "assignments": [
    {"user_id": 2, "date": "2025-12-14"},
    {"user_id": 2, "date": "2025-12-14"},
    {"user_id": 3, "date": "2025-12-14"},
    ...
  ]
}
```

**Response Errors:**
- `400 Bad Request`: Campos faltantes o inválidos
- `403 Forbidden`: Usuario no es administrador
- `404 Not Found`: Tarea o usuario no encontrado

## 💻 Interfaz de Usuario

### Página: Asignar Tareas (`/task-assignment`)
Accesible solo para administradores desde el menú lateral.

**Flujo de Uso:**

1. **Seleccionar Tarea**
   - Dropdown con todas las tareas activas
   - Muestra: título, frecuencia, créditos

2. **Seleccionar Usuarios**
   - Checkboxes con avatar y nombre
   - Botón "Seleccionar todos" / "Deseleccionar todos"
   - Contador de usuarios seleccionados

3. **Definir Fechas**
   - Input de fecha inicio
   - Input de fecha fin
   - Validación: inicio < fin

4. **Configurar Frecuencia**
   - Radio buttons: Diaria / Semanal / Mensual
   - Panel específico según frecuencia seleccionada

5. **Opciones por Frecuencia**

   **Diaria:**
   - Checkboxes para días de la semana (Lun-Dom)
   - Input numérico para veces por día (1-10)
   
   **Semanal:**
   - Dropdown para día de la semana
   - Checkboxes para semanas del mes (1-4)
   
   **Mensual:**
   - Input numérico para día del mes (1-31)
   - Checkboxes para meses (Ene-Dic)

6. **Confirmar Asignación**
   - Botón "Asignar Tarea"
   - Mensaje de éxito con número de asignaciones creadas
   - Opción de limpiar formulario

### Panel de Información
Muestra guía rápida sobre cada tipo de frecuencia y comportamiento esperado.

## 📊 Ejemplos de Uso Común

### Ejemplo 1: Tareas Escolares Diarias
**Escenario:** "Hacer deberes" 1 vez al día, de Lunes a Viernes, para 2 niños durante el mes escolar.

```json
{
  "task_id": 5,
  "user_ids": [2, 3],
  "start_date": "2025-09-01",
  "end_date": "2025-09-30",
  "frequency": "daily",
  "weekdays": [0, 1, 2, 3, 4],
  "times_per_day": 1
}
```
→ ~44 asignaciones (22 días × 2 usuarios)

### Ejemplo 2: Lavado de Platos Múltiple
**Escenario:** "Lavar platos" 3 veces al día, todos los días, para 1 niño durante 1 semana.

```json
{
  "task_id": 7,
  "user_ids": [2],
  "start_date": "2025-12-14",
  "end_date": "2025-12-20",
  "frequency": "daily",
  "weekdays": [0, 1, 2, 3, 4, 5, 6],
  "times_per_day": 3
}
```
→ 21 asignaciones (7 días × 3 veces/día)

### Ejemplo 3: Limpieza Semanal Rotativa
**Escenario:** "Limpiar baño" cada Sábado, para 3 niños rotando cada mes.

```json
// Mes 1: Usuario 2
{
  "task_id": 8,
  "user_ids": [2],
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "frequency": "weekly",
  "weekday": 5,
  "weeks": [1, 2, 3, 4]
}

// Mes 2: Usuario 3
{
  "task_id": 8,
  "user_ids": [3],
  "start_date": "2025-02-01",
  "end_date": "2025-02-28",
  "frequency": "weekly",
  "weekday": 5,
  "weeks": [1, 2, 3, 4]
}
```

### Ejemplo 4: Revisión Mensual
**Escenario:** "Organizar armario" el primer día de cada mes, para todos.

```json
{
  "task_id": 10,
  "user_ids": [2, 3, 4],
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "frequency": "monthly",
  "day_of_month": 1,
  "months": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
}
```
→ 36 asignaciones (12 meses × 3 usuarios)

## ⚙️ Comportamiento del Sistema

### Reglas de Asignación
1. **Múltiples asignaciones diarias**: Permitidas intencionalmente
2. **Asignaciones duplicadas**: El sistema permite múltiples asignaciones de la misma tarea al mismo usuario el mismo día (para tareas que se repiten)
3. **Días inexistentes**: Si se asigna el día 31 de un mes que no lo tiene, se omite automáticamente
4. **Rango de fechas**: Inclusivo en ambos extremos (start_date y end_date)

### Validaciones
- ✅ Tarea debe existir y estar activa
- ✅ Usuarios deben existir
- ✅ start_date debe ser anterior a end_date
- ✅ Frecuencia debe ser válida (daily/weekly/monthly)
- ✅ Al menos 1 usuario seleccionado
- ✅ Parámetros específicos de frecuencia:
  - Daily: Al menos 1 día de la semana
  - Weekly: Al menos 1 semana seleccionada
  - Monthly: Al menos 1 mes seleccionado

### Gestión de Errores
- `400`: Parámetros inválidos o faltantes
- `403`: No autorizado (no es admin)
- `404`: Tarea o usuario no encontrado

## 🔄 Flujo Completo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin selecciona tarea y usuarios                         │
│ 2. Define rango de fechas (inicio-fin)                       │
│ 3. Elige frecuencia (diaria/semanal/mensual)                 │
│ 4. Configura parámetros específicos de frecuencia            │
│ 5. Sistema valida datos                                      │
│ 6. Sistema genera asignaciones según reglas                  │
│ 7. TaskAssignment creados en base de datos                   │
│ 8. Respuesta con número de asignaciones creadas              │
│ 9. Usuario ve tareas asignadas en su calendario              │
│ 10. Usuario completa tareas → Admin valida → Créditos        │
└─────────────────────────────────────────────────────────────┘
```

## 📝 Notas Técnicas

### Base de Datos
Cada asignación crea un registro `TaskAssignment`:
```sql
INSERT INTO task_assignments (
  task_id,
  user_id,
  assigned_date,
  assigned_by_id,
  is_completed,
  is_validated,
  created_at
) VALUES (?, ?, ?, ?, 0, 0, NOW())
```

### Performance
- El sistema genera asignaciones en memoria antes de commit
- Transacción única para todas las asignaciones
- Para rangos largos (>1 año) con daily, puede generar miles de registros

### Limitaciones
- Semanas del mes se calculan como: `(día - 1) // 7 + 1`
- Máximo 4 semanas por mes (días 29-31 pueden quedar en "semana 5")
- No hay validación de días festivos o vacaciones

## 🎯 Próximas Mejoras Sugeridas
- [ ] Plantillas de asignación predefinidas
- [ ] Vista previa de asignaciones antes de confirmar
- [ ] Exclusión de días festivos/vacaciones
- [ ] Copiar asignaciones de semana/mes anterior
- [ ] Estadísticas de asignaciones por usuario/tarea
- [ ] Exportar calendario de asignaciones a PDF/CSV

---

**Documentación actualizada:** 14 de Diciembre, 2025
