import { useState, useCallback, useRef } from 'react'
import { analyze, buildSegments, TK, TOKEN_COLORS, RESERVED_WORDS, ASDFG_PERMS_COUNT } from './lexer.js'
import Docs from './Docs.jsx'

// ── Código de ejemplo precargado ─────────────────────────────────
const SAMPLE_CODE = `// ============================================
// Programa de prueba — Analizador Léxico
// ============================================

int x;
int y;
int resultado;

// Asignaciones básicas
x := 50;
y := 25;

// Operadores aritméticos
resultado := x + y;
resultado := x - y;
resultado := x * 2;
resultado := x / 5;

// Operadores relacionales
if (x >= y) {
    print("mayor o igual");
}

if (x <= 100) {
    resultado := x + 1;
}

if (x <> y) {
    print("diferente");
}

if (x = y) {
    print("igual");
}

// For con rango ..
for (i := 1..10) {
    resultado := resultado + i;
}

// Cadenas de caracteres
nombre := "asdfg";
texto  := "hola mundo";

// Permutaciones de asdfg (palabras reservadas)
asdgf := 42;
dgafs := 10;
fgads := 99;

// Arreglos y agrupaciones
arr[5] := 42;
x := (resultado + 3) * 2;

/* Comentario de bloque:
   estas líneas son ignoradas */

// ---- CASOS DE ERROR ----

// Error 1: identificador demasiado largo (> 10 chars)
int variableMuyLarga;

// Error 2: número fuera de rango (> 100)
x := 999;

// Error 3: carácter no reconocido
x := x @ 5;
`

// ── Leyenda de tipos ─────────────────────────────────────────────
const TOKEN_ORDER = [
  TK.RESERVED, TK.IDENTIFIER, TK.INTEGER, TK.STRING,
  TK.ARITH_OP, TK.ASSIGN, TK.REL_OP, TK.SYMBOL, TK.ERROR,
]

const SHORT_LABEL = {
  [TK.RESERVED]:   'Reservada',
  [TK.IDENTIFIER]: 'Identificador',
  [TK.INTEGER]:    'Entero',
  [TK.STRING]:     'Cadena',
  [TK.ARITH_OP]:   'Aritmético',
  [TK.ASSIGN]:     'Asignación',
  [TK.REL_OP]:     'Relacional',
  [TK.SYMBOL]:     'Símbolo',
  [TK.ERROR]:      'Error',
}

// ── Componente Badge ─────────────────────────────────────────────
function Badge({ type, small }) {
  const col = TOKEN_COLORS[type]
  return (
    <span
      style={{
        background: col.badge,
        color: '#fff',
        borderRadius: 4,
        padding: small ? '1px 6px' : '2px 8px',
        fontSize: small ? 10 : 11,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        whiteSpace: 'nowrap',
        letterSpacing: 0.3,
      }}
    >
      {small ? SHORT_LABEL[type] : type}
    </span>
  )
}

