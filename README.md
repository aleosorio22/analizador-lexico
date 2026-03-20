# Analizador Léxico

Visualizador interactivo de un analizador léxico desarrollado para la materia **Compiladores**. Permite ingresar código fuente, analizarlo y ver los tokens detectados con resaltado de colores en tiempo real.

🔗 **Demo en vivo:** [aleosorio22.github.io/analizador-lexico](https://aleosorio22.github.io/analizador-lexico/)

---

## ¿Qué es un analizador léxico?

El analizador lexico es la **primera fase de un compilador**. Su tarea es leer el código fuente carácter por carácter y agruparlos en unidades con significado llamadas **tokens** (palabras reservadas, identificadores, operadores, etc.), que luego serán procesados por el analizador sintáctico.

---

## Tokens reconocidos

| Tipo | Descripción | Ejemplos |
|------|-------------|---------|
| **Palabra reservada** | Palabras con significado especial en el lenguaje | `if`, `else`, `for`, `print`, `int`, `asdfg` y sus 120 permutaciones |
| **Identificador** | Nombre de variable o función (máx. 10 chars) | `x`, `contador`, `miVar2` |
| **Número entero** | Entero sin signo en rango 0–100 | `0`, `50`, `100` |
| **Cadena de caracteres** | Texto entre comillas simples o dobles | `"hola"`, `'mundo'` |
| **Operador aritmético** | Operaciones matemáticas básicas | `+`, `-`, `*`, `/` |
| **Operador de asignación** | Asignación estilo Pascal | `:=` |
| **Operador relacional** | Comparación entre valores | `>=`, `<=`, `>`, `<`, `=`, `<>` |
| **Símbolo** | Delimitadores y separadores | `{`, `}`, `[`, `]`, `(`, `)`, `,`, `;`, `..` |
| **Error** | Construcción no válida en el lenguaje | identificador >10 chars, número >100, carácter desconocido |

---

## Funcionalidades de la interfaz

- **Editor de código** con números de línea y scroll sincronizado
- **Resaltado de tokens** — cada tipo tiene su propio color en el código fuente
- **Lista de tokens** con número de línea, tipo y valor
- **Filtros** por tipo de token
- **Hover interactivo** — pasar el mouse sobre un token en la lista lo resalta en el código y viceversa
- **Barra de estadísticas** con conteo por categoría
- **Documentación integrada** con referencia completa de la sintaxis y ejemplos

---

## Tecnologías

- [React 18](https://react.dev/)
- [Vite 5](https://vitejs.dev/)
- CSS puro (sin librerías de UI externas)
- GitHub Actions para CI/CD

---

## Correr localmente

```bash
# Clonar el repositorio
git clone https://github.com/aleosorio22/analizador-lexico.git
cd analizador-lexico

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en el navegador.

---

## Autor

**Alejandro Osorio** — [@aleosorio22](https://github.com/aleosorio22)
