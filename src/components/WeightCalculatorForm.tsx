'use client'

import { useMemo, useState } from 'react'
import { CalcGrid, CalcPanel, CalcResultPanel, MicroLabel, PillInput, PillSelect } from '@/components/ui/styled'

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

const DEFAULT_DIMS: Record<Shape, Record<string, number>> = {
  'round-bar': { diameter: 12 },
  'square-bar': { side: 10 },
  'flat-bar': { thickness: 6, width: 50 },
  'round-pipe': { outerDiameter: 50, wallThickness: 3 },
  'angle-bar': { legA: 50, legB: 50, thickness: 5 },
  'sheet-plate': { thickness: 1 },
}

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
    case 'flat-bar':
      return d(dims.thickness || 0) * d(dims.width || 0) * density
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
    case 'sheet-plate':
      return d(dims.thickness || 0) * density
    default:
      return 0
  }
}

export default function WeightCalculatorForm({ products }: { products: CalcProduct[] }) {
  const [productId, setProductId] = useState<string | number>(products[0]?.id ?? '')
  const [dims, setDims] = useState<Record<string, number>>(DEFAULT_DIMS[products[0]?.shape] || {})
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

  function handleProductChange(value: string) {
    const found = products.find((p) => String(p.id) === value)
    const next = found || products[0]
    setProductId(next?.id ?? '')
    setDims(DEFAULT_DIMS[next?.shape] || {})
  }

  return (
    <CalcGrid>
      <CalcPanel>
        {products.length > 1 && (
          <div style={{ marginBottom: 16 }}>
            <MicroLabel style={{ marginBottom: 8 }}>Product Shape</MicroLabel>
            <PillSelect value={String(productId)} onChange={(e) => handleProductChange(e.target.value)}>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} ({SHAPE_LABELS[p.shape]})
                </option>
              ))}
            </PillSelect>
          </div>
        )}

        {product && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 14 }}>
            {product.shape === 'round-bar' && (
              <Field label="Diameter (mm)">
                <PillInput type="number" min="0" step="0.1" defaultValue={dims.diameter} onChange={(e) => updateDim('diameter', e.target.value)} />
              </Field>
            )}
            {product.shape === 'square-bar' && (
              <Field label="Side (mm)">
                <PillInput type="number" min="0" step="0.1" defaultValue={dims.side} onChange={(e) => updateDim('side', e.target.value)} />
              </Field>
            )}
            {product.shape === 'flat-bar' && (
              <>
                <Field label="Thickness (mm)">
                  <PillInput type="number" min="0" step="0.1" defaultValue={dims.thickness} onChange={(e) => updateDim('thickness', e.target.value)} />
                </Field>
                <Field label="Width (mm)">
                  <PillInput type="number" min="0" step="0.1" defaultValue={dims.width} onChange={(e) => updateDim('width', e.target.value)} />
                </Field>
              </>
            )}
            {product.shape === 'round-pipe' && (
              <>
                <Field label="Outer Diameter (mm)">
                  <PillInput type="number" min="0" step="0.1" defaultValue={dims.outerDiameter} onChange={(e) => updateDim('outerDiameter', e.target.value)} />
                </Field>
                <Field label="Wall Thickness (mm)">
                  <PillInput type="number" min="0" step="0.1" defaultValue={dims.wallThickness} onChange={(e) => updateDim('wallThickness', e.target.value)} />
                </Field>
              </>
            )}
            {product.shape === 'angle-bar' && (
              <>
                <Field label="Leg A (mm)">
                  <PillInput type="number" min="0" step="0.1" defaultValue={dims.legA} onChange={(e) => updateDim('legA', e.target.value)} />
                </Field>
                <Field label="Leg B (mm)">
                  <PillInput type="number" min="0" step="0.1" defaultValue={dims.legB} onChange={(e) => updateDim('legB', e.target.value)} />
                </Field>
                <Field label="Thickness (mm)">
                  <PillInput type="number" min="0" step="0.1" defaultValue={dims.thickness} onChange={(e) => updateDim('thickness', e.target.value)} />
                </Field>
              </>
            )}
            {product.shape === 'sheet-plate' && (
              <>
                <Field label="Thickness (mm)">
                  <PillInput type="number" min="0" step="0.1" defaultValue={dims.thickness} onChange={(e) => updateDim('thickness', e.target.value)} />
                </Field>
                <Field label="Width (mm)">
                  <PillInput type="number" min="0" step="1" defaultValue={1000} onChange={(e) => setSheetWidth(parseFloat(e.target.value) || 0)} />
                </Field>
                <Field label="Length (mm)">
                  <PillInput type="number" min="0" step="1" defaultValue={2440} onChange={(e) => setSheetLength(parseFloat(e.target.value) || 0)} />
                </Field>
              </>
            )}
            <Field label={product.shape === 'sheet-plate' ? 'Number of Sheets' : 'Number of Pieces'}>
              <PillInput type="number" min="1" step="1" defaultValue={1} onChange={(e) => setPieces(parseInt(e.target.value) || 1)} />
            </Field>
          </div>
        )}
      </CalcPanel>

      <CalcResultPanel>
        <MicroLabel $onDark style={{ marginBottom: 14 }}>Result</MicroLabel>
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <ResultRow label={result.perUnitLabel} value={result.perUnit} />
            <ResultRow label={result.perPieceLabel} value={result.perPiece} />
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: 14 }}>
              <ResultRow label={`Total (${pieces} ${product?.shape === 'sheet-plate' ? 'sheets' : 'pieces'})`} value={result.total} big />
            </div>
          </div>
        ) : (
          <p>Select a product to calculate.</p>
        )}
      </CalcResultPanel>
    </CalcGrid>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, fontWeight: 600 }}>
      {label}
      {children}
    </label>
  )
}

function ResultRow({ label, value, big }: { label: string; value: number; big?: boolean }) {
  return (
    <div>
      <p style={{ fontSize: 12, opacity: 0.9, marginBottom: 4, margin: 0, color: 'var(--color-white)' }}>{label}</p>
      <p style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: big ? 26 : 18, margin: '4px 0 0', color: 'var(--color-white)' }}>
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
      </p>
    </div>
  )
}
