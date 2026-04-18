// ================================================================
//  TreeView — Renderizador SVG de árboles de derivación
// ================================================================

import { useMemo } from 'react'

const NODE_W = 114
const NODE_H = 30
const H_GAP  = 12
const V_GAP  = 52
const PAD    = 20

// Colores para nodos internos (no-terminales)
const RULE_COLOR = {
  '<programa>':    '#6366f1',
  '<sentencia>':   '#7c3aed',
  '<declaracion>': '#3b82f6',
  '<asignacion>':  '#2563eb',
  '<condicional>': '#d97706',
  '<bucle>':       '#b45309',
  '<impresion>':   '#059669',
  '<condicion>':   '#0891b2',
  '<expresion>':   '#ea580c',
  '<termino>':     '#c2410c',
  '<id>':          '#7c3aed',
  '<entero>':      '#047857',
  '<cadena>':      '#b45309',
  '<op_arit>':      '#64748b',
  '<op_rel>':       '#475569',
  '<asig_arreglo>': '#1d4ed8',
  '<rango>':        '#0e7490',
}

function getColor(rule) {
  return RULE_COLOR[rule] ?? '#334155'
}

// ── Layout Reingold-Tilford simplificado ──────────────────────────
// Cada hoja recibe un índice x secuencial.
// Cada nodo interno queda centrado sobre sus hijos.
function layout(node, depth, counter) {
  node._depth = depth
  if (!node.children.length) {
    node._x = counter.n++
  } else {
    node.children.forEach(c => layout(c, depth + 1, counter))
    const first = node.children[0]._x
    const last  = node.children[node.children.length - 1]._x
    node._x = (first + last) / 2
  }
}

function collectAll(root) {
  const nodes = [], edges = []
  function walk(n) {
    nodes.push(n)
    n.children.forEach(c => { edges.push([n, c]); walk(c) })
  }
  walk(root)
  return { nodes, edges }
}

// ── Componente ────────────────────────────────────────────────────
export default function TreeView({ tree }) {
  const { nodes, edges, svgW, svgH } = useMemo(() => {
    if (!tree) return { nodes: [], edges: [], svgW: 0, svgH: 0 }

    // Clone estructural liviano (solo copia rule y children, agrega campos de layout)
    function clone(n) {
      return { rule: n.rule, children: n.children.map(clone) }
    }
    const root = clone(tree)
    const counter = { n: 0 }
    layout(root, 0, counter)

    const { nodes, edges } = collectAll(root)
    const maxDepth = Math.max(...nodes.map(n => n._depth))

    // Convertir índices a píxeles
    nodes.forEach(n => {
      n._px = PAD + n._x * (NODE_W + H_GAP)
      n._py = PAD + n._depth * (NODE_H + V_GAP)
    })

    const svgW = PAD * 2 + counter.n * (NODE_W + H_GAP)
    const svgH = PAD * 2 + (maxDepth + 1) * (NODE_H + V_GAP)

    return { nodes, edges, svgW, svgH }
  }, [tree])

  if (!tree) return null

  return (
    <svg
      width={svgW}
      height={svgH}
      style={{ display: 'block', minWidth: svgW }}
    >
      {/* ── Aristas ── */}
      {edges.map(([p, c], i) => (
        <line key={i}
          x1={p._px + NODE_W / 2} y1={p._py + NODE_H}
          x2={c._px + NODE_W / 2} y2={c._py}
          stroke="#334155"
          strokeWidth={1.5}
        />
      ))}

      {/* ── Nodos ── */}
      {nodes.map((n, i) => {
        const isLeaf = !n.children.length
        const color  = isLeaf ? null : getColor(n.rule)
        const cx     = n._px + NODE_W / 2
        const cy     = n._py + NODE_H / 2

        // Abreviar labels largos
        const label = n.rule.length > 13 ? n.rule.slice(0, 11) + '…' : n.rule

        return (
          <g key={i}>
            <rect
              x={n._px} y={n._py}
              width={NODE_W} height={NODE_H}
              rx={isLeaf ? 4 : 8}
              fill={isLeaf ? '#1e293b' : color}
              stroke={isLeaf ? '#334155' : color}
              strokeWidth={1.5}
            />
            <text
              x={cx} y={cy + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill={isLeaf ? '#94a3b8' : '#fff'}
              fontFamily="'JetBrains Mono', 'Fira Code', monospace"
              fontWeight={isLeaf ? 400 : 700}
            >
              {label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
