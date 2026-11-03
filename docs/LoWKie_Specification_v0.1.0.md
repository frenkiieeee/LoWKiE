# LoWKie --- Especificación funcional y técnica

## MVP v0.1.0 · Educational Programming Environment

**Estado:** Borrador inicial para desarrollo\
**Plataforma objetivo:** Windows 11\
**Idioma de la interfaz:** Español\
**Lenguaje de programación de la primera experiencia:** Java\
**Duración de la sesión piloto:** 90 minutos\
**Modalidad de distribución:** Paquete ZIP local, sin backend externo

------------------------------------------------------------------------

## 1. Propósito del proyecto

LoWKie es un entorno educativo de programación que combina una
experiencia de aprendizaje guiada con un espacio de programación real.

Su objetivo no es sustituir un IDE profesional ni convertirse
inicialmente en un LMS completo. El MVP debe permitir que un alumno
principiante:

1.  Consulte explicaciones breves y contextualizadas.
2.  Visualice conceptos de programación mediante simuladores.
3.  Experimente modificando estructuras y valores.
4.  Resuelva ejercicios progresivos.
5.  Escriba, organice, compile y ejecute código Java real.
6.  Reciba correcciones, pistas y recomendaciones basadas en su
    actividad.
7.  Conserve sus proyectos y el progreso de aprendizaje localmente.

La primera unidad didáctica será **Arrays unidimensionales y
bidimensionales en Java**.

### 1.1 Principios de producto

-   **Aprender haciendo:** cada bloque teórico debe conectarse con una
    actividad.
-   **Visualizar antes de memorizar:** representar índices, posiciones,
    filas, columnas y recorridos.
-   **Progresión gradual:** comenzar desde conocimientos básicos y
    aumentar la dificultad.
-   **Feedback útil:** explicar por qué una respuesta es correcta o
    incorrecta.
-   **Autonomía acompañada:** el alumno debe poder experimentar sin
    depender continuamente del profesor.
-   **Entorno real:** el código Java debe compilarse y ejecutarse con un
    JDK real.
-   **Local-first:** proyectos y progreso permanecen en el equipo del
    alumno.
-   **Modularidad:** nuevas unidades didácticas deben poder añadirse sin
    rehacer la aplicación.

------------------------------------------------------------------------

## 2. Alcance del MVP

### 2.1 Incluido en v0.1.0

-   Dashboard de la sesión.
-   Learning Space.
-   Code Space.
-   Unidad didáctica de arrays 1D y 2D.
-   Teoría contextualizada.
-   Simulador de arrays unidimensionales.
-   Simulador de matrices.
-   Visualización de recorridos mediante bucles.
-   Ejercicios de predicción, interpretación, detección de errores y
    resolución.
-   Editor Java integrado.
-   Explorador de archivos y carpetas.
-   Gestión de una carpeta raíz o workspace.
-   Creación, lectura, edición, guardado y eliminación de archivos.
-   Compilación y ejecución real de Java.
-   Salida estándar y errores de compilación/ejecución.
-   Detención de procesos.
-   Guardado local de progreso y configuración.
-   Recomendaciones basadas en reglas.
-   Distribución mediante ZIP para Windows 11.
-   Lanzadores de inicio y cierre.

### 2.2 Fuera de alcance en v0.1.0

-   Cuentas de usuario y autenticación remota.
-   Backend en la nube.
-   Sincronización entre dispositivos.
-   Colaboración en tiempo real.
-   Ejecución de código en servidores externos.
-   Asistente de IA conectado a servicios externos.
-   Depurador Java completo con breakpoints y evaluación de variables.
-   Compatibilidad multiplataforma garantizada.
-   Sustituir IntelliJ IDEA, Eclipse o VS Code como IDE general.
-   Gestión de múltiples alumnos o panel docente avanzado.

Estas capacidades podrán evaluarse en versiones posteriores.

------------------------------------------------------------------------

## 3. Usuarios y escenarios principales

### 3.1 Alumno

Alumno principiante que necesita recuperar conceptos de Java y aprender
mediante explicaciones, visualizaciones y práctica.

Necesita: - Saber qué debe hacer a continuación. - Entender qué
representa cada elemento visual. - Poder probar sin miedo a
equivocarse. - Ver errores explicados de forma comprensible. - Escribir
y ejecutar código sin instalar un IDE completo.

### 3.2 Profesor

Persona que acompaña la sesión mediante videollamada o presencialmente.

Necesita: - Seguir una secuencia didáctica de 90 minutos. - Explicar
conceptos mientras el alumno interactúa. - Proponer ejercicios y
observar cómo los resuelve. - Consultar soluciones y explicaciones. -
Revisar el progreso al finalizar.

El MVP no necesita un modo profesor complejo. Las soluciones y notas
docentes pueden residir en los datos de contenido, ocultas de la vista
normal del alumno y accesibles mediante una opción de facilitador.

------------------------------------------------------------------------

## 4. Arquitectura técnica

