/* «Avanzando»: segunda parte de la unidad Arrays. Se apoya en la unidad base sin modificarla:
   ids propios (x1…x6) para que el progreso ya guardado siga siendo válido.
   Cada paso lleva `section` (tema) → módulo › tema › paso. Los `tip` son consejos destacados. */
(function (L) {
  var C = (L.content = L.content || {});

  Object.assign(C.topics, {
    "patterns": "Patrones de recorrido",
    "modify-copy": "Modificar y copiar arrays",
    "references": "Referencias y copias",
    "sorting": "Ordenar",
    "methods": "Arrays y métodos",
    "matrix-adv": "Matrices avanzadas",
    "errors": "Errores y buenas prácticas"
  });

  C.advanced = {
    id: "java-arrays-advanced",
    title: "Avanzando",
    summary: "Patrones, copias, ordenación, métodos y matrices más allá de lo básico, con consejos para programar mejor.",
    prerequisite: "Recomendado después de completar la Unidad 1 (puedes entrar cuando quieras).",
    takeaways: [
      "Casi todo problema con arrays es acumular, contar, buscar o quedarse con «el mejor hasta ahora».",
      "Inicializa bien las variables antes del bucle: máximo con el primer elemento, contadores a 0.",
      "`b = a` no copia: son dos nombres del mismo array. Para copiar, `clone()` o `Arrays.copyOf`.",
      "Para intercambiar dos valores necesitas una variable auxiliar.",
      "Un método que recibe un array puede modificar el original.",
      "En matrices irregulares usa siempre `m[f].length` en el bucle interno.",
      "Declarar no es crear: un array sin `new` vale `null` y provoca `NullPointerException`.",
      "Prueba los casos límite: vacío, un elemento, repetidos y negativos."
    ],
    blocks: [
      {
        id: "x1", minutes: 20, title: "Patrones de recorrido", goal: "Acumular, contar, buscar y quedarse con el mejor",
        facilitator: "Pide que, antes de escribir, diga en voz alta qué guarda cada variable. Si dice «el máximo empieza en 0», pregúntale qué pasa con valores negativos.",
        steps: [
          { kind: "theory", section: "Acumular y contar", title: "Tres patrones que se repiten siempre",
            body: ["Casi todos los problemas con arrays se resuelven con uno de estos patrones: **acumular** (sumar), **contar** (cuántos cumplen algo) y **buscar** (¿existe?).",
                   "Lo importante no es memorizar código, sino saber **qué guarda cada variable** y con qué valor empieza."],
            code: "int[] datos = {4, 7, 10, 3, 8};\nint suma = 0;            // acumular\nint pares = 0;           // contar\nboolean hay10 = false;   // buscar\n\nfor (int i = 0; i < datos.length; i++) {\n    suma += datos[i];\n    if (datos[i] % 2 == 0) {\n        pares++;\n    }\n    if (datos[i] == 10) {\n        hay10 = true;\n    }\n}",
            tip: "Antes de escribir el bucle, di en voz alta qué guarda cada variable y con qué valor empieza. La mitad de los errores están en esa línea inicial." },
          { kind: "exercise", id: "x1a", section: "Acumular y contar" },
          { kind: "theory", section: "Buscar", title: "Buscar un valor",
            body: ["Se usa una variable `boolean` que empieza en `false` y pasa a `true` cuando se encuentra el valor.",
                   "Si solo importa **saber si existe**, puedes parar el bucle en cuanto aparece con `break`: no hace falta seguir mirando."],
            code: "boolean encontrado = false;\nfor (int i = 0; i < datos.length; i++) {\n    if (datos[i] == objetivo) {\n        encontrado = true;\n        break;   // ya no hace falta seguir\n    }\n}",
            tip: "Un `boolean` que empieza en `false` y se vuelve `true` es la forma más limpia de responder «¿hay alguno que…?»." },
          { kind: "exercise", id: "x1b", section: "Buscar" },
          { kind: "theory", section: "El mejor hasta ahora", title: "El patrón del «mejor hasta ahora»",
            body: ["Para el **máximo** (o el mínimo) guardas el mejor valor visto hasta el momento y lo cambias cuando aparece uno mejor.",
                   "Lo delicado es el **valor inicial**: debe ser un valor real del array."],
            code: "int max = datos[0];   // el primero, no 0\nfor (int i = 1; i < datos.length; i++) {\n    if (datos[i] > max) {\n        max = datos[i];\n    }\n}",
            tip: "Inicializa con el primer elemento, no con 0: si todos los valores son negativos, el máximo real no puede ser 0." },
          { kind: "exercise", id: "x1c", section: "El mejor hasta ahora" },
          { kind: "exercise", id: "x1d", section: "El mejor hasta ahora" }
        ]
      },
      {
        id: "x2", minutes: 25, title: "Modificar y copiar", goal: "Intercambiar, invertir y entender referencias y copias",
        facilitator: "Las referencias son lo más abstracto del módulo: usa el simulador de referencias y que prediga antes de pulsar cada botón. Analogía: dos nombres para el mismo buzón.",
        steps: [
          { kind: "theory", section: "Intercambiar", title: "Intercambiar dos elementos",
            body: ["Para intercambiar dos valores necesitas una variable auxiliar que guarde uno temporalmente.",
                   "Sin ella pierdes un valor: `a[0] = a[1];` borra el contenido original de `a[0]`."],
            code: "int[] a = {1, 2};\nint temp = a[0];\na[0] = a[1];\na[1] = temp;      // a = {2, 1}",
            tip: "Piensa en intercambiar el contenido de dos vasos: necesitas un tercer vaso vacío." },
          { kind: "exercise", id: "x2a", section: "Intercambiar" },
          { kind: "theory", section: "Invertir", title: "Invertir un array",
            body: ["Invertir es intercambiar parejas simétricas: el primero con el último, el segundo con el penúltimo…",
                   "El índice simétrico de `i` es `a.length - 1 - i`. Solo hay que recorrer **hasta la mitad**."],
            code: "int[] a = {1, 2, 3, 4, 5};\nfor (int i = 0; i < a.length / 2; i++) {\n    int j = a.length - 1 - i;\n    int temp = a[i];\n    a[i] = a[j];\n    a[j] = temp;\n}\n// a = {5, 4, 3, 2, 1}",
            tip: "Si recorres hasta el final, cada pareja se intercambia dos veces y el array queda como estaba." },
          { kind: "exercise", id: "x2b", section: "Invertir" },
          { kind: "theory", section: "Referencias y copias", title: "Copiar no es lo mismo que asignar",
            body: ["Una variable de array no contiene los valores: contiene una **referencia** (dónde están). `int[] b = a;` **no copia**: `a` y `b` son dos nombres del **mismo** array.",
                   "Para tener una copia independiente: `a.clone()` o `Arrays.copyOf(a, a.length)` (de `java.util.Arrays`)."],
            code: "int[] a = {1, 2, 3};\nint[] b = a;                // mismo array\nint[] c = a.clone();        // copia independiente\n\nb[0] = 99;\nSystem.out.println(a[0]);   // 99\nSystem.out.println(c[0]);   // 1",
            sim: { type: "refs" },
            tip: "Si te encuentras pensando «cambié b y se cambió a», casi seguro hiciste `b = a` en vez de copiar." },
          { kind: "exercise", id: "x2c", section: "Referencias y copias" },
          { kind: "exercise", id: "x2d", section: "Referencias y copias" },
          { kind: "exercise", id: "x2e", section: "Referencias y copias" }
        ]
      },
      {
        id: "x3", minutes: 25, title: "Ordenar", goal: "Entender un algoritmo de ordenación y usar las herramientas de Java",
        facilitator: "No hace falta memorizar la burbuja. Lo valioso es que vea cómo se razona un algoritmo: comparar, intercambiar, repetir. Después, que sepa que Arrays.sort existe.",
        steps: [
          { kind: "theory", section: "La burbuja", title: "Ordenar con el método de la burbuja",
            body: ["Ordenar es colocar los valores de menor a mayor. La **burbuja** compara parejas vecinas y las intercambia si están al revés. En cada vuelta, el mayor «sube» hasta el final.",
                   "Es lenta con listas grandes, pero perfecta para aprender a razonar un algoritmo. Míralo trabajar:"],
            code: "for (int i = 0; i < a.length - 1; i++) {\n    for (int j = 0; j < a.length - 1 - i; j++) {\n        if (a[j] > a[j + 1]) {\n            int temp = a[j];\n            a[j] = a[j + 1];\n            a[j + 1] = temp;\n        }\n    }\n}",
            sim: { type: "sort", values: [5, 3, 8, 1, 4] },
            tip: "No intentes verlo todo a la vez: sigue una sola pareja y pregúntate si hay que intercambiarla." },
          { kind: "exercise", id: "x3a", section: "La burbuja" },
          { kind: "exercise", id: "x3b", section: "La burbuja" },
          { kind: "theory", section: "Arrays.sort y compañía", title: "`Arrays.sort` y compañía",
            body: ["En proyectos reales no se escribe la burbuja: Java ya trae `Arrays.sort`. Está en `java.util`, así que hay que importarla.",
                   "`Arrays.toString(a)` convierte el array en texto (ideal para depurar). `Arrays.fill`, `Arrays.equals` y `Arrays.copyOf` completan la caja de herramientas."],
            code: "import java.util.Arrays;\n\nint[] a = {5, 3, 8, 1};\nArrays.sort(a);\nSystem.out.println(Arrays.toString(a));   // [1, 3, 5, 8]\n\nint[] b = {1, 3, 5, 8};\nSystem.out.println(a == b);                // false: son arrays distintos\nSystem.out.println(Arrays.equals(a, b));   // true: mismo contenido",
            tip: "`==` compara si son el **mismo** array; `Arrays.equals` compara si **valen lo mismo**." },
          { kind: "exercise", id: "x3c", section: "Arrays.sort y compañía" },
          { kind: "exercise", id: "x3d", section: "Arrays.sort y compañía" }
        ]
      },
      {
        id: "x4", minutes: 20, title: "Arrays y métodos", goal: "Pasar y devolver arrays, y escribir tus propios métodos",
        facilitator: "Conecta con las referencias del módulo anterior: pasar un array a un método es lo mismo que b = a. Por eso el método puede modificar el original.",
        steps: [
          { kind: "theory", section: "Pasar arrays", title: "Pasar un array a un método",
            body: ["Al pasar un array a un método le das **la referencia**, no una copia. Si el método cambia un elemento, el array original cambia también.",
                   "Por eso un método puede «devolver» resultados modificando el array que recibe."],
            code: "static void duplicar(int[] v) {\n    for (int i = 0; i < v.length; i++) {\n        v[i] = v[i] * 2;\n    }\n}\n\npublic static void main(String[] args) {\n    int[] a = {1, 2, 3};\n    duplicar(a);\n    System.out.println(a[2]);   // 6\n}",
            tip: "Pon nombres de verbo que avisen de que se modifica el array: `duplicar`, `invertir`… mejor que `calcular`." },
          { kind: "exercise", id: "x4a", section: "Pasar arrays" },
          { kind: "theory", section: "Devolver arrays", title: "Devolver un array",
            body: ["Un método también puede **crear y devolver** un array nuevo. El tipo de retorno lleva corchetes: `int[]`.",
                   "Por cierto: el `args` de `main(String[] args)` es un array de `String` con lo que se escribe al ejecutar el programa."],
            code: "static int[] crearTabla(int n) {\n    int[] t = new int[n];\n    for (int i = 0; i < n; i++) {\n        t[i] = (i + 1) * 10;\n    }\n    return t;\n}\n\n// int[] tabla = crearTabla(4);   // {10, 20, 30, 40}",
            tip: "Si un método devuelve un array, su tipo de retorno es `int[]`; si devuelve un número, `int`. Tienen que coincidir con el `return`." },
          { kind: "exercise", id: "x4b", section: "Devolver arrays" },
          { kind: "exercise", id: "x4c", section: "Escribir métodos" }
        ]
      },
      {
        id: "x5", minutes: 25, title: "Matrices avanzadas", goal: "Sumas por filas y columnas, transponer y matrices irregulares",
        facilitator: "Pide que dibuje la matriz en papel con sus índices antes de programar. En matrices, el 80 % de los errores es confundir fila y columna.",
        steps: [
          { kind: "theory", section: "Sumas por filas y columnas", title: "Sumar por filas y por columnas",
            body: ["Para sumar una **fila**, fija la fila y recorre sus columnas. Para sumar una **columna**, fija la columna y recorre las filas.",
                   "Cuida dónde pones el acumulador: debe empezar en 0 **para cada fila**."],
            code: "int[][] m = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};\n\nfor (int f = 0; f < m.length; f++) {\n    int suma = 0;                        // 0 por cada fila\n    for (int c = 0; c < m[f].length; c++) {\n        suma += m[f][c];\n    }\n    System.out.println(\"Fila \" + f + \": \" + suma);\n}",
            sim: { type: "2d", values: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], panels: ["select"], name: "m" },
            tip: "Declara el acumulador justo antes del bucle interno. Si lo pones fuera, las filas se sumarían todas juntas." },
          { kind: "exercise", id: "x5a", section: "Sumas por filas y columnas" },
          { kind: "theory", section: "Transponer", title: "Transponer una matriz",
            body: ["La **traspuesta** intercambia filas por columnas: el elemento `[i][j]` pasa a `[j][i]`.",
                   "Ojo con el tamaño: una matriz de 2 filas × 3 columnas tiene una traspuesta de 3 × 2. Hay que crear la nueva con las dimensiones cambiadas."],
            code: "int[][] m = {{1, 2, 3}, {4, 5, 6}};   // 2 filas x 3 columnas\nint[][] t = new int[3][2];            // 3 filas x 2 columnas\n\nfor (int i = 0; i < 2; i++) {\n    for (int j = 0; j < 3; j++) {\n        t[j][i] = m[i][j];\n    }\n}",
            tip: "Dibuja la matriz en papel con sus índices: transponer es mucho más fácil de ver que de imaginar." },
          { kind: "exercise", id: "x5b", section: "Transponer" },
          { kind: "theory", section: "Matrices irregulares", title: "Matrices irregulares y triángulos",
            body: ["Cada fila puede tener su propio tamaño. Se crea indicando solo las filas (`new int[4][]`) y luego cada fila con su longitud. Así se construye, por ejemplo, un triángulo.",
                   "En estas matrices, la longitud de cada fila se pregunta con `m[f].length`."],
            code: "int[][] tri = new int[4][];\nfor (int f = 0; f < tri.length; f++) {\n    tri[f] = new int[f + 1];\n    for (int c = 0; c < tri[f].length; c++) {\n        tri[f][c] = c + 1;\n    }\n}\n// {1}  {1,2}  {1,2,3}  {1,2,3,4}",
            sim: { type: "2d", values: [[1], [1, 2], [1, 2, 3], [1, 2, 3, 4]], panels: ["select"], name: "tri" },
            tip: "Con matrices irregulares usa siempre `m[f].length` en el bucle interno, nunca `m[0].length`." },
          { kind: "exercise", id: "x5c", section: "Matrices irregulares" },
          { kind: "exercise", id: "x5d", section: "Matrices irregulares" }
        ]
      },
      {
        id: "x6", minutes: 25, title: "Errores y buenas prácticas", goal: "Leer errores, probar casos límite y programar con buenos hábitos",
        facilitator: "Módulo de consejos. Dedica tiempo a leer en voz alta una excepción real: tipo, mensaje y primera línea de su archivo. Es la habilidad que más rendimiento da.",
        steps: [
          { kind: "theory", section: "Excepciones", title: "Dos excepciones que verás mucho",
            body: ["`ArrayIndexOutOfBoundsException`: pediste un índice que no existe. `NullPointerException`: usaste un array que **no se ha creado** (vale `null`).",
                   "Declarar no es crear: `int[] a;` no reserva espacio. Hace falta `new int[n]` o una lista `{...}`."],
            code: "int[] a = new int[3];\na[3] = 1;          // ArrayIndexOutOfBoundsException (índices 0..2)\n\nint[] b = null;\nb[0] = 1;          // NullPointerException (no hay array)",
            tip: "Lee el tipo de excepción y **la primera línea que menciona tu archivo**: te dice exactamente dónde falló." },
          { kind: "exercise", id: "x6a", section: "Excepciones" },
          { kind: "exercise", id: "x6b", section: "Excepciones" },
          { kind: "theory", section: "Casos límite", title: "Los casos límite",
            body: ["Un buen programa funciona también en los casos raros: un array **vacío**, con **un solo** elemento, con valores **negativos** o **repetidos**.",
                   "Un array vacío tiene `length` 0, así que `v[0]` falla. Comprueba `v.length > 0` antes de usar el primer elemento."],
            code: "int[] v = {};\nif (v.length > 0) {\n    int max = v[0];\n    // ...\n} else {\n    System.out.println(\"No hay datos\");\n}",
            tip: "Antes de dar un programa por bueno, pruébalo con: vacío, un elemento, todos iguales y valores negativos." },
          { kind: "exercise", id: "x6c", section: "Casos límite" },
          { kind: "theory", section: "Buenas costumbres", title: "Cuatro hábitos que ahorran horas",
            body: ["**Nombres claros** (`notas`, no `a`). **Sin números mágicos**: en vez de `i < 5`, usa `i < notas.length` o una constante. **Imprime** valores intermedios para depurar. **Divide** el problema en métodos pequeños.",
                   "Programar bien no es escribir rápido: es que otra persona (o tú mismo la semana que viene) entienda el código."],
            code: "final int NUM_ALUMNOS = 5;\nint[] notas = new int[NUM_ALUMNOS];\nfor (int i = 0; i < notas.length; i++) {\n    notas[i] = 5;\n}\nSystem.out.println(java.util.Arrays.toString(notas));   // depurar",
            tip: "Cuando algo falle, no cambies código al azar: imprime los valores y busca cuál no es el que esperabas." },
          { kind: "exercise", id: "x6d", section: "Buenas costumbres" },
          { kind: "summary", title: "Resumen de Avanzando", section: "Cierre" }
        ]
      }
    ]
  };
})(window.LoWKie = window.LoWKie || {});
