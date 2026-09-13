const binanceAPI = require('../api/binance');
const AIIntelligence = require('../ai/intelligence');
const Trade = require('../db/models/Trade');
const config = require('../config/config');

class AutoTrader {
  constructor() {
    this.isTrading = false;
    this.currentPrice = 0;
    this.analysis = null;
    this.signals = null;
    this.tradeHistory = [];
  }

  // Iniciar bot de trading
  async start() {
    this.isTrading = true;
    console.log('✅ Bot de trading iniciado!');
    await this.tradeLoop();
  }

  // Parar bot de trading
  stop() {
    this.isTrading = false;
    console.log('⛔ Bot de trading parado!');
  }

  // Loop principal de trading
  async tradeLoop() {
    while (this.isTrading) {
      try {
        // Obter dados do mercado
        const ohlcvData = await binanceAPI.getOHLCV(
          'BTC/USDT',
          config.TRADING_TIMEFRAME,
          100
        );

        if (!ohlcvData || ohlcvData.length === 0) {
          console.log('⚠️ Sem dados de mercado');
          await this.sleep(5000);
          continue;
        }

        // Analisar com IA
        this.analysis = AIIntelligence.analyzeTickerData(ohlcvData);
        this.currentPrice = this.analysis.currentPrice;

        // Gerar sinais
        this.signals = AIIntelligence.generateSignals(this.analysis);
        const decision = AIIntelligence.makeTradingDecision(this.signals);

        console.log(`\n📊 Análise: ${this.currentPrice.toFixed(2)}`);
        console.log(`📈 Decisão: ${decision.decision} (Confiança: ${decision.confidence}%)`);

        // Executar decisão
        if (decision.confidence > 65) {
          await this.executeTrade(decision, ohlcvData);
        }

        // Aguardar próximo ciclo
        await this.sleep(config.TRADING_TIMEFRAME === '5m' ? 300000 : 60000);

      } catch (error) {
        console.error('❌ Erro no loop de trading:', error.message);
        await this.sleep(5000);
      }
    }
  }

  // Executar trade
  async executeTrade(decision, ohlcvData) {
    try {
      const balance = await binanceAPI.getBalance();
      if (!balance) return;

      const usdtBalance = balance.USDT?.free || 0;
      const btcBalance = balance.BTC?.free || 0;

      const tradeSize = usdtBalance * config.MAX_POSITION_SIZE;

      if (decision.decision === 'BUY' && usdtBalance > tradeSize) {
        await this.executeBuyOrder(tradeSize, ohlcvData);
      } else if (decision.decision === 'SELL' && btcBalance > 0.0001) {
        await this.executeSellOrder(btcBalance, ohlcvData);
      }
    } catch (error) {
      console.error('❌ Erro ao executar trade:', error.message);
    }
  }

  // Executar ordem de compra
  async executeBuyOrder(amount, ohlcvData) {
    try {
      const price = this.currentPrice;
      const quantity = amount / price;

      const order = await binanceAPI.createBuyOrder('BTC/USDT', quantity, price);

      if (order) {
        const trade = new Trade({
          symbol: 'BTCUSDT',
          type: 'BUY',
          entryPrice: price,
          quantity,
          status: 'OPEN',
          aiSignals: Object.entries(this.signals).map(([model, signal]) => ({
            model,
            confidence: signal.confidence,
            signal: signal.signal
          })),
          orderId: order.id
        });

        await trade.save();
        this.tradeHistory.push(trade);
        console.log(`✅ Ordem de COMPRA executada: ${quantity.toFixed(8)} BTC @ ${price}`);
      }
    } catch (error) {
      console.error('❌ Erro ao executar compra:', error.message);
    }
  }

  // Executar ordem de venda
  async executeSellOrder(quantity, ohlcvData) {
    try {
      const price = this.currentPrice;

      const order = await binanceAPI.createSellOrder('BTC/USDT', quantity, price);

      if (order) {
        const trade = new Trade({
          symbol: 'BTCUSDT',
          type: 'SELL',
          entryPrice: price,
          quantity,
          status: 'OPEN',
          aiSignals: Object.entries(this.signals).map(([model, signal]) => ({
            model,
            confidence: signal.confidence,
            signal: signal.signal
          })),
          orderId: order.id
        });

        await trade.save();
        this.tradeHistory.push(trade);
        console.log(`✅ Ordem de VENDA executada: ${quantity.toFixed(8)} BTC @ ${price}`);
      }
    } catch (error) {
      console.error('❌ Erro ao executar venda:', error.message);
    }
  }

  // Função auxiliar para aguardar
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new AutoTrader();
