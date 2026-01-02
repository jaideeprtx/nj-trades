import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  UserCircle,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  Search,
  RefreshCw
} from 'lucide-react'

const fetchInsiderTrades = async () => {
  const res = await fetch('/api/insider?limit=100')
  if (!res.ok) throw new Error('Failed to fetch insider trades')
  return res.json()
}

const fetchInsiderBuys = async () => {
  const res = await fetch('/api/insider/buys?limit=20')
  if (!res.ok) throw new Error('Failed to fetch insider buys')
  return res.json()
}

function formatValue(value) {
  if (!value) return '-'
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`
  return `$${value.toLocaleString()}`
}

function formatShares(shares) {
  if (!shares) return '-'
  if (shares >= 1e6) return `${(shares / 1e6).toFixed(2)}M`
  if (shares >= 1e3) return `${(shares / 1e3).toFixed(1)}K`
  return shares.toLocaleString()
}

export default function Insider() {
  const [search, setSearch] = useState('')
  const [showBuysOnly, setShowBuysOnly] = useState(false)

  const { data: trades, isLoading, refetch } = useQuery({
    queryKey: ['insider-trades'],
    queryFn: fetchInsiderTrades,
    refetchInterval: 60000, // Refetch every minute
  })

  const { data: recentBuys } = useQuery({
    queryKey: ['insider-buys'],
    queryFn: fetchInsiderBuys,
  })

  const filteredTrades = trades?.filter(trade => {
    if (showBuysOnly && trade.transaction_type !== 'P') return false
    if (search) {
      const s = search.toLowerCase()
      return (
        trade.ticker?.toLowerCase().includes(s) ||
        trade.company_name?.toLowerCase().includes(s) ||
        trade.insider_name?.toLowerCase().includes(s)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Insider Trading</h1>
          <p className="text-gray-500">SEC Form 4 filings - Corporate insider buys and sells</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn btn-secondary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search ticker, company, or insider..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showBuysOnly}
              onChange={(e) => setShowBuysOnly(e.target.checked)}
              className="rounded text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-600">Show buys only</span>
          </label>

          <span className="text-sm text-gray-500">
            {filteredTrades?.length || 0} trades
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Recent Buys Highlight */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <ArrowUpRight className="h-5 w-5 text-green-500" />
            <span>Recent Insider Buys</span>
          </h2>
          <div className="space-y-3">
            {recentBuys?.slice(0, 8).map((trade) => (
              <div key={trade.id} className="p-3 bg-green-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-green-700">{trade.ticker}</span>
                  <span className="text-sm text-green-600">
                    {formatShares(trade.shares)} shares
                  </span>
                </div>
                <p className="text-xs text-gray-600 truncate">{trade.insider_name}</p>
                <p className="text-xs text-gray-400">{trade.insider_title}</p>
              </div>
            ))}
            {(!recentBuys || recentBuys.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">
                No insider buys recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Trades Table */}
        <div className="lg:col-span-3 card">
          <h2 className="text-lg font-semibold mb-4">All Insider Trades</h2>

          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredTrades?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Filing Date</th>
                    <th>Ticker</th>
                    <th>Insider</th>
                    <th>Type</th>
                    <th className="text-right">Shares</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Value</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrades.map((trade) => (
                    <tr key={trade.id}>
                      <td className="text-gray-500 text-xs">
                        {new Date(trade.filing_date).toLocaleDateString()}
                      </td>
                      <td>
                        <div>
                          <p className="font-bold">{trade.ticker}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[120px]">
                            {trade.company_name}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="text-sm font-medium">{trade.insider_name}</p>
                          <p className="text-xs text-gray-400">{trade.insider_title}</p>
                        </div>
                      </td>
                      <td>
                        {trade.transaction_type === 'P' ? (
                          <div className="flex items-center space-x-1">
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                            <span className="badge badge-green">Buy</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <ArrowDownRight className="h-4 w-4 text-red-500" />
                            <span className="badge badge-red">Sell</span>
                          </div>
                        )}
                      </td>
                      <td className="text-right">{formatShares(trade.shares)}</td>
                      <td className="text-right">
                        {trade.price_per_share ? `$${trade.price_per_share.toFixed(2)}` : '-'}
                      </td>
                      <td className="text-right font-medium">
                        {formatValue(trade.total_value)}
                      </td>
                      <td>
                        {trade.filing_url && (
                          <a
                            href={trade.filing_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-primary-600"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <UserCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No insider trades found.</p>
              <p className="text-sm mt-2">
                Insider trades are fetched from SEC Form 4 filings every 5 minutes.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Info Box */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">About Insider Trading Data</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>- Form 4 filings are required within 2 business days of a transaction</li>
          <li>- "P" = Purchase (insider buying), "S" = Sale (insider selling)</li>
          <li>- Insider buys are often seen as bullish signals</li>
          <li>- Data updates automatically every 5 minutes from SEC EDGAR</li>
        </ul>
      </div>
    </div>
  )
}
