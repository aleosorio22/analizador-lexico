// ================================================================
//  BNFModal — Gramática BNF y Árbol de Derivación
// ================================================================

import { useState, useEffect, useRef } from 'react'
import { BNF_GRAMMAR, EXAMPLES, parseSource } from './grammar.js'
import TreeView from './TreeView.jsx'

export default function BNFModal({ onClose, mainSource }) {
  const [tab,     setTab]    = useState('bnf')
  const [exIdx,   setExIdx]  = useState(0)
  const [useMain, setMain]   = useState(false)

  // Estado del árbol: separado para poder mostrar loading
  const [treeState, setTreeState] = useState({ tree: null, parseErr: null, loading: false })
  const timerRef = useRef(null)

  const src = useMain ? mainSource : EXAMPLES[exIdx].code

  // Cuando cambia la fuente o la tab, lanzar parseo diferido
  useEffect(() => {
    if (tab !== 'tree') return
    // Mostrar loading de inmediato, parsear en el siguiente tick
    setTreeState({ tree: null, parseErr: null, loading: true })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        const tree = parseSource(src)
        setTreeState({ tree, parseErr: null, loading: false })
      } catch (e) {
        setTreeState({ tree: null, parseErr: e.message, loading: false })
      }
    }, 30)   // 30ms: suficiente para que React renderice el spinner primero
    return () => clearTimeout(timerRef.current)
  }, [src, tab])

  const { tree, parseErr, loading } = treeState
  const skipped = tree?._skipped ?? []
  const parsed  = tree?.children?.length ?? 0

  function handleOverlayClick(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="docs-overlay" onClick={handleOverlayClick}>
      <div className="docs-modal bnf-modal">

        {/* ── Cabecera ── */}
        <div className="docs-header">
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              className={`bnf-tab-btn ${tab === 'bnf' ? 'active' : ''}`}
              onClick={() => setTab('bnf')}
            >
              Gramática BNF
            </button>
            <button
              className={`bnf-tab-btn ${tab === 'tree' ? 'active' : ''}`}
              onClick={() => setTab('tree')}
            >
              Árbol de Derivación
            </button>
          </div>
          <button className="docs-close" onClick={onClose}>✕</button>
        </div>

        {/* ══════════════════════════════════════════════
            TAB: GRAMÁTICA BNF
        ══════════════════════════════════════════════ */}
        {tab === 'bnf' && (
          <div className="bnf-body">
            <p className="bnf-intro">
              La siguiente gramática en <strong>Forma de Backus-Naur (BNF)</strong> describe
              la sintaxis del lenguaje reconocido por el analizador léxico. Cada regla define
              cómo se construye un no-terminal a partir de otros símbolos.
            </p>

            <div className="bnf-rules-list">
              {BNF_GRAMMAR.map((r, i) => (
                <div key={i} className="bnf-rule-row">
                  <span className="bnf-lhs">{r.lhs}</span>
                  <span className="bnf-op">::=</span>
                  <pre className="bnf-rhs">{r.rhs}</pre>
                </div>
              ))}
            </div>

            <div className="bnf-legend">
              <h3>Convenciones de notación</h3>
              <div className="bnf-legend-grid">
                {[
                  ['{ }',    'Cero o más repeticiones'],
                  ['[ ]',    'Elemento opcional'],
                  [' | ',    'Alternativa (o)'],
                  ["'...'",  'Símbolo terminal (literal exacto)'],
                  ['<...>',  'No terminal (regla de la gramática)'],
                ].map(([sym, desc]) => (
                  <div key={sym} className="bnf-legend-item">
                    <code>{sym}</code>
                    <span>{desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB: ÁRBOL DE DERIVACIÓN
        ══════════════════════════════════════════════ */}
        {tab === 'tree' && (
          <div className="tree-body">

            {/* Barra lateral con ejemplos */}
            <div className="tree-sidebar">
              <div className="tree-sidebar-title">Ejemplos</div>
              {EXAMPLES.map((ex, i) => (
                <button
                  key={i}
                  className={`tree-ex-btn ${!useMain && exIdx === i ? 'active' : ''}`}
                  onClick={() => { setExIdx(i); setMain(false) }}
                >
                  <span className="tree-ex-num">{i + 1}</span>
                  {ex.title}
                </button>
              ))}
              {mainSource && mainSource.trim() && (
                <>
                  <div className="tree-sidebar-sep" />
                  <button
                    className={`tree-ex-btn ${useMain ? 'active' : ''}`}
                    onClick={() => setMain(true)}
                  >
                    <span className="tree-ex-num">▶</span>
                    Código actual
                  </button>
                </>
              )}
            </div>

            {/* Área principal */}
            <div className="tree-main">
              {/* Encabezado con la sentencia */}
              <div className="tree-source-bar">
                <code className="tree-src-code">{src}</code>
                {!useMain && (
                  <span className="tree-src-desc">{EXAMPLES[exIdx].desc}</span>
                )}
              </div>

              {/* Info de parseo parcial */}
              {skipped.length > 0 && (
                <div className="tree-partial-info">
                  <strong>{parsed}</strong> sentencia{parsed !== 1 ? 's' : ''} parseada{parsed !== 1 ? 's' : ''} correctamente
                  · <strong>{skipped.length}</strong> omitida{skipped.length !== 1 ? 's' : ''} (sintaxis no soportada por la gramática BNF)
                </div>
              )}

              {/* Árbol SVG */}
              <div className="tree-canvas">
                {loading ? (
                  <div className="tree-loading">
                    <div className="tree-spinner" />
                    <span>Calculando árbol...</span>
                  </div>
                ) : parseErr ? (
                  <div className="tree-error">
                    <strong>Error sintáctico:</strong> {parseErr}
                    <p style={{ marginTop: 8, fontSize: 12, color: '#94a3b8' }}>
                      El árbol de derivación solo soporta sentencias de la gramática BNF definida.
                      Usá los 5 ejemplos del panel izquierdo, o escribí una sentencia simple.
                    </p>
                  </div>
                ) : parsed === 0 ? (
                  <div className="tree-error">
                    Ninguna sentencia del código pudo parsearse con la gramática BNF.
                    El árbol de derivación está diseñado para sentencias individuales simples.
                    Probá con uno de los 5 ejemplos del panel izquierdo.
                  </div>
                ) : (
                  <TreeView tree={tree} />
                )}
              </div>

              {/* Leyenda de colores */}
              <div className="tree-legend">
                {[
                  ['#6366f1', '<programa>'],
                  ['#7c3aed', '<sentencia>'],
                  ['#3b82f6', 'declaracion / asignacion'],
                  ['#d97706', 'condicional / bucle'],
                  ['#059669', '<impresion>'],
                  ['#0891b2', '<condicion>'],
                  ['#ea580c', 'expresion / termino'],
                  ['#1e293b', 'hoja (token)'],
                ].map(([color, label]) => (
                  <div key={label} className="tree-legend-item">
                    <span className="tree-legend-dot" style={{ background: color }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
