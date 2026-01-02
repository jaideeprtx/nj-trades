import { useQuery } from '@tanstack/react-query'
import {
  Building2,
  Landmark,
  UserCircle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts'

const fetchStats = async () => {
  const res = await fetch('/api/stats')
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

const fetchTrending = async () => {
  const res = await fetch('/api/trending')
  if (!res.ok) throw new Error('Failed to fetch trending')
  return res.json()
}

const fetchRecentCongress = async () => {
  const res = await fetch('/api/congress?limit=100')
  if (!res.ok) throw new Error('Failed to fetch congress trades')
  return res.json()
}

const fetchRecentInsider = async () => {
  const res = await fetch('/api/insider?limit=100')
  if (!res.ok) throw new Error('Failed to fetch insider trades')
  return res.json()
}

function StatCard({ icon: Icon, label, value, change, color, bgColor }) {
  return (
    <div className="card relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 ${bgColor} opacity-10 rounded-full -mr-16 -mt-16`} />
      <div className="flex items-center justify-between relative">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value?.toLocaleString() || 0}</p>
          {change && (
            <p className={`text-sm mt-1 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change > 0 ? '+' : ''}{change}% from last week
            </p>
          )}
        </div>
        <div className={`p-4 rounded-2xl ${bgColor}`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </div>
  )
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

const SECTOR_COLORS = {
  Tech: '#3b82f6',
  Finance: '#10b981',
  Healthcare: '#ef4444',
  Energy: '#f59e0b',
  Defense: '#6366f1',
  Consumer: '#ec4899',
  Other: '#6b7280'
}

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: fetchStats,
  })

  const { data: trending } = useQuery({
    queryKey: ['trending'],
    queryFn: fetchTrending,
  })

  const { data: congressTrades } = useQuery({
    queryKey: ['congress-all'],
    queryFn: fetchRecentCongress,
  })

  const { data: insiderTrades } = useQuery({
    queryKey: ['insider-all'],
    queryFn: fetchRecentInsider,
  })

  // Process data for charts
  const sectorData = processSectorData(congressTrades)
  const activityData = processActivityData(congressTrades, insiderTrades)
  const buyVsSellData = processBuyVsSell(congressTrades)
  const partyData = processPartyData(congressTrades)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Real-time institutional, congressional, and insider trading intelligence</p>
        </div>
        <div className="hidden sm:flex items-center space-x-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full">
          <Activity className="h-4 w-4 animate-pulse" />
          <span className="text-sm font-medium">Live Data</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Tracked Institutions"
          value={stats?.institution_count}
          color="text-blue-600"
          bgColor="bg-blue-500"
        />
        <StatCard
          icon={DollarSign}
          label="Holdings Tracked"
          value={stats?.holding_count}
          color="text-green-600"
          bgColor="bg-green-500"
        />
        <StatCard
          icon={Landmark}
          label="Congress Trades"
          value={stats?.congress_trade_count}
          color="text-purple-600"
          bgColor="bg-purple-500"
        />
        <StatCard
          icon={UserCircle}
          label="Insider Trades"
          value={stats?.insider_trade_count}
          color="text-orange-600"
          bgColor="bg-orange-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Timeline */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-gray-400" />
              <span>Trading Activity (Last 30 Days)</span>
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorCongress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInsider" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Area type="monotone" dataKey="congress" name="Congress" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorCongress)" />
                <Area type="monotone" dataKey="insider" name="Insider" stroke="#f59e0b" fillOpacity={1} fill="url(#colorInsider)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sector Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center space-x-2">
              <PieChartIcon className="h-5 w-5 text-gray-400" />
              <span>Congress Trades by Sector</span>
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sectorData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {sectorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SECTOR_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} trades`, 'Count']}
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Buy vs Sell */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Buy vs Sell Ratio</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={buyVsSellData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" width={80} />
                <Tooltip />
                <Bar dataKey="buy" name="Buy" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="sell" name="Sell" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Party Breakdown */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Trades by Party</h2>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={partyData}
                  cx="50%"
                  cy="50%"
                  outerRadius={70}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  <Cell fill="#3b82f6" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trending Tickers */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Top Trending Tickers</h2>
          {trending?.length > 0 ? (
            <div className="space-y-2">
              {trending.slice(0, 6).map((item, i) => (
                <div key={item.ticker} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="font-bold text-gray-900">{item.ticker}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{item.totalMentions} trades</span>
                    <div className="flex space-x-1">
                      {item.sources.includes('congress') && (
                        <span className="w-2 h-2 bg-purple-500 rounded-full" title="Congress" />
                      )}
                      {item.sources.includes('insider') && (
                        <span className="w-2 h-2 bg-orange-500 rounded-full" title="Insider" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Loading trending data...</p>
          )}
        </div>
      </div>

      {/* Recent Trades */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Congress Trades */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Congress Trades</h2>
            <a href="/congress" className="text-sm text-primary-600 hover:text-primary-700">View all →</a>
          </div>
          {congressTrades?.length > 0 ? (
            <div className="space-y-3">
              {congressTrades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    {trade.transaction_type === 'Purchase' ? (
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 rounded-lg">
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold">{trade.ticker || 'N/A'}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          trade.party === 'D' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {trade.party === 'D' ? 'DEM' : 'REP'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{trade.member}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{trade.amount_range}</p>
                    <p className="text-xs text-gray-400">{trade.transaction_date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No congress trades yet.</p>
          )}
        </div>

        {/* Recent Insider Trades */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Insider Trades</h2>
            <a href="/insider" className="text-sm text-primary-600 hover:text-primary-700">View all →</a>
          </div>
          {insiderTrades?.length > 0 ? (
            <div className="space-y-3">
              {insiderTrades.slice(0, 5).map((trade) => (
                <div key={trade.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    {trade.transaction_type === 'P' ? (
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ArrowUpRight className="h-4 w-4 text-green-600" />
                      </div>
                    ) : (
                      <div className="p-2 bg-red-100 rounded-lg">
                        <ArrowDownRight className="h-4 w-4 text-red-600" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold">{trade.ticker}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[180px]">{trade.insider_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{trade.shares?.toLocaleString()} shares</p>
                    <p className="text-xs text-gray-400">{trade.insider_title}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No insider trades yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper functions to process data for charts
function processSectorData(trades) {
  if (!trades?.length) return []

  const sectorMap = {
    'NVDA': 'Tech', 'AAPL': 'Tech', 'MSFT': 'Tech', 'GOOGL': 'Tech', 'META': 'Tech', 'AMZN': 'Tech', 'TSLA': 'Tech', 'AMD': 'Tech', 'CRM': 'Tech', 'AVGO': 'Tech', 'ORCL': 'Tech', 'ADBE': 'Tech', 'INTC': 'Tech', 'QCOM': 'Tech', 'NFLX': 'Tech',
    'JPM': 'Finance', 'BAC': 'Finance', 'WFC': 'Finance', 'GS': 'Finance', 'MS': 'Finance', 'BLK': 'Finance', 'C': 'Finance', 'V': 'Finance', 'MA': 'Finance', 'AXP': 'Finance',
    'LMT': 'Defense', 'RTX': 'Defense', 'NOC': 'Defense', 'GD': 'Defense', 'BA': 'Defense', 'LHX': 'Defense',
    'JNJ': 'Healthcare', 'UNH': 'Healthcare', 'PFE': 'Healthcare', 'MRK': 'Healthcare', 'ABBV': 'Healthcare', 'LLY': 'Healthcare', 'TMO': 'Healthcare', 'BMY': 'Healthcare',
    'XOM': 'Energy', 'CVX': 'Energy', 'COP': 'Energy', 'OXY': 'Energy', 'SLB': 'Energy', 'NEE': 'Energy',
    'DIS': 'Consumer', 'NKE': 'Consumer', 'SBUX': 'Consumer', 'MCD': 'Consumer', 'KO': 'Consumer', 'PEP': 'Consumer', 'WMT': 'Consumer', 'COST': 'Consumer', 'HD': 'Consumer', 'TGT': 'Consumer',
  }

  const counts = {}
  trades.forEach(t => {
    const sector = sectorMap[t.ticker] || 'Other'
    counts[sector] = (counts[sector] || 0) + 1
  })

  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

function processActivityData(congressTrades, insiderTrades) {
  const days = []
  const today = new Date()

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    days.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      dateStr,
      congress: 0,
      insider: 0
    })
  }

  congressTrades?.forEach(t => {
    const day = days.find(d => d.dateStr === t.transaction_date)
    if (day) day.congress++
  })

  insiderTrades?.forEach(t => {
    const filingDate = t.filing_date?.split('T')[0]
    const day = days.find(d => d.dateStr === filingDate)
    if (day) day.insider++
  })

  return days
}

function processBuyVsSell(trades) {
  if (!trades?.length) return []

  let congressBuy = 0, congressSell = 0

  trades.forEach(t => {
    if (t.transaction_type === 'Purchase') congressBuy++
    else congressSell++
  })

  return [
    { name: 'Congress', buy: congressBuy, sell: congressSell }
  ]
}

function processPartyData(trades) {
  if (!trades?.length) return []

  let dem = 0, rep = 0
  trades.forEach(t => {
    if (t.party === 'D') dem++
    else if (t.party === 'R') rep++
  })

  return [
    { name: 'Democrat', value: dem },
    { name: 'Republican', value: rep }
  ]
}
