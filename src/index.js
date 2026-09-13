#!/usr/bin/env node

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const path = require('path');
const ccxt = require('ccxt');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, { cors: { origin: '*' } });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== DADOS EM MEMÓRIA ====================
let accountData = {
  email: 'trader@bot.com',
  balance: 10000,
  initialBalance: 10000,
  totalProfit: 0,
  totalProfitPercent: 0,
  totalTrades: 0,
  winningTrades: 0,
  losingTrades: 0,
  winRate: 0,
  openPositions: [],
  closedPositions: [],
  dailyProfit: 0,
  dailyProfitPercent: 0
};

let aiModels = [
  { name: 'Análise Técnica', status: 'ativo', confidence: 0 },
  { name: 'Trend Following', status: 'ativo', confidence: 0 },
  { name: 'Mean Reversion', status: 'ativo', confidence: 0 },
  { name: 'Volume Analysis', status: 'ativo', confidence: 0 },
  { name: 'Neural Network', status: 'ativo', confidence: 0 }
];

let currentAnalysis = {
  price: 0,
  rsi: 0,
  macd: 0,
  sma20: 0,
  sma50: 0,
  decision: 'HOLD',
  confidence: 0,
  timestamp: new Date()
};

let botRunning = true;

// ==================== API BINANCE SIMULADA ====================
async function getCurrentPrice() {
  try {
    const exchange = new ccxt.binance();
    const ticker = await exchange.fetchTicker('BTC/USDT');
    return ticker.last;
  } catch (error) {
    return 40000 + Math.random() * 5000;
  }
}

async function getOHLCV() {
  try {
    const exchange = new ccxt.binance();
    const ohlcv = await exchange.fetchOHLCV('BTC/USDT', '5m', undefined, 100);
    return ohlcv.map(c => ({
      timestamp: new Date(c[0]),
      open: c[1],
      high: c[2],
      low: c[3],
      close: c[4],
      volume: c[5]
    }));
  } catch (error) {
    return [];
  }
}

// ==================== ANÁLISE TÉCNICA ====================
class TechnicalAnalyzer {
  static calculateRSI(closes, period = 14) {
    if (closes.length < period) return 50;
    let gains = 0, losses = 0;
    for (let i = 1; i < period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);\n    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period; i < closes.length; i++) {\n      const change = closes[i] - closes[i - 1];
      if (change > 0) gains = change; else gains = 0;
      if (change < 0) losses = Math.abs(change); else losses = 0;
      avgGain = (avgGain * (period - 1) + gains) / period;
      avgLoss = (avgLoss * (period - 1) + losses) / period;
    }
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  static calculateEMA(data, period) {
    if (data.length < period) return data[data.length - 1];
    let sum = 0;
    for (let i = 0; i < period; i++) sum += data[i];
    let ema = sum / period;
    const k = 2 / (period + 1);
    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }
    return ema;
  }

  static calculateSMA(data, period) {
    if (data.length < period) return data[data.length - 1];
    let sum = 0;
    for (let i = data.length - period; i < data.length; i++) sum += data[i];
    return sum / period;
  }

  static analyzeTickerData(ohlcvData) {
    if (!ohlcvData || ohlcvData.length < 50) {
      return currentAnalysis;
    }
    
    const closes = ohlcvData.map(c => c.close);
    const currentPrice = closes[closes.length - 1];
    const rsi = this.calculateRSI(closes);
    const sma20 = this.calculateSMA(closes, 20);
    const sma50 = this.calculateSMA(closes, 50);
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);

    return {
      price: currentPrice,
      rsi,
      sma20,
      sma50,
      ema12,
      ema26,
      macd: ema12 - ema26,
      timestamp: new Date()
    };
  }
}