### 4.1 Decisión arquitectónica

Aplicación local compuesta por:

1.  **Frontend web:** HTML5, CSS3 y JavaScript.
2.  **Editor:** CodeMirror 6.
3.  **Servicio local:** Node.js.
4.  **Sistema de archivos:** APIs de Node.js, limitadas al workspace
    autorizado.
5.  **Ejecución Java:** JDK instalado en Windows.
6.  **Persistencia:** JSON en el perfil del usuario y archivos del
    workspace.

El frontend se servirá desde el propio servicio local mediante HTTP en
loopback. No se recomienda abrir `index.html` directamente con
`file://`, porque el servicio debe controlar la sesión, los recursos y
las operaciones locales.

### 4.2 Diagrama lógico

``` text
┌──────────────────────────────────────────────┐
│                 LoWKie UI                    │
│                                              │
│  Dashboard · Learning Space · Code Space     │
│  Simuladores · Ejercicios · Progress UI      │
└──────────────────────┬───────────────────────┘
                       │ HTTP local / JSON
                       ▼
┌──────────────────────────────────────────────┐
│             Local Runtime Service            │
│                                              │
│  Static UI Server                            │
│  API Router                                  │
│  Workspace Manager                           │
│  File Manager                                │
│  Java Build & Execution Manager               │
│  Progress & Settings Manager                 │
│  Security & Process Control                  │
└──────────────────────┬───────────────────────┘
                       │ Procesos controlados
                       ▼
┌──────────────────────────────────────────────┐
│              Java Development Kit            │
│                                              │
│              javac · java · JVM              │
└──────────────────────────────────────────────┘
```

### 4.3 Stack propuesto

  Área              Tecnología                   Uso
  ----------------- ---------------------------- ---------------------------
  Estructura        HTML5                        Pantallas y componentes
  Estilos           CSS3                         Sistema visual responsive
  Lógica frontend   JavaScript Vanilla           Interacciones y estado
  Editor            CodeMirror 6                 Edición de Java
  Runtime local     Node.js LTS                  Servidor y API local
  Archivos          Node.js `fs/promises`        Workspace y persistencia
  Procesos          Node.js `child_process`      Compilación y ejecución
  Java              Eclipse Temurin JDK 21 LTS   Compilar y ejecutar
  Datos             JSON                         Progreso y configuración
  Pruebas           Node test runner o Vitest    Pruebas unitarias
  Empaquetado       ZIP + scripts BAT            Distribución inicial

Las dependencias de frontend deben estar incluidas localmente en el
paquete. LoWKie no debe depender de CDN ni de recursos remotos para
funcionar.

### 4.4 Principios de implementación

-   Mantener frontend y runtime desacoplados.
-   Separar rutas HTTP de la lógica de negocio.
-   Separar contenido didáctico de los componentes de interfaz.
-   Evitar un único archivo JavaScript monolítico.
-   Centralizar configuración y constantes.
-   Validar todas las entradas recibidas por la API.
-   Mantener operaciones de archivos dentro de la raíz autorizada.
-   Gestionar procesos de compilación y ejecución de forma asíncrona.
-   No bloquear el event loop durante compilaciones o ejecuciones.
-   Documentar contratos de API y decisiones técnicas relevantes.

------------------------------------------------------------------------

## 5. Estructura de carpetas del repositorio

Estructura orientativa de desarrollo:

``` text
lowkie/
├── README.md
├── package.json
├── package-lock.json
├── .gitignore
│
├── app/
│   ├── index.html
│   ├── assets/
│   │   ├── icons/
│   │   ├── images/
│   │   └── fonts/
│   ├── styles/
│   │   ├── tokens.css
│   │   ├── base.css
│   │   ├── layout.css
│   │   ├── components.css
│   │   └── modules/
│   ├── scripts/
│   │   ├── app.js
│   │   ├── router.js
│   │   ├── api-client.js
│   │   └── state/
│   └── modules/
│       ├── dashboard/
│       ├── learning/
│       ├── code-space/
│       ├── simulators/
│       ├── exercises/
│       └── progress/
│
├── runtime/
│   └── src/
│       ├── server.js
│       ├── config/
│       ├── routes/
│       ├── middleware/
│       ├── services/
│       │   ├── workspace-service.js
│       │   ├── file-service.js
│       │   ├── java-service.js
│       │   └── progress-service.js
│       ├── security/
│       │   ├── session.js
│       │   ├── path-guard.js
│       │   └── process-guard.js
│       └── utils/
│
├── content/
│   └── java/
│       └── arrays/
│           ├── lesson.json
│           ├── theory/
│           ├── exercises.json
│           ├── hints.json
│           └── facilitator-notes.md
│
├── templates/
│   └── projects/
│       └── arrays/
│           ├── src/
│           │   └── Main.java
│           ├── ejercicios/
│           └── README.md
│
├── scripts/
│   ├── start.bat
│   ├── stop.bat
│   ├── package.ps1
│   └── check-environment.ps1
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
└── docs/
    ├── architecture.md
    ├── api.md
    ├── security.md
    └── packaging.md
```