// ── Componente principal ─────────────────────────────────────────
export default function App() {
  const [source, setSource]         = useState(SAMPLE_CODE)
  const [tokens, setTokens]         = useState([])
  const [isAnalyzed, setIsAnalyzed] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [activeTab, setActiveTab]   = useState('tokens')   // 'tokens' | 'code'
  const [showDocs, setShowDocs]     = useState(false)
  const tokenListRef  = useRef(null)
  const lineNumsRef   = useRef(null)   // div con números de línea
  const textareaRef   = useRef(null)
  const preRef        = useRef(null)

  // Sincroniza el scrollTop del gutter con el del editor
  const syncLineNums = (scrollTop) => {
    if (lineNumsRef.current) lineNumsRef.current.scrollTop = scrollTop
  }

  // Cuenta de líneas del fuente actual
  const lineCount = source.split('\n').length

  // ── Acciones ───────────────────────────────────────────────────
  const handleAnalyze = useCallback(() => {
    const result = analyze(source)
    setTokens(result)
    setIsAnalyzed(true)
    setFilterType('all')
    setHoveredIdx(null)
    setActiveTab('tokens')
  }, [source])

  const handleClear = () => {
    setSource('')
    setTokens([])
    setIsAnalyzed(false)
    setHoveredIdx(null)
  }

  const handleSample = () => {
    setSource(SAMPLE_CODE)
    setIsAnalyzed(false)
    setTokens([])
    setHoveredIdx(null)
  }

  // ── Datos derivados ────────────────────────────────────────────
  const filtered  = filterType === 'all' ? tokens : tokens.filter(t => t.type === filterType)
  const errors    = tokens.filter(t => t.type === TK.ERROR)
  const segments  = isAnalyzed ? buildSegments(source, tokens) : []

  const countByType = TOKEN_ORDER.reduce((acc, t) => {
    acc[t] = tokens.filter(tk => tk.type === t).length
    return acc
  }, {})

  // ── Scroll de token en hover ───────────────────────────────────
  const handleSegmentHover = (tok) => {
    if (!tok) return
    const idx = tokens.indexOf(tok)
    setHoveredIdx(idx)
    // scroll al token en la lista
    const el = tokenListRef.current?.querySelector(`[data-idx="${idx}"]`)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="app">
      {showDocs && <Docs onClose={() => setShowDocs(false)} />}
      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            {/* Icono de chip compilador */}
            <svg className="logo-svg" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="9" fill="#161b22"/>
              <rect x="10" y="10" width="20" height="20" rx="3" fill="#0d1117" stroke="#3b82f6" strokeWidth="1.8"/>
              {/* Pines izquierda */}
              <line x1="3"  y1="15" x2="10" y2="15" stroke="#58a6ff" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="3"  y1="20" x2="10" y2="20" stroke="#58a6ff" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="3"  y1="25" x2="10" y2="25" stroke="#58a6ff" strokeWidth="1.8" strokeLinecap="round"/>
              {/* Pines derecha */}
              <line x1="30" y1="15" x2="37" y2="15" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="30" y1="20" x2="37" y2="20" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="30" y1="25" x2="37" y2="25" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round"/>
              {/* Puntos de esquina del chip */}
              <circle cx="14" cy="14" r="1.2" fill="#3b82f6" opacity="0.7"/>
              {/* Texto </> */}
              <text x="20" y="24" textAnchor="middle" fill="#e6edf3"
                fontFamily="'Courier New', monospace" fontSize="9.5" fontWeight="700" letterSpacing="-0.5">
                &lt;/&gt;
              </text>
            </svg>
            <div>
              <h1>Analizador Léxico</h1>
              <p>Compiladores — Visualizador de Tokens</p>
            </div>
          </div>
        </div>

        <div className="header-stats">
          {isAnalyzed && (
            <>
              <div className="stat-pill total">
                <span>{tokens.length}</span> tokens
              </div>
              {errors.length > 0 && (
                <div className="stat-pill error">
                  <span>{errors.length}</span> error{errors.length !== 1 ? 'es' : ''}
                </div>
              )}
              <div className="stat-pill ok">
                <span>{tokens.length - errors.length}</span> válidos
              </div>
            </>
          )}
        </div>

        {/* Autor */}
        <div className="author-block">
          <span className="author-name">Alejandro Osorio</span>
          <a
            className="github-link"
            href="https://github.com/aleosorio22"
            target="_blank"
            rel="noreferrer"
            title="Ver perfil en GitHub"
          >
            {/* GitHub mark */}
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="github-icon">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577
                0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755
                -1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236
                1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466
                -1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176
                0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405
                2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23
                1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22
                0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295
                24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            aleosorio22
          </a>
        </div>

        <div className="header-actions">
          <button className="btn btn-ghost" onClick={handleSample}>Código de ejemplo</button>
          <button className="btn btn-ghost" onClick={handleClear}>Limpiar</button>
          <button className="btn btn-docs" onClick={() => setShowDocs(true)}>? Documentación</button>
          <button className="btn btn-primary" onClick={handleAnalyze}>
            ▶ Analizar
          </button>
        </div>
      </header>

      {/* ── INFO BAR (reservadas) ── */}
      <div className="info-bar">
        <span>
          Palabras reservadas: <strong>if, else, for, print, int</strong>
          {' '}+ <strong>{ASDFG_PERMS_COUNT} permutaciones</strong> de <em>"asdfg"</em>
          {' '}= <strong>{RESERVED_WORDS.size}</strong> en total
        </span>
        {!isAnalyzed && (
          <span className="hint">← Escribe o pega código y presiona <strong>Analizar</strong></span>
        )}
      </div>

      {/* ── MAIN LAYOUT ── */}
      <main className="main">

        {/* ── PANEL IZQUIERDO: Editor / Vista resaltada ── */}
        <section className="panel panel-left">
          <div className="panel-header">
            <span className="panel-title">Código Fuente</span>
            {isAnalyzed && (
              <div className="tab-group">
                <button
                  className={`tab-btn ${activeTab === 'tokens' ? 'active' : ''}`}
                  onClick={() => setActiveTab('tokens')}
                >
                  Tokens resaltados
                </button>
                <button
                  className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
                  onClick={() => setActiveTab('code')}
                >
                  Editar
                </button>
              </div>
            )}
          </div>

          <div className="editor-wrapper">
            {/* Gutter: números de línea */}
            <div className="line-gutter" ref={lineNumsRef}>
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i} className="line-num">{i + 1}</div>
              ))}
            </div>

            {/* Vista resaltada */}
            {isAnalyzed && activeTab === 'tokens' ? (
              <pre
                className="code-highlighted"
                ref={preRef}
                onScroll={e => syncLineNums(e.currentTarget.scrollTop)}
              >
                {segments.map((seg, i) => {
                  if (!seg.token) {
                    return <span key={i} className="code-plain">{seg.text}</span>
                  }
                  const idx   = tokens.indexOf(seg.token)
                  const col   = TOKEN_COLORS[seg.token.type]
                  const isHov = hoveredIdx === idx
                  return (
                    <span
                      key={i}
                      data-idx={idx}
                      className={`code-token ${isHov ? 'hovered' : ''}`}
                      style={{
                        background:    isHov ? col.badge + 'cc' : col.highlight,
                        borderBottom:  `2px solid ${col.badge}`,
                        borderRadius:  2,
                        cursor:        'default',
                      }}
                      title={`${seg.token.type}: ${seg.token.value}  (línea ${seg.token.line})`}
                      onMouseEnter={() => setHoveredIdx(idx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      {seg.text}
                    </span>
                  )
                })}
              </pre>
            ) : (
              /* Textarea editable */
              <textarea
                ref={textareaRef}
                className="code-editor"
                value={source}
                wrap="off"
                onChange={e => { setSource(e.target.value); setIsAnalyzed(false) }}
                onScroll={e => syncLineNums(e.currentTarget.scrollTop)}
                spellCheck={false}
                placeholder="// Ingresa o pega aquí tu código fuente..."
              />
            )}
          </div>
        </section>

        {/* ── PANEL DERECHO: Lista de tokens ── */}
        <section className="panel panel-right">
          <div className="panel-header">
            <span className="panel-title">Tokens Detectados</span>
            {isAnalyzed && (
              <span className="token-count">{filtered.length} / {tokens.length}</span>
            )}
          </div>

          {/* Filtros */}
          {isAnalyzed && (
            <div className="filters">
              <button
                className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
                onClick={() => setFilterType('all')}
              >
                Todos ({tokens.length})
              </button>
              {TOKEN_ORDER.map(type =>
                countByType[type] > 0 ? (
                  <button
                    key={type}
                    className={`filter-btn ${filterType === type ? 'active' : ''}`}
                    style={filterType === type ? { background: TOKEN_COLORS[type].badge } : {}}
                    onClick={() => setFilterType(type === filterType ? 'all' : type)}
                  >
                    <span
                      className="filter-dot"
                      style={{ background: TOKEN_COLORS[type].badge }}
                    />
                    {SHORT_LABEL[type]} ({countByType[type]})
                  </button>
                ) : null
              )}
            </div>
          )}

          {/* Lista de tokens */}
          <div className="token-list" ref={tokenListRef}>
            {!isAnalyzed ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <p>Presiona <strong>Analizar</strong> para ver los tokens</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎉</div>
                <p>No hay tokens de este tipo</p>
              </div>
            ) : (
              <table className="token-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Línea</th>
                    <th>Tipo</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tok, i) => {
                    const idx   = tokens.indexOf(tok)
                    const isHov = hoveredIdx === idx
                    const col   = TOKEN_COLORS[tok.type]
                    return (
                      <tr
                        key={i}
                        data-idx={idx}
                        className={`token-row ${isHov ? 'hovered' : ''} ${tok.type === TK.ERROR ? 'row-error' : ''}`}
                        style={{ background: isHov ? col.highlight : '' }}
                        onMouseEnter={() => setHoveredIdx(idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                      >
                        <td className="td-num">{i + 1}</td>
                        <td className="td-line">{tok.line}</td>
                        <td className="td-type">
                          <Badge type={tok.type} small />
                        </td>
                        <td className="td-value">
                          <code>{tok.value}</code>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* ── STATS BAR ── */}
      {isAnalyzed && (
        <footer className="stats-bar">
          <span className="stats-title">Resumen por tipo:</span>
          {TOKEN_ORDER.map(type =>
            countByType[type] > 0 ? (
              <div
                key={type}
                className="stats-chip"
                style={{ borderColor: TOKEN_COLORS[type].badge, color: TOKEN_COLORS[type].badge }}
                title={type}
              >
                <span
                  className="chip-dot"
                  style={{ background: TOKEN_COLORS[type].badge }}
                />
                {SHORT_LABEL[type]}: <strong>{countByType[type]}</strong>
              </div>
            ) : null
          )}
        </footer>
      )}
    </div>
  )
}
