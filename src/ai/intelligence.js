const TechnicalAnalyzer = require('../trading/analyzer');

class AIIntelligence {
  constructor() {
    this.models = [
      'Technical Analysis',
      'Trend Following',
      'Mean Reversion',
      'Volume Analysis',
      'Pattern Recognition'
    ];
  }

  // Análise Técnica Completa
  analyzeTickerData(ohlcvData) {
    if (!ohlcvData || ohlcvData.length < 26) {
      return { error: 'Dados insuficientes para análise' };
    }

    const closes = ohlcvData.map(c => c.close);
    const volumes = ohlcvData.map(c => c.volume);
    const currentPrice = closes[closes.length - 1];

    // Calcular indicadores
    const rsi = TechnicalAnalyzer.calculateRSI(closes, 14);
    const macd = TechnicalAnalyzer.calculateMACD(closes);
    const sma20 = TechnicalAnalyzer.calculateSMA(closes, 20);
    const sma50 = TechnicalAnalyzer.calculateSMA(closes, 50);
    const bb = TechnicalAnalyzer.calculateBollingerBands(closes, 20, 2);
    const volumeAnalysis = TechnicalAnalyzer.analyzeVolume(volumes);

    return {
      currentPrice,
      rsi,
      macd,
      sma20,
      sma50,
      bollingerBands: bb,
      volume: volumeAnalysis,
      timestamp: new Date()
    };
  }

  // Gerar Sinais de Compra/Venda
  generateSignals(analysis) {
    const signals = {};

    // Modelo 1: Análise Técnica
    signals['Technical Analysis'] = this.technicalSignal(analysis);

    // Modelo 2: Trend Following
    signals['Trend Following'] = this.trendFollowingSignal(analysis);

    // Modelo 3: Mean Reversion
    signals['Mean Reversion'] = this.meanReversionSignal(analysis);

    // Modelo 4: Volume Analysis
    signals['Volume Analysis'] = this.volumeAnalysisSignal(analysis);

    // Modelo 5: Pattern Recognition
    signals['Pattern Recognition'] = this.patternRecognitionSignal(analysis);

    return signals;
  }

  // Sinal de Análise Técnica
  technicalSignal(analysis) {
    let score = 0;
    let details = [];

    // RSI
    if (analysis.rsi < 30) {
      score += 2;
      details.push('RSI em zona de sobrevenda (BUY)');
    } else if (analysis.rsi > 70) {
      score -= 2;
      details.push('RSI em zona de sobrecompra (SELL)');
    }

    // MACD
    if (analysis.macd && analysis.macd.histogram > 0) {
      score += 1;
      details.push('MACD positivo (BUY)');
    } else if (analysis.macd && analysis.macd.histogram < 0) {
      score -= 1;
      details.push('MACD negativo (SELL)');
    }

    // Média Móvel
    if (analysis.currentPrice > analysis.sma20 && analysis.sma20 > analysis.sma50) {
      score += 1.5;
      details.push('Médias em alta (BUY)');
    } else if (analysis.currentPrice < analysis.sma20 && analysis.sma20 < analysis.sma50) {
      score -= 1.5;
      details.push('Médias em queda (SELL)');
    }

    return this.scoreToSignal(score, details);
  }

  // Sinal de Trend Following
  trendFollowingSignal(analysis) {
    let score = 0;
    let details = [];

    if (analysis.sma20 > analysis.sma50) {
      score += 2;
      details.push('Tendência de alta confirmada');
    } else if (analysis.sma20 < analysis.sma50) {
      score -= 2;
      details.push('Tendência de queda confirmada');
    }

    if (analysis.currentPrice > analysis.sma20) {
      score += 1;
      details.push('Preço acima da SMA20');
    } else {
      score -= 1;
      details.push('Preço abaixo da SMA20');
    }

    return this.scoreToSignal(score, details);
  }

  // Sinal de Mean Reversion
  meanReversionSignal(analysis) {
    let score = 0;
    let details = [];

    if (analysis.bollingerBands) {
      if (analysis.currentPrice < analysis.bollingerBands.lower) {
        score += 2;
        details.push('Preço abaixo da banda inferior (BUY)');
      } else if (analysis.currentPrice > analysis.bollingerBands.upper) {
        score -= 2;
        details.push('Preço acima da banda superior (SELL)');
      }
    }

    if (analysis.rsi < 20) {
      score += 1;
      details.push('RSI extremamente baixo (BUY)');
    } else if (analysis.rsi > 80) {
      score -= 1;
      details.push('RSI extremamente alto (SELL)');
    }

    return this.scoreToSignal(score, details);
  }

  // Sinal de Volume Analysis
  volumeAnalysisSignal(analysis) {
    let score = 0;
    let details = [];

    if (analysis.volume) {
      if (analysis.volume.ratio > 1.5) {
        if (analysis.rsi > 50) {
          score += 1.5;
          details.push('Volume alto com preço em alta (BUY)');
        } else {
          score -= 1.5;
          details.push('Volume alto com preço em queda (SELL)');
        }
      }
    }

    return this.scoreToSignal(score, details);
  }

  // Sinal de Pattern Recognition
  patternRecognitionSignal(analysis) {
    let score = 0;
    let details = [];

    // Padrão de duplo fundo
    if (analysis.rsi < 30 && analysis.currentPrice > analysis.bollingerBands.lower) {
      score += 1.5;
      details.push('Possível duplo fundo detectado');
    }

    // Padrão de topo duplo
    if (analysis.rsi > 70 && analysis.currentPrice < analysis.bollingerBands.upper) {
      score -= 1.5;
      details.push('Possível topo duplo detectado');
    }

    return this.scoreToSignal(score, details);
  }

  // Converter Score em Sinal
  scoreToSignal(score, details) {
    let signal, confidence;

    if (score > 3) {
      signal = 'STRONG BUY';
      confidence = Math.min(100, (score / 6) * 100);
    } else if (score > 1) {
      signal = 'BUY';
      confidence = Math.min(100, (score / 6) * 100);
    } else if (score < -3) {
      signal = 'STRONG SELL';
      confidence = Math.min(100, (Math.abs(score) / 6) * 100);
    } else if (score < -1) {
      signal = 'SELL';
      confidence = Math.min(100, (Math.abs(score) / 6) * 100);
    } else {
      signal = 'HOLD';
      confidence = 50;
    }

    return {
      signal,
      confidence: Math.round(confidence),
      score,
      details
    };
  }

  // Decisão de Trading Consolidada
  makeTradingDecision(signals) {
    let totalScore = 0;
    let buySignals = 0;
    let sellSignals = 0;

    Object.values(signals).forEach(signal => {
      if (signal.signal.includes('BUY')) buySignals++;
      if (signal.signal.includes('SELL')) sellSignals++;
      totalScore += signal.score;
    });

    const avgScore = totalScore / Object.keys(signals).length;
    const agreementPercent = Math.max(buySignals, sellSignals) / Object.keys(signals).length * 100;

    let finalDecision = 'HOLD';
    if (agreementPercent > 60) {
      finalDecision = buySignals > sellSignals ? 'BUY' : 'SELL';
    }

    return {
      decision: finalDecision,
      confidence: Math.round(agreementPercent),
      agreementModels: Math.max(buySignals, sellSignals),
      totalModels: Object.keys(signals).length
    };
  }
}

module.exports = new AIIntelligence();
