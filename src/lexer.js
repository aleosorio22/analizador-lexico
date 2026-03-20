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

const ARITHMETIC_OPS = new Set(['+', '-', '*', '/'])
const SYMBOLS_SET    = new Set(['{', '}', '[', ']', '(', ')', ',', ';'])

// ================================================================
//  Clase AnalizadorLexico
// ================================================================
class AnalizadorLexico {
  constructor(source) {
    this.src    = source
    this.pos    = 0
    this.line   = 1
    this.tokens = []
  }

  // ── Acceso al texto ────────────────────────────────────────────
  _ch()               { return this.pos < this.src.length ? this.src[this.pos]              : null }
  _peek(offset = 1)   { const p = this.pos + offset; return p < this.src.length ? this.src[p] : null }
  _advance() {
    const ch = this.src[this.pos]
    if (ch === '\n') this.line++
    this.pos++
    return ch
  }

  _add(type, value, startPos) {
    this.tokens.push({ type, value: String(value), line: this.line, startPos, endPos: this.pos })
  }

  // ── Saltar espacios en blanco y comentarios ────────────────────
  _skipBlanks() {
    while (this._ch() !== null) {
      const ch = this._ch()

      // Espacios en blanco
      if (' \t\r\n'.includes(ch)) { this._advance(); continue }

      // Comentario de línea: // ó #
      if ((ch === '/' && this._peek() === '/') || ch === '#') {
        while (this._ch() !== null && this._ch() !== '\n') this._advance()
        continue
      }

      // Comentario de bloque: /* ... */
      if (ch === '/' && this._peek() === '*') {
        this._advance(); this._advance()
        while (this._ch() !== null) {
          if (this._ch() === '*' && this._peek() === '/') { this._advance(); this._advance(); break }
          this._advance()
        }
        continue
      }

      break
    }
  }

  // ── Lectura de tokens ──────────────────────────────────────────

  _readWord(startPos) {
    let word = ''
    while (this._ch() !== null && (this._isLetter(this._ch()) || this._isDigit(this._ch())))
      word += this._advance()

    if (word.length > 10) {
      this._add(TK.ERROR, `identificador demasiado largo (${word.length} chars): "${word}"`, startPos)
      return
    }

    const lower = word.toLowerCase()
    if (BASE_RESERVED.has(lower)) { this._add(TK.RESERVED, lower, startPos); return }
    if (ASDFG_PERMS.has(word))    { this._add(TK.RESERVED, word,  startPos); return }
    this._add(TK.IDENTIFIER, word, startPos)
  }

  _readNumber(startPos) {
    let num = ''
    while (this._ch() !== null && this._isDigit(this._ch())) num += this._advance()
    const val = parseInt(num, 10)
    if (val >= 0 && val <= 100) this._add(TK.INTEGER, num, startPos)
    else this._add(TK.ERROR, `número fuera de rango 0–100: ${num}`, startPos)
  }

  _readString(startPos) {
    const quote = this._advance()
    let content = ''
    while (this._ch() !== null) {
      const ch = this._ch()
      if (ch === quote)  { this._advance(); this._add(TK.STRING, content, startPos); return }
      if (ch === '\n')   break
      content += this._advance()
    }
    this._add(TK.ERROR, `cadena sin cerrar: ${quote}${content}`, startPos)
  }

  _isLetter(ch) { return /[a-zA-ZáéíóúÁÉÍÓÚñÑ_]/.test(ch) }
  _isDigit(ch)  { return /[0-9]/.test(ch) }

  // ── Tokenización principal ─────────────────────────────────────
  analyze() {
    while (this.pos < this.src.length) {
      this._skipBlanks()
      if (this.pos >= this.src.length) break

      const startPos = this.pos
      const ch = this._ch()

      // Cadenas
      if (ch === '"' || ch === "'") { this._readString(startPos); continue }

      // Palabras
      if (this._isLetter(ch)) { this._readWord(startPos); continue }

      // Números
      if (this._isDigit(ch)) { this._readNumber(startPos); continue }

      // Operadores aritméticos (el '/' que llegue aquí no es comentario)
      if (ARITHMETIC_OPS.has(ch)) {
        this._add(TK.ARITH_OP, ch, startPos); this._advance(); continue
      }

      // Asignación :=
      if (ch === ':') {
        if (this._peek() === '=') {
          this._advance(); this._advance()
          this._add(TK.ASSIGN, ':=', startPos)
        } else {
          this._add(TK.ERROR, `carácter inesperado: '${ch}'`, startPos); this._advance()
        }
        continue
      }

      // < <= <>
      if (ch === '<') {
        const nxt = this._peek()
        if (nxt === '=') { this._advance(); this._advance(); this._add(TK.REL_OP, '<=', startPos) }
        else if (nxt === '>') { this._advance(); this._advance(); this._add(TK.REL_OP, '<>', startPos) }
        else { this._advance(); this._add(TK.REL_OP, '<', startPos) }
        continue
      }

      // > >=
      if (ch === '>') {
        if (this._peek() === '=') { this._advance(); this._advance(); this._add(TK.REL_OP, '>=', startPos) }
        else { this._advance(); this._add(TK.REL_OP, '>', startPos) }
        continue
      }

      // =
      if (ch === '=') { this._advance(); this._add(TK.REL_OP, '=', startPos); continue }

      // ..
      if (ch === '.') {
        if (this._peek() === '.') {
          this._advance(); this._advance(); this._add(TK.SYMBOL, '..', startPos)
        } else {
          this._add(TK.ERROR, `carácter inesperado: '${ch}' (¿quiso escribir '..'?)`, startPos); this._advance()
        }
        continue
      }

      // Símbolos delimitadores
      if (SYMBOLS_SET.has(ch)) { this._add(TK.SYMBOL, ch, startPos); this._advance(); continue }

      // Carácter no reconocido
      this._add(TK.ERROR, `carácter no reconocido: '${ch}'`, startPos); this._advance()
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
