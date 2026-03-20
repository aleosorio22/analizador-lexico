import { TK, TOKEN_COLORS, RESERVED_WORDS, ASDFG_PERMS_COUNT } from './lexer.js'

// ── Pequeño componente para bloques de código ─────────────────────
function CodeBlock({ children }) {
  return (
    <pre className="doc-code">
      <code>{children}</code>
    </pre>
  )
}

// ── Fila de ejemplo válido/inválido ───────────────────────────────
function Example({ valid, code, label }) {
  return (
    <div className={`doc-example ${valid ? 'valid' : 'invalid'}`}>
      <span className="doc-ex-icon">{valid ? '✓' : '✗'}</span>
      <code className="doc-ex-code">{code}</code>
      <span className="doc-ex-label">{label}</span>
    </div>
  )
}

// ── Badge inline ──────────────────────────────────────────────────
function TkBadge({ type }) {
  const col = TOKEN_COLORS[type]
  return (
    <span style={{
      background: col.badge, color: '#fff',
      borderRadius: 4, padding: '1px 7px',
      fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {type}
    </span>
  )
}

// ── Sección ───────────────────────────────────────────────────────
function Section({ id, title, badge, children }) {
  return (
    <section className="doc-section" id={id}>
      <div className="doc-section-title">
        <h2>{title}</h2>
        {badge && <TkBadge type={badge} />}
      </div>
      {children}
    </section>
  )
}

// ── MODAL PRINCIPAL ───────────────────────────────────────────────
export default function Docs({ onClose }) {
  return (
    <div className="docs-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="docs-modal">

        {/* Cabecera */}
        <div className="docs-header">
          <div>
            <h1>Documentación del Lenguaje</h1>
            <p>Referencia completa de la sintaxis reconocida por el analizador léxico</p>
          </div>
          <button className="docs-close" onClick={onClose}>✕</button>
        </div>

        {/* Navegación lateral + contenido */}
        <div className="docs-body">
          <nav className="docs-nav">
            <p className="docs-nav-title">Contenido</p>
            {[
              ['intro',       '¿Qué lenguaje es?'],
              ['identifiers', 'Identificadores'],
              ['integers',    'Números enteros'],
              ['strings',     'Cadenas de caracteres'],
              ['arith',       'Operadores aritméticos'],
              ['assign',      'Operador de asignación'],
              ['relational',  'Operadores relacionales'],
              ['symbols',     'Símbolos / Delimitadores'],
              ['reserved',    'Palabras reservadas'],
              ['errors',      'Errores léxicos'],
              ['examples',    'Programa de ejemplo'],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="docs-nav-link"
                onClick={e => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                {label}
              </a>
            ))}
          </nav>

          <article className="docs-content">

            {/* ── INTRO ── */}
            <Section id="intro" title="¿Qué lenguaje es?">
              <p>
                Este analizador léxico no reconoce un lenguaje de programación estándar
                (no es C, Java, Python ni Pascal). Reconoce un <strong>lenguaje académico
                personalizado</strong> definido con reglas específicas para la materia
                de Compiladores.
              </p>
              <p>
                La sintaxis toma inspiración de varios lenguajes:
              </p>
              <ul className="doc-list">
                <li><strong>Pascal</strong> → operador de asignación <code>:=</code> y rangos con <code>..</code></li>
                <li><strong>C / Java</strong> → estructuras de control <code>if</code>, <code>for</code>, llaves <code>{'{}'}</code></li>
                <li><strong>Personalizado</strong> → palabras reservadas basadas en permutaciones de <em>"asdfg"</em></li>
              </ul>
              <div className="doc-callout info">
                El analizador procesa <strong>cualquier archivo de texto</strong>: clasifica lo que reconoce
                según las reglas definidas e informa como <em>Error</em> lo que no pertenece al lenguaje.
              </div>
            </Section>

            {/* ── IDENTIFICADORES ── */}
            <Section id="identifiers" title="Identificadores" badge={TK.IDENTIFIER}>
              <p>
                Un identificador es el nombre que se le da a una variable, función u otro elemento del programa.
              </p>
              <ul className="doc-list">
                <li>El <strong>primer carácter</strong> debe ser una <strong>letra</strong> (a–z, A–Z)</li>
                <li>Los caracteres siguientes pueden ser <strong>letras o dígitos</strong></li>
                <li>Longitud <strong>máxima: 10 caracteres</strong></li>
                <li>Longitud mayor a 10 → se reporta como <strong>Error</strong></li>
                <li><em>No</em> se permiten espacios, guiones bajos ni caracteres especiales</li>
              </ul>
              <CodeBlock>{`x
resultado
contador1
miVar2024
ab1234567     ← 10 chars (válido, límite exacto)`}</CodeBlock>
              <div className="doc-examples-grid">
                <Example valid code="x"              label="1 char — válido" />
                <Example valid code="resultado"      label="9 chars — válido" />
                <Example valid code="ab1234567"      label="10 chars — límite exacto" />
                <Example valid code="Nombre"         label="inicia con mayúscula — válido" />
                <Example valid code="var1"           label="letra + dígitos — válido" />
                <Example valid={false} code="1var"           label="inicia con dígito — Error" />
                <Example valid={false} code="variableLarga"  label="13 chars — Error" />
                <Example valid={false} code="mi_var"         label="guión bajo — Error" />
              </div>
            </Section>

            {/* ── NÚMEROS ── */}
            <Section id="integers" title="Números enteros" badge={TK.INTEGER}>
              <p>
                Solo se reconocen números enteros <strong>sin signo</strong> (positivos) con
                valor dentro del rango <strong>0 a 100</strong> inclusive.
              </p>
              <ul className="doc-list">
                <li>Solo dígitos: <code>0</code>–<code>9</code></li>
                <li>Rango permitido: <strong>0 ≤ n ≤ 100</strong></li>
                <li>Valores fuera de rango → <strong>Error</strong></li>
                <li>No se admiten decimales, notación científica ni signo negativo</li>
              </ul>
              <div className="doc-examples-grid">
                <Example valid code="0"    label="mínimo válido" />
                <Example valid code="50"   label="válido" />
                <Example valid code="100"  label="máximo válido" />
                <Example valid={false} code="101"  label="fuera de rango — Error" />
                <Example valid={false} code="999"  label="fuera de rango — Error" />
                <Example valid={false} code="3.14" label="decimal — Error (punto inesperado)" />
              </div>
              <div className="doc-callout warning">
                El signo <code>-</code> siempre es un <em>operador aritmético</em>, nunca parte
                del número. Por tanto <code>-5</code> se tokeniza como <code>Operador -</code>
                seguido de <code>Entero 5</code>.
              </div>
            </Section>

            {/* ── CADENAS ── */}
            <Section id="strings" title="Cadenas de caracteres" badge={TK.STRING}>
              <p>
                Una cadena es una secuencia de caracteres encerrada entre comillas.
              </p>
              <ul className="doc-list">
                <li>Se admiten <strong>comillas dobles</strong> <code>"..."</code> y <strong>simples</strong> <code>'...'</code></li>
                <li>El contenido puede ser cualquier carácter excepto salto de línea</li>
                <li>La cadena debe cerrarse en la <strong>misma línea</strong></li>
                <li>Una cadena sin cerrar → <strong>Error</strong></li>
              </ul>
              <CodeBlock>{`nombre := "asdfg";
saludo := "hola mundo";
letra  := 'A';
vacia  := "";`}</CodeBlock>
              <div className="doc-examples-grid">
                <Example valid code={`"asdfg"`}      label="válida" />
                <Example valid code={`"hola mundo"`} label="con espacios — válida" />
                <Example valid code={`""`}           label="cadena vacía — válida" />
                <Example valid code={`'ok'`}         label="comillas simples — válida" />
                <Example valid={false} code={`"sin cerrar`} label="sin comilla de cierre — Error" />
              </div>
            </Section>

            {/* ── ARITMÉTICOS ── */}
            <Section id="arith" title="Operadores aritméticos" badge={TK.ARITH_OP}>
              <p>Los cuatro operadores básicos de aritmética:</p>
              <table className="doc-table">
                <thead><tr><th>Símbolo</th><th>Operación</th><th>Ejemplo</th></tr></thead>
                <tbody>
                  <tr><td><code>+</code></td><td>Suma</td><td><code>x + y</code></td></tr>
                  <tr><td><code>-</code></td><td>Resta</td><td><code>x - 1</code></td></tr>
                  <tr><td><code>*</code></td><td>Multiplicación</td><td><code>x * 2</code></td></tr>
                  <tr><td><code>/</code></td><td>División</td><td><code>x / 5</code></td></tr>
                </tbody>
              </table>
              <CodeBlock>{`resultado := x + y * 2 - 10 / 5;`}</CodeBlock>
            </Section>

            {/* ── ASIGNACIÓN ── */}
            <Section id="assign" title="Operador de asignación" badge={TK.ASSIGN}>
              <p>
                El operador de asignación es <strong><code>:=</code></strong> (estilo Pascal).
                No debe confundirse con <code>=</code>, que es el operador de <em>igualdad relacional</em>.
              </p>
              <div className="doc-examples-grid">
                <Example valid      code="x := 50;"        label="asignación — correcto" />
                <Example valid      code="res := a + b;"   label="asignación de expresión" />
                <Example valid={false} code="x = 50;"      label="esto es comparación, no asignación" />
              </div>
              <CodeBlock>{`int x;
x := 42;          // asigna 42 a x
y := x + 1;       // asigna la expresión
z := "hola";      // asigna una cadena`}</CodeBlock>
            </Section>

            {/* ── RELACIONALES ── */}
            <Section id="relational" title="Operadores relacionales" badge={TK.REL_OP}>
              <p>Comparan dos valores y se usan típicamente en condiciones:</p>
              <table className="doc-table">
                <thead><tr><th>Símbolo</th><th>Significado</th><th>Ejemplo</th></tr></thead>
                <tbody>
                  <tr><td><code>{'>'}</code></td> <td>Mayor que</td>           <td><code>{'x > y'}</code></td></tr>
                  <tr><td><code>{'<'}</code></td> <td>Menor que</td>           <td><code>{'x < 100'}</code></td></tr>
                  <tr><td><code>{'>='}</code></td><td>Mayor o igual</td>        <td><code>{'x >= 50'}</code></td></tr>
                  <tr><td><code>{'<='}</code></td><td>Menor o igual</td>        <td><code>{'x <= 100'}</code></td></tr>
                  <tr><td><code>{'='}</code></td> <td>Igualdad</td>            <td><code>{'x = y'}</code></td></tr>
                  <tr><td><code>{'<>'}</code></td><td>Distinto / No igual</td>  <td><code>{'x <> 0'}</code></td></tr>
                </tbody>
              </table>
              <CodeBlock>{`if (x >= 50) { print("grande"); }
if (x <> y)  { print("distintos"); }
if (x = 0)   { print("cero"); }`}</CodeBlock>
            </Section>

            {/* ── SÍMBOLOS ── */}
            <Section id="symbols" title="Símbolos / Delimitadores" badge={TK.SYMBOL}>
              <table className="doc-table">
                <thead><tr><th>Símbolo</th><th>Uso</th></tr></thead>
                <tbody>
                  <tr><td><code>{'{ }'}</code></td> <td>Delimita bloques de código</td></tr>
                  <tr><td><code>{'[ ]'}</code></td> <td>Índices de arreglos</td></tr>
                  <tr><td><code>{'( )'}</code></td> <td>Agrupación de expresiones / condiciones</td></tr>
                  <tr><td><code>,</code></td>        <td>Separador de argumentos o listas</td></tr>
                  <tr><td><code>;</code></td>        <td>Fin de sentencia</td></tr>
                  <tr><td><code>..</code></td>       <td>Rango (ej: <code>1..10</code> en un <code>for</code>)</td></tr>
                </tbody>
              </table>
              <CodeBlock>{`for (i := 1..10) {    // .. define el rango
    arr[i] := i * 2;  // [] para índices
    print(arr[i]);    // () para argumentos
}`}</CodeBlock>
              <div className="doc-callout warning">
                <code>..</code> debe escribirse como dos puntos <em>seguidos</em>. Un solo punto
                <code>.</code> no es un token válido y se reporta como Error.
              </div>
            </Section>

            {/* ── PALABRAS RESERVADAS ── */}
            <Section id="reserved" title="Palabras reservadas" badge={TK.RESERVED}>
              <p>
                Son identificadores con significado especial en el lenguaje. <strong>No pueden
                usarse como nombres de variables.</strong>
              </p>

              <h3 className="doc-subtitle">Palabras base (insensibles a mayúsculas)</h3>
              <div className="reserved-grid base">
                {['if', 'else', 'for', 'print', 'int'].map(w => (
                  <code key={w} className="reserved-word">{w}</code>
                ))}
              </div>
              <CodeBlock>{`if (x > 0) {
    print("positivo");
} else {
    print("no positivo");
}

for (i := 0; i <= 10; i := i + 1) { }

int x;   // declaración de tipo entero`}</CodeBlock>

              <h3 className="doc-subtitle">
                Permutaciones de <em>"asdfg"</em>
                <span className="doc-badge-count">{ASDFG_PERMS_COUNT} palabras</span>
              </h3>
              <p>
                Todas las combinaciones posibles de las 5 letras <strong>a, s, d, f, g</strong>
                son palabras reservadas. Se calculan como 5! = 120 permutaciones únicas.
                Son <strong>sensibles a mayúsculas</strong> (solo minúsculas).
              </p>
              <div className="reserved-grid perms">
                {['asdfg','asdfg','asdgf','adsfg','adgfs','afgsd','afgds',
                  'sadgf','sdfag','sgadf','sdgfa','sfdag','sfagd',
                  'dasfg','dfgas','dgafs','dsgaf','dfasg','dgfas',
                  'fasdg','fdgas','fgsad','fgdas','fsdga','fsgad',
                  'gasdf','gfasd','gdafs','gsadf','gfads','gdsfa',
                  '...y más'].slice(0, 18).map((w, i) => (
                  <code key={i} className="reserved-word perm">{w}</code>
                ))}
                <span className="reserved-more">+ {ASDFG_PERMS_COUNT - 18} más</span>
              </div>
              <div className="doc-callout info">
                Estas palabras no tienen semántica definida aún — son parte del vocabulario
                reservado del lenguaje para su posterior uso en el analizador sintáctico.
              </div>
            </Section>

            {/* ── ERRORES ── */}
            <Section id="errors" title="Errores léxicos" badge={TK.ERROR}>
              <p>El analizador detecta y reporta los siguientes tipos de error:</p>
              <table className="doc-table">
                <thead><tr><th>Error</th><th>Causa</th><th>Ejemplo</th></tr></thead>
                <tbody>
                  <tr>
                    <td>Identificador largo</td>
                    <td>Más de 10 caracteres</td>
                    <td><code>variableLarga</code></td>
                  </tr>
                  <tr>
                    <td>Número fuera de rango</td>
                    <td>Entero {'>'} 100</td>
                    <td><code>999</code></td>
                  </tr>
                  <tr>
                    <td>Cadena sin cerrar</td>
                    <td>Falta comilla de cierre</td>
                    <td><code>"texto</code></td>
                  </tr>
                  <tr>
                    <td>Carácter no reconocido</td>
                    <td>Símbolo fuera del lenguaje</td>
                    <td><code>@ # $ % &amp; ?</code></td>
                  </tr>
                  <tr>
                    <td>Punto suelto</td>
                    <td>Un solo <code>.</code> en lugar de <code>..</code></td>
                    <td><code>1.10</code></td>
                  </tr>
                  <tr>
                    <td>Dos puntos solos</td>
                    <td><code>:</code> sin el <code>=</code> siguiente</td>
                    <td><code>x : 5</code></td>
                  </tr>
                </tbody>
              </table>
              <div className="doc-callout error">
                Los errores <strong>no detienen el análisis</strong>. El lexer los registra
                y continúa procesando el resto del código, permitiendo detectar múltiples
                errores en una sola pasada.
              </div>
            </Section>

            {/* ── EJEMPLO COMPLETO ── */}
            <Section id="examples" title="Programa de ejemplo">
              <p>Un programa completo que usa todas las construcciones del lenguaje:</p>
              <CodeBlock>{`// Declaración de variables
int x;
int y;
int resultado;

// Asignación de valores (rango 0-100)
x := 50;
y := 25;

// Estructura condicional
if (x >= y) {
    resultado := x - y;
    print("diferencia calculada");
} else {
    resultado := 0;
}

// Bucle con rango ..
for (i := 1..10) {
    resultado := resultado + i;
}

// Operaciones con arreglos
arr[0] := x * 2;
arr[1] := y + 1;

// Comparaciones
if (resultado <> 0) {
    print("resultado distinto de cero");
}

// Palabra reservada (permutación de asdfg)
asdgf := 99;
fgads := resultado;`}</CodeBlock>
            </Section>

          </article>
        </div>
      </div>
    </div>
  )
}
