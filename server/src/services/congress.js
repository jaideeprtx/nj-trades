import { congressQueries } from '../db/database.js';

// Expanded congress trading data (200+ trades from various members)
// In production, you'd scrape from official sources:
// House: https://disclosures-clerk.house.gov/FinancialDisclosure
// Senate: https://efdsearch.senate.gov/search/

const CONGRESS_MEMBERS = [
  // Democrats - House
  { member: 'Nancy Pelosi', chamber: 'House', party: 'D', state: 'CA' },
  { member: 'Josh Gottheimer', chamber: 'House', party: 'D', state: 'NJ' },
  { member: 'Ro Khanna', chamber: 'House', party: 'D', state: 'CA' },
  { member: 'Suzan DelBene', chamber: 'House', party: 'D', state: 'WA' },
  { member: 'Lois Frankel', chamber: 'House', party: 'D', state: 'FL' },
  { member: 'Debbie Wasserman Schultz', chamber: 'House', party: 'D', state: 'FL' },
  { member: 'Daniel Goldman', chamber: 'House', party: 'D', state: 'NY' },
  { member: 'Kathy Manning', chamber: 'House', party: 'D', state: 'NC' },
  { member: 'Marie Gluesenkamp Perez', chamber: 'House', party: 'D', state: 'WA' },
  { member: 'Susie Lee', chamber: 'House', party: 'D', state: 'NV' },
  { member: 'Tom Malinowski', chamber: 'House', party: 'D', state: 'NJ' },
  { member: 'Kurt Schrader', chamber: 'House', party: 'D', state: 'OR' },
  { member: 'Cindy Axne', chamber: 'House', party: 'D', state: 'IA' },
  { member: 'Dean Phillips', chamber: 'House', party: 'D', state: 'MN' },
  { member: 'Sean Casten', chamber: 'House', party: 'D', state: 'IL' },
  { member: 'Raja Krishnamoorthi', chamber: 'House', party: 'D', state: 'IL' },
  { member: 'Gilbert Cisneros', chamber: 'House', party: 'D', state: 'CA' },
  { member: 'Dwight Evans', chamber: 'House', party: 'D', state: 'PA' },
  { member: 'Earl Blumenauer', chamber: 'House', party: 'D', state: 'OR' },
  { member: 'Judy Chu', chamber: 'House', party: 'D', state: 'CA' },
  // Republicans - House
  { member: 'Dan Crenshaw', chamber: 'House', party: 'R', state: 'TX' },
  { member: 'Marjorie Taylor Greene', chamber: 'House', party: 'R', state: 'GA' },
  { member: 'Michael McCaul', chamber: 'House', party: 'R', state: 'TX' },
  { member: 'Pat Fallon', chamber: 'House', party: 'R', state: 'TX' },
  { member: 'Brian Mast', chamber: 'House', party: 'R', state: 'FL' },
  { member: 'French Hill', chamber: 'House', party: 'R', state: 'AR' },
  { member: 'Mark Green', chamber: 'House', party: 'R', state: 'TN' },
  { member: 'Kevin Hern', chamber: 'House', party: 'R', state: 'OK' },
  { member: 'Michael Guest', chamber: 'House', party: 'R', state: 'MS' },
  { member: 'Roger Williams', chamber: 'House', party: 'R', state: 'TX' },
  { member: 'Austin Scott', chamber: 'House', party: 'R', state: 'GA' },
  { member: 'John Curtis', chamber: 'House', party: 'R', state: 'UT' },
  { member: 'John Rutherford', chamber: 'House', party: 'R', state: 'FL' },
  { member: 'Michael Waltz', chamber: 'House', party: 'R', state: 'FL' },
  { member: 'Gary Palmer', chamber: 'House', party: 'R', state: 'AL' },
  { member: 'Rich McCormick', chamber: 'House', party: 'R', state: 'GA' },
  { member: 'Steve Womack', chamber: 'House', party: 'R', state: 'AR' },
  { member: 'Diana Harshbarger', chamber: 'House', party: 'R', state: 'TN' },
  { member: 'Greg Steube', chamber: 'House', party: 'R', state: 'FL' },
  { member: 'Bill Huizenga', chamber: 'House', party: 'R', state: 'MI' },
  // Democrats - Senate
  { member: 'Mark Kelly', chamber: 'Senate', party: 'D', state: 'AZ' },
  { member: 'Gary Peters', chamber: 'Senate', party: 'D', state: 'MI' },
  { member: 'Mark Warner', chamber: 'Senate', party: 'D', state: 'VA' },
  { member: 'Sheldon Whitehouse', chamber: 'Senate', party: 'D', state: 'RI' },
  { member: 'Jacky Rosen', chamber: 'Senate', party: 'D', state: 'NV' },
  { member: 'Debbie Stabenow', chamber: 'Senate', party: 'D', state: 'MI' },
  { member: 'Tom Carper', chamber: 'Senate', party: 'D', state: 'DE' },
  { member: 'Tina Smith', chamber: 'Senate', party: 'D', state: 'MN' },
  { member: 'Jeanne Shaheen', chamber: 'Senate', party: 'D', state: 'NH' },
  { member: 'John Hickenlooper', chamber: 'Senate', party: 'D', state: 'CO' },
  // Republicans - Senate
  { member: 'Tommy Tuberville', chamber: 'Senate', party: 'R', state: 'AL' },
  { member: 'John Hoeven', chamber: 'Senate', party: 'R', state: 'ND' },
  { member: 'Roger Wicker', chamber: 'Senate', party: 'R', state: 'MS' },
  { member: 'Cynthia Lummis', chamber: 'Senate', party: 'R', state: 'WY' },
  { member: 'Bill Hagerty', chamber: 'Senate', party: 'R', state: 'TN' },
  { member: 'Markwayne Mullin', chamber: 'Senate', party: 'R', state: 'OK' },
  { member: 'John Kennedy', chamber: 'Senate', party: 'R', state: 'LA' },
  { member: 'Pete Ricketts', chamber: 'Senate', party: 'R', state: 'NE' },
  { member: 'Mike Braun', chamber: 'Senate', party: 'R', state: 'IN' },
  { member: 'Tim Scott', chamber: 'Senate', party: 'R', state: 'SC' },
];