Los datos generados por el usuario no deben guardarse dentro del
directorio de instalación de la aplicación. La estructura anterior
representa el repositorio de desarrollo; la distribución y las rutas de
datos se describen en la sección 13.

------------------------------------------------------------------------

## 6. Experiencia de usuario y navegación

### 6.1 Estructura principal

La aplicación tendrá una navegación persistente y sencilla:

-   Inicio
-   Ruta de aprendizaje
-   Lección actual
-   Simuladores
-   Code Space
-   Progreso

La navegación debe indicar claramente dónde se encuentra el alumno y qué
actividad está activa.

### 6.2 Dashboard

Debe mostrar:

-   Saludo y contexto de la sesión.
-   Unidad actual: Arrays en Java.
-   Progreso general de la sesión.
-   Actividades pendientes y completadas.
-   Acceso a continuar aprendiendo.
-   Recomendación principal.
-   Resumen breve de objetivos.

No convertir el dashboard en un panel de analítica complejo. Su función
es orientar al alumno.

### 6.3 Learning Space

Debe integrar: - Explicación breve. - Ejemplo de código Java. -
Representación visual. - Actividad inmediata. - Pregunta de
comprobación. - Pista contextual. - Navegación anterior/siguiente.

La teoría no debe ocupar pantallas extensas. Utilizar bloques pequeños,
ejemplos concretos y lenguaje accesible.

### 6.4 Code Space

Distribución de referencia:

``` text
┌───────────────────────────────────────────────────────────┐
│ LoWKie     Workspace: Arrays        Java: Ready     Run   │
├───────────────┬───────────────────────────────┬───────────┤
│ EXPLORER      │ EDITOR                        │ LEARNING  │
│               │                               │ ASSISTANT │
│ Arrays/       │ Main.java                     │           │
│  src/         │                               │ Objetivo  │
│   Main.java   │ public class Main {           │ actual    │
│   Arrays.java │   public static void main...  │           │
│  ejercicios/  │                               │ Pistas    │
│               │ }                             │           │
├───────────────┴───────────────────────────────┴───────────┤
│ OUTPUT / PROBLEMS / TERMINAL                              │
│ > 10                                                     │
│ > 20                                                     │
│ > Program finished.                                      │
└───────────────────────────────────────────────────────────┘
```

Regiones: 1. Barra superior: proyecto, estado del JDK y controles. 2.
Explorer: árbol de archivos. 3. Editor: pestañas y contenido. 4.
Learning Assistant: objetivo, contexto, pistas y ayuda. 5. Panel
inferior: salida, problemas y terminal informativa.

El panel de ayuda puede ocultarse para ampliar el editor. En pantallas
pequeñas, las regiones deben reorganizarse sin perder funcionalidad.

### 6.5 Recomendaciones visuales

-   Interfaz clara, limpia y cercana.
-   Blanco como fondo principal.
-   Azul vivo para navegación, selección y acciones.
-   Verde vivo para éxito y progreso.
-   Tonos azul marino para contraste y código.
-   Evitar colores pastel como identidad dominante.
-   No abusar de sombras, gradientes o tarjetas.
-   Mantener jerarquía tipográfica y espaciado consistente.

Paleta inicial:

  Token                  Valor       Uso
  ---------------------- ----------- -------------------------
  `--color-white`        `#FFFFFF`   Fondo
  `--color-blue`         `#165DFF`   Acción principal
  `--color-navy`         `#102A56`   Contraste
  `--color-green`        `#00C875`   Éxito y progreso
  `--color-green-dark`   `#087A50`   Estados positivos
  `--color-text`         `#172033`   Texto principal
  `--color-muted`        `#667085`   Texto secundario
  `--color-border`       `#E5EAF2`   Bordes
  `--color-surface`      `#F6F8FC`   Superficies secundarias

Los colores deben definirse como tokens CSS para poder ajustarlos
globalmente.

------------------------------------------------------------------------

## 7. Unidad didáctica: Arrays en Java

### 7.1 Objetivo general

Que el alumno comprenda qué es un array, cómo se declara y utiliza, cómo
se accede a sus elementos y cómo se recorren arrays unidimensionales y
bidimensionales.

El alumno debe poder escribir pequeños programas Java utilizando arrays
y bucles.

### 7.2 Secuencia de 90 minutos

  -----------------------------------------------------------------------
  Tiempo                  Bloque                  Objetivo
  ----------------------- ----------------------- -----------------------
  00--10                  Diagnóstico             Recuperar variables,
                                                  tipos, condiciones y
                                                  bucles

  10--25                  Arrays 1D               Comprender estructura,
                                                  índice y longitud

  25--40                  Operaciones             Leer, modificar y
                                                  recorrer arrays

  40--55                  Arrays 2D               Comprender filas,
                                                  columnas e índices
                                                  dobles

  55--70                  Bucles anidados         Recorrer matrices paso
                                                  a paso

  70--85                  Laboratorio             Resolver problemas
                                                  combinados

  85--90                  Cierre                  Comprobar comprensión y
                                                  registrar progreso
  -----------------------------------------------------------------------

