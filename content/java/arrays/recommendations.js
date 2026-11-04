/* Reglas de recomendación (spec §8): deterministas, transparentes y editables sin tocar el código.
   `mistakes` de un concepto = intentos fallidos + soluciones reveladas de los ejercicios de esos conceptos.
   Se aplica la PRIMERA regla cuyas condiciones se cumplen (ordenadas por prioridad).
   target: { route } | { exercise: id } | { sim: "1d"|"2d" } */
(function (L) {
  var C = (L.content = L.content || {});
  C.recommendationRules = [
    { id: "index-access", topics: ["array-indexing"], minMistakes: 2,
      reason: "Has dudado varias veces al acceder por índice. Es normal: Java cuenta desde cero.",
      concept: "Índices de un array", activity: "Explorar índices con el simulador", minutes: 4, target: { sim: "1d" } },
    { id: "index-vs-value", topics: ["index-vs-value"], minMistakes: 1,
      reason: "Parece que índice (posición) y valor (contenido) se mezclan a veces.",
      concept: "Índice frente a valor", activity: "Elegir posiciones en un array", minutes: 3, target: { exercise: "a2" } },
    { id: "array-length", topics: ["array-length"], minMistakes: 2,
      reason: "Los límites del array y `.length` aún se resisten, y son la causa del error más común.",
      concept: "Longitud y límites", activity: "Recorrido guiado paso a paso", minutes: 5, target: { sim: "1d" } },
    { id: "matrix", topics: ["matrix-rowcol", "jagged"], minMistakes: 2,
      reason: "En las matrices cuesta distinguir fila y columna. Una buena imagen lo arregla.",
      concept: "Filas y columnas", activity: "Seleccionar celdas en la matriz", minutes: 5, target: { sim: "2d" } },
    { id: "nested", topics: ["nested-loops"], minMistakes: 2,
      reason: "Los bucles anidados se entienden mejor viéndolos avanzar uno a uno.",
      concept: "Bucles anidados", activity: "Simulación paso a paso de una matriz", minutes: 6, target: { sim: "2d" } },
    { id: "basics", topics: ["variables", "conditions", "loops-for"], minMistakes: 2,
      reason: "Antes de seguir con arrays conviene afianzar un poco las bases.",
      concept: "Variables, condiciones y bucles", activity: "Repasar el diagnóstico", minutes: 5, target: { route: "#/leccion/b1" } }
  ];
  // Rendimiento alto: propone un reto.
  C.challengeRule = { minCompleted: 8, maxMistakeRatio: 0.25,
    reason: "Vas con muy buen ritmo y pocos fallos. ¿Te animas con algo más difícil?", concept: "Programar con arrays", activity: "Reto de programación", minutes: 10 };
})(window.LoWKie = window.LoWKie || {});

/* Reglas de «Avanzando» (mismo funcionamiento). Se evalúan después de las de la unidad base. */
(function (L) {
  var C = L.content;
  C.recommendationRules.push(
    { id: "adv-references", topics: ["references"], minMistakes: 2, reason: "Las referencias confunden a casi todo el mundo al principio: dos nombres, un mismo array.", concept: "Referencias y copias", activity: "Probar referencias y copias en el simulador", minutes: 5, target: { sim: "refs" } },
    { id: "adv-sorting", topics: ["sorting"], minMistakes: 2, reason: "Seguir una ordenación paso a paso ayuda mucho a entender cada comparación.", concept: "Ordenar", activity: "Ver la burbuja paso a paso", minutes: 5, target: { sim: "orden" } },
    { id: "adv-patterns", topics: ["patterns"], minMistakes: 2, reason: "Los patrones de recorrido se repiten en casi todos los problemas: merece la pena repasarlos.", concept: "Patrones de recorrido", activity: "Repasar acumular, contar y buscar", minutes: 6, target: { route: "#/leccion/x1/0" } },
    { id: "adv-methods", topics: ["methods"], minMistakes: 2, reason: "Pasar arrays a métodos conecta con las referencias: un repaso corto lo aclara.", concept: "Arrays y métodos", activity: "Repasar métodos con arrays", minutes: 6, target: { route: "#/leccion/x4/0" } },
    { id: "adv-matrix", topics: ["matrix-adv"], minMistakes: 2, reason: "En matrices, dibujar los índices en papel resuelve la mayoría de las dudas.", concept: "Matrices avanzadas", activity: "Repasar sumas y traspuestas", minutes: 6, target: { route: "#/leccion/x5/0" } },
    { id: "adv-errors", topics: ["errors"], minMistakes: 2, reason: "Leer bien una excepción es la habilidad que más tiempo ahorra al programar.", concept: "Errores y buenas prácticas", activity: "Repasar excepciones y casos límite", minutes: 5, target: { route: "#/leccion/x6/0" } }
  );
})(window.LoWKie);
