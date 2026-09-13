const ccxt = require('ccxt');
const config = require('../config/config');

class BinanceAPI {
  constructor() {
    this.exchange = new ccxt.binance({
      apiKey: config.BINANCE_API_KEY,
      secret: config.BINANCE_SECRET_KEY,
      enableRateLimit: true,
      options: {
        defaultType: 'spot'
      }
    });
  }

  // Obter preço atual
  async getCurrentPrice(symbol = 'BTC/USDT') {
    try {
      const ticker = await this.exchange.fetchTicker(symbol);
      return ticker.last;
    } catch (error) {
      console.error('Erro ao buscar preço:', error.message);
      return null;
    }
  }

  // Obter histórico de candles
  async getOHLCV(symbol = 'BTC/USDT', timeframe = '5m', limit = 100) {
    try {
      const ohlcv = await this.exchange.fetchOHLCV(symbol, timeframe, undefined, limit);
      return ohlcv.map(candle => ({
        timestamp: new Date(candle[0]),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));
    } catch (error) {
      console.error('Erro ao buscar OHLCV:', error.message);
      return [];
    }
  }

  // Criar ordem de compra
  async createBuyOrder(symbol = 'BTC/USDT', amount, price) {
    try {
      const order = await this.exchange.createLimitBuyOrder(symbol, amount, price);
      return order;
    } catch (error) {
      console.error('Erro ao criar ordem de compra:', error.message);
      return null;
    }
  }

  // Criar ordem de venda
  async createSellOrder(symbol = 'BTC/USDT', amount, price) {
    try {
      const order = await this.exchange.createLimitSellOrder(symbol, amount, price);
      return order;
    } catch (error) {
      console.error('Erro ao criar ordem de venda:', error.message);
      return null;
    }
  }

  // Obter saldo
  async getBalance() {
    try {
      const balance = await this.exchange.fetchBalance();
      return balance;
    } catch (error) {
      console.error('Erro ao buscar saldo:', error.message);
      return null;
    }
  }

  // Obter ordens abertas
  async getOpenOrders(symbol = 'BTC/USDT') {
    try {
      const orders = await this.exchange.fetchOpenOrders(symbol);
      return orders;
    } catch (error) {
      console.error('Erro ao buscar ordens abertas:', error.message);
      return [];
    }
  }

  // Cancelar ordem
  async cancelOrder(orderId, symbol = 'BTC/USDT') {
    try {
      const result = await this.exchange.cancelOrder(orderId, symbol);
      return result;
    } catch (error) {
      console.error('Erro ao cancelar ordem:', error.message);
      return null;
    }
  }
}

module.exports = new BinanceAPI();