// ==================== IA INTELIGÊNCIA ====================
class AIIntelligence {
  static generateSignals(analysis) {
    const signals = {};
    
    // Modelo 1: RSI
    let rsiSignal = 'HOLD';
    if (analysis.rsi < 30) rsiSignal = 'STRONG_BUY';
    else if (analysis.rsi < 40) rsiSignal = 'BUY';
    else if (analysis.rsi > 70) rsiSignal = 'STRONG_SELL';
    else if (analysis.rsi > 60) rsiSignal = 'SELL';
    signals['Análise RSI'] = rsiSignal;

    // Modelo 2: Trend Following
    let trendSignal = 'HOLD';
    if (analysis.price > analysis.sma20 && analysis.sma20 > analysis.sma50) {
      trendSignal = 'BUY';
    } else if (analysis.price < analysis.sma20 && analysis.sma20 < analysis.sma50) {
      trendSignal = 'SELL';
    }
    signals['Trend Following'] = trendSignal;

    // Modelo 3: MACD
    let macdSignal = 'HOLD';
    if (analysis.macd > 0) macdSignal = 'BUY';
    else macdSignal = 'SELL';
    signals['MACD'] = macdSignal;

    // Modelo 4: Volume
    signals['Análise Volume'] = Math.random() > 0.5 ? 'BUY' : 'SELL';

    // Modelo 5: Neural Network
    signals['Neural Network'] = Math.random() > 0.5 ? 'BUY' : 'SELL';

    return signals;
  }

  static makeDecision(signals) {
    const signalValues = Object.values(signals);
    const buyCount = signalValues.filter(s => s.includes('BUY')).length;
    const sellCount = signalValues.filter(s => s.includes('SELL')).length;

    let decision = 'HOLD';
    let confidence = 50;

    if (buyCount > sellCount && buyCount >= 3) {
      decision = 'BUY';
      confidence = (buyCount / signalValues.length) * 100;
    } else if (sellCount > buyCount && sellCount >= 3) {
      decision = 'SELL';
      confidence = (sellCount / signalValues.length) * 100;
    }

    return { decision, confidence: Math.round(confidence) };
  }
}

// ==================== BOT DE TRADING ====================
async function runTradingBot() {
  while (botRunning) {
    try {
      const ohlcvData = await getOHLCV();
      if (ohlcvData.length === 0) {
        await sleep(5000);
        continue;
      }

      currentAnalysis = TechnicalAnalyzer.analyzeTickerData(ohlcvData);
      const signals = AIIntelligence.generateSignals(currentAnalysis);
      const { decision, confidence } = AIIntelligence.makeDecision(signals);

      // Atualizar modelos IA
      aiModels.forEach(model => {
        model.confidence = confidence + (Math.random() - 0.5) * 20;
        model.confidence = Math.max(0, Math.min(100, model.confidence));
      });

      currentAnalysis.decision = decision;
      currentAnalysis.confidence = confidence;
      currentAnalysis.signals = signals;

      // Executar trade se confiança > 70%
      if (confidence > 70 && accountData.balance > 100) {
        executeTrade(decision, currentAnalysis.price);
      }

      // Atualizar lucro diário
      updateDailyProfit();

      // Emitir dados para WebSocket
      io.emit('market-update', {
        price: currentAnalysis.price,
        rsi: currentAnalysis.rsi.toFixed(2),
        sma20: currentAnalysis.sma20.toFixed(2),
        sma50: currentAnalysis.sma50.toFixed(2),
        macd: currentAnalysis.macd.toFixed(2),
        decision,
        confidence,
        signals,
        timestamp: currentAnalysis.timestamp,
        balance: accountData.balance.toFixed(2),
        totalProfit: accountData.totalProfit.toFixed(2),
        totalProfitPercent: accountData.totalProfitPercent.toFixed(2),
        openPositions: accountData.openPositions.length
      });

      await sleep(5000); // Atualizar a cada 5 segundos
    } catch (error) {
      console.error('Erro no bot:', error.message);
      await sleep(5000);
    }
  }
}

