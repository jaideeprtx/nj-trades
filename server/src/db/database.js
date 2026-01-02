import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/nj-trades.db');
const dbDir = dirname(dbPath);

// Create data directory if it doesn't exist
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize database with schema immediately
const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
db.exec(schema);

// For backwards compatibility
export function initDatabase() {
  console.log('Database initialized successfully');
}

// Institution queries
export const institutionQueries = {
  getAll: db.prepare('SELECT * FROM institutions ORDER BY name'),

  getByCik: db.prepare('SELECT * FROM institutions WHERE cik = ?'),

  insert: db.prepare(`
    INSERT OR IGNORE INTO institutions (cik, name) VALUES (?, ?)
  `),

  updateTimestamp: db.prepare(`
    UPDATE institutions SET updated_at = CURRENT_TIMESTAMP WHERE cik = ?
  `)
};

// Holdings queries
export const holdingsQueries = {
  getByInstitution: db.prepare(`
    SELECT h.*, i.name as institution_name
    FROM holdings h
    JOIN institutions i ON h.institution_id = i.id
    WHERE i.cik = ?
    ORDER BY h.value DESC
  `),

  getLatestByInstitution: db.prepare(`
    SELECT h.*, i.name as institution_name
    FROM holdings h
    JOIN institutions i ON h.institution_id = i.id
    WHERE i.cik = ? AND h.quarter = (
      SELECT MAX(quarter) FROM holdings WHERE institution_id = i.id
    )
    ORDER BY h.value DESC
  `),

  getHistory: db.prepare(`
    SELECT h.*, i.name as institution_name
    FROM holdings h
    JOIN institutions i ON h.institution_id = i.id
    WHERE i.cik = ?
    ORDER BY h.quarter DESC, h.value DESC
  `),

  insert: db.prepare(`
    INSERT OR REPLACE INTO holdings
    (institution_id, ticker, cusip, company_name, shares, value, quarter, filing_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
};

// Congress trades queries
export const congressQueries = {
  getRecent: db.prepare(`
    SELECT * FROM congress_trades
    ORDER BY disclosure_date DESC, transaction_date DESC
    LIMIT ? OFFSET ?
  `),

  getByMember: db.prepare(`
    SELECT * FROM congress_trades
    WHERE member LIKE ?
    ORDER BY transaction_date DESC
  `),

  getMembers: db.prepare(`
    SELECT DISTINCT member, chamber, party, state,
           COUNT(*) as trade_count
    FROM congress_trades
    GROUP BY member
    ORDER BY trade_count DESC
  `),

  getByTicker: db.prepare(`
    SELECT * FROM congress_trades
    WHERE ticker = ?
    ORDER BY transaction_date DESC
  `),

  insert: db.prepare(`
    INSERT OR IGNORE INTO congress_trades
    (member, chamber, party, state, ticker, asset_description,
     transaction_type, amount_range, transaction_date, disclosure_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
};

// Insider trades queries
export const insiderQueries = {
  getRecent: db.prepare(`
    SELECT * FROM insider_trades
    ORDER BY filing_date DESC
    LIMIT ? OFFSET ?
  `),

  getByTicker: db.prepare(`
    SELECT * FROM insider_trades
    WHERE ticker = ?
    ORDER BY filing_date DESC
  `),

  getBuys: db.prepare(`
    SELECT * FROM insider_trades
    WHERE transaction_type = 'P'
    ORDER BY filing_date DESC
    LIMIT ?
  `),

  insert: db.prepare(`
    INSERT OR IGNORE INTO insider_trades
    (ticker, company_name, insider_name, insider_title, transaction_type,
     shares, price_per_share, total_value, transaction_date, filing_date, filing_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
};

// Analytics queries
export const analyticsQueries = {
  getTrendingTickers: db.prepare(`
    SELECT ticker, COUNT(*) as mentions,
           'congress' as source
    FROM congress_trades
    WHERE transaction_date > date('now', '-30 days')
    GROUP BY ticker
    UNION ALL
    SELECT ticker, COUNT(*) as mentions,
           'insider' as source
    FROM insider_trades
    WHERE filing_date > date('now', '-7 days')
    GROUP BY ticker
    ORDER BY mentions DESC
    LIMIT 20
  `),

  getStats: db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM institutions) as institution_count,
      (SELECT COUNT(*) FROM holdings) as holding_count,
      (SELECT COUNT(*) FROM congress_trades) as congress_trade_count,
      (SELECT COUNT(*) FROM insider_trades) as insider_trade_count
  `)
};

// Search across all sources
export function searchAll(query) {
  const searchTerm = `%${query}%`;

  const holdings = db.prepare(`
    SELECT 'holding' as type, h.ticker, h.company_name as name,
           i.name as source, h.value, h.quarter as date
    FROM holdings h
    JOIN institutions i ON h.institution_id = i.id
    WHERE h.ticker LIKE ? OR h.company_name LIKE ?
    ORDER BY h.value DESC LIMIT 10
  `).all(searchTerm, searchTerm);

  const congress = db.prepare(`
    SELECT 'congress' as type, ticker, member as name,
           transaction_type as source, amount_range as value, transaction_date as date
    FROM congress_trades
    WHERE ticker LIKE ? OR member LIKE ?
    ORDER BY transaction_date DESC LIMIT 10
  `).all(searchTerm, searchTerm);

  const insider = db.prepare(`
    SELECT 'insider' as type, ticker, insider_name as name,
           transaction_type as source, total_value as value, filing_date as date
    FROM insider_trades
    WHERE ticker LIKE ? OR company_name LIKE ? OR insider_name LIKE ?
    ORDER BY filing_date DESC LIMIT 10
  `).all(searchTerm, searchTerm, searchTerm);

  return { holdings, congress, insider };
}

export default db;
