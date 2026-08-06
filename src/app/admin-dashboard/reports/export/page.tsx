'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ExportCenterPage() {
  const [period, setPeriod] = useState<'this_month' | 'ytd' | 'all_time' | 'custom'>('this_month')
  
  // Set defaults dynamically
  const now = new Date()
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0')
  const currentYear = String(now.getFullYear())

  const [customMonth, setCustomMonth] = useState(currentMonth) 
  const [customYear, setCustomYear] = useState(currentYear)
  const [format, setFormat] = useState<'excel_summary' | 'csv_ledger'>('excel_summary')
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    
    try {
      // 1. Fetch raw data directly from your Payload database
      const res = await fetch('/api/orders?limit=1000&depth=0', { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch order data')
      const data = await res.json()
      let orders: any[] = data.docs || []

      // 2. Filter based on selected period
      orders = orders.filter(o => {
        if (period === 'all_time') return true
        const d = new Date(o.orderDate || o.createdAt)
        if (isNaN(d.getTime())) return false

        const m = String(d.getMonth() + 1).padStart(2, '0')
        const y = String(d.getFullYear())

        if (period === 'this_month') {
          return m === currentMonth && y === currentYear
        }
        if (period === 'ytd') {
          return y === currentYear
        }
        if (period === 'custom') {
          return m === customMonth && y === customYear
        }
        return true
      })

      // 3. Helper to prevent CSV breaking from internal commas in names/addresses
      const escape = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`
      
      let csv = ''

      // 4a. Generate RAW LEDGER
      if (format === 'csv_ledger') {
        csv += "Date,Order Number,Customer,Company,Sales Agent,Fulfillment Status,Payment Status,Gross Revenue,VAT Payable,Total COGS,Liquidated OPEX,True Net Profit\n"
        
        orders.forEach(o => {
          const date = new Date(o.orderDate || o.createdAt).toLocaleDateString('en-PH')
          const orderNo = o.orderNumber || ''
          const customer = o.customerName || ''
          const company = o.company || ''
          const salesPerson = o.salesPerson || ''
          const fulfillment = o.fulfillmentStatus || 'preparing'
          const payment = o.paymentStatus || 'unpaid'

          // Financial Math explicitly calculated for CSV payload
          const subtotal = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
          const discount = Number(o.discountAmount) || 0
          const delivery = Number(o.deliveryFee) || 0
          const netRev = subtotal - discount + delivery
          
          const vatVal = netRev * ((Number(o.vatRate) || 0) / 100)
          const gross = netRev + vatVal

          const cogs = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
          const opex = (o.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0)
          
          const profit = (netRev - cogs) - opex

          csv += `${escape(date)},${escape(orderNo)},${escape(customer)},${escape(company)},${escape(salesPerson)},${escape(fulfillment)},${escape(payment)},${gross.toFixed(2)},${vatVal.toFixed(2)},${cogs.toFixed(2)},${opex.toFixed(2)},${profit.toFixed(2)}\n`
        })
      } 
      // 4b. Generate EXECUTIVE SUMMARY
      else {
        const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
        let totalGross = 0, totalVat = 0, totalCogs = 0, totalOpex = 0
        
        paidOrders.forEach(o => {
          const subtotal = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
          const netRev = subtotal - (Number(o.discountAmount) || 0) + (Number(o.deliveryFee) || 0)
          const vatVal = netRev * ((Number(o.vatRate) || 0) / 100)
          
          totalGross += netRev + vatVal
          totalVat += vatVal
          totalCogs += (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
          totalOpex += (o.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0)
        })

        const profit = totalGross - totalVat - totalCogs - totalOpex
        const periodStr = period === 'custom' ? `${customMonth}/${customYear}` : period.replace('_', ' ').toUpperCase()

        csv += "PRIMEGEN TRADING CORPORATION\n"
        csv += "EXECUTIVE FINANCIAL SUMMARY\n\n"
        csv += `Period:,${periodStr}\n`
        csv += `Generated On:,${new Date().toLocaleString('en-PH')}\n\n`
        
        csv += `PIPELINE OVERVIEW\n`
        csv += `Total Confirmed Orders,${orders.length}\n`
        csv += `Fully Paid Orders,${paidOrders.length}\n`
        csv += `Unpaid / Pending,${orders.length - paidOrders.length}\n\n`
        
        csv += `FINANCIAL PERFORMANCE (Paid Orders Only)\n`
        csv += `Gross Revenue,${totalGross.toFixed(2)}\n`
        csv += `VAT Collected / Payable,-${totalVat.toFixed(2)}\n`
        csv += `Cost of Goods Sold (COGS),-${totalCogs.toFixed(2)}\n`
        csv += `Liquidated OPEX,-${totalOpex.toFixed(2)}\n`
        csv += `True Net Profit,${profit.toFixed(2)}\n\n`

        csv += `SALES PERFORMANCE BREAKDOWN (Paid Orders Only)\n`
        csv += `Sales Agent,Order Count,Gross Revenue generated,True Net Profit Contributed\n`
        
        const bySales: Record<string, {count: number, gross: number, profit: number}> = {}
        paidOrders.forEach(o => {
           const sp = o.salesPerson || 'Unassigned'
           if (!bySales[sp]) bySales[sp] = { count: 0, gross: 0, profit: 0 }
           
           const subtotal = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitPrice) || 0), 0)
           const netRev = subtotal - (Number(o.discountAmount) || 0) + (Number(o.deliveryFee) || 0)
           const vatVal = netRev * ((Number(o.vatRate) || 0) / 100)
           const gross = netRev + vatVal
           const cogs = (o.items || []).reduce((sum: number, i: any) => sum + (Number(i.qty) || 0) * (Number(i.unitCost) || 0), 0)
           const opex = (o.opex || []).reduce((sum: number, exp: any) => sum + (exp.status === 'liquidated' ? Number(exp.amount) || 0 : 0), 0)
           
           bySales[sp].count++
           bySales[sp].gross += gross
           bySales[sp].profit += (netRev - cogs) - opex
        })

        Object.entries(bySales).sort((a,b) => b[1].profit - a[1].profit).forEach(([agent, data]) => {
           csv += `${escape(agent)},${data.count},${data.gross.toFixed(2)},${data.profit.toFixed(2)}\n`
        })
      }

      // 5. Build File and Trigger Browser Download natively 
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', format === 'excel_summary' ? 'Executive_Summary.csv' : 'Raw_Ledger.csv')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

    } catch (error) {
      console.error("Export error:", error)
      alert("Failed to generate export. Please check your connection and try again.")
    } finally {
      setIsDownloading(false)
    }
  }

  // Pre-generate year array dynamically starting from 2023
  const filterYears = Array.from({ length: Number(currentYear) - 2023 + 2 }, (_, i) => String(2023 + i))

  return (
    <div className="min-h-screen bg-white">
      
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between p-6 md:px-10 border-b border-gray-100">
        <Link href="/admin-dashboard/reports" className="inline-flex items-center gap-2 text-[12px] font-semibold text-gray-400 hover:text-gray-900 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
          Back to Reports
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row max-w-[1000px] mx-auto">
        
        {/* LEFT COLUMN: CONTROLS */}
        <div className="w-full lg:w-[45%] xl:w-[40%] p-8 md:p-12 lg:pr-16 flex flex-col">
          
          <div className="mb-12">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4">
              Data & Export
            </p>
            <h1 className="text-[40px] md:text-[48px] font-serif text-[#1d1d1f] tracking-tight leading-none">
              Report Center
            </h1>
          </div>

          {/* STEP 1: PERIOD */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">1</div>
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Select Period</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setPeriod('this_month')}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all outline-none ${period === 'this_month' ? 'border-[#149911] shadow-[0_0_0_1px_#149911] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={period === 'this_month' ? 'text-[#149911]' : 'text-gray-400'}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${period === 'this_month' ? 'text-[#149911]' : 'text-gray-500'}`}>This Month</span>
              </button>

              <div 
                className={`relative flex flex-col justify-center p-4 rounded-xl border transition-all ${period === 'custom' ? 'border-[#149911] shadow-[0_0_0_1px_#149911] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex justify-between items-center w-full mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${period === 'custom' ? 'text-[#149911]' : 'text-gray-400'}`}>Custom</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={period === 'custom' ? 'text-[#149911]' : 'text-gray-300'}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </div>
                
                <div className="flex gap-2">
                  <select 
                    value={customMonth}
                    onChange={(e) => { setPeriod('custom'); setCustomMonth(e.target.value) }}
                    className={`w-full text-[12px] font-semibold bg-transparent outline-none cursor-pointer appearance-none ${period === 'custom' ? 'text-[#149911]' : 'text-gray-600'}`}
                  >
                    <option value="01">Jan</option><option value="02">Feb</option><option value="03">Mar</option>
                    <option value="04">Apr</option><option value="05">May</option><option value="06">Jun</option>
                    <option value="07">Jul</option><option value="08">Aug</option><option value="09">Sep</option>
                    <option value="10">Oct</option><option value="11">Nov</option><option value="12">Dec</option>
                  </select>
                  <select 
                    value={customYear}
                    onChange={(e) => { setPeriod('custom'); setCustomYear(e.target.value) }}
                    className={`w-full text-[12px] font-semibold bg-transparent outline-none cursor-pointer appearance-none ${period === 'custom' ? 'text-[#149911]' : 'text-gray-600'}`}
                  >
                    {filterYears.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <button 
                onClick={() => setPeriod('ytd')}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all outline-none ${period === 'ytd' ? 'border-[#149911] shadow-[0_0_0_1px_#149911] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={period === 'ytd' ? 'text-[#149911]' : 'text-gray-400'}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${period === 'ytd' ? 'text-[#149911]' : 'text-gray-500'}`}>Year to Date</span>
              </button>

              <button 
                onClick={() => setPeriod('all_time')}
                className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border transition-all outline-none ${period === 'all_time' ? 'border-[#149911] shadow-[0_0_0_1px_#149911] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={period === 'all_time' ? 'text-[#149911]' : 'text-gray-400'}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${period === 'all_time' ? 'text-[#149911]' : 'text-gray-500'}`}>All Time</span>
              </button>
            </div>
          </div>

          {/* STEP 2: FORMAT */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-400">2</div>
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-500">Output Format</h2>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => setFormat('excel_summary')}
                className={`flex items-start gap-5 p-6 rounded-2xl border transition-all outline-none text-left ${format === 'excel_summary' ? 'border-[#149911] shadow-[0_0_0_1px_#149911] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 mt-1 ${format === 'excel_summary' ? 'text-[#149911]' : 'text-gray-400'}`}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                <div>
                  <p className={`text-[13px] font-bold tracking-wide mb-1.5 ${format === 'excel_summary' ? 'text-[#1d1d1f]' : 'text-gray-800'}`}>EXECUTIVE SUMMARY (CSV / EXCEL)</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed font-medium">Includes aggregate pipeline tracking, financial math, and performance breakdowns seamlessly formatted for Excel.</p>
                </div>
              </button>

              <button 
                onClick={() => setFormat('csv_ledger')}
                className={`flex items-start gap-5 p-6 rounded-2xl border transition-all outline-none text-left ${format === 'csv_ledger' ? 'border-[#149911] shadow-[0_0_0_1px_#149911] bg-green-50/30' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`shrink-0 mt-1 ${format === 'csv_ledger' ? 'text-[#149911]' : 'text-gray-400'}`}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/><line x1="15" y1="9" x2="15" y2="21"/></svg>
                <div>
                  <p className={`text-[13px] font-bold tracking-wide mb-1.5 ${format === 'csv_ledger' ? 'text-[#1d1d1f]' : 'text-gray-800'}`}>RAW LEDGER (CSV / EXCEL)</p>
                  <p className="text-[12px] text-gray-500 leading-relaxed font-medium">Standard spreadsheet of all completed orders, costs, and P&L totals ready for database imports or deep formulas.</p>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4">
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full py-4 rounded-full bg-[#1A1A1A] text-white text-[12px] font-bold uppercase tracking-[0.15em] hover:bg-black transition-colors shadow-xl disabled:opacity-70 flex items-center justify-center gap-3"
            >
              {isDownloading ? (
                <span>Generating Data...</span>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download Report
                </>
              )}
            </button>
          </div>

        </div>


        {/* RIGHT COLUMN: PREVIEW */}
        <div className="w-full lg:w-[55%] xl:w-[60%] p-4 sm:p-8 md:p-12 lg:pl-0 flex flex-col">
          
          <div className="flex items-center gap-3 mb-6 lg:mb-12 px-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Document Preview</h2>
          </div>

          <div className="bg-[#f8f9fa] border border-gray-100 rounded-[2.5rem] p-6 sm:p-10 md:p-16 flex items-start justify-center flex-1 shadow-inner">
            
            {/* Mock Sheet of Paper */}
            <div className="bg-white rounded-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-[540px] p-8 sm:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              <h3 className="text-[28px] sm:text-[32px] font-serif text-[#1d1d1f] mb-2 tracking-tight">
                {format === 'csv_ledger' ? 'Raw Ledger Export' : 'Executive Summary'}
              </h3>
              
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-8">
                {period === 'all_time' ? 'Full Archive' : period === 'ytd' ? `Year to Date - ${customYear}` : period === 'custom' ? `Selected Month - ${customMonth}/${customYear}` : 'Current Month'}
              </p>
              
              <div className="w-full h-[2px] bg-gray-900 mb-10" />
              
              {/* Skeleton content reflecting chosen format */}
              {format === 'excel_summary' ? (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-3">Total Revenue</p>
                      <div className="h-5 w-24 bg-gray-200 rounded-full" />
                    </div>
                    <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-3">True Net Profit</p>
                      <div className="h-5 w-16 bg-[#149911]/20 rounded-full" />
                    </div>
                  </div>

                  <div className="mb-10">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">Category Sales</p>
                    <div className="flex justify-between items-center mb-3"><div className="h-3 w-40 bg-gray-100 rounded-full"/><div className="h-3 w-12 bg-gray-100 rounded-full"/></div>
                    <div className="flex justify-between items-center mb-3"><div className="h-3 w-32 bg-gray-100 rounded-full"/><div className="h-3 w-12 bg-gray-100 rounded-full"/></div>
                    <div className="flex justify-between items-center"><div className="h-3 w-48 bg-gray-100 rounded-full"/><div className="h-3 w-12 bg-gray-100 rounded-full"/></div>
                  </div>

                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">Breakdown (Preview)</p>
                    <div className="h-10 w-full bg-gray-50 rounded-lg mb-2" />
                    <div className="h-10 w-full bg-gray-50 rounded-lg mb-2" />
                    <div className="h-10 w-full bg-gray-50 rounded-lg" />
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-6">
                    <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">Ledger Columns (A-K)</p>
                    <div className="flex gap-2 mb-4 overflow-hidden">
                       <div className="h-4 w-12 bg-gray-200 rounded-sm" />
                       <div className="h-4 w-20 bg-gray-200 rounded-sm" />
                       <div className="h-4 w-16 bg-gray-200 rounded-sm" />
                       <div className="h-4 w-24 bg-gray-200 rounded-sm" />
                       <div className="h-4 w-16 bg-gray-200 rounded-sm" />
                    </div>
                    
                    <div className="h-6 w-full bg-gray-50 border-b border-gray-100 mb-1" />
                    <div className="h-6 w-full bg-gray-50 border-b border-gray-100 mb-1" />
                    <div className="h-6 w-full bg-gray-50 border-b border-gray-100 mb-1" />
                    <div className="h-6 w-full bg-gray-50 border-b border-gray-100 mb-1" />
                    <div className="h-6 w-full bg-gray-50 border-b border-gray-100 mb-1" />
                    <div className="h-6 w-full bg-gray-50 border-b border-gray-100 mb-1" />
                  </div>
                </>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}