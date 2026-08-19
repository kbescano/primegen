import ExcelJS from 'exceljs'

const COMMISSION_RATE = 0.20
const GREEN = 'FF149911'
const DARK = 'FF01172F'
const LIGHT_BAND = 'FFF7F9F7'
const CURRENCY_FMT = '"₱"#,##0.00'

function styleHeaderRow(row: ExcelJS.Row, color = DARK) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
  })
  row.height = 20
}

function styleDataRow(row: ExcelJS.Row, zebra: boolean) {
  row.eachCell((cell) => {
    cell.font = { size: 10 }
    cell.border = { bottom: { style: 'hair', color: { argb: 'FFE5E5E5' } } }
    if (zebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BAND } }
  })
}

function addReportHeader(sheet: ExcelJS.Worksheet, title: string, periodLabel: string | undefined, lastCol: string) {
  sheet.mergeCells(`A1:${lastCol}1`)
  const co = sheet.getCell('A1')
  co.value = 'PRIMEGEN TRADING CORPORATION'
  co.font = { bold: true, size: 14, color: { argb: GREEN } }

  sheet.mergeCells(`A2:${lastCol}2`)
  const ti = sheet.getCell('A2')
  ti.value = title
  ti.font = { bold: true, size: 11, color: { argb: DARK } }

  let row = 3
  if (periodLabel) {
    sheet.mergeCells(`A3:${lastCol}3`)
    sheet.getCell('A3').value = `Period: ${periodLabel}`
    sheet.getCell('A3').font = { italic: true, size: 9, color: { argb: 'FF666666' } }
    row = 4
  }

  sheet.mergeCells(`A${row}:${lastCol}${row}`)
  sheet.getCell(`A${row}`).value = `Generated: ${new Date().toLocaleString('en-PH')}`
  sheet.getCell(`A${row}`).font = { italic: true, size: 9, color: { argb: 'FF999999' } }

  return row + 2
}

function computeOrder(o: any) {
  const items = o.items || []
  const subtotal = items.reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
  const discount = Number(o.discountAmount) || 0
  const delivery = Number(o.deliveryFee) || 0
  const netRev = subtotal - discount + delivery
  const vatAmount = netRev * ((Number(o.vatRate) || 0) / 100)
  const gross = netRev + vatAmount

  const cogs = items.reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
  const markup = netRev - cogs

  const liquidatedOpex = (o.opex || []).reduce(
    (sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0
  )
  const pendingOpex = (o.opex || []).reduce(
    (sum: number, exp: any) => sum + (exp.status === 'pending' ? Number(exp.amount) || 0 : 0), 0
  )

  const profit = markup - liquidatedOpex

  // amountPaid only has a real stored value when paymentStatus is
  // 'partial' -- the field is hidden/unset for 'paid' orders since the
  // full gross amount is implied rather than manually entered. Derive the
  // true collected amount from paymentStatus instead of trusting the raw
  // field for every status.
  const amountPaid =
    o.paymentStatus === 'paid' ? gross :
    o.paymentStatus === 'partial' ? (Number(o.amountPaid) || 0) :
    0

  const receivable = o.paymentStatus === 'partial' ? gross - amountPaid : (o.paymentStatus === 'paid' ? 0 : gross)

  return { gross, cogs, liquidatedOpex, pendingOpex, profit, amountPaid, receivable }
}

export async function generateExcelSummary(orders: any[], periodLabel?: string): Promise<ExcelJS.Workbook> {
  const safeOrders = orders || []
  const processedOrders = safeOrders.map((o) => ({ ...o, computed: computeOrder(o) }))

  const sumGross = processedOrders.reduce((s, o) => s + o.computed.gross, 0)
  const sumPaid = processedOrders.reduce((s, o) => s + o.computed.amountPaid, 0)
  const sumReceivables = processedOrders.reduce((s, o) => s + o.computed.receivable, 0)
  const sumCogs = processedOrders.reduce((s, o) => s + o.computed.cogs, 0)
  const sumOpexLiquidated = processedOrders.reduce((s, o) => s + o.computed.liquidatedOpex, 0)
  const sumPendingOpex = processedOrders.reduce((s, o) => s + o.computed.pendingOpex, 0)
  const sumProfit = processedOrders.reduce((s, o) => s + o.computed.profit, 0)
  const totalCommission = sumProfit * COMMISSION_RATE
  const collectionRate = sumGross > 0 ? (sumPaid / sumGross) * 100 : 0
  const marginPct = sumGross > 0 ? (sumProfit / sumGross) * 100 : 0

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Primegen Trading Corporation'
  workbook.created = new Date()

  // ============ SHEET 1: EXECUTIVE SUMMARY ============
  const exec = workbook.addWorksheet('Executive Summary', {
    pageSetup: {
      orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
  })
  exec.columns = [{ width: 28 }, { width: 18 }, { width: 4 }, { width: 28 }, { width: 18 }]

  let r = addReportHeader(exec, 'Executive Summary', periodLabel, 'E')

  function kpiBlock(
  startRow: number,
  startCol: number,
  title: string,
  rows: [string, number | string, boolean?, ('currency' | 'percent' | 'count')?][]
) {
  const colLetter = String.fromCharCode(64 + startCol)
  const nextColLetter = String.fromCharCode(64 + startCol + 1)
  exec.mergeCells(`${colLetter}${startRow}:${nextColLetter}${startRow}`)
  const hdr = exec.getCell(startRow, startCol)
  hdr.value = title
  hdr.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } }
  hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } }
  hdr.alignment = { vertical: 'middle' }
  exec.getRow(startRow).height = 18

  rows.forEach(([label, value, isTotal, format], i) => {
    const row = exec.getRow(startRow + 1 + i)
    const labelCell = row.getCell(startCol)
    const valueCell = row.getCell(startCol + 1)
    labelCell.value = label
    valueCell.value = value

    if (typeof value === 'number') {
      if (format === 'percent') {
        valueCell.numFmt = '0.0"%"'
      } else if (format !== 'count') {
        valueCell.numFmt = CURRENCY_FMT
      }
      // format === 'count' gets no numFmt -- plain integer
    }

    labelCell.font = { size: 10, bold: !!isTotal }
    valueCell.font = { size: 10, bold: !!isTotal, color: isTotal ? { argb: GREEN } : undefined }
    valueCell.alignment = { horizontal: 'right' }
    if (i % 2 === 1) {
      ;[labelCell, valueCell].forEach((c) => (c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_BAND } }))
    }
  })

  return startRow + 1 + rows.length
}

  const revenueEnd = kpiBlock(r, 1, 'REVENUE', [
  ['Total Orders', processedOrders.length, false, 'count'],
  ['Gross Revenue', sumGross, false, 'currency'],
  ['Amount Collected', sumPaid, false, 'currency'],
  ['Collection Rate (%)', Number(collectionRate.toFixed(1)), false, 'percent'],
])