El recorrido debe ser flexible: el profesor puede detenerse, repetir una
explicación o saltar una actividad.

### 7.3 Contenido de arrays unidimensionales

Incluir: - Qué problema resuelve un array. - Diferencia entre variable
individual y colección. - Declaración. - Inicialización. - Índices desde
cero. - Longitud mediante `.length`. - Lectura y modificación. -
Recorrido con `for`. - Recorrido con `for-each` como ampliación. -
Errores frecuentes. - `ArrayIndexOutOfBoundsException`.

Ejemplo base:

``` java
int[] numeros = {10, 20, 30, 40};

System.out.println(numeros[0]);
numeros[1] = 25;

for (int i = 0; i < numeros.length; i++) {
    System.out.println(numeros[i]);
}
```

### 7.4 Contenido de arrays bidimensionales

Incluir: - Qué representa una matriz. - Filas y columnas. - Declaración
e inicialización. - Acceso mediante dos índices. - Longitud de filas y
columnas. - Recorrido con bucles anidados. - Modificación de celdas. -
Errores frecuentes.

Ejemplo base:

``` java
int[][] matriz = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};

for (int fila = 0; fila < matriz.length; fila++) {
    for (int columna = 0;
         columna < matriz[fila].length;
         columna++) {

        System.out.print(matriz[fila][columna] + " ");
    }

    System.out.println();
}
```

Explicar que en Java un array bidimensional es un array de arrays y que
las filas pueden tener longitudes diferentes. No asumir que todas las
matrices son rectangulares.

### 7.5 Simulador 1D

Debe permitir: - Crear un array con una longitud determinada. -
Introducir o modificar valores. - Seleccionar una posición. - Mostrar
índice y valor. - Consultar longitud. - Añadir y eliminar elementos solo
si el simulador representa una operación de reconstrucción del array;
explicar que los arrays Java tienen tamaño fijo. - Ejecutar visualmente
un recorrido. - Avanzar y retroceder paso a paso. - Reiniciar el
ejemplo.

La visualización debe distinguir claramente índice, valor y longitud.

### 7.6 Simulador 2D

Debe permitir: - Crear matrices con filas y columnas. - Seleccionar
celdas. - Mostrar los dos índices. - Modificar valores. - Visualizar
fila y columna activas. - Recorrer la matriz paso a paso. - Mostrar el
estado de los bucles anidados. - Reiniciar el ejemplo.

Incluir una explicación visual de `matriz[fila][columna]`.

### 7.7 Tipos de ejercicios

1.  **Predicción:** seleccionar la salida de un código.
2.  **Interpretación:** explicar qué contiene una posición.
3.  **Detección:** identificar un índice incorrecto o condición errónea.
4.  **Completar:** rellenar una parte de código.
5.  **Ordenar:** organizar instrucciones para obtener un resultado.
6.  **Programación:** resolver un problema en Code Space.

Cada ejercicio tendrá: - Identificador único. - Título. - Concepto
evaluado. - Dificultad. - Enunciado. - Código inicial opcional. -
Respuesta esperada o validador. - Pistas progresivas. - Explicación de
la solución. - Criterios de éxito.

No mostrar la solución antes de que el alumno intente resolver el
ejercicio.

------------------------------------------------------------------------

## 8. Sistema de recomendaciones

El MVP utilizará un motor determinista basado en reglas. No necesita IA
ni conexión externa.

### 8.1 Datos observados

-   Ejercicios iniciados.
-   Ejercicios completados.
-   Respuestas correctas e incorrectas.
-   Número de intentos.
-   Pistas utilizadas.
-   Tiempo aproximado por actividad, si se mide.
-   Conceptos asociados a cada ejercicio.

### 8.2 Reglas iniciales

Ejemplos:

-   Varios errores de acceso por índice: recomendar repaso de índices.
-   Confusión entre índice y valor: recomendar ejercicio de selección de
    posiciones.
-   Dificultad con `.length`: recomendar recorrido guiado.
-   Errores en matrices: reforzar interpretación de fila y columna.
-   Dificultad en bucles anidados: mostrar simulación paso a paso.
-   Buen rendimiento: proponer un reto de mayor dificultad.

Las reglas deben ser transparentes y configurables desde los datos de
contenido.

### 8.3 Presentación

Mostrar una recomendación principal, con: - Motivo breve. - Concepto que
se quiere reforzar. - Actividad sugerida. - Duración estimada. - Acción
para comenzar.

Evitar mensajes que etiqueten negativamente al alumno. Utilizar lenguaje
motivador y específico.

------------------------------------------------------------------------

## 9. Code Space: editor, archivos y workspace

### 9.1 Editor

