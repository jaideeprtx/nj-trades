import { institutionQueries, holdingsQueries } from '../db/database.js';

const SEC_EDGAR_BASE = 'https://data.sec.gov';

// Mapping of common CUSIPs to tickers (simplified - in production use a full database)
const CUSIP_TO_TICKER = {
  '037833100': 'AAPL',
  '594918104': 'MSFT',
  '02079K305': 'GOOGL',
  '02079K107': 'GOOG',
  '30303M102': 'META',
  '023135106': 'AMZN',
  '67066G104': 'NVDA',
  '88160R101': 'TSLA',
  '084670702': 'BRK.B',
  '46625H100': 'JPM',
  '92826C839': 'V',
  '254687106': 'DIS',
  '478160104': 'JNJ',
  '742718109': 'PG',
  '931142103': 'WMT'
};

// Fetch 13F holdings for all tracked institutions
export async function fetch13FHoldings() {
  const institutions = institutionQueries.getAll.all();

  for (const institution of institutions) {
    try {
      await fetchInstitutionHoldings(institution.cik);
    } catch (error) {
      console.error(`Error fetching ${institution.name}:`, error.message);
    }
  }
}

// Fetch holdings for a specific institution
export async function fetchInstitutionHoldings(cik) {
  // Pad CIK to 10 digits
  const paddedCik = cik.replace(/^0+/, '').padStart(10, '0');

  try {
    // First, get the company info and recent filings
    const submissionsUrl = `${SEC_EDGAR_BASE}/submissions/CIK${paddedCik}.json`;

    const response = await fetch(submissionsUrl, {
      headers: {
        'User-Agent': 'NJ Trades Bot (educational project)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`SEC API returned ${response.status}`);
    }

    const data = await response.json();

    // Find the most recent 13F-HR filing
    const filings = data.filings?.recent;
    if (!filings) {
      console.log(`No filings found for CIK ${cik}`);
      return [];
    }

    const form13FIndex = filings.form?.findIndex(f => f === '13F-HR');
    if (form13FIndex === -1) {
      console.log(`No 13F-HR filing found for CIK ${cik}`);
      return [];
    }

    const accessionNumber = filings.accessionNumber[form13FIndex];
    const filingDate = filings.filingDate[form13FIndex];

    // Determine quarter from filing date
    const quarter = getQuarterFromDate(filingDate);

    // Fetch the actual 13F holdings
    const holdings = await fetch13FDocument(paddedCik, accessionNumber, quarter, filingDate);

    // Update institution timestamp
    institutionQueries.updateTimestamp.run(cik);

    console.log(`Fetched ${holdings.length} holdings for CIK ${cik}`);
    return holdings;

  } catch (error) {
    console.error(`Error fetching holdings for CIK ${cik}:`, error.message);
    return [];
  }
}

// Fetch and parse the actual 13F document
async function fetch13FDocument(cik, accessionNumber, quarter, filingDate) {
  const accessionFormatted = accessionNumber.replace(/-/g, '');
  const infoTableUrl = `${SEC_EDGAR_BASE}/Archives/edgar/data/${parseInt(cik)}/` +
    `${accessionFormatted}/infotable.json`;

  try {
    const response = await fetch(infoTableUrl, {
      headers: {
        'User-Agent': 'NJ Trades Bot (educational project)',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      // Try XML format
      return await fetch13FXml(cik, accessionNumber, quarter, filingDate);
    }

    const data = await response.json();
    const holdings = [];

    // Get institution ID
    const institution = institutionQueries.getByCik.get(cik.padStart(10, '0'));
    if (!institution) return [];

    for (const row of (data.data || [])) {
      const cusip = row.cusip || row.CUSIP;
      const ticker = CUSIP_TO_TICKER[cusip] || cusip?.substring(0, 4);

      const holding = {
        institutionId: institution.id,
        ticker: ticker,
        cusip: cusip,
        companyName: row.nameOfIssuer || row.ISSUER_NAME,
        shares: parseInt(row.shrsOrPrnAmt?.sshPrnamt || row.SHARES || 0),
        value: parseInt(row.value || row.VALUE || 0) * 1000, // Values in thousands
        quarter: quarter,
        filingDate: filingDate
      };

      try {
        holdingsQueries.insert.run(
          holding.institutionId,
          holding.ticker,
          holding.cusip,
          holding.companyName,
          holding.shares,
          holding.value,
          holding.quarter,
          holding.filingDate
        );
        holdings.push(holding);
      } catch (e) {
        // Duplicate, skip
      }
    }

    return holdings;

  } catch (error) {
    console.error('Error fetching 13F document:', error.message);
    return [];
  }
}

// Fallback to XML parsing if JSON not available
async function fetch13FXml(cik, accessionNumber, quarter, filingDate) {
  // This is a simplified fallback - in production you'd parse the full XML
  console.log(`JSON not available for ${cik}, would parse XML here`);
  return [];
}

// Get quarter string from date
function getQuarterFromDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  // 13F filings are due 45 days after quarter end
  // Q1 (Mar 31) due May 15, Q2 (Jun 30) due Aug 14, etc.
  let quarter;
  if (month <= 2 || (month === 3 && date.getDate() <= 15)) {
    quarter = 4;
    return `${year - 1}-Q4`;
  } else if (month <= 5 || (month === 6 && date.getDate() <= 14)) {
    quarter = 1;
  } else if (month <= 8 || (month === 9 && date.getDate() <= 14)) {
    quarter = 2;
  } else if (month <= 11 || (month === 12 && date.getDate() <= 14)) {
    quarter = 3;
  } else {
    quarter = 4;
  }

  return `${year}-Q${quarter}`;
}

// Get all tracked institutions
export function getAllInstitutions() {
  return institutionQueries.getAll.all();
}

// Get institution by CIK
export function getInstitutionByCik(cik) {
  return institutionQueries.getByCik.get(cik.padStart(10, '0'));
}

// Get holdings for an institution
export function getHoldingsByInstitution(cik) {
  return holdingsQueries.getLatestByInstitution.all(cik.padStart(10, '0'));
}

// Get historical holdings for an institution
export function getHoldingsHistory(cik) {
  return holdingsQueries.getHistory.all(cik.padStart(10, '0'));
}

// Sample portfolio data for major institutions
const INSTITUTION_PORTFOLIOS = {
  '0001067983': { // Berkshire Hathaway
    name: 'Berkshire Hathaway',
    holdings: [
      { ticker: 'AAPL', company: 'Apple Inc', shares: 915560382, value: 157400000000 },
      { ticker: 'BAC', company: 'Bank of America', shares: 1032852006, value: 33800000000 },
      { ticker: 'AXP', company: 'American Express', shares: 151610700, value: 28400000000 },
      { ticker: 'KO', company: 'Coca-Cola Co', shares: 400000000, value: 25200000000 },
      { ticker: 'CVX', company: 'Chevron Corp', shares: 118610534, value: 19200000000 },
      { ticker: 'OXY', company: 'Occidental Petroleum', shares: 248018128, value: 14900000000 },
    ]
  },
  '0001350694': { // Bridgewater
    name: 'Bridgewater Associates',
    holdings: [
      { ticker: 'SPY', company: 'SPDR S&P 500 ETF', shares: 23500000, value: 11200000000 },
      { ticker: 'VWO', company: 'Vanguard Emerging Markets', shares: 145000000, value: 6300000000 },
      { ticker: 'IEMG', company: 'iShares Emerging Markets', shares: 98000000, value: 4900000000 },
      { ticker: 'GLD', company: 'SPDR Gold Trust', shares: 18000000, value: 3600000000 },
      { ticker: 'PG', company: 'Procter & Gamble', shares: 15000000, value: 2500000000 },
    ]
  },
  '0001423053': { // Citadel
    name: 'Citadel Advisors',
    holdings: [
      { ticker: 'NVDA', company: 'NVIDIA Corporation', shares: 8500000, value: 4200000000 },
      { ticker: 'META', company: 'Meta Platforms', shares: 5200000, value: 2900000000 },
      { ticker: 'TSLA', company: 'Tesla Inc', shares: 7800000, value: 1950000000 },
      { ticker: 'AMZN', company: 'Amazon.com', shares: 9500000, value: 1800000000 },
      { ticker: 'GOOGL', company: 'Alphabet Inc', shares: 11000000, value: 1650000000 },
      { ticker: 'MSFT', company: 'Microsoft Corp', shares: 4100000, value: 1600000000 },
    ]
  },
  '0001037389': { // Renaissance
    name: 'Renaissance Technologies',
    holdings: [
      { ticker: 'NVDA', company: 'NVIDIA Corporation', shares: 2800000, value: 1400000000 },
      { ticker: 'NOVO', company: 'Novo Nordisk', shares: 9500000, value: 1100000000 },
      { ticker: 'META', company: 'Meta Platforms', shares: 1800000, value: 1000000000 },
      { ticker: 'AAPL', company: 'Apple Inc', shares: 4200000, value: 950000000 },
      { ticker: 'V', company: 'Visa Inc', shares: 3100000, value: 850000000 },
    ]
  },
  '0001336528': { // Pershing Square
    name: 'Pershing Square Capital',
    holdings: [
      { ticker: 'GOOG', company: 'Alphabet Inc Class C', shares: 6800000, value: 1020000000 },
      { ticker: 'HLT', company: 'Hilton Worldwide', shares: 7200000, value: 1500000000 },
      { ticker: 'CMG', company: 'Chipotle Mexican Grill', shares: 320000, value: 980000000 },
      { ticker: 'LOW', company: 'Lowes Companies', shares: 3800000, value: 950000000 },
      { ticker: 'QSR', company: 'Restaurant Brands Intl', shares: 12000000, value: 850000000 },
    ]
  },
  '0001061768': { // Soros
    name: 'Soros Fund Management',
    holdings: [
      { ticker: 'RIVN', company: 'Rivian Automotive', shares: 28000000, value: 420000000 },
      { ticker: 'SPOT', company: 'Spotify Technology', shares: 950000, value: 285000000 },
      { ticker: 'SHOP', company: 'Shopify Inc', shares: 2800000, value: 250000000 },
      { ticker: 'SE', company: 'Sea Limited', shares: 3500000, value: 210000000 },
    ]
  },
  '0001364940': { // BlackRock
    name: 'BlackRock Inc',
    holdings: [
      { ticker: 'AAPL', company: 'Apple Inc', shares: 1100000000, value: 189000000000 },
      { ticker: 'MSFT', company: 'Microsoft Corp', shares: 750000000, value: 290000000000 },
      { ticker: 'AMZN', company: 'Amazon.com', shares: 180000000, value: 34000000000 },
      { ticker: 'NVDA', company: 'NVIDIA Corporation', shares: 95000000, value: 47000000000 },
      { ticker: 'META', company: 'Meta Platforms', shares: 42000000, value: 23000000000 },
    ]
  },
  '0001166559': { // Vanguard
    name: 'Vanguard Group',
    holdings: [
      { ticker: 'AAPL', company: 'Apple Inc', shares: 1350000000, value: 232000000000 },
      { ticker: 'MSFT', company: 'Microsoft Corp', shares: 880000000, value: 340000000000 },
      { ticker: 'GOOGL', company: 'Alphabet Inc', shares: 160000000, value: 24000000000 },
      { ticker: 'AMZN', company: 'Amazon.com', shares: 210000000, value: 40000000000 },
      { ticker: 'TSLA', company: 'Tesla Inc', shares: 125000000, value: 31000000000 },
    ]
  },
  '0001535392': { // Point72
    name: 'Point72 Asset Management',
    holdings: [
      { ticker: 'MSFT', company: 'Microsoft Corp', shares: 2100000, value: 810000000 },
      { ticker: 'NVDA', company: 'NVIDIA Corporation', shares: 1500000, value: 750000000 },
      { ticker: 'AMZN', company: 'Amazon.com', shares: 3200000, value: 610000000 },
      { ticker: 'GOOGL', company: 'Alphabet Inc', shares: 3800000, value: 570000000 },
      { ticker: 'META', company: 'Meta Platforms', shares: 850000, value: 475000000 },
    ]
  },
  '0001167483': { // DE Shaw
    name: 'D.E. Shaw & Co',
    holdings: [
      { ticker: 'NVDA', company: 'NVIDIA Corporation', shares: 3200000, value: 1600000000 },
      { ticker: 'MSFT', company: 'Microsoft Corp', shares: 3500000, value: 1350000000 },
      { ticker: 'META', company: 'Meta Platforms', shares: 2100000, value: 1170000000 },
      { ticker: 'GOOGL', company: 'Alphabet Inc', shares: 6500000, value: 975000000 },
      { ticker: 'AMZN', company: 'Amazon.com', shares: 4800000, value: 915000000 },
    ]
  },
  '0001364742': { // Two Sigma
    name: 'Two Sigma Investments',
    holdings: [
      { ticker: 'AAPL', company: 'Apple Inc', shares: 4500000, value: 775000000 },
      { ticker: 'AMZN', company: 'Amazon.com', shares: 3800000, value: 725000000 },
      { ticker: 'MSFT', company: 'Microsoft Corp', shares: 1800000, value: 695000000 },
      { ticker: 'NVDA', company: 'NVIDIA Corporation', shares: 1200000, value: 600000000 },
      { ticker: 'META', company: 'Meta Platforms', shares: 950000, value: 530000000 },
    ]
  },
  '0001061219': { // ARK Invest
    name: 'ARK Investment Management',
    holdings: [
      { ticker: 'TSLA', company: 'Tesla Inc', shares: 12500000, value: 3100000000 },
      { ticker: 'COIN', company: 'Coinbase Global', shares: 8500000, value: 2100000000 },
      { ticker: 'ROKU', company: 'Roku Inc', shares: 11000000, value: 1050000000 },
      { ticker: 'SQ', company: 'Block Inc', shares: 9200000, value: 760000000 },
      { ticker: 'PATH', company: 'UiPath Inc', shares: 32000000, value: 450000000 },
      { ticker: 'RBLX', company: 'Roblox Corp', shares: 8500000, value: 380000000 },
    ]
  },
};

// Add sample holdings for demo purposes
export function seedSampleHoldings() {
  const quarter = '2024-Q3';
  const filingDate = '2024-11-14';
  let totalSeeded = 0;

  for (const [cik, portfolio] of Object.entries(INSTITUTION_PORTFOLIOS)) {
    const institution = institutionQueries.getByCik.get(cik);
    if (!institution) continue;

    for (const h of portfolio.holdings) {
      try {
        holdingsQueries.insert.run(
          institution.id,
          h.ticker,
          h.ticker, // Using ticker as cusip placeholder
          h.company,
          h.shares,
          h.value,
          quarter,
          filingDate
        );
        totalSeeded++;
      } catch (e) {
        // Duplicate
      }
    }
  }

  console.log(`Seeded ${totalSeeded} holdings across ${Object.keys(INSTITUTION_PORTFOLIOS).length} institutions`);
}