const costsEnd = kpiBlock(r, 4, 'COSTS', [
  ['Total COGS', sumCogs, false, 'currency'],
  ['Liquidated OPEX', sumOpexLiquidated, false, 'currency'],
  ...(sumPendingOpex > 0 ? [['Pending OPEX', sumPendingOpex, false, 'currency'] as [string, number, boolean, 'currency']] : []),
])

const nextRow = Math.max(revenueEnd, costsEnd) + 1

const profitEnd = kpiBlock(nextRow, 1, 'PROFITABILITY', [
  ['Net Profit', sumProfit, false, 'currency'],
  ['Profit Margin (%)', Number(marginPct.toFixed(1)), false, 'percent'],
  ['Total Commission (20%)', totalCommission, true, 'currency'],
])

kpiBlock(nextRow, 4, 'RECEIVABLES', [
  ['Outstanding Receivables', sumReceivables, false, 'currency'],
])

  const noteRow = exec.getRow(profitEnd + 2)
  noteRow.getCell(1).value = 'Figures reflect the selected reporting period only.'
  noteRow.getCell(1).font = { italic: true, size: 8, color: { argb: 'FF999999' } }

  // ============ SHEET 2: SALES PERFORMANCE ============
  const salesSheet = workbook.addWorksheet('Sales Performance', {
    pageSetup: {
      orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
  })
  salesSheet.columns = [
    { header: 'Sales Agent', key: 'agent', width: 22 },
    { header: 'Order Count', key: 'count', width: 12 },
    { header: 'Gross Revenue', key: 'gross', width: 16 },
    { header: 'Amount Collected', key: 'paid', width: 16 },
    { header: 'Receivables', key: 'ar', width: 14 },
    { header: 'Liquidated OPEX', key: 'opex', width: 15 },
    { header: 'Net Profit', key: 'profit', width: 14 },
    { header: 'Commission (20%)', key: 'commission', width: 16 },
  ]

  let sr = addReportHeader(salesSheet, 'Sales Performance Breakdown', periodLabel, 'H')
  salesSheet.getRow(sr).values = salesSheet.columns.map((c) => c.header as string)
  styleHeaderRow(salesSheet.getRow(sr), GREEN)
  salesSheet.views = [{ state: 'frozen', ySplit: sr }]
  sr++

  const bySales: Record<string, { count: number; gross: number; paid: number; ar: number; opex: number; profit: number }> = {}
  processedOrders.forEach((o) => {
    const sp = o.salesPerson || 'Unassigned'
    if (!bySales[sp]) bySales[sp] = { count: 0, gross: 0, paid: 0, ar: 0, opex: 0, profit: 0 }
    const c = o.computed
    bySales[sp].count++
    bySales[sp].gross += c.gross
    bySales[sp].paid += c.amountPaid
    bySales[sp].ar += c.receivable
    bySales[sp].opex += c.liquidatedOpex
    bySales[sp].profit += c.profit
  })

  Object.entries(bySales).sort((a, b) => b[1].profit - a[1].profit).forEach(([agent, data], i) => {
    const commission = data.profit * COMMISSION_RATE
    const row = salesSheet.getRow(sr)
    row.values = [agent, data.count, data.gross, data.paid, data.ar, data.opex, data.profit, commission]
    ;[3, 4, 5, 6, 7, 8].forEach((col) => (row.getCell(col).numFmt = CURRENCY_FMT))
    styleDataRow(row, i % 2 === 1)
    sr++
  })

  const salesTotalRow = salesSheet.getRow(sr)
  salesTotalRow.values = ['GRAND TOTAL', processedOrders.length, sumGross, sumPaid, sumReceivables, sumOpexLiquidated, sumProfit, totalCommission]
  ;[3, 4, 5, 6, 7, 8].forEach((col) => (salesTotalRow.getCell(col).numFmt = CURRENCY_FMT))
  salesTotalRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 }
    cell.border = { top: { style: 'medium', color: { argb: DARK } } }
  })

  // ============ SHEET 3: PER-ORDER DETAIL ============
  const orderSheet = workbook.addWorksheet('Order Detail', {
    pageSetup: {
      orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
    },
  })
  orderSheet.columns = [
    { header: 'Order #', key: 'orderNumber', width: 14 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Customer', key: 'customer', width: 20 },
    { header: 'Sales Agent', key: 'agent', width: 16 },
    { header: 'Fulfillment', key: 'fulfillment', width: 12 },
    { header: 'Payment', key: 'payment', width: 12 },
    { header: 'Gross Revenue', key: 'gross', width: 14 },
    { header: 'Amount Paid', key: 'paid', width: 13 },
    { header: 'Receivables', key: 'ar', width: 13 },
    { header: 'COGS', key: 'cogs', width: 12 },
    { header: 'Liquidated OPEX', key: 'opex', width: 15 },
    { header: 'Net Profit', key: 'profit', width: 13 },
    { header: 'Commission (20%)', key: 'commission', width: 16 },
  ]

  let orow = addReportHeader(orderSheet, 'Per-Order Detail', periodLabel, 'M')
  orderSheet.getRow(orow).values = orderSheet.columns.map((c) => c.header as string)
  styleHeaderRow(orderSheet.getRow(orow), DARK)
  orderSheet.views = [{ state: 'frozen', ySplit: orow }]
  orow++

  const sortedOrders = processedOrders.slice().sort((a, b) => {
    const da = new Date(a.orderDate || a.createdAt).getTime()
    const db = new Date(b.orderDate || b.createdAt).getTime()
    return da - db
  })

  sortedOrders.forEach((o, i) => {
    const c = o.computed
    const commission = c.profit * COMMISSION_RATE
    const dateStr = o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-PH') : new Date(o.createdAt).toLocaleDateString('en-PH')
    const row = orderSheet.getRow(orow)
    row.values = [
      o.orderNumber || '--', dateStr, o.customerName || '--', o.salesPerson || 'Unassigned',
      o.fulfillmentStatus || '--', o.paymentStatus || '--',
      c.gross, c.amountPaid, c.receivable, c.cogs, c.liquidatedOpex, c.profit, commission,
    ]
    ;[7, 8, 9, 10, 11, 12, 13].forEach((col) => (row.getCell(col).numFmt = CURRENCY_FMT))
    styleDataRow(row, i % 2 === 1)
    orow++
  })

  const orderTotalRow = orderSheet.getRow(orow)
  orderTotalRow.values = ['GRAND TOTAL', '', '', '', '', '', sumGross, sumPaid, sumReceivables, sumCogs, sumOpexLiquidated, sumProfit, totalCommission]
  ;[7, 8, 9, 10, 11, 12, 13].forEach((col) => (orderTotalRow.getCell(col).numFmt = CURRENCY_FMT))
  orderTotalRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10 }
    cell.border = { top: { style: 'medium', color: { argb: DARK } } }
  })

  return workbook
}

export async function downloadExcelSummary(orders: any[], periodLabel?: string) {
  const workbook = await generateExcelSummary(orders, periodLabel)
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `primegen-summary-${new Date().toISOString().split('T')[0]}.xlsx`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}