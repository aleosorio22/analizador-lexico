// ================================================================
//  GRAMÁTICA BNF + PARSER DE DERIVACIÓN
//  Compiladores — Universidad
// ================================================================

import { TK, analyze } from './lexer.js'

// ── BNF para mostrar en la UI ────────────────────────────────────
export const BNF_GRAMMAR = [
  {
    lhs:  '<programa>',
    rhs:  '{ <sentencia> }',
    desc: 'Un programa es una secuencia de cero o más sentencias.',
  },
  {
    lhs:  '<sentencia>',
    rhs:  '<declaracion>\n  | <asignacion>\n  | <asig_arreglo>\n  | <condicional>\n  | <bucle>\n  | <impresion>',
    desc: 'Una sentencia puede ser cualquiera de los 6 tipos.',
  },
  {
    lhs:  '<declaracion>',
    rhs:  "'int'  <id>  ';'",
    desc: 'Declara una variable entera.',
  },
  {
    lhs:  '<asignacion>',
    rhs:  "<id>  ':='  <expresion>  ';'",
    desc: 'Asigna el resultado de una expresión a un identificador.',
  },
  {
    lhs:  '<asig_arreglo>',
    rhs:  "<id>  '['  <entero>  ']'  ':='  <expresion>  ';'",
    desc: 'Asigna un valor a una posición de arreglo.',
  },
  {
    lhs:  '<condicional>',
    rhs:  "'if' '(' <condicion> ')' '{' { <sentencia> } '}'\n  | 'if' '(' <condicion> ')' '{' { <sentencia> } '}' 'else' '{' { <sentencia> } '}'",
    desc: 'Estructura condicional, con rama else opcional.',
  },
  {
    lhs:  '<bucle>',
    rhs:  "'for' '(' <id> ':=' <rango> ')' '{' { <sentencia> } '}'\n  | 'for' '(' <asignacion> <condicion> ';' <expresion> ')' '{' { <sentencia> } '}'",
    desc: 'Bucle con rango (..) o con inicialización / condición / actualización.',
  },
  {
    lhs:  '<rango>',
    rhs:  "<entero>  '..'  <entero>",
    desc: "Rango numérico: valor inicial '..' valor final.",
  },
  {
    lhs:  '<impresion>',
    rhs:  "'print' '(' <expresion> ')' ';'",
    desc: 'Imprime el valor de una expresión.',
  },
  {
    lhs:  '<condicion>',
    rhs:  '<expresion>  <op_rel>  <expresion>',
    desc: 'Comparación entre dos expresiones mediante un operador relacional.',
  },
  {
    lhs:  '<expresion>',
    rhs:  '<termino>  { <op_arit>  <termino> }',
    desc: 'Una o más operaciones aritméticas encadenadas.',
  },
  {
    lhs:  '<termino>',
    rhs:  "<id>  |  <entero>  |  <cadena>  |  <id> '[' <entero> ']'  |  '('  <expresion>  ')'",
    desc: 'Unidad atómica de una expresión.',
  },
  {
    lhs:  '<id>',
    rhs:  'letra { letra | dígito }    [máx. 10 chars]',
    desc: 'Identificador: empieza con letra, seguido de letras o dígitos.',
  },
  {
    lhs:  '<entero>',
    rhs:  'dígito { dígito }           [valor 0 – 100]',
    desc: 'Número entero sin signo entre 0 y 100.',
  },
  {
    lhs:  '<cadena>',
    rhs:  '\'"\'  { car }  \'"\'\n  |  "\'"  { car }  "\'"',
    desc: 'Texto entre comillas dobles o simples, en una sola línea.',
  },
  {
    lhs:  '<op_arit>',
    rhs:  "'+' | '-' | '*' | '/'",
    desc: 'Operadores aritméticos básicos.',
  },
  {
    lhs:  '<op_rel>',
    rhs:  "'>'  |  '<'  |  '>='  |  '<='  |  '<>'  |  '='",
    desc: 'Operadores de comparación entre valores.',
  },
]

// ── Nodo del árbol de derivación ──────────────────────────────────
// { rule: string, children: Node[] }
// Hojas: children vacío, rule = texto del token
function nd(rule, children = []) {
  return { rule, children }
}

