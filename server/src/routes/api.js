import { Router } from 'express';
import {
  getAllInstitutions,
  getInstitutionByCik,
  getHoldingsByInstitution,
  getHoldingsHistory,
  seedSampleHoldings
} from '../services/sec13f.js';
import {
  getRecentCongressTrades,
  getCongressMembers,
  getTradesByMember,
  getCongressTradesByTicker
} from '../services/congress.js';
import {
  getRecentInsiderTrades,
  getInsiderTradesByTicker,
  getRecentInsiderBuys
} from '../services/insider.js';
import { analyticsQueries, searchAll } from '../db/database.js';

const router = Router();

// ============ INSTITUTIONS (13F) ============

// Get all tracked institutions
router.get('/institutions', (req, res) => {
  try {
    const institutions = getAllInstitutions();
    res.json(institutions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a specific institution by CIK
router.get('/institutions/:cik', (req, res) => {
  try {
    const institution = getInstitutionByCik(req.params.cik);
    if (!institution) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const holdings = getHoldingsByInstitution(req.params.cik);
    res.json({ ...institution, holdings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get historical holdings for an institution
router.get('/institutions/:cik/history', (req, res) => {
  try {
    const history = getHoldingsHistory(req.params.cik);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ CONGRESS TRADES ============

// Get recent congress trades
router.get('/congress', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const trades = getRecentCongressTrades(limit, offset);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all congress members
router.get('/congress/members', (req, res) => {
  try {
    const members = getCongressMembers();
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trades by a specific member
router.get('/congress/member/:name', (req, res) => {
  try {
    const trades = getTradesByMember(req.params.name);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get congress trades for a specific ticker
router.get('/congress/ticker/:ticker', (req, res) => {
  try {
    const trades = getCongressTradesByTicker(req.params.ticker);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ INSIDER TRADES ============

// Get recent insider trades
router.get('/insider', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const trades = getRecentInsiderTrades(limit, offset);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent insider buys only
router.get('/insider/buys', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const trades = getRecentInsiderBuys(limit);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get insider trades for a specific ticker
router.get('/insider/:ticker', (req, res) => {
  try {
    const trades = getInsiderTradesByTicker(req.params.ticker);
    res.json(trades);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ SEARCH & ANALYTICS ============

// Search across all sources
router.get('/search', (req, res) => {
  try {
    const query = req.query.q;
    if (!query || query.length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }
    const results = searchAll(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trending tickers
router.get('/trending', (req, res) => {
  try {
    const trending = analyticsQueries.getTrendingTickers.all();

    // Aggregate by ticker
    const tickerMap = {};
    for (const item of trending) {
      if (!tickerMap[item.ticker]) {
        tickerMap[item.ticker] = { ticker: item.ticker, sources: [], totalMentions: 0 };
      }
      tickerMap[item.ticker].sources.push(item.source);
      tickerMap[item.ticker].totalMentions += item.mentions;
    }

    const result = Object.values(tickerMap)
      .sort((a, b) => b.totalMentions - a.totalMentions)
      .slice(0, 10);

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dashboard statistics
router.get('/stats', (req, res) => {
  try {
    const stats = analyticsQueries.getStats.get();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Seed sample data (for demo purposes)
router.post('/seed', (req, res) => {
  try {
    seedSampleHoldings();
    res.json({ message: 'Sample data seeded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
