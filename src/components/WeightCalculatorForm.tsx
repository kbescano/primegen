'use client'

import { useMemo, useState } from 'react'

export type Shape = 
  | 'round-bar' 
  | 'square-bar' 
  | 'flat-bar' 
  | 'round-pipe' 
  | 'angle-bar' 
  | 'sheet-plate'
  | 'square-tube'
  | 'c-channel'
  | 'i-beam'

export type CalcProduct = {
  id: string | number
  name: string
  shape: Shape
  density: number
  standardLength: number
}

// Filtered and mapped product list based on applicable structural materials
export const APPLICABLE_PRODUCTS: CalcProduct[] = [
  { id: 'deformed-bar', name: 'Deformed Bar', shape: 'round-bar', density: 7850, standardLength: 6 },
  { id: 'angle-bar', name: 'Angle Bar', shape: 'angle-bar', density: 7850, standardLength: 6 },
  { id: 'channel-bar', name: 'Channel Bar', shape: 'c-channel', density: 7850, standardLength: 6 },
  { id: 'square-bar', name: 'Square Bar', shape: 'square-bar', density: 7850, standardLength: 6 },
  { id: 'plain-round-bar', name: 'Plain Round Bar', shape: 'round-bar', density: 7850, standardLength: 6 },
  { id: 'rectangular-bar', name: 'Rectangular Bar (Stainless/Carbon)', shape: 'flat-bar', density: 7930, standardLength: 6 },
  { id: 'flat-bar', name: 'Flat Bar', shape: 'flat-bar', density: 7850, standardLength: 6 },
  { id: 'tubular', name: 'Tubular Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'square-tube', name: 'Square Tube', shape: 'square-tube', density: 7850, standardLength: 6 },
  { id: 'c-purlins', name: 'C-Purlins', shape: 'c-channel', density: 7850, standardLength: 6 },
  { id: 'i-beam', name: 'I Beam', shape: 'i-beam', density: 7850, standardLength: 6 },
  { id: 'h-beam', name: 'H Beam', shape: 'i-beam', density: 7850, standardLength: 6 },
  { id: 'bi-pipe', name: 'B.I. Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'gi-pipe', name: 'G.I. Pipe', shape: 'round-pipe', density: 7850, standardLength: 6 },
  { id: 'copper-pipe', name: 'Copper Pipe', shape: 'round-pipe', density: 8960, standardLength: 6 },
  { id: 'stainless-pipe', name: 'Stainless Pipe', shape: 'round-pipe', density: 7930, standardLength: 6 },
  { id: 'base-plate', name: 'Base Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'mild-steel-plate', name: 'Mild Steel Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'chequered-plate', name: 'Chequered Plate', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'gi-sheet', name: 'G.I. Sheet', shape: 'sheet-plate', density: 7850, standardLength: 1 },
  { id: 'copper-sheet', name: 'Copper Sheet', shape: 'sheet-plate', density: 8960, standardLength: 1 },
  { id: 'stainless-sheet', name: 'Stainless Sheet', shape: 'sheet-plate', density: 7930, standardLength: 1 },
]

const SHAPE_LABELS: Record<Shape, string> = {
  'round-bar': 'Round Bar',
  'square-bar': 'Solid Square Bar',
  'flat-bar': 'Flat / Rectangular Bar',
  'round-pipe': 'Round Pipe / Tube',
  'angle-bar': 'Angle Bar',
  'sheet-plate': 'Sheet / Plate',
  'square-tube': 'Hollow Square Tube',
  'c-channel': 'C-Channel / Purlin',
  'i-beam': 'I-Beam / H-Beam'
}

const DEFAULT_DIMS: Record<Shape, Record<string, number>> = {
  'round-bar': { diameter: 12 },
  'square-bar': { side: 10 },
  'flat-bar': { thickness: 6, width: 50 },
  'round-pipe': { outerDiameter: 50, wallThickness: 3 },
  'angle-bar': { legA: 50, legB: 50, thickness: 5 },
  'sheet-plate': { thickness: 1 },
  'square-tube': { outerSide: 50, wallThickness: 3 },
  'c-channel': { flangeWidth: 50, depth: 100, thickness: 5 },
  'i-beam': { flangeWidth: 100, depth: 200, webThickness: 5, flangeThickness: 8 }
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
    case 'square-tube': {
      const side = d(dims.outerSide || 0)
      const wall = d(dims.wallThickness || 0)
      return (side * side - (side - 2 * wall) * (side - 2 * wall)) * density
    }
    case 'c-channel': {
      const fw = d(dims.flangeWidth || 0)
      const depth = d(dims.depth || 0)
      const t = d(dims.thickness || 0)
      return ((2 * fw * t) + ((depth - 2 * t) * t)) * density
    }
    case 'i-beam': {
      const fw = d(dims.flangeWidth || 0)
      const depth = d(dims.depth || 0)
      const wt = d(dims.webThickness || 0)
      const ft = d(dims.flangeThickness || 0)
      return ((2 * fw * ft) + ((depth - 2 * ft) * wt)) * density
    }
    default:
      return 0
  }
}

const inputClass = "w-full px-3.5 py-2.5 border border-sage rounded text-sm bg-white text-black focus:outline-none focus:border-green"

export default function WeightCalculatorForm({ products = APPLICABLE_PRODUCTS }: { products?: CalcProduct[] }) {
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
    <div className="grid gap-5 [grid-template-columns:minmax(260px,1fr)_minmax(240px,320px)] max-[720px]:grid-cols-1">
      <div className="bg-white border border-black/10 rounded p-6">
        {products.length > 1 && (
          <div className="mb-4">
            <p className="text-xs font-bold uppercase tracking-wide text-green mb-2">Select Product</p>
            <select value={String(productId)} onChange={(e) => handleProductChange(e.target.value)} className={inputClass}>
              {products.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.name} ({SHAPE_LABELS[p.shape]})
                </option>
              ))}
            </select>
          </div>
        )}

        {product && (
          <div className="grid gap-3.5 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
            {product.shape === 'round-bar' && (
              <Field label="Diameter (mm)">
                <input type="number" min="0" step="0.1" defaultValue={dims.diameter} onChange={(e) => updateDim('diameter', e.target.value)} className={inputClass} />
              </Field>
            )}
            {product.shape === 'square-bar' && (
              <Field label="Side (mm)">
                <input type="number" min="0" step="0.1" defaultValue={dims.side} onChange={(e) => updateDim('side', e.target.value)} className={inputClass} />
              </Field>
            )}
            {product.shape === 'flat-bar' && (
              <>
                <Field label="Thickness (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.thickness} onChange={(e) => updateDim('thickness', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Width (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.width} onChange={(e) => updateDim('width', e.target.value)} className={inputClass} />
                </Field>
              </>
            )}
            {product.shape === 'round-pipe' && (
              <>
                <Field label="Outer Diameter (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.outerDiameter} onChange={(e) => updateDim('outerDiameter', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Wall Thickness (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.wallThickness} onChange={(e) => updateDim('wallThickness', e.target.value)} className={inputClass} />
                </Field>
              </>
            )}
            {product.shape === 'square-tube' && (
              <>
                <Field label="Outer Side (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.outerSide} onChange={(e) => updateDim('outerSide', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Wall Thickness (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.wallThickness} onChange={(e) => updateDim('wallThickness', e.target.value)} className={inputClass} />
                </Field>
              </>
            )}
            {product.shape === 'angle-bar' && (
              <>
                <Field label="Leg A (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.legA} onChange={(e) => updateDim('legA', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Leg B (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.legB} onChange={(e) => updateDim('legB', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Thickness (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.thickness} onChange={(e) => updateDim('thickness', e.target.value)} className={inputClass} />
                </Field>
              </>
            )}
            {product.shape === 'c-channel' && (
              <>
                <Field label="Flange Width (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.flangeWidth} onChange={(e) => updateDim('flangeWidth', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Depth (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.depth} onChange={(e) => updateDim('depth', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Thickness (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.thickness} onChange={(e) => updateDim('thickness', e.target.value)} className={inputClass} />
                </Field>
              </>
            )}
            {product.shape === 'i-beam' && (
              <>
                <Field label="Flange Width (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.flangeWidth} onChange={(e) => updateDim('flangeWidth', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Depth (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.depth} onChange={(e) => updateDim('depth', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Web Thickness (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.webThickness} onChange={(e) => updateDim('webThickness', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Flange Thickness (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.flangeThickness} onChange={(e) => updateDim('flangeThickness', e.target.value)} className={inputClass} />
                </Field>
              </>
            )}
            {product.shape === 'sheet-plate' && (
              <>
                <Field label="Thickness (mm)">
                  <input type="number" min="0" step="0.1" defaultValue={dims.thickness} onChange={(e) => updateDim('thickness', e.target.value)} className={inputClass} />
                </Field>
                <Field label="Width (mm)">
                  <input type="number" min="0" step="1" defaultValue={1000} onChange={(e) => setSheetWidth(parseFloat(e.target.value) || 0)} className={inputClass} />
                </Field>
                <Field label="Length (mm)">
                  <input type="number" min="0" step="1" defaultValue={2440} onChange={(e) => setSheetLength(parseFloat(e.target.value) || 0)} className={inputClass} />
                </Field>
              </>
            )}
            <Field label={product.shape === 'sheet-plate' ? 'Number of Sheets' : 'Number of Pieces'}>
              <input type="number" min="1" step="1" defaultValue={1} onChange={(e) => setPieces(parseInt(e.target.value) || 1)} className={inputClass} />
            </Field>
          </div>
        )}
      </div>

      <div className="bg-[#3D5F3B] text-white rounded p-6">
        <p className="text-xs font-bold uppercase tracking-wide text-white mb-3.5">Result</p>
        {result ? (
          <div className="flex flex-col gap-3.5">
            <ResultRow label={result.perUnitLabel} value={result.perUnit} />
            <ResultRow label={result.perPieceLabel} value={result.perPiece} />
            <div className="border-t border-white/20 pt-3.5">
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
    <label className="flex flex-col gap-1.5 text-xs font-semibold">
      {label}
      {children}
    </label>
  )
}

function ResultRow({ label, value, big }: { label: string; value: number; big?: boolean }) {
  return (
    <div>
      <p className="text-xs opacity-70 mb-1 m-0 text-white">{label}</p>
      <p className={`text-white font-mono font-semibold mt-1 mb-0 ${big ? 'text-2xl' : 'text-lg'}`}>
        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} kg
      </p>
    </div>
  )
}