/* Ejercicios de la unidad (spec §7.7 y §14). Seis tipos:
   prediction · interpretation (opciones) · detection (línea errónea) · completar (huecos) · ordenar · programacion (Code Space).
   - `why`: por qué cada opción incorrecta es incorrecta (la corrección explica el razonamiento).
   - `verify`: permite a `pnpm test` comprobar con Java real que la respuesta correcta es cierta. */
(function (L) {
  var C = (L.content = L.content || {});

  function choice(id, type, topic, difficulty, title, prompt, code, options, answer, why, hints, explanation, extra) {
    return Object.assign({ id: id, type: type, topic: topic, difficulty: difficulty, title: title, prompt: prompt, code: code,
      options: options, correctAnswer: answer, why: why || {}, hints: hints, explanation: explanation, estimatedMinutes: 2 }, extra || {});
  }
  function detect(id, topic, difficulty, title, prompt, lines, answerLine, hints, explanation) {
    return { id: id, type: "detection", topic: topic, difficulty: difficulty, title: title, prompt: prompt, lines: lines,
      correctAnswer: answerLine, hints: hints, explanation: explanation, estimatedMinutes: 2 };
  }
  function program(id, topic, difficulty, title, prompt, file, starter, expected, solution, hints, explanation) {
    return { id: id, type: "programacion", topic: topic, difficulty: difficulty, title: title, prompt: prompt, file: file,
      starter: starter, expectedOutput: expected, solution: solution, hints: hints, explanation: explanation, estimatedMinutes: 8 };
  }

  C.exercises = [
    /* ---------- Bloque 1 · Diagnóstico ---------- */
    choice("d1", "prediction", "variables", "beginner", "Una variable calculada",
      "¿Qué imprime este código?", "int a = 5;\nint b = a * 2;\nSystem.out.println(b);",
      ["5", "10", "25", "b"], "10",
      { "5": "Ese es el valor de `a`. La variable `b` vale `a * 2`.", "25": "El operador `*` multiplica: 5 · 2, no 5 y 5.", "b": "`println` escribe el **valor** de la variable, no su nombre." },
      ["Primero calcula `b`: ¿cuánto es `a * 2`?", "`a` vale 5."], "`b` se calcula como `a * 2`, es decir, 5 · 2 = 10. `println(b)` muestra ese valor.", { verify: true }),

    choice("d2", "prediction", "conditions", "beginner", "Par o impar",
      "¿Qué imprime este código?", "int n = 7;\nif (n % 2 == 0) {\n    System.out.println(\"par\");\n} else {\n    System.out.println(\"impar\");\n}",
      ["par", "impar", "7", "No imprime nada"], "impar",
      { "par": "`7 % 2` es el **resto** de dividir 7 entre 2, que vale 1. No es 0, así que se ejecuta el `else`.", "7": "Ninguna de las ramas imprime `n`.", "No imprime nada": "Siempre se ejecuta una de las dos ramas: `if` o `else`." },
      ["`%` devuelve el resto de una división.", "7 entre 2 da 3 y sobra 1."], "`7 % 2 == 0` es falso (el resto es 1), así que Java ejecuta el `else` e imprime «impar».", { verify: true }),

    choice("d3", "prediction", "loops-for", "beginner", "Contar con for",
      "¿Qué imprime este código?", "for (int i = 0; i < 3; i++) {\n    System.out.print(i + \" \");\n}",
      ["0 1 2", "1 2 3", "0 1 2 3", "1 2"], "0 1 2",
      { "1 2 3": "El contador `i` empieza en 0, no en 1.", "0 1 2 3": "La condición es `i < 3`: cuando `i` vale 3 ya no se entra.", "1 2": "Empieza en 0 y llega hasta 2." },
      ["¿Con qué valor empieza `i`?", "El bucle se detiene cuando `i < 3` deja de cumplirse."], "`i` empieza en 0 y el bucle continúa mientras `i < 3`: vale 0, 1 y 2. Con `i = 3` la condición falla y termina.", { verify: true }),

    detect("d4", "variables", "beginner", "Tipos que no encajan", "Una de estas líneas tiene un error de tipos. ¿Cuál?",
      ["int edad = 17;", "int nombre = \"Ana\";", "String ciudad = \"Madrid\";", "double altura = 1.68;"], 2,
      ["Piensa qué tipo de dato puede guardar un `int`.", "Los textos entre comillas son de tipo `String`."],
      "Un `int` solo guarda números enteros. El texto `\"Ana\"` es un `String`: habría que escribir `String nombre = \"Ana\";`."),

    /* ---------- Bloque 2 · Arrays 1D ---------- */
    choice("a1", "prediction", "array-indexing", "beginner", "El tercer elemento",
      "¿Qué valor imprime este código?", "int[] numeros = {10, 20, 30, 40};\nSystem.out.println(numeros[2]);",
      ["10", "20", "30", "40"], "30",
      { "10": "Ese es `numeros[0]`, el primero.", "20": "Ese es `numeros[1]`. Has contado desde 1, pero Java empieza en 0.", "40": "Ese es `numeros[3]`, el último." },
      ["Recuerda que los índices comienzan en cero.", "La primera posición es `numeros[0]`."],
      "El índice 2 es la tercera posición: 0 → 10, 1 → 20, **2 → 30**.", { verify: true }),

    choice("a2", "interpretation", "index-vs-value", "beginner", "Índice o valor",
      "¿En qué **posición** (índice) está guardado el valor 8?", "int[] n = {5, 8, 3};",
      ["0", "1", "2", "8"], "1",
      { "0": "En la posición 0 está el 5.", "2": "En la posición 2 está el 3. Recuerda: se cuenta desde cero.", "8": "El 8 es el **valor**. La posición se llama **índice**." },
      ["Diferencia entre *dónde* está (índice) y *qué* hay (valor).", "Cuenta desde cero: 5 está en la posición 0."],
      "El 5 está en el índice 0 y el **8 en el índice 1**. Índice = posición; valor = lo que hay dentro.",
      { verify: { body: "int[] n = {5, 8, 3};\nfor (int i = 0; i < n.length; i++) { if (n[i] == 8) System.out.println(i); }", output: "1" } }),

    choice("a3", "interpretation", "array-length", "beginner", "El último índice",
      "Se crea un array de 6 posiciones. ¿Cuál es el **último índice válido**?", "int[] v = new int[6];",
      ["5", "6", "7", "0"], "5",
      { "6": "`v.length` vale 6, pero los índices van de 0 a `length - 1`. `v[6]` no existe.", "7": "Ese índice está aún más lejos del array.", "0": "El 0 es el **primero**, no el último." },
      ["Si empiezas en 0 y hay 6 posiciones, ¿en qué número terminas de contar?", "El último índice es `length - 1`."],
      "Hay 6 posiciones numeradas 0, 1, 2, 3, 4 y **5**. El último índice es siempre `v.length - 1`.",
      { verify: { body: "int[] v = new int[6];\nSystem.out.println(v.length - 1);", output: "5" } }),

    { id: "a4", type: "completar", topic: "array-length", difficulty: "beginner", title: "Recorrer sin pasarse",
      prompt: "Completa el hueco para recorrer todo el array.",
      template: "int[] pares = {2, 4, 6, 8};\nfor (int i = 0; i < pares.{{1}}; i++) {\n    System.out.println(pares[i]);\n}",
      blanks: [{ id: "1", options: ["length", "length()", "size", "size()"], answer: "length" }],
      why: { "length()": "`length()` con paréntesis es de los `String`. En arrays `length` va **sin** paréntesis.", "size": "`size` no existe en los arrays.", "size()": "`size()` es de listas (`ArrayList`), no de arrays." },
      hints: ["¿Cómo se pedía el número de elementos de un array?", "Es una propiedad, no un método: sin paréntesis."],
      explanation: "La longitud de un array es la propiedad `length` (sin paréntesis). Así el bucle se adapta aunque cambie el tamaño.",
      estimatedMinutes: 2, verify: { prelude: "", output: "2 4 6 8" } },

    /* ---------- Bloque 3 · Operaciones ---------- */
    choice("o1", "prediction", "array-modify", "beginner", "Modificar y leer",
      "¿Qué imprime este código?", "int[] a = {1, 2, 3};\na[1] = a[0] + a[2];\nSystem.out.println(a[1]);",
      ["2", "3", "4", "6"], "4",
      { "2": "Ese era el valor de `a[1]` **antes** de modificarlo.", "3": "Ese es `a[2]`; se suma con `a[0]`.", "6": "Sumarías los tres elementos. Solo se suman `a[0]` y `a[2]`." },
      ["Primero se calcula la parte derecha: `a[0] + a[2]`.", "Después el resultado se guarda en `a[1]`."],
      "`a[0] + a[2]` es 1 + 3 = 4. Ese valor se guarda en `a[1]`, que pasa de 2 a **4**.", { verify: true }),

    detect("o2", "array-length", "intermediate", "El bucle que se pasa", "Este programa falla al ejecutarse con una `ArrayIndexOutOfBoundsException`. ¿Qué línea contiene el error?",
      ["int[] numeros = {4, 8, 15, 16};", "for (int i = 0; i <= numeros.length; i++) {", "    System.out.println(numeros[i]);", "}"], 2,
      ["Piensa en el último valor que toma `i`.", "¿Qué diferencia hay entre `<` y `<=`?"],
      "Con `i <= numeros.length`, `i` llega a 4 y `numeros[4]` no existe (los índices válidos son 0–3). Debe ser `i < numeros.length`."),

    { id: "o3", type: "ordenar", topic: "programming", difficulty: "intermediate", title: "Sumar un array",
      prompt: "Ordena las instrucciones para que el programa imprima la **suma** de los elementos.",
      lines: ["int[] datos = {4, 6, 10};", "int suma = 0;", "for (int i = 0; i < datos.length; i++) {", "    suma += datos[i];", "}", "System.out.println(suma);"],
      correctOrders: [[0, 1, 2, 3, 4, 5], [1, 0, 2, 3, 4, 5]],
      hints: ["Hay que **tener** las variables antes de usarlas.", "El `println` va al final, cuando la suma ya está calculada.", "La llave `}` cierra el `for`, así que va después de su contenido."],
      explanation: "Primero se declaran el array y el acumulador `suma` (en cualquier orden), luego el bucle suma cada `datos[i]` y, al terminar, se imprime el total: **20**.",
      estimatedMinutes: 3, verify: { output: "20" } },

    program("o4", "programming", "intermediate", "Suma de un array",
      "Completa el programa: recorre el array `datos` con un `for` y muestra la suma de todos sus elementos.",
      "ejercicios/Ejercicio1.java",
      "// Ejercicio 1: recorre el array e imprime la suma de todos sus elementos.\npublic class Ejercicio1 {\n    public static void main(String[] args) {\n        int[] datos = {3, 5, 8, 2};\n        // TODO: calcula e imprime la suma\n    }\n}\n",
      "18",
      "public class Ejercicio1 {\n    public static void main(String[] args) {\n        int[] datos = {3, 5, 8, 2};\n        int suma = 0;\n        for (int i = 0; i < datos.length; i++) {\n            suma += datos[i];\n        }\n        System.out.println(suma);\n    }\n}\n",
      ["Necesitas una variable `suma` que empiece en 0.", "Dentro del `for`, suma `datos[i]` a esa variable.", "Imprime `suma` **después** del bucle."],
      "Un acumulador (`suma`) empieza en 0 y el bucle le añade cada `datos[i]`. 3 + 5 + 8 + 2 = **18**."),

    /* ---------- Bloque 4 · Arrays 2D ---------- */
    choice("m1", "prediction", "matrix-rowcol", "beginner", "Fila y columna",
      "¿Qué valor imprime este código?", "int[][] matriz = {\n    {1, 2, 3},\n    {4, 5, 6},\n    {7, 8, 9}\n};\nSystem.out.println(matriz[1][2]);",
      ["2", "4", "6", "8"], "6",
      { "2": "Ese está en la fila 0, columna 1.", "4": "Ese está en la fila 1 pero en la columna **0**.", "8": "Ese es `matriz[2][1]`: has leído columna y fila al revés. Primero va la **fila**." },
      ["Primer índice: fila. Segundo índice: columna.", "La fila 1 es la segunda: `{4, 5, 6}`."],
      "`matriz[1][2]` es la **fila 1** (`{4, 5, 6}`) y dentro de ella la **columna 2** (el tercer elemento): **6**.", { verify: true }),

    choice("m2", "interpretation", "matrix-rowcol", "beginner", "Contar columnas",
      "¿Cuánto vale `tabla[0].length` (las columnas de la primera fila)?", "int[][] tabla = {\n    {3, 1, 4, 1},\n    {5, 9, 2, 6}\n};",
      ["2", "4", "6", "8"], "4",
      { "2": "Eso es `tabla.length`: el número de **filas**.", "6": "6 es un valor guardado, no una longitud.", "8": "Son los valores totales (2 × 4). `tabla[0].length` cuenta solo los de una fila." },
      ["`tabla[0]` es la primera fila, un array de números.", "Cuenta cuántos elementos tiene `{3, 1, 4, 1}`."],
      "`tabla[0]` es `{3, 1, 4, 1}`, un array de **4** elementos. `tabla.length` (2) cuenta filas; `tabla[0].length` (4) cuenta columnas.",
      { verify: { body: "int[][] tabla = {{3, 1, 4, 1}, {5, 9, 2, 6}};\nSystem.out.println(tabla[0].length);", output: "4" } }),

    detect("m3", "matrix-rowcol", "intermediate", "Una fila que no existe", "Una de estas líneas lanzará una excepción por usar un índice que no existe. ¿Cuál?",
      ["int[][] sala = {{1, 0}, {0, 1}, {1, 1}};", "System.out.println(sala[0][1]);", "System.out.println(sala[2][0]);", "System.out.println(sala[3][0]);"], 4,
      ["Cuenta cuántas filas tiene `sala`.", "Si hay 3 filas, ¿qué índices de fila son válidos?"],
      "`sala` tiene 3 filas (índices 0, 1 y 2). `sala[3]` no existe y provoca `ArrayIndexOutOfBoundsException`."),

    choice("m4", "prediction", "jagged", "intermediate", "Filas distintas",
      "¿Qué imprime este código?", "int[][] t = {{1}, {2, 3}, {4, 5, 6}};\nSystem.out.println(t[2].length);",
      ["1", "2", "3", "6"], "3",
      { "1": "Esa es la longitud de `t[0]`. Aquí se pregunta por `t[2]`, la tercera fila.", "2": "Esa es la longitud de `t[1]`.", "6": "6 es el último **valor** de `t[2]`, no su longitud." },
      ["Cada fila es un array con su propia longitud.", "`t[2]` es `{4, 5, 6}`."],
      "En Java una matriz es un array de arrays y cada fila puede medir distinto. `t[2]` es `{4, 5, 6}`: longitud **3**.", { verify: true }),

    /* ---------- Bloque 5 · Bucles anidados ---------- */
    choice("n1", "prediction", "nested-loops", "intermediate", "Cuántas vueltas",
      "¿Qué imprime este código?", "int cuenta = 0;\nfor (int i = 0; i < 2; i++) {\n    for (int j = 0; j < 3; j++) {\n        cuenta++;\n    }\n}\nSystem.out.println(cuenta);",
      ["2", "3", "5", "6"], "6",
      { "2": "Eso sería solo el bucle de fuera. El de dentro se repite por cada vuelta.", "3": "Eso sería una sola vuelta del externo. Hay dos.", "5": "No se **suman** las vueltas (2 + 3): el interno se ejecuta entero **por cada** vuelta del externo." },
      ["El bucle de dentro da una vuelta completa por cada paso del de fuera.", "¿Cuánto es 2 veces 3?"],
      "El externo hace 2 vueltas y en cada una el interno hace 3: 2 × 3 = **6**.", { verify: true }),

    { id: "n2", type: "completar", topic: "nested-loops", difficulty: "intermediate", title: "Recorrer toda la matriz",
      prompt: "Completa los dos huecos para recorrer filas y columnas.",
      template: "for (int fila = 0; fila < matriz.{{1}}; fila++) {\n    for (int columna = 0; columna < matriz[fila].{{2}}; columna++) {\n        System.out.print(matriz[fila][columna] + \" \");\n    }\n    System.out.println();\n}",
      blanks: [{ id: "1", options: ["length", "length()", "size()", "columnas"], answer: "length" },
               { id: "2", options: ["length", "length()", "size()", "filas"], answer: "length" }],
      why: { "length()": "Con paréntesis es de `String`. En arrays: `length`.", "size()": "`size()` es de listas, no de arrays.", "columnas": "Java no tiene una propiedad `columnas`: se obtiene con `matriz[fila].length`.", "filas": "Java no tiene una propiedad `filas`: las filas son `matriz.length`." },
      hints: ["`matriz.length` cuenta las filas.", "`matriz[fila].length` cuenta las columnas de **esa** fila."],
      explanation: "El bucle externo recorre `matriz.length` (filas) y el interno `matriz[fila].length` (columnas de la fila actual). Usar `matriz[fila].length` funciona también con filas de distinta longitud.",
      estimatedMinutes: 3, verify: { prelude: "int[][] matriz = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};\n", output: "1 2 3 4 5 6 7 8 9" } },

    choice("n3", "prediction", "nested-loops", "intermediate", "El orden del recorrido",
      "¿Qué imprime este código?", "int[][] m = {{1, 2}, {3, 4}};\nfor (int i = 0; i < m.length; i++) {\n    for (int j = 0; j < m[i].length; j++) {\n        System.out.print(m[i][j] + \" \");\n    }\n}",
      ["1 2 3 4", "1 3 2 4", "1 2 4 3", "4 3 2 1"], "1 2 3 4",
      { "1 3 2 4": "Eso recorrería **por columnas**. Aquí el bucle externo elige la fila: se leen entera `{1, 2}` y luego `{3, 4}`.", "1 2 4 3": "Cada fila se recorre de izquierda a derecha, siempre de la columna 0 a la última.", "4 3 2 1": "Esto sería recorrerlo de atrás hacia delante; los bucles empiezan en 0." },
      ["El bucle de fuera (`i`) es la fila.", "Se recorre una fila completa antes de pasar a la siguiente."],
      "Fila 0: `m[0][0]`=1, `m[0][1]`=2. Fila 1: `m[1][0]`=3, `m[1][1]`=4. Resultado: **1 2 3 4**.", { verify: true }),

    program("n4", "programming", "intermediate", "Suma de una matriz",
      "Recorre la matriz con **dos bucles** y muestra la suma de todos sus valores.",
      "ejercicios/Ejercicio2.java",
      "// Ejercicio 2: suma todos los números de la matriz e imprime el resultado.\npublic class Ejercicio2 {\n    public static void main(String[] args) {\n        int[][] matriz = {\n            {1, 2, 3},\n            {4, 5, 6},\n            {7, 8, 9}\n        };\n        // TODO: recorre la matriz con dos bucles y suma todos sus valores\n    }\n}\n",
      "45",
      "public class Ejercicio2 {\n    public static void main(String[] args) {\n        int[][] matriz = {\n            {1, 2, 3},\n            {4, 5, 6},\n            {7, 8, 9}\n        };\n        int suma = 0;\n        for (int fila = 0; fila < matriz.length; fila++) {\n            for (int columna = 0; columna < matriz[fila].length; columna++) {\n                suma += matriz[fila][columna];\n            }\n        }\n        System.out.println(suma);\n    }\n}\n",
      ["Necesitas un acumulador `suma` fuera de los bucles.", "Usa `matriz.length` para las filas y `matriz[fila].length` para las columnas.", "Dentro del bucle interno: `suma += matriz[fila][columna];`"],
      "Un bucle anidado visita las 9 celdas y las acumula en `suma`: 1 + 2 + … + 9 = **45**."),

    /* ---------- Bloque 6 · Laboratorio ---------- */
    program("l1", "programming", "intermediate", "El valor máximo",
      "Encuentra e imprime el **mayor** valor del array.",
      "ejercicios/Ejercicio3.java",
      "// Ejercicio 3: encuentra e imprime el mayor valor del array.\npublic class Ejercicio3 {\n    public static void main(String[] args) {\n        int[] datos = {7, 3, 9, 4};\n        // TODO: calcula e imprime el máximo\n    }\n}\n",
      "9",
      "public class Ejercicio3 {\n    public static void main(String[] args) {\n        int[] datos = {7, 3, 9, 4};\n        int max = datos[0];\n        for (int i = 1; i < datos.length; i++) {\n            if (datos[i] > max) {\n                max = datos[i];\n            }\n        }\n        System.out.println(max);\n    }\n}\n",
      ["Guarda en una variable `max` el primer elemento.", "Recorre el resto y, si `datos[i]` es mayor que `max`, actualiza `max`."],
      "Partimos de `datos[0]` como mayor provisional y lo sustituimos cada vez que encontramos uno más grande. Resultado: **9**."),

    program("l2", "programming", "challenge", "Reto: la diagonal",
      "Suma los elementos de la **diagonal principal** (fila = columna) de la matriz.",
      "ejercicios/Ejercicio4.java",
      "// Ejercicio 4 (reto): suma la diagonal principal de la matriz (1 + 5 + 9).\npublic class Ejercicio4 {\n    public static void main(String[] args) {\n        int[][] matriz = {\n            {1, 2, 3},\n            {4, 5, 6},\n            {7, 8, 9}\n        };\n        // TODO: suma e imprime la diagonal principal\n    }\n}\n",
      "15",
      "public class Ejercicio4 {\n    public static void main(String[] args) {\n        int[][] matriz = {\n            {1, 2, 3},\n            {4, 5, 6},\n            {7, 8, 9}\n        };\n        int suma = 0;\n        for (int i = 0; i < matriz.length; i++) {\n            suma += matriz[i][i];\n        }\n        System.out.println(suma);\n    }\n}\n",
      ["La diagonal son las celdas `[0][0]`, `[1][1]`, `[2][2]`…", "No hace falta un bucle anidado: un solo contador sirve de fila **y** de columna."],
      "En la diagonal fila y columna coinciden, así que basta un bucle con `matriz[i][i]`: 1 + 5 + 9 = **15**."),

    program("l3", "programming", "challenge", "Reto: al revés",
      "Imprime los elementos del array **de atrás hacia delante**, uno por línea.",
      "ejercicios/Ejercicio5.java",
      "// Ejercicio 5 (reto): imprime el array al revés, un número por línea (4, 3, 2, 1).\npublic class Ejercicio5 {\n    public static void main(String[] args) {\n        int[] datos = {1, 2, 3, 4};\n        // TODO: recorre el array desde el último índice hasta el 0\n    }\n}\n",
      "4 3 2 1",
      "public class Ejercicio5 {\n    public static void main(String[] args) {\n        int[] datos = {1, 2, 3, 4};\n        for (int i = datos.length - 1; i >= 0; i--) {\n            System.out.println(datos[i]);\n        }\n    }\n}\n",
      ["El último índice es `datos.length - 1`.", "El contador debe **bajar**: `i--` y la condición `i >= 0`."],
      "El bucle empieza en el último índice (`length - 1`), baja de uno en uno y para al llegar a 0."),

    /* ---------- Bloque 7 · Cierre ---------- */
    choice("c1", "prediction", "array-modify", "intermediate", "Un acumulador",
      "¿Qué imprime este código?", "int[] a = {2, 4, 6};\nint total = 0;\nfor (int i = 0; i < a.length; i++) {\n    total += a[i];\n}\nSystem.out.println(total);",
      ["6", "12", "24", "2"], "12",
      { "6": "Ese es el último elemento, no la suma.", "24": "Eso sería multiplicar (2·4·6). El operador es `+=`.", "2": "Ese es el primer elemento." },
      ["`total += a[i]` equivale a `total = total + a[i]`.", "¿Cuánto es 2 + 4 + 6?"], "El bucle suma los tres elementos: 0 + 2 + 4 + 6 = **12**.", { verify: true }),

    detect("c2", "nested-loops", "intermediate", "Columnas de más", "Este programa falla con una excepción. ¿Qué línea contiene el error?",
      ["int[][] m = new int[2][3];", "for (int f = 0; f < m.length; f++) {", "    for (int c = 0; c <= m[f].length; c++) {", "        m[f][c] = f + c;", "    }", "}"], 3,
      ["Cada fila tiene 3 columnas: índices 0, 1 y 2.", "Mira la condición del bucle interno."],
      "`c <= m[f].length` hace que `c` llegue a 3, y `m[f][3]` no existe. Debe ser `c < m[f].length`."),

    choice("c3", "interpretation", "jagged", "intermediate", "¿Qué es `int[][]`?",
      "En Java, ¿qué es exactamente una matriz `int[][] m`?", "",
      ["Un array donde cada elemento es otro array", "Una tabla que siempre tiene el mismo número de columnas", "Un único array con el doble de posiciones", "Dos arrays unidos con +"],
      "Un array donde cada elemento es otro array",
      { "Una tabla que siempre tiene el mismo número de columnas": "No siempre: cada fila puede tener **su propia longitud** (matrices irregulares).", "Un único array con el doble de posiciones": "Son varios arrays (las filas) agrupados en otro array.", "Dos arrays unidos con +": "Java no une arrays con `+`." },
      ["Piensa en `matriz[0]`: ¿qué tipo de dato es?", "`matriz[0]` es una fila entera."],
      "`int[][]` es un **array de arrays**: cada `m[i]` es un `int[]` independiente. Por eso las filas pueden medir distinto.")
  ];

  C.exerciseById = function (id) { return C.exercises.filter(function (e) { return e.id === id; })[0] || null; };
})(window.LoWKie = window.LoWKie || {});
