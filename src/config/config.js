require('dotenv').config();

module.exports = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Binance API
  BINANCE_API_KEY: process.env.BINANCE_API_KEY,
  BINANCE_SECRET_KEY: process.env.BINANCE_SECRET_KEY,

  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/trading-bot',

  // Trading
  TRADING_SYMBOL: process.env.TRADING_SYMBOL || 'BTCUSDT',
  TRADING_TIMEFRAME: process.env.TRADING_TIMEFRAME || '5m',
  INITIAL_CAPITAL: parseFloat(process.env.INITIAL_CAPITAL) || 1000,
  MAX_POSITION_SIZE: parseFloat(process.env.MAX_POSITION_SIZE) || 0.1,
  STOP_LOSS_PERCENT: parseFloat(process.env.STOP_LOSS_PERCENT) || 2,
  TAKE_PROFIT_PERCENT: parseFloat(process.env.TAKE_PROFIT_PERCENT) || 5,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'your_secret_key_change_in_production',
  JWT_EXPIRE: '7d',

  // Risk Management
  RISK_PER_TRADE: 0.02, // 2% do capital por operação
  MAX_DAILY_LOSS: 0.05, // 5% de perda máxima por dia
  LEVERAGE: 1, // Sem alavancagem por padrão
};