CodeMirror 6 debe configurarse con: - Modo Java. - Resaltado de
sintaxis. - Números de línea. - Indentación. - Búsqueda dentro del
archivo. - Pestañas para archivos abiertos. - Indicador de cambios sin
guardar. - Guardado explícito y posibilidad de autosave. - Atajos
básicos de teclado.

El editor no debe fingir funcionalidades que todavía no existan. El
autocompletado avanzado y la integración con Language Server Protocol
quedan fuera del MVP.

### 9.2 Explorer

Operaciones necesarias: - Abrir workspace. - Listar directorios. - Abrir
archivo. - Crear archivo. - Crear carpeta. - Renombrar. - Eliminar con
confirmación. - Refrescar árbol. - Mostrar archivo activo.

La raíz del workspace debe estar claramente identificada.

### 9.3 Modelo de workspace

-   Solo puede existir un workspace activo en v0.1.0.
-   El usuario puede abrir una carpeta mediante el selector de Windows.
-   El servicio conserva la ruta autorizada.
-   Las operaciones de archivos deben validar que la ruta resuelta
    permanece dentro de esa raíz.
-   Rechazar rutas absolutas no autorizadas, traversal (`..`), enlaces
    simbólicos que escapen de la raíz y rutas ambiguas.
-   No seguir enlaces simbólicos fuera del workspace.
-   El usuario puede cambiar de workspace mediante una acción explícita.
-   Los proyectos se mantienen fuera del directorio de instalación.

### 9.4 Guardado

-   Guardado manual.
-   Aviso de cambios pendientes al cerrar una pestaña.
-   Autosave opcional con debounce.
-   Confirmación visible del guardado.
-   No sobrescribir silenciosamente archivos externos modificados desde
    otra aplicación.

------------------------------------------------------------------------

## 10. Runtime Java

### 10.1 Requisitos

-   Windows 11 de 64 bits.
-   JDK 21 LTS compatible.
-   Disponibilidad de `java` y `javac`.
-   No requerir permisos de administrador.
-   No requerir conexión a Internet durante la sesión.

El lanzador debe comprobar: - Que Java existe. - Que `java -version`
responde. - Que `javac -version` responde. - Que la versión cumple el
requisito. - Que puede compilar y ejecutar un programa de prueba.

Si no existe un JDK, mostrar instrucciones claras para instalar una
distribución compatible. No intentar descargar ni instalar software
silenciosamente.

### 10.2 Compilación

Para el caso básico, el servicio debe: 1. Validar el workspace y el
archivo de entrada. 2. Comprobar que el archivo está guardado. 3.
Preparar un directorio de salida separado, por ejemplo `.lowkie-build/`.
4. Compilar los archivos Java necesarios. 5. Capturar stdout y stderr.
6. Devolver código de salida y duración. 7. Traducir los errores
habituales a mensajes comprensibles sin ocultar el error original.

Ejemplo conceptual:

``` powershell
javac -encoding UTF-8 -d .lowkie-build src\Main.java
```

Para proyectos con varios archivos: - Recopilar fuentes Java del
directorio de fuentes autorizado. - Respetar paquetes y estructura de
directorios. - Evitar compilar archivos fuera del workspace. - Limpiar o
actualizar el directorio de salida de forma controlada.

### 10.3 Ejecución

Ejemplo conceptual:

``` powershell
java -cp .lowkie-build Main
```

El servicio debe gestionar: - Proceso activo. - Identificador de
ejecución. - stdout y stderr. - Código de salida. - Tiempo de
ejecución. - Timeout. - Límite de salida. - Acción de cancelación.

### 10.4 Entrada estándar

La primera versión puede ejecutar programas que no requieran entrada
interactiva. Si se implementa stdin, debe hacerse mediante un canal
controlado del runtime y una interfaz específica. No presentar una
terminal completa si solo se captura la salida del proceso.

### 10.5 Gestión de procesos

-   Utilizar `spawn` con argumentos separados, no construir comandos
    mediante concatenación de strings.
-   No utilizar `shell: true` para ejecutar código del alumno.
-   Registrar PID y proceso asociado a cada ejecución.
-   Detener el proceso y sus descendientes al cancelar.
-   Aplicar timeout por defecto.
-   Limitar stdout y stderr para evitar consumo excesivo de memoria.
-   Gestionar errores de proceso y cierre inesperado del servicio.

### 10.6 Seguridad y límites

El código Java ejecutado tiene los permisos del usuario de Windows. No
existe aislamiento de seguridad por el mero hecho de ejecutarlo desde un
servicio local.

Por tanto: - Utilizar únicamente código de ejercicios y código del
alumno bajo supervisión. - No ejecutar como administrador. - No exponer
el servicio a la red local. - Escuchar solo en `127.0.0.1`. - Validar
`Host` y `Origin`. - Utilizar token aleatorio de sesión para las
operaciones sensibles. - No aceptar comandos arbitrarios del cliente. -
No permitir que la API ejecute PowerShell, CMD u otros programas
solicitados libremente. - Limitar duración y salida. - Mantener
operaciones de archivos dentro del workspace. - No almacenar secretos en
el frontend.