// ── Parser de descenso recursivo ─────────────────────────────────
class Parser {
  constructor(tokens) {
    this.toks = tokens.filter(t => t.type !== TK.ERROR)
    this.pos  = 0
  }

  peek(offset = 0) { return this.toks[this.pos + offset] ?? null }
  advance()        { return this.toks[this.pos++] }

  check(type, value = null, offset = 0) {
    const t = this.peek(offset)
    return !!t && t.type === type && (value == null || t.value === value)
  }

  expect(type, value = null) {
    if (!this.check(type, value)) {
      const t   = this.peek()
      const got = t ? `"${t.value}"` : 'fin de entrada'
      const exp = value ? `"${value}"` : type
      throw new Error(`Se esperaba ${exp}, se encontró ${got}`)
    }
    return this.advance()
  }

  // Detecta if next pattern is: IDENTIFIER ':=' INTEGER '..'  (for-rango)
  _isForRango() {
    return (
      this.check(TK.IDENTIFIER,   null, 0) &&
      this.check(TK.ASSIGN,       null, 1) &&
      this.check(TK.INTEGER,      null, 2) &&
      this.check(TK.SYMBOL,       '..', 3)
    )
  }

  // Detecta if next pattern is: IDENTIFIER '[' (array access)
  _isArrayAccess(offset = 0) {
    return (
      this.check(TK.IDENTIFIER, null,  offset) &&
      this.check(TK.SYMBOL,     '[',   offset + 1)
    )
  }

  // Recuperación de errores: avanza hasta el inicio de la próxima sentencia.
  // Siempre avanza al menos un token para garantizar terminación.
  _recover() {
    if (this.pos >= this.toks.length) return
    while (this.pos < this.toks.length) {
      const t = this.peek()
      if (!t) break
      if (t.type === TK.SYMBOL && (t.value === ';' || t.value === '}')) {
        this.advance(); break
      }
      // Llegamos al inicio de una sentencia conocida — parar SIN consumir
      // solo si ya avanzamos al menos uno (evita ciclo infinito)
      if (t.type === TK.RESERVED && ['int','if','for','print'].includes(t.value)) {
        this.advance()   // consumir la palabra reservada problemática y parar
        break
      }
      this.advance()   // avanzar siempre
    }
  }

  // <programa> ::= { <sentencia> }
  parsePrograma() {
    const kids    = []
    const skipped = []
    let   guard   = 0                          // límite de seguridad anti-loop
    const MAX     = this.toks.length * 3 + 10  // nunca más iteraciones que tokens×3
    while (this.pos < this.toks.length && guard++ < MAX) {
      const before = this.pos
      try {
        kids.push(this.parseSentencia())
      } catch (e) {
        skipped.push(e.message)
        // Si parseSentencia no avanzó nada, forzar avance
        if (this.pos === before) this.advance()
      }
    }
    const root = nd('<programa>', kids)
    root._skipped = skipped
    return root
  }

  // <sentencia> ::= <declaracion> | <asignacion> | <asig_arreglo> | <condicional> | <bucle> | <impresion>
  parseSentencia() {
    const t = this.peek()
    if (!t) throw new Error('Se esperaba una sentencia pero se llegó al fin de la entrada')

    if (t.type === TK.RESERVED) {
      if (t.value === 'int')   return nd('<sentencia>', [this.parseDeclaracion()])
      if (t.value === 'if')    return nd('<sentencia>', [this.parseCondicional()])
      if (t.value === 'for')   return nd('<sentencia>', [this.parseBucle()])
      if (t.value === 'print') return nd('<sentencia>', [this.parseImpresion()])
    }

    if (t.type === TK.IDENTIFIER) {
      // arr[5] := ...   (peek: 0=id, 1=[, 2=int, 3=], 4=:=)
      if (this._isArrayAccess()) {
        const next4 = this.peek(4)
        if (next4 && next4.type === TK.ASSIGN)
          return nd('<sentencia>', [this.parseAsigArreglo()])
      }
      // id := ...
      if (this.check(TK.ASSIGN, null, 1))
        return nd('<sentencia>', [this.parseAsignacion()])
    }

    throw new Error(`Token inesperado: "${t.value}" (${t.type}) en línea ${t.line}`)
  }

