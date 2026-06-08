# Auto-guardado Automático - Cambios Implementados

## Resumen
Se implementó un sistema de **auto-guardado automático** que guarda el estado del proyecto en localStorage cada vez que cambia algo. El usuario ahora puede navegar entre diferentes apartados y pestañas sin perder información.

## Cambios Realizados

### 1. **Store Global (useApp.ts)**
- Eliminadas las llamadas explícitas a `guardar()` en cada acción individual
- Cada acción que modifica el proyecto (`setNicho`, `setAssets`, `setIdea`, etc.) ahora guarda automáticamente en localStorage
- Agregada una suscripción a Zustand que detecta cambios en el estado y los guarda automáticamente
- El método `guardar()` sigue disponible para sincronización explícita a la lista de proyectos

**Flujo:**
```
Usuario hace un cambio → Acción del store → Se guarda en localStorage automáticamente
                      ↓
                   Estado se actualiza
                      ↓
                   Suscripción detecta cambio
                      ↓
                   Se guarda en localStorage (redundancia)
```

### 2. **Indicador Visual (ProjectStatusBar.tsx)**
Se actualizó el componente ProjectStatusBar para mostrar en tiempo real:
- **"Auto-guardando..."** mientras se está guardando el cambio (con ícono animado)
- **"Auto-guardado"** cuando el cambio ha sido guardado exitosamente
- Cambió la etiqueta del botón de "Guardar proyecto" a "Sincronizar" para claridad
- El botón ahora sincroniza explícitamente el proyecto a la lista de proyectos

### 3. **Modal Informativo (AutoSaveInfo.tsx)**
Se agregó un modal que aparece la primera vez que el usuario abre la aplicación:
- Explica cómo funciona el auto-guardado
- Se muestra solo una vez (se guarda en localStorage que ya fue visto)
- Mejora la experiencia del usuario al entender el sistema

### 4. **Componente Auxiliar (AutoSaveIndicator.tsx)**
Se creó un componente reutilizable que puede usarse en otras páginas para mostrar el estado de guardado

### 5. **Integración en App (App.tsx)**
Se agregó el componente AutoSaveInfo en el componente raíz para que aparezca en toda la aplicación

## Beneficios

✅ **Cero pérdida de datos**: Todos los cambios se guardan automáticamente en localStorage
✅ **Experiencia fluida**: El usuario puede navegar sin preocuparse por guardar
✅ **Indicador visual**: El usuario ve en tiempo real que sus cambios se están guardando
✅ **Guardado definitivo**: El botón "Sincronizar" permite guardar la lista de proyectos
✅ **Sincronización automática**: Los cambios se guardan tanto localmente como en la lista de proyectos cuando se llama a `guardar()`

## Cómo Funciona

1. **Auto-guardado Local**: Cuando el usuario cambia cualquier cosa (nicho, idea, assets, etc.), el cambio se guarda automáticamente en localStorage
2. **Estado Actualizado**: La suscripción de Zustand detecta el cambio y también lo guarda en localStorage
3. **Navegación Segura**: El usuario puede navegar entre diferentes apartados, cambiar proyectos, etc., sin perder información
4. **Guardado Definitivo**: Cuando el usuario hace click en "Sincronizar", el proyecto se guarda definitivamente en la lista de proyectos

## Flujo de Guardado

```
┌─────────────────────────────────────┐
│  Usuario hace un cambio             │
│  (ej: genera activos, elige idea)   │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Acción del store (setAssets, etc)  │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Estado se actualiza                │
│  Se guarda en localStorage           │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  ProjectStatusBar muestra indicador  │
│  "Auto-guardando..." → "Auto-guardado"│
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│  Usuario navega a otra pestaña      │
│  Estado se restaura automáticamente  │
└─────────────────────────────────────┘
```

## Archivos Modificados

- `frontend/src/store/useApp.ts` - Store global con auto-guardado
- `frontend/src/components/ProjectStatusBar.tsx` - Indicador visual actualizado
- `frontend/src/components/AutoSaveInfo.tsx` - NUEVO: Modal informativo
- `frontend/src/components/AutoSaveIndicator.tsx` - NUEVO: Componente indicador
- `frontend/src/App.tsx` - Integración del modal informativo

## Notas Técnicas

- Se usa `localStorage` para almacenamiento temporal
- La suscripción de Zustand detecta cambios comparando el JSON del proyecto anterior
- El auto-guardado es instantáneo (sin debounce) para garantizar que no se pierda información
- El método `guardar()` sigue sincronizando a la lista de proyectos cuando se llama

## Pruebas Recomendadas

1. Ir a "Paso 1: Nicho" y seleccionar un nicho
2. Navegar a "Paso 2: Investigación" y volver a "Paso 1"
3. Verificar que el nicho seleccionado se mantiene
4. Repetir con "Paso 3: Ideas", "Paso 4: Activos", etc.
5. Verificar el indicador "Auto-guardando..." en la sidebar
6. Abrir las DevTools (F12) → Application → localStorage → Verificar que `ynl.proyectoActivo` se actualiza
7. Actualizar la página (F5) y verificar que todos los cambios se restauran automáticamente
