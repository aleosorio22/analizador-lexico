// ================================================================
//  ANALIZADOR LÉXICO
//  Compiladores — Universidad
// ================================================================

// ── Tipos de token ───────────────────────────────────────────────
export const TK = {
  RESERVED:   'Palabra reservada',
  IDENTIFIER: 'Identificador',
  INTEGER:    'Número entero',
  STRING:     'Cadena de caracteres',
  ARITH_OP:   'Operador aritmético',
  ASSIGN:     'Operador de asignación',
  REL_OP:     'Operador relacional',
  SYMBOL:     'Símbolo',
  ERROR:      'Error',
}

// ── Colores por tipo de token (badge / highlight) ────────────────
export const TOKEN_COLORS = {
  [TK.RESERVED]:   { badge: '#8b5cf6', highlight: 'rgba(139,92,246,0.25)',  text: '#fff' },
  [TK.IDENTIFIER]: { badge: '#3b82f6', highlight: 'rgba(59,130,246,0.25)',  text: '#fff' },
  [TK.INTEGER]:    { badge: '#10b981', highlight: 'rgba(16,185,129,0.25)',  text: '#fff' },
  [TK.STRING]:     { badge: '#f59e0b', highlight: 'rgba(245,158,11,0.25)',  text: '#fff' },
  [TK.ARITH_OP]:   { badge: '#f97316', highlight: 'rgba(249,115,22,0.25)',  text: '#fff' },
  [TK.ASSIGN]:     { badge: '#6366f1', highlight: 'rgba(99,102,241,0.25)',  text: '#fff' },
  [TK.REL_OP]:     { badge: '#06b6d4', highlight: 'rgba(6,182,212,0.25)',   text: '#fff' },
  [TK.SYMBOL]:     { badge: '#64748b', highlight: 'rgba(100,116,139,0.25)', text: '#fff' },
  [TK.ERROR]:      { badge: '#ef4444', highlight: 'rgba(239,68,68,0.35)',   text: '#fff' },
}

// ── Palabras reservadas ──────────────────────────────────────────

function* permutations(arr) {
  if (arr.length <= 1) { yield arr; return }
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)]
    for (const perm of permutations(rest)) yield [arr[i], ...perm]
  }
}

const BASE_RESERVED = new Set(['if', 'else', 'for', 'print', 'int'])

// Todas las permutaciones de "asdfg" (5! = 120 palabras reservadas)
const ASDFG_PERMS = new Set(
  [...permutations([...'asdfg'])].map(p => p.join(''))
)

export const RESERVED_WORDS  = new Set([...BASE_RESERVED, ...ASDFG_PERMS])
export const ASDFG_PERMS_COUNT = ASDFG_PERMS.size

// ================================================================
//  Clase AnalizadorLexico — implementación con Expresiones Regulares
//
//  Estrategia: lista de reglas (regex + acción) en orden de
//  prioridad. En cada posición se prueba cada regex desde el
//  inicio del texto restante (^). La primera que coincide gana.
// ================================================================

// Reglas definidas en orden de prioridad
// Cada regla tiene:
//   re  → la expresión regular (siempre ancla al inicio con ^)
//   tag → qué hacer cuando coincide
//   type→ tipo de token resultante (para reglas simples)
const RULES = [
  // ── 1. Ignorar: blancos y comentarios ───────────────────────
  { tag: 'skip',    re: /^[ \t\r\n]+/          },  // espacios y saltos de línea
  { tag: 'skip',    re: /^\/\/[^\n]*/           },  // comentario de línea: //
  { tag: 'skip',    re: /^#[^\n]*/              },  // comentario de línea: #
  { tag: 'skip',    re: /^\/\*[\s\S]*?\*\//     },  // comentario de bloque: /* */

  // ── 2. Operadores de 2 chars (ANTES que los de 1 char) ──────
  //    Si no van primero, ">=" se tokenizaría como ">" + "="
  { tag: 'token',   re: /^:=/,    type: TK.ASSIGN  },
  { tag: 'token',   re: /^(>=|<=|<>)/, type: TK.REL_OP  },
  { tag: 'token',   re: /^\.\./,  type: TK.SYMBOL  },

  // ── 3. Operadores de 1 char ───────────────────────────────────
  { tag: 'token',   re: /^[><]/,  type: TK.REL_OP  },
  { tag: 'token',   re: /^=/,     type: TK.REL_OP  },
  { tag: 'token',   re: /^[+\-*\/]/, type: TK.ARITH_OP },
  { tag: 'token',   re: /^[{}\[\](),;]/, type: TK.SYMBOL },

  // ── 4. Cadenas (primero la cerrada, luego sin cerrar = error) ─
  //    El grupo 1 captura el contenido SIN las comillas
  { tag: 'string',  re: /^"([^"\n]*)"/ },
  { tag: 'string',  re: /^'([^'\n]*)'/ },
  { tag: 'strErr',  re: /^"[^"\n]*/    },  // abrió " pero no cerró
  { tag: 'strErr',  re: /^'[^'\n]*/    },  // abrió ' pero no cerró

  // ── 5. Números (validación de rango 0-100 después del match) ──
  { tag: 'number',  re: /^\d+/ },

  // ── 6. Palabras (validación de longitud y reservadas después) ─
  //    Coincide letras + dígitos (la letra inicial la garantiza
  //    que este patrón no matchea si empieza por dígito, ya que
  //    la regla de número viene antes)
  { tag: 'word',    re: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ][a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]*/ },

  // ── 7. Carácter no reconocido (siempre coincide como fallback) ─
  { tag: 'unknown', re: /^[\s\S]/ },
]

