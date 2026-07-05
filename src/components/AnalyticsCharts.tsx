'use client'

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function AnalyticsCharts({ data }: { data: any[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <ChartCard title="Spend vs. Leads">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis yAxisId="left" fontSize={12} />
            <YAxis yAxisId="right" orientation="right" fontSize={12} />
            <Tooltip />
            <Line yAxisId="left" type="monotone" dataKey="spend" stroke="#1e4b8f" strokeWidth={2} name="Spend (₱)" />
            <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#d4a24c" strokeWidth={2} name="Leads" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Cost per Lead Trend">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip />
            <Bar dataKey="costPerLead" fill="#0f1f3d" name="Cost per Lead (₱)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: 24 }}>
      <h2 style={{ fontSize: 16, marginBottom: 16 }}>{title}</h2>
      {children}
    </div>
  )
}