Si en el futuro se necesita ejecutar código no confiable, será necesario
incorporar un aislamiento real de procesos o máquinas virtuales; no se
debe afirmar que este MVP proporciona un sandbox seguro.

------------------------------------------------------------------------

## 11. API local

La API será privada para la interfaz local. Todas las respuestas
utilizarán JSON salvo los recursos estáticos.

Prefijo propuesto: `/api`.

### 11.1 Health

`GET /api/health`

Devuelve: - Estado del servicio. - Versión de LoWKie. - Estado de
Java. - Versión de Java detectada.

### 11.2 Workspace

`GET /api/workspace`

Devuelve el workspace activo y sus metadatos.

`POST /api/workspace/open`

Selecciona o autoriza una carpeta mediante un diálogo nativo de Windows.
No aceptar una ruta arbitraria del navegador sin validación y
autorización del servicio.

`GET /api/files`

Lista el contenido del directorio solicitado, siempre relativo a la raíz
autorizada.

### 11.3 Archivos

`GET /api/file?path=src/Main.java`

Lee un archivo de texto autorizado.

`POST /api/file`

Crea o guarda un archivo. El payload incluye ruta relativa y contenido.

`POST /api/folder`

Crea un directorio autorizado.

`PATCH /api/file`

Renombra un archivo o carpeta, si se implementa como operación separada.

`DELETE /api/file`

Elimina un elemento con confirmación explícita en la interfaz.

### 11.4 Java

`POST /api/java/compile`

Recibe el identificador del workspace y el objetivo de compilación
permitido. No recibe una línea de comandos libre.

`POST /api/java/run`

Inicia una ejecución asociada a una compilación válida.

`POST /api/java/stop`

Detiene una ejecución mediante su identificador.

`GET /api/java/status/:runId`

Consulta el estado de una ejecución.

### 11.5 Progreso

`GET /api/progress`

Recupera el progreso local.

`PUT /api/progress`

Guarda el progreso validado.

### 11.6 Contrato de errores

Todas las rutas deben utilizar respuestas consistentes:

``` json
{
  "ok": false,
  "error": {
    "code": "WORKSPACE_PATH_INVALID",
    "message": "La ruta seleccionada no pertenece al proyecto activo."
  }
}
```

No devolver stack traces ni rutas internas sensibles al frontend en
producción.

------------------------------------------------------------------------

## 12. Persistencia

### 12.1 Datos de aplicación

Ubicación recomendada:

``` text
%APPDATA%\LoWKie\
├── settings.json
├── progress.json
├── sessions/
└── logs/
```

### 12.2 Datos de proyectos

Ubicación inicial recomendada:

``` text
%USERPROFILE%\Documents\LoWKie\Projects\
└── Arrays\
    ├── src\
    ├── ejercicios\
    ├── resources\
    └── README.md
```

El usuario podrá seleccionar otra carpeta.

### 12.3 Progreso

Guardar: - Unidad actual. - Actividad actual. - Actividades
completadas. - Intentos. - Aciertos. - Conceptos que requieren
refuerzo. - Última fecha de actividad. - Recomendaciones mostradas.

No guardar datos personales innecesarios.

### 12.4 Actualizaciones

El directorio de instalación y los datos del usuario deben estar
separados. Actualizar la aplicación no debe eliminar proyectos ni
progreso.

------------------------------------------------------------------------

## 13. Distribución para Windows 11

### 13.1 Estrategia

Primera entrega mediante ZIP portable. El alumno no necesita instalar
Node.js ni un IDE.

Dependencia externa inicial: JDK 21 LTS.

Node.js se incluirá en el paquete, preferiblemente una versión LTS
compatible y fijada durante el proceso de build.

Las dependencias de frontend se empaquetarán localmente. No usar CDN.

### 13.2 Estructura de distribución

``` text
LoWKie-v0.1.0/
├── Start-LoWKie.bat
├── Stop-LoWKie.bat
├── README.md
├── app/
│   ├── index.html
│   └── assets/
├── runtime/
│   ├── node/
│   │   └── node.exe
│   └── service/
│       └── ...
├── workspace-templates/
│   └── Arrays/
├── config/
│   └── default.json
└── licenses/
```

### 13.3 Inicio

`Start-LoWKie.bat` debe: 1. Cambiar al directorio correcto. 2. Comprobar
si ya existe una instancia. 3. Comprobar Node incluido. 4. Comprobar JDK
y `javac`. 5. Preparar configuración y datos de usuario. 6. Iniciar el
servicio local. 7. Esperar a que `/api/health` responda. 8. Abrir el
navegador en la URL local. 9. Mostrar instrucciones comprensibles si
algo falla.

La aplicación no debe iniciar el navegador antes de que el servicio esté
listo.

### 13.4 Cierre