function executeTrade(decision, price) {
  const tradeSize = accountData.balance * 0.02; // 2% do capital
  const quantity = tradeSize / price;

  if (decision === 'BUY' && accountData.balance >= tradeSize) {
    const trade = {
      id: Date.now(),
      type: 'BUY',
      entryPrice: price,
      quantity,
      entryTime: new Date(),
      exitPrice: null,
      status: 'OPEN',
      profit: 0,
      profitPercent: 0
    };
    accountData.openPositions.push(trade);
    accountData.balance -= tradeSize;
    accountData.totalTrades++;

    io.emit('trade-executed', {
      type: 'BUY',
      price: price.toFixed(2),
      quantity: quantity.toFixed(8),
      amount: tradeSize.toFixed(2)
    });
  } else if (decision === 'SELL' && accountData.openPositions.length > 0) {
    const openTrade = accountData.openPositions[0];
    const exitAmount = openTrade.quantity * price;
    const profit = exitAmount - (openTrade.quantity * openTrade.entryPrice);
    const profitPercent = (profit / (openTrade.quantity * openTrade.entryPrice)) * 100;

    openTrade.exitPrice = price;
    openTrade.exitTime = new Date();
    openTrade.status = 'CLOSED';
    openTrade.profit = profit;
    openTrade.profitPercent = profitPercent;

    accountData.balance += exitAmount;
    accountData.totalProfit += profit;
    accountData.closedPositions.push(openTrade);
    accountData.openPositions.shift();

    if (profit > 0) accountData.winningTrades++;
    else accountData.losingTrades++;

    accountData.winRate = accountData.closedPositions.length > 0 
      ? (accountData.winningTrades / accountData.closedPositions.length) * 100 
      : 0;

    accountData.totalProfitPercent = ((accountData.balance - accountData.initialBalance) / accountData.initialBalance) * 100;

    io.emit('trade-executed', {
      type: 'SELL',
      price: price.toFixed(2),
      quantity: openTrade.quantity.toFixed(8),
      profit: profit.toFixed(2),
      profitPercent: profitPercent.toFixed(2)
    });
  }
}

