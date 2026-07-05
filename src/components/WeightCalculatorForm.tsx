'use client'

import { useMemo, useState } from 'react'

export type Shape = 'round-bar' | 'square-bar' | 'flat-bar' | 'round-pipe' | 'angle-bar' | 'sheet-plate'

export type CalcProduct = {
  id: string | number
  name: string
  shape: Shape
  density: number
  standardLength: number
}

const SHAPE_LABELS: Record<Shape, string> = {
  'round-bar': 'Round Bar',
  'square-bar': 'Square Bar',
  'flat-bar': 'Flat Bar',
  'round-pipe': 'Round Pipe / Tube',
  'angle-bar': 'Angle Bar',
  'sheet-plate': 'Sheet / Plate',
}

// Standard engineering weight formulas (density x cross-section area).
// All dimensions in millimeters; density in kg per cubic meter.
function weightPerMeter(shape: Shape, density: number, dims: Record<string, number>): number {
  const d = (mm: number) => mm / 1000
  switch (shape) {
    case 'round-bar': {
      const dia = d(dims.diameter || 0)
      return (Math.PI / 4) * dia * dia * density
    }
    case 'square-bar': {
      const side = d(dims.side || 0)
      return side * side * density
    }
    case 'flat-bar': {
      return d(dims.thickness || 0) * d(dims.width || 0) * density
    }
    case 'round-pipe': {
      const od = d(dims.outerDiameter || 0)
      const wall = d(dims.wallThickness || 0)
      return Math.PI * (od - wall) * wall * density
    }
    case 'angle-bar': {
      const a = d(dims.legA || 0)
      const b = d(dims.legB || 0)
      const t = d(dims.thickness || 0)
      return (a + b - t) * t * density
    }
    case 'sheet-plate': {
      return d(dims.thickness || 0) * density
    }
    default:
      return 0
  }
}

export default function WeightCalculatorForm({ products }: { products: CalcProduct[] }) {
  const [productId, setProductId] = useState(products[0]?.id)
  const [dims, setDims] = useState<Record<string, number>>({})
  const [pieces, setPieces] = useState(1)
  const [sheetWidth, setSheetWidth] = useState(1000)
  const [sheetLength, setSheetLength] = useState(2440)

  const product = products.find((p) => p.id === productId) || products[0]

  const result = useMemo(() => {
    if (!product) return null

    if (product.shape === 'sheet-plate') {
      const perSqm = weightPerMeter('sheet-plate', product.density, dims)
      const area = (sheetWidth / 1000) * (sheetLength / 1000)
      const perSheet = perSqm * area
      return {
        perUnit: perSqm,
        perUnitLabel: 'kg / square meter',
        perPiece: perSheet,
        perPieceLabel: 'kg / sheet (as entered dimensions)',
        total: perSheet * pieces,
      }
    }

    const perM = weightPerMeter(product.shape, product.density, dims)
    const perPiece = perM * (product.standardLength || 6)
    return {
      perUnit: perM,
      perUnitLabel: 'kg / meter',
      perPiece,
      perPieceLabel: `kg / ${product.standardLength || 6}m standard piece`,
      total: perPiece * pieces,
    }
  }, [product, dims, pieces, sheetWidth, sheetLength])

  function updateDim(key: string, value: string) {
    setDims((prev) => ({ ...prev, [key]: parseFloat(value) || 0 }))
  }

  return (
    <div className="calc-grid">
      <div className="facet-card calc-panel">
        <label style={labelStyle}>Product Shape</label>
        <select
          value={String(productId)}
          onChange={(e) => {
            setProductId(products.find((p) => String(p.id) === e.target.value)?.id)
            setDims({})
          }}
          style={inputStyle}
        >
          {products.map((p) => (
            <option key={p.id} value={String(p.id)}>
              {p.name} ({SHAPE_LABELS[p.shape]})
            </option>
          ))}
        </select>

        {product && (
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            {product.shape === 'round-bar' && (
              <Field label="Diameter (mm)">
                <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('diameter', e.target.value)} />
              </Field>
            )}

            {product.shape === 'square-bar' && (
              <Field label="Side (mm)">
                <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('side', e.target.value)} />
              </Field>
            )}

            {product.shape === 'flat-bar' && (
              <>
                <Field label="Thickness (mm)">
                  <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('thickness', e.target.value)} />
                </Field>
                <Field label="Width (mm)">
                  <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('width', e.target.value)} />
                </Field>
              </>
            )}

            {product.shape === 'round-pipe' && (
              <>
                <Field label="Outer Diameter (mm)">
                  <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('outerDiameter', e.target.value)} />
                </Field>
                <Field label="Wall Thickness (mm)">
                  <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('wallThickness', e.target.value)} />
                </Field>
              </>
            )}

            {product.shape === 'angle-bar' && (
              <>
                <Field label="Leg A (mm)">
                  <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('legA', e.target.value)} />
                </Field>
                <Field label="Leg B (mm)">
                  <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('legB', e.target.value)} />
                </Field>
                <Field label="Thickness (mm)">
                  <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('thickness', e.target.value)} />
                </Field>
              </>
            )}

            {product.shape === 'sheet-plate' && (
              <>
                <Field label="Thickness (mm)">
                  <input type="number" min="0" step="0.1" style={inputStyle} onChange={(e) => updateDim('thickness', e.target.value)} />
                </Field>
                <Field label="Width (mm)">
                  <input type="number" min="0" step="1" defaultValue={1000} style={inputStyle} onChange={(e) => setSheetWidth(parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="Length (mm)">
                  <input type="number" min="0" step="1" defaultValue={2440} style={inputStyle} onChange={(e) => setSheetLength(parseFloat(e.target.value) || 0)} />
                </Field>
              </>
            )}

            <Field label={product.shape === 'sheet-plate' ? 'Number of Sheets' : 'Number of Pieces'}>
              <input type="number" min="1" step="1" defaultValue={1} style={inputStyle} onChange={(e) => setPieces(parseInt(e.target.value) || 1)} />
            </Field>
          </div>
        )}
      </div>

      <div className="facet-card calc-panel" style={{ background: 'var(--color-ink)', color: 'white' }}>
        <p className="eyebrow" style={{ color: 'white', opacity: 0.7, marginBottom: 16 }}>Result</p>
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <ResultRow label={result.perUnitLabel} value={result.perUnit} />
            <ResultRow label={result.perPieceLabel} value={result.perPiece} />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 16 }}>
              <ResultRow label={`Total (${pieces} ${product?.shape === 'sheet-plate' ? 'sheets' : 'pieces'})`} value={result.total} big />
            </div>
          </div>
        ) : (
          <p>Select a product to calculate.</p>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, fontWeight: 500 }}>
      {label}
      {children}
    </label>
  )
}

function ResultRow({ label, value, big }: { label: string; value: number; big?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.65, marginBottom: 4 }}>{label}</p>
      <p
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 600,
          fontSize: big ? 28 : 18,
          margin: 0,
        }}
      >
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
      </p>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  marginBottom: 8,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1.5px solid var(--color-border)',
  borderRadius: 4,
  fontSize: 15,
  fontFamily: 'var(--font-body)',
}