`Stop-LoWKie.bat` debe: - Solicitar cierre ordenado. - Detener
ejecuciones Java activas. - Cerrar el servicio iniciado por LoWKie. - No
matar procesos Node ajenos a la aplicación.

Se recomienda utilizar un archivo PID o identificador de instancia y
validar que el proceso pertenece a LoWKie antes de detenerlo.

### 13.5 Instalación del JDK

El README debe explicar cómo instalar Temurin JDK 21 para Windows x64
desde la fuente oficial de Adoptium.

El instalador del JDK será responsabilidad del usuario. El lanzador no
debe ejecutar instalaciones ni modificar variables de entorno
silenciosamente.

------------------------------------------------------------------------

## 14. Diseño de contenido y modelo de datos

El contenido educativo debe residir fuera de los componentes visuales.

Ejemplo orientativo de ejercicio:

``` json
{
  "id": "arrays-1d-predict-001",
  "title": "Identifica el tercer elemento",
  "topic": "array-indexing",
  "difficulty": "beginner",
  "type": "prediction",
  "prompt": "¿Qué valor contiene numeros[2]?",
  "code": "int[] numeros = {10, 20, 30, 40};",
  "options": ["10", "20", "30", "40"],
  "correctAnswer": "30",
  "hints": [
    "Recuerda que los índices comienzan en cero.",
    "La primera posición es numeros[0]."
  ],
  "explanation": "El índice 2 representa el tercer elemento del array.",
  "estimatedMinutes": 2
}
```

La respuesta correcta no debe enviarse necesariamente al frontend antes
de la validación. En el MVP local puede almacenarse en los datos de
contenido, pero la interfaz debe evitar mostrarla hasta que corresponda.

Tipos de contenido: - Lección. - Sección teórica. - Ejemplo de código. -
Simulación. - Ejercicio. - Pista. - Recomendación. - Nota del
facilitador.

------------------------------------------------------------------------

## 15. Requisitos no funcionales

### Rendimiento

-   Inicio rápido en un equipo Windows 11 estándar.
-   Interacciones de simuladores sin bloqueos perceptibles.
-   Ejecución Java asíncrona.
-   Carga de módulos bajo demanda cuando aporte valor.

### Usabilidad

-   Navegación clara.
-   Lenguaje comprensible para principiantes.
-   Estados de carga visibles.
-   Mensajes de error accionables.
-   Confirmación para operaciones destructivas.
-   Accesibilidad mediante teclado en controles principales.

### Compatibilidad

-   Windows 11 x64.
-   Navegadores modernos instalados en Windows.
-   Resolución de escritorio como objetivo principal.
-   Diseño adaptable para ventanas más pequeñas.

### Fiabilidad

-   No perder archivos por un error de interfaz.
-   Detectar servicio no disponible.
-   Detectar JDK ausente o incompatible.
-   Recuperar estado tras cerrar y abrir la aplicación.
-   Registrar errores técnicos en logs locales.

### Privacidad

-   Sin telemetría en el MVP.
-   Sin cuentas.
-   Sin envío de código a servicios externos.
-   Sin conexión obligatoria.
-   Progreso almacenado localmente.

------------------------------------------------------------------------

## 16. Plan de desarrollo

### Fase 1 --- Foundation & Design System

Entregables: - Estructura del repositorio. - Tokens visuales. -
Tipografía y componentes. - Navegación. - Dashboard. - Layout
responsive. - Datos de ejemplo.

Criterio de salida: aplicación navegable con identidad visual
consistente.

### Fase 2 --- Learning Experience

Entregables: - Contenido de arrays 1D. - Contenido de arrays 2D. -
Simulador 1D. - Simulador 2D. - Recorrido paso a paso. - Ejercicios. -
Pistas y correcciones. - Recomendaciones por reglas.

Criterio de salida: sesión educativa completa que pueda probarse sin
runtime Java.

### Fase 3 --- Code Space & Runtime

Entregables: - Editor CodeMirror. - Explorer. - Gestión de workspace. -
API local. - Lectura y escritura de archivos. - Comprobación del JDK. -
Compilación. - Ejecución. - Captura de salida. - Cancelación y límites
de proceso.

Criterio de salida: alumno capaz de crear, editar, compilar y ejecutar
un proyecto Java real.

### Fase 4 --- Packaging & QA

Entregables: - Lanzador BAT. - Cierre ordenado. - ZIP de distribución. -
README. - Pruebas en Windows 11. - Pruebas offline. - Validación de
persistencia. - Pruebas de errores y seguridad.

Criterio de salida: paquete reproducible que puede entregarse a un
alumno y utilizarse en una sesión real.

------------------------------------------------------------------------

## 17. Criterios de aceptación del MVP

### Aplicación

-   [ ] La interfaz carga correctamente.
-   [ ] La navegación funciona.
-   [ ] Los módulos se muestran correctamente.
-   [ ] La identidad visual es consistente.
-   [ ] La interfaz es usable en escritorio.