  // <declaracion> ::= 'int' <id> ';'
  parseDeclaracion() {
    this.expect(TK.RESERVED, 'int')
    const id = this.expect(TK.IDENTIFIER)
    this.expect(TK.SYMBOL, ';')
    return nd('<declaracion>', [nd("'int'"), nd('<id>', [nd(id.value)]), nd("';'")])
  }

  // <asignacion> ::= <id> ':=' <expresion> ';'
  parseAsignacion() {
    const id = this.expect(TK.IDENTIFIER)
    this.expect(TK.ASSIGN)
    const expr = this.parseExpresion()
    this.expect(TK.SYMBOL, ';')
    return nd('<asignacion>', [nd('<id>', [nd(id.value)]), nd("':='"), expr, nd("';'")])
  }

  // <asig_arreglo> ::= <id> '[' <entero> ']' ':=' <expresion> ';'
  parseAsigArreglo() {
    const id  = this.expect(TK.IDENTIFIER)
    this.expect(TK.SYMBOL, '[')
    const idx = this.expect(TK.INTEGER)
    this.expect(TK.SYMBOL, ']')
    this.expect(TK.ASSIGN)
    const expr = this.parseExpresion()
    this.expect(TK.SYMBOL, ';')
    return nd('<asig_arreglo>', [
      nd('<id>', [nd(id.value)]),
      nd("'['"), nd('<entero>', [nd(idx.value)]), nd("']'"),
      nd("':='"), expr, nd("';'"),
    ])
  }

  // <condicional> ::= 'if' '(' <condicion> ')' '{' { <sentencia> } '}' [ 'else' ... ]
  parseCondicional() {
    this.expect(TK.RESERVED, 'if')
    this.expect(TK.SYMBOL, '(')
    const cond = this.parseCondicion()
    this.expect(TK.SYMBOL, ')')
    this.expect(TK.SYMBOL, '{')
    const body = []
    while (this.peek() && this.peek().value !== '}') body.push(this.parseSentencia())
    this.expect(TK.SYMBOL, '}')

    const kids = [nd("'if'"), nd("'('"), cond, nd("')'"), nd("'{'"), ...body, nd("'}'")]

    if (this.check(TK.RESERVED, 'else')) {
      this.advance()
      this.expect(TK.SYMBOL, '{')
      const elseBody = []
      while (this.peek() && this.peek().value !== '}') elseBody.push(this.parseSentencia())
      this.expect(TK.SYMBOL, '}')
      kids.push(nd("'else'"), nd("'{'"), ...elseBody, nd("'}'"))
    }

    return nd('<condicional>', kids)
  }

  // <bucle> ::= 'for' '(' <id> ':=' <rango> ')' '{' ... '}'
  //           | 'for' '(' <asignacion> <condicion> ';' <expresion> ')' '{' ... '}'
  parseBucle() {
    this.expect(TK.RESERVED, 'for')
    this.expect(TK.SYMBOL, '(')

    const body = []
    let kids

    if (this._isForRango()) {
      // Forma rango: for (i := 1..10) { ... }
      const id = this.expect(TK.IDENTIFIER)
      this.expect(TK.ASSIGN)
      const rango = this.parseRango()
      this.expect(TK.SYMBOL, ')')
      this.expect(TK.SYMBOL, '{')
      while (this.peek() && this.peek().value !== '}') body.push(this.parseSentencia())
      this.expect(TK.SYMBOL, '}')
      kids = [nd("'for'"), nd("'('"), nd('<id>', [nd(id.value)]), nd("':='"), rango, nd("')'"), nd("'{'"), ...body, nd("'}'")]
    } else {
      // Forma clásica: for (asig; cond; expr) { ... }
      const init = this.parseAsignacion()
      const cond = this.parseCondicion()
      this.expect(TK.SYMBOL, ';')
      const upd  = this.parseExpresion()
      this.expect(TK.SYMBOL, ')')
      this.expect(TK.SYMBOL, '{')
      while (this.peek() && this.peek().value !== '}') body.push(this.parseSentencia())
      this.expect(TK.SYMBOL, '}')
      kids = [nd("'for'"), nd("'('"), init, cond, nd("';'"), upd, nd("')'"), nd("'{'"), ...body, nd("'}'")]
    }

    return nd('<bucle>', kids)
  }