const STOCK_TICKERS = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', sector: 'Tech' },
  { ticker: 'AAPL', name: 'Apple Inc', sector: 'Tech' },
  { ticker: 'MSFT', name: 'Microsoft Corporation', sector: 'Tech' },
  { ticker: 'GOOGL', name: 'Alphabet Inc Class A', sector: 'Tech' },
  { ticker: 'AMZN', name: 'Amazon.com Inc', sector: 'Tech' },
  { ticker: 'META', name: 'Meta Platforms Inc', sector: 'Tech' },
  { ticker: 'TSLA', name: 'Tesla Inc', sector: 'Tech' },
  { ticker: 'AMD', name: 'Advanced Micro Devices', sector: 'Tech' },
  { ticker: 'CRM', name: 'Salesforce Inc', sector: 'Tech' },
  { ticker: 'AVGO', name: 'Broadcom Inc', sector: 'Tech' },
  { ticker: 'ORCL', name: 'Oracle Corporation', sector: 'Tech' },
  { ticker: 'ADBE', name: 'Adobe Inc', sector: 'Tech' },
  { ticker: 'INTC', name: 'Intel Corporation', sector: 'Tech' },
  { ticker: 'QCOM', name: 'Qualcomm Inc', sector: 'Tech' },
  { ticker: 'NFLX', name: 'Netflix Inc', sector: 'Tech' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co', sector: 'Finance' },
  { ticker: 'BAC', name: 'Bank of America Corp', sector: 'Finance' },
  { ticker: 'WFC', name: 'Wells Fargo & Co', sector: 'Finance' },
  { ticker: 'GS', name: 'Goldman Sachs Group', sector: 'Finance' },
  { ticker: 'MS', name: 'Morgan Stanley', sector: 'Finance' },
  { ticker: 'BLK', name: 'BlackRock Inc', sector: 'Finance' },
  { ticker: 'C', name: 'Citigroup Inc', sector: 'Finance' },
  { ticker: 'V', name: 'Visa Inc', sector: 'Finance' },
  { ticker: 'MA', name: 'Mastercard Inc', sector: 'Finance' },
  { ticker: 'AXP', name: 'American Express Co', sector: 'Finance' },
  { ticker: 'LMT', name: 'Lockheed Martin Corp', sector: 'Defense' },
  { ticker: 'RTX', name: 'Raytheon Technologies', sector: 'Defense' },
  { ticker: 'NOC', name: 'Northrop Grumman Corp', sector: 'Defense' },
  { ticker: 'GD', name: 'General Dynamics Corp', sector: 'Defense' },
  { ticker: 'BA', name: 'Boeing Company', sector: 'Defense' },
  { ticker: 'LHX', name: 'L3Harris Technologies', sector: 'Defense' },
  { ticker: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { ticker: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { ticker: 'PFE', name: 'Pfizer Inc', sector: 'Healthcare' },
  { ticker: 'MRK', name: 'Merck & Co Inc', sector: 'Healthcare' },
  { ticker: 'ABBV', name: 'AbbVie Inc', sector: 'Healthcare' },
  { ticker: 'LLY', name: 'Eli Lilly and Co', sector: 'Healthcare' },
  { ticker: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
  { ticker: 'BMY', name: 'Bristol-Myers Squibb', sector: 'Healthcare' },
  { ticker: 'XOM', name: 'Exxon Mobil Corp', sector: 'Energy' },
  { ticker: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { ticker: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
  { ticker: 'OXY', name: 'Occidental Petroleum', sector: 'Energy' },
  { ticker: 'SLB', name: 'Schlumberger Ltd', sector: 'Energy' },
  { ticker: 'NEE', name: 'NextEra Energy Inc', sector: 'Energy' },
  { ticker: 'DIS', name: 'Walt Disney Co', sector: 'Consumer' },
  { ticker: 'NKE', name: 'Nike Inc', sector: 'Consumer' },
  { ticker: 'SBUX', name: 'Starbucks Corp', sector: 'Consumer' },
  { ticker: 'MCD', name: 'McDonalds Corp', sector: 'Consumer' },
  { ticker: 'KO', name: 'Coca-Cola Co', sector: 'Consumer' },
  { ticker: 'PEP', name: 'PepsiCo Inc', sector: 'Consumer' },
  { ticker: 'WMT', name: 'Walmart Inc', sector: 'Consumer' },
  { ticker: 'COST', name: 'Costco Wholesale Corp', sector: 'Consumer' },
  { ticker: 'HD', name: 'Home Depot Inc', sector: 'Consumer' },
  { ticker: 'TGT', name: 'Target Corporation', sector: 'Consumer' },
];

const AMOUNT_RANGES = [
  '$1,001 - $15,000',
  '$15,001 - $50,000',
  '$50,001 - $100,000',
  '$100,001 - $250,000',
  '$250,001 - $500,000',
  '$500,001 - $1,000,000',
  '$1,000,001 - $5,000,000',
  '$5,000,001 - $25,000,000',
];

// Generate comprehensive sample data
function generateCongressData() {
  const trades = [];
  const today = new Date();

  // Generate 200+ trades across different dates
  for (let i = 0; i < 250; i++) {
    const member = CONGRESS_MEMBERS[Math.floor(Math.random() * CONGRESS_MEMBERS.length)];
    const stock = STOCK_TICKERS[Math.floor(Math.random() * STOCK_TICKERS.length)];
    const transactionType = Math.random() > 0.45 ? 'Purchase' : 'Sale';
    const amountRange = AMOUNT_RANGES[Math.floor(Math.random() * AMOUNT_RANGES.length)];

    // Random date in the last 180 days
    const daysAgo = Math.floor(Math.random() * 180);
    const transactionDate = new Date(today);
    transactionDate.setDate(transactionDate.getDate() - daysAgo);

    const disclosureDate = new Date(transactionDate);
    disclosureDate.setDate(disclosureDate.getDate() + Math.floor(Math.random() * 30) + 15);

    trades.push({
      member: member.member,
      chamber: member.chamber,
      party: member.party,
      state: member.state,
      ticker: stock.ticker,
      asset_description: stock.name,
      transaction_type: transactionType,
      amount_range: amountRange,
      transaction_date: transactionDate.toISOString().split('T')[0],
      disclosure_date: disclosureDate.toISOString().split('T')[0]
    });
  }

  // Add some notable specific trades
  const notableTrades = [
    { member: 'Nancy Pelosi', chamber: 'House', party: 'D', state: 'CA', ticker: 'NVDA', asset_description: 'NVIDIA Corporation', transaction_type: 'Purchase', amount_range: '$1,000,001 - $5,000,000', transaction_date: '2024-11-15', disclosure_date: '2024-12-01' },
    { member: 'Nancy Pelosi', chamber: 'House', party: 'D', state: 'CA', ticker: 'GOOGL', asset_description: 'Alphabet Inc Class A', transaction_type: 'Purchase', amount_range: '$500,001 - $1,000,000', transaction_date: '2024-11-10', disclosure_date: '2024-11-28' },
    { member: 'Nancy Pelosi', chamber: 'House', party: 'D', state: 'CA', ticker: 'AAPL', asset_description: 'Apple Inc', transaction_type: 'Purchase', amount_range: '$1,000,001 - $5,000,000', transaction_date: '2024-10-20', disclosure_date: '2024-11-05' },
    { member: 'Nancy Pelosi', chamber: 'House', party: 'D', state: 'CA', ticker: 'TSLA', asset_description: 'Tesla Inc', transaction_type: 'Sale', amount_range: '$500,001 - $1,000,000', transaction_date: '2024-09-15', disclosure_date: '2024-10-01' },
    { member: 'Tommy Tuberville', chamber: 'Senate', party: 'R', state: 'AL', ticker: 'MSFT', asset_description: 'Microsoft Corporation', transaction_type: 'Sale', amount_range: '$50,001 - $100,000', transaction_date: '2024-11-20', disclosure_date: '2024-12-05' },
    { member: 'Tommy Tuberville', chamber: 'Senate', party: 'R', state: 'AL', ticker: 'NVDA', asset_description: 'NVIDIA Corporation', transaction_type: 'Purchase', amount_range: '$250,001 - $500,000', transaction_date: '2024-10-05', disclosure_date: '2024-10-25' },
    { member: 'Dan Crenshaw', chamber: 'House', party: 'R', state: 'TX', ticker: 'AAPL', asset_description: 'Apple Inc', transaction_type: 'Purchase', amount_range: '$15,001 - $50,000', transaction_date: '2024-11-18', disclosure_date: '2024-12-02' },
    { member: 'Michael McCaul', chamber: 'House', party: 'R', state: 'TX', ticker: 'AVGO', asset_description: 'Broadcom Inc', transaction_type: 'Purchase', amount_range: '$250,001 - $500,000', transaction_date: '2024-11-16', disclosure_date: '2024-12-01' },
    { member: 'Mark Warner', chamber: 'Senate', party: 'D', state: 'VA', ticker: 'MSFT', asset_description: 'Microsoft Corporation', transaction_type: 'Purchase', amount_range: '$1,000,001 - $5,000,000', transaction_date: '2024-10-28', disclosure_date: '2024-11-15' },
    { member: 'Josh Gottheimer', chamber: 'House', party: 'D', state: 'NJ', ticker: 'META', asset_description: 'Meta Platforms Inc', transaction_type: 'Purchase', amount_range: '$100,001 - $250,000', transaction_date: '2024-11-12', disclosure_date: '2024-11-30' },
  ];

  return [...notableTrades, ...trades];
}

const SAMPLE_CONGRESS_DATA = generateCongressData();

// Fetch congress trades
export async function fetchCongressTrades() {
  const newTrades = [];

  try {
    for (const trade of SAMPLE_CONGRESS_DATA) {
      try {
        congressQueries.insert.run(
          trade.member,
          trade.chamber,
          trade.party,
          trade.state,
          trade.ticker,
          trade.asset_description,
          trade.transaction_type,
          trade.amount_range,
          trade.transaction_date,
          trade.disclosure_date
        );
        newTrades.push(trade);
      } catch (e) {
        // Duplicate entry, skip
      }
    }

    console.log(`Loaded ${newTrades.length} congress trades`);
  } catch (error) {
    console.error('Error fetching congress trades:', error.message);
  }

  return newTrades;
}

// Get recent congress trades
export function getRecentCongressTrades(limit = 50, offset = 0) {
  return congressQueries.getRecent.all(limit, offset);
}

// Get all congress members with trade counts
export function getCongressMembers() {
  return congressQueries.getMembers.all();
}

// Get trades by a specific member
export function getTradesByMember(memberName) {
  return congressQueries.getByMember.all(`%${memberName}%`);
}

// Get trades for a specific ticker
export function getCongressTradesByTicker(ticker) {
  return congressQueries.getByTicker.all(ticker.toUpperCase());
}

// Parse amount range to get min/max values
export function parseAmountRange(range) {
  const match = range.match(/\$?([\d,]+)\s*-\s*\$?([\d,]+)/);
  if (match) {
    return {
      min: parseInt(match[1].replace(/,/g, '')),
      max: parseInt(match[2].replace(/,/g, ''))
    };
  }
  return { min: 0, max: 0 };
}

// Calculate total estimated value of trades by member
export function getMemberTotalValue(memberName) {
  const trades = getTradesByMember(memberName);
  let totalMin = 0;
  let totalMax = 0;

  for (const trade of trades) {
    const { min, max } = parseAmountRange(trade.amount_range);
    if (trade.transaction_type === 'Purchase') {
      totalMin += min;
      totalMax += max;
    } else {
      totalMin -= max;
      totalMax -= min;
    }
  }

  return { totalMin, totalMax, tradeCount: trades.length };
}
