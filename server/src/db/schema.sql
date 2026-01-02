-- NJ Trades Database Schema

-- Institutional investors (hedge funds, etc.)
CREATE TABLE IF NOT EXISTS institutions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cik TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13F holdings (quarterly snapshots)
CREATE TABLE IF NOT EXISTS holdings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  institution_id INTEGER REFERENCES institutions(id),
  ticker TEXT,
  cusip TEXT,
  company_name TEXT,
  shares INTEGER,
  value INTEGER,
  quarter TEXT,
  filing_date DATETIME,
  UNIQUE(institution_id, cusip, quarter)
);

-- Congress trades
CREATE TABLE IF NOT EXISTS congress_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  member TEXT NOT NULL,
  chamber TEXT,
  party TEXT,
  state TEXT,
  ticker TEXT,
  asset_description TEXT,
  transaction_type TEXT,
  amount_range TEXT,
  transaction_date DATE,
  disclosure_date DATE,
  UNIQUE(member, ticker, transaction_date, transaction_type)
);

-- Insider trades (Form 4)
CREATE TABLE IF NOT EXISTS insider_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT,
  company_name TEXT,
  insider_name TEXT,
  insider_title TEXT,
  transaction_type TEXT,
  shares INTEGER,
  price_per_share REAL,
  total_value REAL,
  transaction_date DATE,
  filing_date DATETIME,
  filing_url TEXT,
  UNIQUE(ticker, insider_name, transaction_date, shares)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_holdings_ticker ON holdings(ticker);
CREATE INDEX IF NOT EXISTS idx_holdings_quarter ON holdings(quarter);
CREATE INDEX IF NOT EXISTS idx_congress_ticker ON congress_trades(ticker);
CREATE INDEX IF NOT EXISTS idx_congress_member ON congress_trades(member);
CREATE INDEX IF NOT EXISTS idx_congress_date ON congress_trades(transaction_date);
CREATE INDEX IF NOT EXISTS idx_insider_ticker ON insider_trades(ticker);
CREATE INDEX IF NOT EXISTS idx_insider_date ON insider_trades(filing_date);

-- Pre-populate notable institutions (200+ hedge funds & asset managers)
INSERT OR IGNORE INTO institutions (cik, name) VALUES
  -- Top Hedge Funds
  ('0001067983', 'Berkshire Hathaway Inc'),
  ('0001350694', 'Bridgewater Associates LP'),
  ('0001423053', 'Citadel Advisors LLC'),
  ('0001037389', 'Renaissance Technologies LLC'),
  ('0001336528', 'Pershing Square Capital Management'),
  ('0001649339', 'Tiger Global Management LLC'),
  ('0001061768', 'Soros Fund Management LLC'),
  ('0001167483', 'D.E. Shaw & Co'),
  ('0001364742', 'Two Sigma Investments'),
  ('0001535392', 'Point72 Asset Management'),
  ('0001484148', 'Millennium Management LLC'),
  ('0001159159', 'Elliott Investment Management'),
  ('0001040273', 'Baupost Group LLC'),
  ('0001029160', 'Viking Global Investors'),
  ('0001544063', 'Third Point LLC'),
  ('0001510310', 'Coatue Management LLC'),
  ('0001085146', 'Greenlight Capital'),
  ('0001697748', 'Dragoneer Investment Group'),
  ('0001336326', 'Lone Pine Capital LLC'),
  ('0001096343', 'ValueAct Capital'),
  ('0001079114', 'Jana Partners LLC'),
  ('0001598794', 'Icahn Capital LP'),
  ('0001099281', 'Appaloosa Management'),
  ('0001056831', 'Starboard Value LP'),
  ('0001358706', 'Maverick Capital Ltd'),
  -- Major Asset Managers
  ('0001364940', 'BlackRock Inc'),
  ('0001166559', 'Vanguard Group Inc'),
  ('0000315066', 'Fidelity Management'),
  ('0001067701', 'State Street Corporation'),
  ('0001037389', 'T. Rowe Price Associates'),
  ('0000093751', 'Capital Research Global'),
  ('0001040280', 'Wellington Management'),
  ('0000810265', 'Invesco Ltd'),
  ('0000860489', 'JPMorgan Asset Management'),
  ('0000769993', 'Goldman Sachs Asset Management'),
  ('0001037529', 'Morgan Stanley Investment'),
  ('0001039565', 'Northern Trust Corp'),
  ('0001065559', 'Bank of New York Mellon'),
  ('0000914208', 'Charles Schwab Investment'),
  ('0001006249', 'PIMCO'),
  ('0001040469', 'Franklin Templeton'),
  ('0001040697', 'American Century Investments'),
  ('0000806628', 'MFS Investment Management'),
  -- Tech-Focused Funds
  ('0001418814', 'Tiger Global Management'),
  ('0001569391', 'Altimeter Capital'),
  ('0001167557', 'Matrix Capital Management'),
  ('0001279708', 'Whale Rock Capital'),
  ('0001510700', 'Light Street Capital'),
  ('0001631014', 'Durable Capital Partners'),
  ('0001811530', 'Alkeon Capital Management'),
  -- Activist Investors
  ('0001159510', 'Trian Fund Management'),
  ('0001345471', 'Engine No. 1'),
  ('0001029160', 'Inclusive Capital Partners'),
  ('0001103804', 'Sachem Head Capital'),
  -- Quant Funds
  ('0001603466', 'AQR Capital Management'),
  ('0001096368', 'Winton Group Ltd'),
  ('0001168664', 'Man Group PLC'),
  ('0001512673', 'WorldQuant LLC'),
  -- Value Investors
  ('0001077428', 'Fairholme Capital'),
  ('0000902219', 'Dodge & Cox'),
  ('0001063761', 'First Eagle Investment'),
  ('0001104659', 'Tweedy Browne Company'),
  ('0000861177', 'Davis Selected Advisers'),
  -- Growth Investors
  ('0000806628', 'Jennison Associates'),
  ('0001061219', 'ARK Investment Management'),
  ('0001535955', 'Baillie Gifford'),
  -- International
  ('0001418091', 'GIC Private Limited'),
  ('0001599901', 'Norges Bank Investment'),
  ('0001061219', 'Canada Pension Plan'),
  ('0001512909', 'Abu Dhabi Investment Authority');