### Aprendizaje

-   [ ] Se explica qué es un array.
-   [ ] Se explican índices y longitud.
-   [ ] Se puede manipular un array visualmente.
-   [ ] Se explica una matriz.
-   [ ] Se pueden seleccionar celdas.
-   [ ] Se visualizan bucles anidados.
-   [ ] Existen ejercicios de diferentes tipos.
-   [ ] Las correcciones explican el razonamiento.
-   [ ] Se muestran recomendaciones pertinentes.

### Code Space

-   [ ] Se puede abrir un workspace.
-   [ ] Se puede crear una carpeta.
-   [ ] Se puede crear y guardar un archivo.
-   [ ] Se pueden abrir varias pestañas.
-   [ ] Se puede editar Java.
-   [ ] Se puede compilar.
-   [ ] Se puede ejecutar.
-   [ ] Se muestra stdout.
-   [ ] Se muestran errores.
-   [ ] Se puede detener una ejecución.

### Distribución

-   [ ] El ZIP se descomprime sin problemas.
-   [ ] El lanzador inicia el servicio.
-   [ ] Se detecta el JDK.
-   [ ] Se abre el navegador.
-   [ ] El cierre no afecta a otros procesos.
-   [ ] El progreso persiste.
-   [ ] Los proyectos no se pierden al actualizar.

### Seguridad

-   [ ] El servicio escucha solo en loopback.
-   [ ] Las rutas están limitadas al workspace.
-   [ ] No hay ejecución de comandos arbitrarios desde la API.
-   [ ] Las ejecuciones tienen timeout.
-   [ ] La salida está limitada.
-   [ ] Los procesos pueden detenerse.
-   [ ] Las operaciones sensibles requieren una sesión local válida.

------------------------------------------------------------------------

## 18. Estrategia de trabajo con el agente de programación

El desarrollo debe realizarse por fases y con entregas verificables.

### Reglas de trabajo

1.  Leer esta especificación antes de modificar el proyecto.
2.  No desarrollar todas las fases en una única iteración.
3.  Antes de implementar cada fase, proponer los archivos y componentes
    afectados.
4.  Mantener la arquitectura modular.
5.  No introducir dependencias sin justificar su necesidad.
6.  No añadir backend remoto ni servicios externos.
7.  No simular la ejecución Java: debe utilizarse el JDK real.
8.  No implementar funcionalidades visuales que no funcionen.
9.  Añadir pruebas para las operaciones críticas.
10. Actualizar la documentación cuando cambien los contratos.
11. Mantener los datos del alumno separados de los archivos de
    aplicación.
12. Informar de limitaciones y decisiones pendientes en lugar de
    ocultarlas.

### Primera tarea del agente

Comenzar exclusivamente por la **Fase 1 --- Foundation & Design
System**.

Antes de escribir la implementación: - Revisar la especificación. -
Proponer la estructura inicial del repositorio. - Definir el sistema de
navegación. - Definir los componentes compartidos. - Definir los tokens
de diseño. - Presentar una propuesta de pantallas. - Identificar
decisiones técnicas que necesiten confirmación.

Después, implementar la base visual y entregar una versión navegable.

No empezar todavía con el runtime Java ni con el sistema de ejecución.

------------------------------------------------------------------------

## 19. Decisiones técnicas que deben mantenerse revisables

La arquitectura es una propuesta inicial, no una obligación de conservar
cada detalle si el desarrollo revela una alternativa mejor.

Revisar especialmente:

-   CodeMirror 6 frente a Monaco.
-   Versión concreta de Node.js LTS.
-   Mecanismo de selección de carpetas en Windows.
-   Gestión de procesos hijos en Windows.
-   Estrategia de distribución del runtime Node.
-   Posibilidad de empaquetar un JDK portable en versiones futuras.
-   Tratamiento de proyectos Java con paquetes.
-   Diseño del panel de entrada estándar.

Cualquier cambio debe documentar: 1. Problema que resuelve. 2.
Alternativas consideradas. 3. Ventajas y desventajas. 4. Impacto sobre
el alumno. 5. Impacto sobre la distribución.

------------------------------------------------------------------------

## 20. Resultado esperado

LoWKie v0.1.0 debe permitir impartir una clase de 90 minutos sobre
arrays unidimensionales y bidimensionales en Java mediante una
experiencia guiada, visual y práctica.

El alumno debe poder: - Comprender conceptos mediante visualizaciones. -
Experimentar con arrays y matrices. - Resolver actividades. - Escribir
código Java. - Organizar archivos en un proyecto. - Compilar y ejecutar
programas reales. - Consultar errores y recibir orientación. - Conservar
sus proyectos y progreso.

El profesor debe poder acompañar el aprendizaje sin convertirse en el
único motor de la sesión.

**LoWKie no es un editor con ejercicios añadidos. Es un entorno de
aprendizaje donde teoría, experimentación y programación real forman
parte de una misma experiencia.**
