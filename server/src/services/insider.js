import { parseStringPromise } from 'xml2js';
import { insiderQueries } from '../db/database.js';

const SEC_FORM4_RSS = 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&company=&dateb=&owner=only&count=100&output=atom';

// Parse the SEC RSS feed for Form 4 filings
export async function fetchInsiderTrades() {
  const newTrades = [];

  try {
    const response = await fetch(SEC_FORM4_RSS, {
      headers: {
        'User-Agent': 'NJ Trades Bot (educational project)',
        'Accept': 'application/atom+xml'
      }
    });

    if (!response.ok) {
      throw new Error(`SEC API returned ${response.status}`);
    }

    const xml = await response.text();
    const result = await parseStringPromise(xml);

    const entries = result.feed?.entry || [];

    for (const entry of entries) {
      const trade = parseForm4Entry(entry);
      if (trade && trade.ticker) {
        try {
          insiderQueries.insert.run(
            trade.ticker,
            trade.companyName,
            trade.insiderName,
            trade.insiderTitle,
            trade.transactionType,
            trade.shares,
            trade.pricePerShare,
            trade.totalValue,
            trade.transactionDate,
            trade.filingDate,
            trade.filingUrl
          );
          newTrades.push(trade);
        } catch (e) {
          // Duplicate entry, skip
        }
      }
    }

    console.log(`Fetched ${entries.length} Form 4 filings, ${newTrades.length} new`);
  } catch (error) {
    console.error('Error fetching Form 4 RSS:', error.message);
  }

  return newTrades;
}

// Parse a single Form 4 RSS entry
function parseForm4Entry(entry) {
  try {
    const title = entry.title?.[0] || '';
    const summary = entry.summary?.[0]?._ || entry.summary?.[0] || '';
    const updated = entry.updated?.[0] || '';
    const link = entry.link?.[0]?.$.href || '';

    // Title format: "4 - Company Name (0001234567) (Filer Name)"
    const titleMatch = title.match(/4\s*-\s*(.+?)\s*\((\d+)\)\s*\((.+?)\)/);
    if (!titleMatch) return null;

    const companyName = titleMatch[1].trim();
    const insiderName = titleMatch[3].trim();

    // Try to extract ticker from summary or company name
    // Summary often contains: "Filed 2024-01-15, Accession Number: 0001234567-24-000123"
    const ticker = extractTickerFromCompanyName(companyName);

    // Try to parse transaction details from summary
    const transactionDetails = parseTransactionSummary(summary);

    return {
      ticker: ticker,
      companyName: companyName,
      insiderName: insiderName,
      insiderTitle: transactionDetails.title || 'Officer/Director',
      transactionType: transactionDetails.type || 'P', // P = Purchase, S = Sale
      shares: transactionDetails.shares || 0,
      pricePerShare: transactionDetails.price || null,
      totalValue: transactionDetails.value || null,
      transactionDate: transactionDetails.date || updated.split('T')[0],
      filingDate: updated,
      filingUrl: link
    };
  } catch (error) {
    return null;
  }
}

// Extract likely ticker from company name
function extractTickerFromCompanyName(companyName) {
  // Common patterns: "APPLE INC", "Microsoft Corp", etc.
  // This is a simplified approach - in production you'd use a lookup table
  const words = companyName.toUpperCase().split(/\s+/);

  // Remove common suffixes
  const cleaned = words.filter(w =>
    !['INC', 'CORP', 'CORPORATION', 'LLC', 'LTD', 'CO', 'COMPANY', 'HOLDINGS', 'GROUP', 'PLC'].includes(w)
  );

  // Return first word as potential ticker (simplified)
  // In reality, you'd want a CUSIP to ticker mapping
  if (cleaned[0] && cleaned[0].length <= 5) {
    return cleaned[0];
  }

  // Return abbreviation of company name
  return cleaned.slice(0, 4).map(w => w[0]).join('');
}

// Parse transaction details from summary
function parseTransactionSummary(summary) {
  const result = {
    type: 'P',
    shares: 0,
    price: null,
    value: null,
    title: null,
    date: null
  };

  // Look for common patterns in the summary
  const saleMatch = summary.match(/sale|sold|sell/i);
  const purchaseMatch = summary.match(/purchase|bought|buy|acquire/i);

  if (saleMatch) {
    result.type = 'S';
  } else if (purchaseMatch) {
    result.type = 'P';
  }

  // Try to extract shares
  const sharesMatch = summary.match(/(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*shares/i);
  if (sharesMatch) {
    result.shares = parseInt(sharesMatch[1].replace(/,/g, ''));
  }

  // Try to extract price
  const priceMatch = summary.match(/\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:per|\/)\s*share/i);
  if (priceMatch) {
    result.price = parseFloat(priceMatch[1].replace(/,/g, ''));
  }

  // Try to extract date
  const dateMatch = summary.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    result.date = dateMatch[1];
  }

  return result;
}

// Get recent insider trades from database
export function getRecentInsiderTrades(limit = 50, offset = 0) {
  return insiderQueries.getRecent.all(limit, offset);
}

// Get insider trades for a specific ticker
export function getInsiderTradesByTicker(ticker) {
  return insiderQueries.getByTicker.all(ticker.toUpperCase());
}

// Get recent insider buys only
export function getRecentInsiderBuys(limit = 20) {
  return insiderQueries.getBuys.all(limit);
}