class AnalizadorLexico {
  constructor(source) {
    this.src    = source
    this.pos    = 0
    this.line   = 1
    this.tokens = []
  }

  // Avanza `len` caracteres contando saltos de línea para el reporte
  _consume(len) {
    const chunk = this.src.slice(this.pos, this.pos + len)
    this.line += (chunk.match(/\n/g) || []).length
    this.pos  += len
  }

  _push(type, value, startPos) {
    this.tokens.push({ type, value: String(value), line: this.line, startPos, endPos: this.pos })
  }

  // ── Tokenización principal ─────────────────────────────────────
  analyze() {
    while (this.pos < this.src.length) {

      const rest  = this.src.slice(this.pos)  // texto que falta procesar
      const start = this.pos

      for (const rule of RULES) {
        const m = rest.match(rule.re)
        if (!m) continue                        // esta regex no coincide, probar la siguiente

        const raw = m[0]                        // texto que coincidió

        switch (rule.tag) {

          case 'skip':
            // Blancos y comentarios: consumir sin emitir token
            this._consume(raw.length)
            break

          case 'token':
            // Token simple: el valor es exactamente lo que coincidió
            this._consume(raw.length)
            this._push(rule.type, raw, start)
            break

          case 'string':
            // m[1] = contenido entre las comillas (grupo de captura)
            this._consume(raw.length)
            this._push(TK.STRING, m[1], start)
            break

          case 'strErr':
            // La regex coincidió con una apertura de comilla sin cierre
            this._consume(raw.length)
            this._push(TK.ERROR, `cadena sin cerrar: ${raw}`, start)
            break

          case 'number': {
            const val = parseInt(raw, 10)
            this._consume(raw.length)
            if (val >= 0 && val <= 100)
              this._push(TK.INTEGER, raw, start)
            else
              this._push(TK.ERROR, `número fuera de rango 0–100: ${raw}`, start)
            break
          }

          case 'word': {
            this._consume(raw.length)
            if (raw.length > 10) {
              this._push(TK.ERROR, `identificador demasiado largo (${raw.length} chars): "${raw}"`, start)
            } else if (BASE_RESERVED.has(raw.toLowerCase())) {
              this._push(TK.RESERVED, raw.toLowerCase(), start)
            } else if (ASDFG_PERMS.has(raw)) {
              this._push(TK.RESERVED, raw, start)
            } else {
              this._push(TK.IDENTIFIER, raw, start)
            }
            break
          }

          case 'unknown':
            this._consume(1)
            this._push(TK.ERROR, `carácter no reconocido: '${raw}'`, start)
            break
        }

        break  // regla aplicada → pasar a la siguiente posición
      }
    }

    return this.tokens
  }
}

// ── Función pública ──────────────────────────────────────────────
export function analyze(source) {
  return new AnalizadorLexico(source).analyze()
}

// ── Construye segmentos para resaltar el código ──────────────────
export function buildSegments(source, tokens) {
  const sorted = [...tokens].sort((a, b) => a.startPos - b.startPos)
  const segments = []
  let last = 0

  for (const tok of sorted) {
    if (tok.startPos > last)
      segments.push({ text: source.slice(last, tok.startPos), token: null })
    segments.push({ text: source.slice(tok.startPos, tok.endPos), token: tok })
    last = tok.endPos
  }

  if (last < source.length)
    segments.push({ text: source.slice(last), token: null })

  return segments
}
