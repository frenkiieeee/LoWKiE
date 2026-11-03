/* Unidad 1 · Arrays en Java — estructura de la sesión de 90 minutos (spec §7.2).
   Es un script (no JSON) porque fetch() de archivos locales no funciona con file://.
   Formatos de texto: `código` y **negrita**. Cada bloque = una parte de la sesión; cada paso = una pantalla. */
(function (L) {
  var C = (L.content = L.content || {});

  C.unit = {
    id: "java-arrays",
    title: "Arrays en Java",
    summary: "Arrays unidimensionales y bidimensionales: índices, longitud y recorridos con bucles.",
    goals: [
      "Entender qué es un array y qué problema resuelve.",
      "Acceder y modificar elementos usando índices desde cero.",
      "Representar una matriz con filas y columnas.",
      "Recorrer matrices con bucles anidados.",
      "Escribir pequeños programas Java con arrays y bucles."
    ]
  };

  // Conceptos evaluables (el campo `topic` de cada ejercicio apunta aquí).
  C.topics = {
    "variables": "Variables y tipos",
    "conditions": "Condiciones",
    "loops-for": "Bucle for",
    "array-indexing": "Índices de un array",
    "index-vs-value": "Índice frente a valor",
    "array-length": "Longitud (.length) y límites",
    "array-modify": "Leer y modificar elementos",
    "matrix-rowcol": "Filas y columnas",
    "jagged": "Matrices como arrays de arrays",
    "nested-loops": "Bucles anidados",
    "programming": "Programar con arrays"
  };

  C.blocks = [
    {
      id: "b1", time: "00–10", minutes: 10, title: "Diagnóstico",
      goal: "Recuperar variables, tipos, condiciones y bucles",
      facilitator: "No es un examen. Observa qué pregunta le cuesta más y empieza por ahí. Si acierta las cuatro sin pistas, puedes pasar rápido al bloque 2.",
      steps: [
        { kind: "theory", title: "Antes de empezar",
          body: ["Vamos a repasar lo que ya sabes: **variables**, **tipos**, **condiciones** y **bucles**. No puntúa: sirve para saber por dónde empezar.",
                 "Lee este ejemplo. Cuatro preguntas cortas te esperan después."],
          code: "int edad = 17;\n\nif (edad >= 18) {\n    System.out.println(\"Mayor de edad\");\n} else {\n    System.out.println(\"Menor de edad\");\n}\n\nfor (int i = 0; i < 3; i++) {\n    System.out.println(\"Vuelta \" + i);\n}",
          caption: "Una variable, una condición y un bucle `for`." },
        { kind: "exercise", id: "d1" }, { kind: "exercise", id: "d2" },
        { kind: "exercise", id: "d3" }, { kind: "exercise", id: "d4" }
      ]
    },
    {
      id: "b2", time: "10–25", minutes: 15, title: "Arrays 1D",
      goal: "Comprender estructura, índice y longitud",
      facilitator: "Insiste en tres palabras: **índice** (posición, empieza en 0), **valor** (lo que hay dentro) y **longitud** (cuántos hay). Pide que prediga antes de pulsar en el simulador.",
      steps: [
        { kind: "theory", title: "¿Qué problema resuelve un array?",
          body: ["Imagina guardar las notas de 30 alumnos. Con variables sueltas necesitarías 30 nombres distintos. Un **array** es una colección de valores del **mismo tipo** guardados uno detrás de otro bajo un único nombre.",
                 "Variable individual: guarda **un** valor. Array: guarda **varios**, y cada uno tiene su posición."],
          code: "// Sin array: un nombre por cada valor\nint nota1 = 7;\nint nota2 = 9;\nint nota3 = 5;\n\n// Con array: un solo nombre\nint[] notas = {7, 9, 5};",
          caption: "Mismo dato, dos formas de guardarlo." },
        { kind: "theory", title: "Declarar e inicializar",
          body: ["Hay dos formas habituales. Con valores conocidos: `int[] numeros = {10, 20, 30, 40};`. Con un tamaño y sin valores: `int[] vacio = new int[4];`, que crea cuatro posiciones valiendo `0`.",
                 "**Importante:** un array de Java tiene **tamaño fijo**. Una vez creado, no puede crecer ni encogerse."],
          code: "int[] numeros = {10, 20, 30, 40};\nint[] vacio = new int[4];   // {0, 0, 0, 0}",
          sim: { type: "1d", values: [10, 20, 30, 40], panels: ["select", "resize"], name: "numeros" },
          caption: "Prueba a crear un array nuevo con otra longitud." },
        { kind: "theory", title: "Índices desde cero y `.length`",
          body: ["Cada elemento tiene un **índice**: su posición. El primero es el `0`, no el `1`. Por eso `numeros[2]` es el **tercer** elemento.",
                 "`numeros.length` te dice **cuántos** elementos hay (sin paréntesis). El último índice válido siempre es `length - 1`."],
          code: "int[] numeros = {10, 20, 30, 40};\n\nSystem.out.println(numeros[0]);      // 10\nSystem.out.println(numeros[2]);      // 30\nSystem.out.println(numeros.length);  // 4",
          sim: { type: "1d", values: [10, 20, 30, 40], panels: ["select"], name: "numeros" },
          caption: "Pulsa una casilla: fíjate en el índice (arriba) y el valor (dentro)." },
        { kind: "exercise", id: "a1" }, { kind: "exercise", id: "a2" },
        { kind: "exercise", id: "a3" }, { kind: "exercise", id: "a4" }
      ]
    },
    {
      id: "b3", time: "25–40", minutes: 15, title: "Operaciones",
      goal: "Leer, modificar y recorrer arrays",
      facilitator: "El error `i <= numeros.length` es el más común del día. Deja que lo cometa en el simulador de errores y lea el mensaje de la excepción antes de explicarlo.",
      steps: [
        { kind: "theory", title: "Leer y modificar un elemento",
          body: ["Para **leer**: `numeros[1]`. Para **modificar**: `numeros[1] = 25;`. El resto del array no cambia.",
                 "Cambia un valor en el simulador y observa cómo se escribe la instrucción."],
          code: "int[] numeros = {10, 20, 30, 40};\nnumeros[1] = 25;\nSystem.out.println(numeros[1]);   // 25",
          sim: { type: "1d", values: [10, 20, 30, 40], panels: ["select", "edit"], name: "numeros" } },
        { kind: "exercise", id: "o1" },
        { kind: "theory", title: "Recorrer un array con `for`",
          body: ["Para visitar **todos** los elementos usamos un bucle cuyo contador `i` hace de índice: empieza en `0` y avanza mientras `i < numeros.length`.",
                 "**Ampliación:** existe el bucle `for-each`, que recorre los valores sin índice. Úsalo cuando solo necesites leer."],
          code: "for (int i = 0; i < numeros.length; i++) {\n    System.out.println(numeros[i]);\n}\n\n// for-each (ampliación)\nfor (int valor : numeros) {\n    System.out.println(valor);\n}",
          sim: { type: "1d", values: [10, 20, 30, 40], panels: ["traverse"], name: "numeros" },
          caption: "Avanza paso a paso y mira cómo cambian `i` y la condición." },
        { kind: "theory", title: "El error más frecuente",
          body: ["Si pides un índice que no existe, Java detiene el programa con una `ArrayIndexOutOfBoundsException`. Sucede, por ejemplo, con `numeros[4]` en un array de 4 elementos (los índices válidos son 0 a 3).",
                 "Pruébalo sin miedo: equivocarse aquí es la mejor forma de recordarlo."],
          code: "int[] numeros = {10, 20, 30, 40};\nSystem.out.println(numeros[4]);   // ¡Error!\n// ArrayIndexOutOfBoundsException:\n// Index 4 out of bounds for length 4",
          sim: { type: "1d", values: [10, 20, 30, 40], panels: ["probe"], name: "numeros" } },
        { kind: "exercise", id: "o2" }, { kind: "exercise", id: "o3" }, { kind: "exercise", id: "o4" }
      ]
    },
    {
      id: "b4", time: "40–55", minutes: 15, title: "Arrays 2D",
      goal: "Comprender filas, columnas e índices dobles",
      facilitator: "Usa la tabla de un horario o un tablero de barcos. Primero la **fila** (hacia abajo), luego la **columna** (hacia la derecha). Pide que lo diga en voz alta: «fila 1, columna 2».",
      steps: [
        { kind: "theory", title: "¿Qué es una matriz?",
          body: ["Una **matriz** es una tabla de valores con **filas** y **columnas**: como una hoja de cálculo, una cuadrícula de asientos o un tablero.",
                 "En Java es un array **con dos índices**: el primero elige la fila y el segundo la columna."],
          code: "int[][] matriz = {\n    {1, 2, 3},\n    {4, 5, 6},\n    {7, 8, 9}\n};",
          sim: { type: "2d", values: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], panels: ["select"], name: "matriz" },
          caption: "Pulsa una celda y mira sus dos índices." },
        { kind: "theory", title: "Acceder con dos índices: `matriz[fila][columna]`",
          body: ["Se lee de izquierda a derecha: primero la **fila**, después la **columna**. `matriz[1][2]` es la fila 1 (la segunda) y la columna 2 (la tercera): el valor `6`.",
                 "Y como en los arrays de una dimensión, **todo empieza en cero**."],
          code: "System.out.println(matriz[0][0]);   // 1\nSystem.out.println(matriz[1][2]);   // 6\nmatriz[2][1] = 80;                  // cambia el 8",
          sim: { type: "2d", values: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], panels: ["select", "edit"], name: "matriz" } },
        { kind: "theory", title: "Filas, columnas y arrays de arrays",
          body: ["`matriz.length` son las **filas**. `matriz[0].length` son las **columnas** de la fila 0.",
                 "En Java una matriz es en realidad un **array de arrays**: cada fila es un array propio, y **las filas pueden tener longitudes distintas**. No des por hecho que todas son rectangulares."],
          code: "int[][] irregular = {\n    {1},\n    {2, 3},\n    {4, 5, 6}\n};\nSystem.out.println(irregular.length);      // 3 filas\nSystem.out.println(irregular[2].length);   // 3\nSystem.out.println(irregular[0].length);   // 1",
          sim: { type: "2d", values: [[1], [2, 3], [4, 5, 6]], panels: ["select", "resize"], name: "irregular" },
          caption: "Cada fila tiene su propia longitud." },
        { kind: "exercise", id: "m1" }, { kind: "exercise", id: "m2" },
        { kind: "exercise", id: "m3" }, { kind: "exercise", id: "m4" }
      ]
    },
    {
      id: "b5", time: "55–70", minutes: 15, title: "Bucles anidados",
      goal: "Recorrer matrices paso a paso",
      facilitator: "Idea clave: el bucle de **fuera** elige la fila; el de **dentro** recorre todas las columnas de esa fila *antes* de que la fila avance. Compáralo con leer un libro: línea a línea.",
      steps: [
        { kind: "theory", title: "Recorrer una matriz con dos bucles",
          body: ["Para visitar todas las celdas necesitamos **dos bucles, uno dentro del otro**. El de fuera recorre las filas; el de dentro, las columnas de esa fila.",
                 "Avanza paso a paso y observa que la columna da una vuelta completa por cada paso de la fila."],
          code: "for (int fila = 0; fila < matriz.length; fila++) {\n    for (int columna = 0; columna < matriz[fila].length; columna++) {\n        System.out.print(matriz[fila][columna] + \" \");\n    }\n    System.out.println();\n}",
          sim: { type: "2d", values: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], panels: ["traverse"], name: "matriz" } },
        { kind: "exercise", id: "n1" }, { kind: "exercise", id: "n2" },
        { kind: "exercise", id: "n3" }, { kind: "exercise", id: "n4" }
      ]
    },
    {
      id: "b6", time: "70–85", minutes: 15, title: "Laboratorio",
      goal: "Resolver problemas combinados",
      facilitator: "Aquí programa de verdad. Deja que se atasque un par de minutos antes de dar pistas. Los dos últimos son reto: no hace falta que los termine.",
      steps: [
        { kind: "theory", title: "Hora de programar",
          body: ["Estos ejercicios se programan **en esta misma pantalla**: escribe tu solución en el editor, pulsa «Ejecutar» para probarla y «Comprobar» cuando creas que está lista.",
                 "Si Java no está instalado, LoWKie te ofrecerá instalarlo con un clic. Si prefieres un editor más grande, usa «Abrir en Code Space»."] },
        { kind: "exercise", id: "l1" }, { kind: "exercise", id: "l2" }, { kind: "exercise", id: "l3" }
      ]
    },
    {
      id: "b7", time: "85–90", minutes: 5, title: "Cierre",
      goal: "Comprobar comprensión y registrar progreso",
      facilitator: "Pide que explique con sus palabras la diferencia entre índice, valor y longitud. Revisa juntos el resumen de conceptos a reforzar.",
      steps: [
        { kind: "exercise", id: "c1" }, { kind: "exercise", id: "c2" }, { kind: "exercise", id: "c3" },
        { kind: "summary", title: "Resumen de la sesión" }
      ]
    }
  ];
})(window.LoWKie = window.LoWKie || {});
