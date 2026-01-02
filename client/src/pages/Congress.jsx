import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import {
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Search
} from 'lucide-react'

const fetchCongressTrades = async () => {
  const res = await fetch('/api/congress?limit=100')
  if (!res.ok) throw new Error('Failed to fetch congress trades')
  return res.json()
}

const fetchMembers = async () => {
  const res = await fetch('/api/congress/members')
  if (!res.ok) throw new Error('Failed to fetch members')
  return res.json()
}

export default function Congress() {
  const [filter, setFilter] = useState({ party: 'all', type: 'all', search: '' })

  const { data: trades, isLoading } = useQuery({
    queryKey: ['congress-trades'],
    queryFn: fetchCongressTrades,
  })

  const { data: members } = useQuery({
    queryKey: ['congress-members'],
    queryFn: fetchMembers,
  })

  const filteredTrades = trades?.filter(trade => {
    if (filter.party !== 'all' && trade.party !== filter.party) return false
    if (filter.type !== 'all' && trade.transaction_type !== filter.type) return false
    if (filter.search) {
      const search = filter.search.toLowerCase()
      return (
        trade.member?.toLowerCase().includes(search) ||
        trade.ticker?.toLowerCase().includes(search) ||
        trade.asset_description?.toLowerCase().includes(search)
      )
    }
    return true
  })

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
        <h1 className="text-2xl font-bold text-gray-900">Congress Tracker</h1>
        <p className="text-gray-500">Stock trades by US Senators and Representatives (STOCK Act disclosures)</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">Filter:</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search member or ticker..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              value={filter.search}
              onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
            />
          </div>

          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filter.party}
            onChange={(e) => setFilter(f => ({ ...f, party: e.target.value }))}
          >
            <option value="all">All Parties</option>
            <option value="D">Democrat</option>
            <option value="R">Republican</option>
          </select>

          <select
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={filter.type}
            onChange={(e) => setFilter(f => ({ ...f, type: e.target.value }))}
          >
            <option value="all">All Types</option>
            <option value="Purchase">Purchases</option>
            <option value="Sale">Sales</option>
          </select>

          <span className="text-sm text-gray-500">
            {filteredTrades?.length || 0} trades
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Top Traders */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Most Active Members</h2>
          <div className="space-y-3">
            {members?.slice(0, 10).map((member, i) => (
              <div key={member.member} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm w-4">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{member.member}</p>
                    <p className="text-xs text-gray-400">
                      {member.party} - {member.state}
                    </p>
                  </div>
                </div>
                <span className="badge badge-blue">{member.trade_count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trades Table */}
        <div className="lg:col-span-3 card">
          <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>

          {filteredTrades?.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Member</th>
                    <th>Ticker</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Party</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTrades.map((trade) => (
                    <tr key={trade.id}>
                      <td className="text-gray-500">{trade.transaction_date}</td>
                      <td>
                        <div>
                          <p className="font-medium">{trade.member}</p>
                          <p className="text-xs text-gray-400">{trade.chamber} - {trade.state}</p>
                        </div>
                      </td>
                      <td>
                        <div>
                          <p className="font-medium">{trade.ticker || 'N/A'}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[150px]">
                            {trade.asset_description}
                          </p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center space-x-1">
                          {trade.transaction_type === 'Purchase' ? (
                            <>
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                              <span className="badge badge-green">Buy</span>
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                              <span className="badge badge-red">Sell</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="text-sm">{trade.amount_range}</td>
                      <td>
                        <span className={`badge ${trade.party === 'D' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'}`}>
                          {trade.party === 'D' ? 'Dem' : 'Rep'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Landmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No congress trades found.</p>
              <p className="text-sm mt-2">Data is fetched from official disclosure websites.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
