import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Building2, ChevronRight, TrendingUp, DollarSign, Briefcase } from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

const fetchInstitutions = async () => {
  const res = await fetch('/api/institutions')
  if (!res.ok) throw new Error('Failed to fetch institutions')
  return res.json()
}

const fetchInstitutionHoldings = async (cik) => {
  const res = await fetch(`/api/institutions/${cik}`)
  if (!res.ok) throw new Error('Failed to fetch holdings')
  return res.json()
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#14b8a6']

function formatValue(value) {
  if (!value) return '-'
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  return `$${value.toLocaleString()}`
}

function formatShares(shares) {
  if (!shares) return '-'
  if (shares >= 1e9) return `${(shares / 1e9).toFixed(2)}B`
  if (shares >= 1e6) return `${(shares / 1e6).toFixed(2)}M`
  if (shares >= 1e3) return `${(shares / 1e3).toFixed(1)}K`
  return shares.toLocaleString()
}

export default function Institutions() {
  const [selectedCik, setSelectedCik] = useState(null)

  const { data: institutions, isLoading } = useQuery({
    queryKey: ['institutions'],
    queryFn: fetchInstitutions,
  })

  const { data: holdings, isLoading: holdingsLoading } = useQuery({
    queryKey: ['holdings', selectedCik],
    queryFn: () => fetchInstitutionHoldings(selectedCik),
    enabled: !!selectedCik,
  })

  // Prepare chart data
  const pieData = holdings?.holdings?.slice(0, 8).map(h => ({
    name: h.ticker || 'Other',
    value: h.value
  })) || []

  const barData = holdings?.holdings?.slice(0, 10).map(h => ({
    ticker: h.ticker || 'N/A',
    value: h.value / 1e9, // In billions
    shares: h.shares / 1e6 // In millions
  })) || []

  const totalValue = holdings?.holdings?.reduce((sum, h) => sum + (h.value || 0), 0) || 0

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Institutional Investors</h1>
        <p className="text-gray-500">13F filings from major hedge funds and investment managers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Institution List */}
        <div className="card lg:col-span-1 max-h-[600px] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 sticky top-0 bg-white pb-2">
            Tracked Institutions ({institutions?.length || 0})
          </h2>
          <div className="space-y-2">
            {institutions?.map((inst) => (
              <button
                key={inst.cik}
                onClick={() => setSelectedCik(inst.cik)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                  selectedCik === inst.cik
                    ? 'bg-primary-50 text-primary-700 shadow-sm'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${selectedCik === inst.cik ? 'bg-primary-100' : 'bg-gray-100'}`}>
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm truncate max-w-[140px]">{inst.name}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>

        {/* Holdings & Charts */}
        <div className="lg:col-span-3 space-y-6">
          {!selectedCik ? (
            <div className="card text-center py-16">
              <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-700">Select an Institution</h3>
              <p className="text-gray-500 mt-2">Choose a fund from the list to view their portfolio holdings</p>
            </div>
          ) : holdingsLoading ? (
            <div className="card flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Portfolio Value</p>
                      <p className="text-2xl font-bold">{formatValue(totalValue)}</p>
                    </div>
                    <DollarSign className="h-10 w-10 text-blue-200" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Holdings Count</p>
                      <p className="text-2xl font-bold">{holdings?.holdings?.length || 0}</p>
                    </div>
                    <Briefcase className="h-10 w-10 text-green-200" />
                  </div>
                </div>
                <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Top Holding</p>
                      <p className="text-2xl font-bold">{holdings?.holdings?.[0]?.ticker || 'N/A'}</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-purple-200" />
                  </div>
                </div>
              </div>

              {/* Charts */}
              {holdings?.holdings?.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pie Chart */}
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Portfolio Allocation</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatValue(value)} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Bar Chart */}
                  <div className="card">
                    <h3 className="text-lg font-semibold mb-4">Top Holdings by Value</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                          <YAxis type="category" dataKey="ticker" tick={{ fontSize: 11 }} stroke="#9ca3af" width={50} />
                          <Tooltip formatter={(value) => `$${value.toFixed(2)}B`} />
                          <Bar dataKey="value" name="Value (B)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Holdings Table */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">All Holdings - {holdings?.name}</h3>
                {holdings?.holdings?.length > 0 ? (
                  <div className="table-container">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Ticker</th>
                          <th>Company</th>
                          <th className="text-right">Shares</th>
                          <th className="text-right">Value</th>
                          <th className="text-right">% of Portfolio</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {holdings.holdings.map((holding, idx) => (
                          <tr key={`${holding.cusip}-${idx}`}>
                            <td className="text-gray-400">{idx + 1}</td>
                            <td>
                              <span className="font-bold text-primary-600">{holding.ticker || 'N/A'}</span>
                            </td>
                            <td className="text-gray-600 max-w-[200px] truncate">{holding.company_name}</td>
                            <td className="text-right font-medium">{formatShares(holding.shares)}</td>
                            <td className="text-right font-bold">{formatValue(holding.value)}</td>
                            <td className="text-right">
                              <span className="text-sm text-gray-500">
                                {totalValue > 0 ? ((holding.value / totalValue) * 100).toFixed(2) : 0}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No holdings data available.</p>
                    <button
                      onClick={async () => {
                        await fetch('/api/seed', { method: 'POST' })
                        window.location.reload()
                      }}
                      className="btn btn-primary mt-4"
                    >
                      Load Sample Data
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
