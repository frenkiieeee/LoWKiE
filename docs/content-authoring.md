# Cómo editar o añadir contenido

Todo el contenido didáctico vive en `content/java/arrays/` como scripts (no JSON: `fetch` local no funciona con `file://`).
No hace falta tocar la interfaz.

| Archivo | Qué contiene |
|---|---|
| `lesson.js` | Unidad, conceptos (`topics`) y los 7 bloques con sus pasos: `theory`, `exercise`, `summary`. Notas del facilitador por bloque. |
| `exercises.js` | Los ejercicios. Tipos: `prediction`, `interpretation`, `detection`, `completar`, `ordenar`, `programacion`. |
| `recommendations.js` | Reglas de recomendación (declarativas) y regla de reto. |

Formato de texto: `` `código` `` y `**negrita**`.

## Avanzando y compatibilidad del progreso
`advanced.js` y `exercises-advanced.js` contienen la segunda parte (módulos `x1…x6`, ejercicios `x*`, archivos `Ejercicio6…11`). **Regla de oro:** nunca
cambies los ids ni el número/orden de pasos de un bloque ya publicado (`b1…b7`, `x1…x6`): el progreso guardado usa esos ids y la posición de cada paso
(`b2:3`). Para ampliar, añade bloques nuevos con ids nuevos. `pnpm test` lo vigila (`la unidad base conserva exactamente su estructura`).
Cada paso lleva `section` (tema) y los de teoría un `tip` (consejo). Los huecos de «completar» admiten explicaciones por hueco: `why["1:true"]`.

## Añadir un ejercicio de elección (predicción / interpretación)
Usa el ayudante `choice(...)` de `exercises.js`: id, tipo, concepto, dificultad, título, enunciado, código, opciones, respuesta,
**`why`** (por qué cada opción incorrecta lo es), pistas, explicación. Después añade `{ kind: "exercise", id: "..." }` al bloque en `lesson.js`.
Añade `verify: true` (o `verify: { body, output }`) para que `pnpm test` compruebe con Java real que la respuesta es cierta.

## Ejercicios de programación
Necesitan `file` (`ejercicios/EjercicioN.java`, clase con el mismo nombre), `starter`, `expectedOutput` y `solution`.
Copia el `starter` a `templates/projects/arrays/<file>`. `pnpm test` comprueba que la solución da la salida esperada
y que el enunciado inicial **no** la da ya.

## Reglas de recomendación
`mistakes` de un concepto = intentos fallidos + soluciones vistas de sus ejercicios. Se aplica la primera regla cuyo
`minMistakes` se alcanza. `target`: `{ route }`, `{ exercise }` o `{ sim: "1d" | "2d" }`.

`pnpm test` valida que cada ejercicio esté en alguna lección, que las opciones incorrectas tengan explicación y que las reglas apunten a algo existente.