  // <rango> ::= <entero> '..' <entero>
  parseRango() {
    const from = this.expect(TK.INTEGER)
    this.expect(TK.SYMBOL, '..')
    const to   = this.expect(TK.INTEGER)
    return nd('<rango>', [nd('<entero>', [nd(from.value)]), nd("'..'"), nd('<entero>', [nd(to.value)])])
  }

  // <impresion> ::= 'print' '(' <expresion> ')' ';'
  parseImpresion() {
    this.expect(TK.RESERVED, 'print')
    this.expect(TK.SYMBOL, '(')
    const expr = this.parseExpresion()
    this.expect(TK.SYMBOL, ')')
    this.expect(TK.SYMBOL, ';')
    return nd('<impresion>', [nd("'print'"), nd("'('"), expr, nd("')'"), nd("';'")])
  }

  // <condicion> ::= <expresion> <op_rel> <expresion>
  parseCondicion() {
    const left  = this.parseExpresion()
    const op    = this.expect(TK.REL_OP)
    const right = this.parseExpresion()
    return nd('<condicion>', [left, nd('<op_rel>', [nd(op.value)]), right])
  }

  // <expresion> ::= <termino> { <op_arit> <termino> }
  parseExpresion() {
    const kids = [this.parseTermino()]
    while (this.check(TK.ARITH_OP)) {
      const op = this.advance()
      kids.push(nd('<op_arit>', [nd(op.value)]), this.parseTermino())
    }
    return nd('<expresion>', kids)
  }

  // <termino> ::= <id> | <entero> | <cadena> | <id>'['<entero>']' | '(' <expresion> ')'
  parseTermino() {
    const t = this.peek()
    if (!t) throw new Error('Se esperaba un término pero se llegó al fin de la entrada')

    if (t.type === TK.IDENTIFIER) {
      this.advance()
      // Acceso a arreglo: id[entero]
      if (this.check(TK.SYMBOL, '[')) {
        this.advance()
        const idx = this.expect(TK.INTEGER)
        this.expect(TK.SYMBOL, ']')
        return nd('<termino>', [nd('<id>', [nd(t.value)]), nd("'['"), nd('<entero>', [nd(idx.value)]), nd("']'")])
      }
      return nd('<termino>', [nd('<id>', [nd(t.value)])])
    }
    if (t.type === TK.INTEGER) {
      this.advance()
      return nd('<termino>', [nd('<entero>', [nd(t.value)])])
    }
    if (t.type === TK.STRING) {
      this.advance()
      return nd('<termino>', [nd('<cadena>', [nd(`"${t.value}"`)])])
    }
    if (t.type === TK.SYMBOL && t.value === '(') {
      this.advance()
      const expr = this.parseExpresion()
      this.expect(TK.SYMBOL, ')')
      return nd('<termino>', [nd("'('"), expr, nd("')'")])
    }
    throw new Error(`No puede iniciar un término: "${t.value}" (${t.type})`)
  }
}

// ── Función pública ───────────────────────────────────────────────
export function parseSource(source) {
  const tokens = analyze(source)
  return new Parser(tokens).parsePrograma()
}

// ── 5 Ejemplos predefinidos (uno por cada construcción clave) ─────
export const EXAMPLES = [
  {
    title: 'Declaración',
    code:  'int x;',
    desc:  'Declara una variable entera x.',
  },
  {
    title: 'Asignación',
    code:  'resultado := x + y;',
    desc:  'Suma x e y y guarda el resultado.',
  },
  {
    title: 'Arreglo',
    code:  'arr[5] := 42;',
    desc:  'Asigna 42 a la posición 5 del arreglo arr.',
  },
  {
    title: 'Condicional',
    code:  'if (x > 0) { y := x + 1; }',
    desc:  'Si x es mayor a 0, asigna x + 1 a y.',
  },
  {
    title: 'Bucle con rango',
    code:  'for (i := 1..10) { resultado := resultado + i; }',
    desc:  'Itera i desde 1 hasta 10 acumulando en resultado.',
  },
]