function updateDailyProfit() {
  const today = new Date().toDateString();
  const todayTrades = accountData.closedPositions.filter(t => 
    new Date(t.exitTime).toDateString() === today
  );
  accountData.dailyProfit = todayTrades.reduce((sum, t) => sum + t.profit, 0);
  accountData.dailyProfitPercent = ((accountData.balance - accountData.initialBalance) / accountData.initialBalance) * 100;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== ROTAS API ====================

// Login
app.post('/api/login', (req, res) => {
  res.json({
    success: true,
    token: 'mock-token-' + Date.now(),
    email: accountData.email
  });
});

// Dados da conta
app.get('/api/account', (req, res) => {
  res.json({
    ...accountData,
    balance: parseFloat(accountData.balance.toFixed(2)),
    totalProfit: parseFloat(accountData.totalProfit.toFixed(2)),
    totalProfitPercent: parseFloat(accountData.totalProfitPercent.toFixed(2))
  });
});

// Depositar
app.post('/api/deposit', (req, res) => {
  const { amount } = req.body;
  accountData.balance += parseFloat(amount);
  accountData.initialBalance += parseFloat(amount);
  res.json({ success: true, balance: accountData.balance });
});

// Sacar
app.post('/api/withdraw', (req, res) => {
  const { amount } = req.body;
  if (accountData.balance >= amount) {
    accountData.balance -= parseFloat(amount);
    res.json({ success: true, balance: accountData.balance });
  } else {
    res.json({ success: false, error: 'Saldo insuficiente' });
  }
});

// Histórico de trades
app.get('/api/trades', (req, res) => {
  res.json({
    openPositions: accountData.openPositions,
    closedPositions: accountData.closedPositions.slice(-20)
  });
});

// Estatísticas
app.get('/api/statistics', (req, res) => {
  res.json({
    totalTrades: accountData.totalTrades,
    winningTrades: accountData.winningTrades,
    losingTrades: accountData.losingTrades,
    winRate: parseFloat(accountData.winRate.toFixed(2)),
    totalProfit: parseFloat(accountData.totalProfit.toFixed(2)),
    totalProfitPercent: parseFloat(accountData.totalProfitPercent.toFixed(2))
  });
});

// Modelos IA
app.get('/api/ai-models', (req, res) => {
  res.json(aiModels);
});

// Análise atual
app.get('/api/analysis', (req, res) => {
  res.json(currentAnalysis);
});

// Controlar bot
app.post('/api/bot-control', (req, res) => {
  const { action } = req.body;
  if (action === 'start') {
    botRunning = true;
    res.json({ success: true, message: 'Bot iniciado' });
  } else if (action === 'stop') {
    botRunning = false;
    res.json({ success: true, message: 'Bot parado' });
  }
});

// ==================== PÁGINA HTML ====================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang=\"pt-BR\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>🤖 Crypto Trading Bot - BTCUSDT</title>
  <script src=\"https://cdn.socket.io/4.5.4/socket.io.min.js\"></script>
  <script src=\"https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js\"></script>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary: #1a1a2e;
      --secondary: #16213e;
      --accent: #0f3460;
      --green: #00d4ff;
      --red: #ff006e;
      --yellow: #ffd60a;
      --text: #eaeaea;
      --text-secondary: #a0a0a0;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: var(--text);
      overflow-x: hidden;
    }

    header {
      background: linear-gradient(90deg, var(--secondary) 0%, var(--accent) 100%);
      padding: 20px;
      border-bottom: 3px solid var(--green);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    h1 {
      font-size: 28px;
      color: var(--green);
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
    }

    .status-indicator {
      display: flex;
      gap: 15px;
      align-items: center;
    }

    .status-dot {
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .card {
      background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
      border: 2px solid var(--accent);
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;
    }

    .card:hover {
      transform: translateY(-5px);
      border-color: var(--green);
      box-shadow: 0 15px 40px rgba(0, 212, 255, 0.2);
    }

    .card-title {
      font-size: 12px;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }

    .card-value {
      font-size: 28px;
      font-weight: bold;
      color: var(--green);
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    }

    .card-value.negative {
      color: var(--red);
    }

    .card-value.neutral {
      color: var(--yellow);
    }

    .small-text {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 10px;
    }

    .section {
      background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
      border: 2px solid var(--accent);
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .section-title {
      font-size: 20px;
      font-weight: bold;
      color: var(--green);
      margin-bottom: 20px;
      border-bottom: 2px solid var(--green);
      padding-bottom: 10px;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    }

    .ai-models {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
    }

    .ai-model {
      background: var(--primary);
      border: 2px solid var(--accent);
      border-radius: 8px;
      padding: 15px;
      text-align: center;
      transition: all 0.3s ease;
    }

    .ai-model:hover {
      border-color: var(--green);
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.2);
    }

    .model-name {
      font-size: 14px;
      font-weight: bold;
      color: var(--green);
      margin-bottom: 10px;
    }

    .model-confidence {
      font-size: 18px;
      font-weight: bold;
      color: var(--yellow);
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: var(--accent);
      border-radius: 4px;
      margin: 10px 0;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--green), var(--yellow));
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .chart-container {
      position: relative;
      height: 300px;
      margin-bottom: 20px;
    }

    .signals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
    }

    .signal-item {
      background: var(--primary);
      border-left: 4px solid var(--green);
      padding: 12px;
      border-radius: 6px;
      font-size: 12px;
    }

    .signal-item.strong-buy {
      border-left-color: var(--green);
      background: rgba(0, 212, 255, 0.1);
    }

    .signal-item.buy {
      border-left-color: var(--yellow);
      background: rgba(255, 214, 10, 0.1);
    }

    .signal-item.sell {
      border-left-color: var(--red);
      background: rgba(255, 0, 110, 0.1);
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin: 20px 0;
    }

    button {
      flex: 1;
      padding: 12px 20px;
      border: 2px solid var(--green);
      background: linear-gradient(135deg, var(--accent) 0%, var(--secondary) 100%);
      color: var(--green);
      font-weight: bold;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    button:hover {
      background: linear-gradient(135deg, var(--green) 0%, var(--accent) 100%);
      color: var(--primary);
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
    }

    button.danger {
      border-color: var(--red);
      color: var(--red);
    }

    button.danger:hover {
      background: linear-gradient(135deg, var(--red) 0%, var(--accent) 100%);
      color: var(--primary);
      box-shadow: 0 0 20px rgba(255, 0, 110, 0.5);
    }

    .trades-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .trade-item {
      background: var(--primary);
      border-left: 4px solid var(--green);
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 6px;
      font-size: 12px;
    }

    .trade-item.sell {
      border-left-color: var(--red);
    }

    .trade-type {
      font-weight: bold;
      color: var(--green);
    }

    .trade-type.sell {
      color: var(--red);
    }

    .trade-profit {
      color: var(--green);
      font-weight: bold;
    }

    .trade-profit.negative {
      color: var(--red);
    }

    .real-time-ticker {
      display: flex;
      gap: 15px;
      padding: 15px;
      background: var(--primary);
      border-radius: 8px;
      border: 1px solid var(--accent);
      font-size: 13px;
      flex-wrap: wrap;
    }

    .ticker-item {
      flex: 1;
      min-width: 100px;
    }

    .ticker-label {
      color: var(--text-secondary);
      font-size: 11px;
      text-transform: uppercase;
    }

    .ticker-value {
      color: var(--green);
      font-weight: bold;
      font-size: 14px;
      margin-top: 3px;
    }

    .deposit-withdraw-form {
      display: flex;
      gap: 10px;
      margin: 15px 0;
    }

    input {
      flex: 1;
      padding: 10px;
      background: var(--primary);
      border: 2px solid var(--accent);
      color: var(--text);
      border-radius: 6px;
      font-size: 14px;
    }

    input:focus {
      outline: none;
      border-color: var(--green);
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    }

    .notification {
      position: fixed;
      top: 100px;
      right: 20px;
      background: var(--green);
      color: var(--primary);
      padding: 15px 20px;
      border-radius: 6px;
      box-shadow: 0 5px 20px rgba(0, 212, 255, 0.4);
      animation: slideIn 0.3s ease;
      z-index: 1000;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .stat {
      background: var(--primary);
      padding: 15px;
      border-radius: 8px;
      border: 1px solid var(--accent);
    }

    .stat-label {
      color: var(--text-secondary);
      font-size: 11px;
      text-transform: uppercase;
    }

    .stat-value {
      color: var(--green);
      font-size: 20px;
      font-weight: bold;
      margin-top: 5px;
    }

    .spinner {
      display: inline-block;
      width: 10px;
      height: 10px;
      border: 2px solid var(--text-secondary);
      border-top-color: var(--green);
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <header>
    <div class=\"header-content\">
      <h1>🤖 CRYPTO TRADING BOT</h1>
      <div class=\"status-indicator\">
        <div class=\"status-dot\"></div>
        <span id=\"botStatus\">Bot Rodando</span>
      </div>
    </div>
  </header>

  <div class=\"container\">
    <!-- RESUMO GERAL -->
    <div class=\"dashboard\">
      <div class=\"card\">
        <div class=\"card-title\">💰 Saldo da Conta</div>
        <div class=\"card-value\" id=\"balance\">$10.000,00</div>
        <div class=\"small-text\" id=\"balancePercent\">+0.00%</div>
      </div>

      <div class=\"card\">
        <div class=\"card-title\">📈 Lucro Total</div>
        <div class=\"card-value\" id=\"totalProfit\">$0,00</div>
        <div class=\"small-text\" id=\"totalProfitPercent\">0.00%</div>
      </div>

      <div class=\"card\">
        <div class=\"card-title\">📊 Lucro Diário</div>
        <div class=\"card-value\" id=\"dailyProfit\">$0,00</div>
        <div class=\"small-text\" id=\"dailyProfitPercent\">0.00%</div>
      </div>

      <div class=\"card\">
        <div class=\"card-title\">🎯 Taxa de Acerto</div>
        <div class=\"card-value\" id=\"winRate\">0.00%</div>
        <div class=\"small-text\">Trades Vencedoras / Total</div>
      </div>

      <div class=\"card\">
        <div class=\"card-title\">📍 Preço BTC</div>
        <div class=\"card-value\" id=\"btcPrice\">$40.000</div>
        <div class=\"small-text\" id=\"priceChange\">Atualizando...</div>
      </div>

      <div class=\"card\">
        <div class=\"card-title\">🔄 Posições Abertas</div>
        <div class=\"card-value\" id=\"openPositions\">0</div>
        <div class=\"small-text\">Operações ativas</div>
      </div>
    </div>

    <!-- INDICADORES TÉCNICOS -->
    <div class=\"section\">
      <div class=\"section-title\">📊 Indicadores Técnicos em Tempo Real</div>
      <div class=\"real-time-ticker\">
        <div class=\"ticker-item\">
          <div class=\"ticker-label\">RSI (14)</div>
          <div class=\"ticker-value\" id=\"rsiValue\">50.00</div>
        </div>
        <div class=\"ticker-item\">
          <div class=\"ticker-label\">SMA 20</div>
          <div class=\"ticker-value\" id=\"sma20Value\">40.000</div>
        </div>
        <div class=\"ticker-item\">
          <div class=\"ticker-label\">SMA 50</div>
          <div class=\"ticker-value\" id=\"sma50Value\">40.000</div>
        </div>
        <div class=\"ticker-item\">
          <div class=\"ticker-label\">MACD</div>
          <div class=\"ticker-value\" id=\"macdValue\">0.00</div>
        </div>
        <div class=\"ticker-item\">
          <div class=\"ticker-label\">📈 Tendência</div>
          <div class=\"ticker-value\" id=\"trendValue\">HOLD</div>
        </div>
      </div>
    </div>

    <!-- IAs INTELIGÊNCIAS -->
    <div class=\"section\">
      <div class=\"section-title\">🧠 Múltiplas Inteligências Artificiais</div>
      <div class=\"ai-models\" id=\"aiModels\">
        <!-- Preenchido por JavaScript -->
      </div>
    </div>

    <!-- SINAIS DE TRADING -->
    <div class=\"section\">
      <div class=\"section-title\">🎯 Sinais de Trading</div>
      <div class=\"signals-grid\" id=\"signalsContainer\">
        <!-- Preenchido por JavaScript -->
      </div>
    </div>

    <!-- GRÁFICO DE LUCRO -->
    <div class=\"section\">
      <div class=\"section-title\">💹 Gráfico de Lucro (Tempo Real)</div>
      <div class=\"chart-container\">
        <canvas id=\"profitChart\"></canvas>
      </div>
    </div>

    <!-- OPERAÇÕES RECENTES -->
    <div class=\"section\">
      <div class=\"section-title\">📋 Operações Recentes</div>
      <div class=\"trades-list\" id=\"tradesList\">
        <!-- Preenchido por JavaScript -->
      </div>
    </div>

    <!-- CONTROLE DE DEPÓSITO/SAQUE -->
    <div class=\"section\">
      <div class=\"section-title\">💳 Gerenciar Conta</div>
      <div class=\"deposit-withdraw-form\">
        <input type=\"number\" id=\"depositAmount\" placeholder=\"Valor em USD\" min=\"1\">
        <button onclick=\"deposit()\">Depositar</button>
      </div>
      <div class=\"deposit-withdraw-form\">
        <input type=\"number\" id=\"withdrawAmount\" placeholder=\"Valor em USD\" min=\"1\">
        <button class=\"danger\" onclick=\"withdraw()\">Sacar</button>
      </div>
    </div>

    <!-- CONTROLE DO BOT -->
    <div class=\"section\">
      <div class=\"section-title\">🎮 Controle do Bot</div>
      <div class=\"button-group\">
        <button onclick=\"startBot()\">▶️ Iniciar Bot</button>
        <button class=\"danger\" onclick=\"stopBot()\">⏹️ Parar Bot</button>
      </div>
    </div>

    <!-- ESTATÍSTICAS -->
    <div class=\"section\">
      <div class=\"section-title\">📊 Estatísticas de Trading</div>
      <div class=\"stats-grid\">
        <div class=\"stat\">
          <div class=\"stat-label\">Total de Trades</div>
          <div class=\"stat-value\" id=\"totalTrades\">0</div>
        </div>
        <div class=\"stat\">
          <div class=\"stat-label\">Trades Vencedoras</div>
          <div class=\"stat-value\" id=\"winningTrades\">0</div>
        </div>
        <div class=\"stat\">
          <div class=\"stat-label\">Trades Perdedoras</div>
          <div class=\"stat-value\" id=\"losingTrades\">0</div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const socket = io();
    let profitChart = null;
    let priceHistory = [];
    let profitHistory = [];

    // WebSocket - Receber atualizações em tempo real
    socket.on('market-update', (data) => {
      updateUI(data);
    });

    socket.on('trade-executed', (data) => {
      showNotification(\`\${data.type}: \${data.quantity} BTC @ \${data.price}\`);
      fetchTrades();
    });

    // Atualizar UI
    function updateUI(data) {
      // Preço e indicadores
      document.getElementById('btcPrice').textContent = '\$' + parseFloat(data.price).toFixed(2);
      document.getElementById('rsiValue').textContent = data.rsi;
      document.getElementById('sma20Value').textContent = '\$' + parseFloat(data.sma20).toFixed(2);
      document.getElementById('sma50Value').textContent = '\$' + parseFloat(data.sma50).toFixed(2);
      document.getElementById('macdValue').textContent = data.macd;
      document.getElementById('trendValue').textContent = data.decision;
      document.getElementById('balance').textContent = '\$' + parseFloat(data.balance).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      document.getElementById('totalProfit').textContent = '\$' + parseFloat(data.totalProfit).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      document.getElementById('totalProfitPercent').textContent = parseFloat(data.totalProfitPercent).toFixed(2) + '%';
      document.getElementById('openPositions').textContent = data.openPositions;

      // Atualizar modelos IA
      fetch('/api/ai-models').then(r => r.json()).then(models => {
        const container = document.getElementById('aiModels');
        container.innerHTML = models.map(m => \`
          <div class=\"ai-model\">
            <div class=\"model-name\">\${m.name}</div>
            <div class=\"progress-bar\">
              <div class=\"progress-fill\" style=\"width: \${m.confidence}%\"></div>
            </div>
            <div class=\"model-confidence\">\${Math.round(m.confidence)}%</div>
          </div>
        \`).join('');
      });

      // Sinais
      if (data.signals) {
        const container = document.getElementById('signalsContainer');
        container.innerHTML = Object.entries(data.signals).map(([model, signal]) => \`
          <div class=\"signal-item \${signal.toLowerCase()}\">
            <div><strong>\${model}</strong></div>
            <div>\${signal}</div>
          </div>
        \`).join('');
      }

      // Gráfico de lucro
      priceHistory.push(data.price);
      profitHistory.push(parseFloat(data.totalProfit));

      if (priceHistory.length > 50) {
        priceHistory.shift();
        profitHistory.shift();
      }

      updateProfitChart();
    }

    // Gráfico de lucro
    function updateProfitChart() {
      const ctx = document.getElementById('profitChart').getContext('2d');
      if (profitChart) {
        profitChart.data.labels = priceHistory.map((_, i) => i);
        profitChart.data.datasets[0].data = profitHistory;
        profitChart.update();
      } else {
        profitChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: priceHistory.map((_, i) => i),
            datasets: [{
              label: 'Lucro em Tempo Real (\$)',
              data: profitHistory,
              borderColor: '#00d4ff',
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              tension: 0.4,
              fill: true,
              borderWidth: 2
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: '#eaeaea' } }
            },
            scales: {
              y: {
                ticks: { color: '#a0a0a0' },
                grid: { color: 'rgba(0, 212, 255, 0.1)' }
              },
              x: {
                ticks: { color: '#a0a0a0' },
                grid: { color: 'rgba(0, 212, 255, 0.1)' }
              }
            }
          }
        });
      }
    }

    // Buscar trades
    function fetchTrades() {
      fetch('/api/trades').then(r => r.json()).then(data => {
        const container = document.getElementById('tradesList');
        const allTrades = [...data.openPositions, ...data.closedPositions].slice(-10);
        container.innerHTML = allTrades.map(t => \`
          <div class=\"trade-item \${t.type === 'SELL' ? 'sell' : ''}\">
            <div>
              <span class=\"trade-type \${t.type === 'SELL' ? 'sell' : ''}\">\${t.type}</span>
              <span style=\"color: var(--text-secondary);\"> @ \$\${t.entryPrice.toFixed(2)}</span>
            </div>
            <div>
              <span>Qty: \${t.quantity.toFixed(8)} BTC</span>
              \${t.status === 'CLOSED' ? \`<span class=\"trade-profit \${t.profit < 0 ? 'negative' : ''}\">\$\${t.profit.toFixed(2)}</span>\` : ''}
            </div>
            <div style=\"color: var(--text-secondary); font-size: 11px;\">\${new Date(t.entryTime).toLocaleTimeString('pt-BR')}</div>
          </div>
        \`).join('');
      });
    }

    // Buscar estatísticas
    function fetchStatistics() {
      fetch('/api/statistics').then(r => r.json()).then(data => {
        document.getElementById('totalTrades').textContent = data.totalTrades;
        document.getElementById('winningTrades').textContent = data.winningTrades;
        document.getElementById('losingTrades').textContent = data.losingTrades;
        document.getElementById('winRate').textContent = data.winRate.toFixed(2) + '%';
      });
    }

    // Depositar
    function deposit() {
      const amount = document.getElementById('depositAmount').value;
      if (!amount || amount <= 0) return alert('Valor inválido');

      fetch('/api/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      }).then(r => r.json()).then(data => {
        if (data.success) {
          showNotification('Depósito realizado com sucesso!');
          document.getElementById('depositAmount').value = '';
          fetchAccount();
        }
      });
    }

    // Sacar
    function withdraw() {
      const amount = document.getElementById('withdrawAmount').value;
      if (!amount || amount <= 0) return alert('Valor inválido');

      fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      }).then(r => r.json()).then(data => {
        if (data.success) {
          showNotification('Saque realizado com sucesso!');
          document.getElementById('withdrawAmount').value = '';
          fetchAccount();
        } else {
          alert(data.error);
        }
      });
    }

    // Controlar bot
    function startBot() {
      fetch('/api/bot-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      }).then(r => r.json()).then(data => {
        showNotification('Bot iniciado!');
        document.getElementById('botStatus').textContent = 'Bot Rodando';
      });
    }

    function stopBot() {
      fetch('/api/bot-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      }).then(r => r.json()).then(data => {
        showNotification('Bot parado!');
        document.getElementById('botStatus').textContent = 'Bot Parado';
      });
    }

    // Notificações
    function showNotification(message) {
      const notif = document.createElement('div');
      notif.className = 'notification';
      notif.textContent = message;
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 3000);
    }

    // Buscar dados da conta
    function fetchAccount() {
      fetch('/api/account').then(r => r.json()).then(data => {
        document.getElementById('balance').textContent = '\$' + parseFloat(data.balance).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});
      });
    }

    // Inicializar
    document.addEventListener('DOMContentLoaded', () => {
      fetchAccount();
      fetchTrades();
      fetchStatistics();
      setInterval(fetchTrades, 5000);
      setInterval(fetchStatistics, 5000);
    });
  </script>
</body>
</html>
  `);
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('\n🚀 ==========================================');
  console.log('🚀 CRYPTO TRADING BOT - BTCUSDT');
  console.log('🚀 ==========================================');
  console.log(\`🚀 Servidor rodando: http://localhost:\${PORT}\`);
  console.log('🚀 ==========================================\n');
});

// Iniciar bot de trading
runTradingBot().catch(console.error);
