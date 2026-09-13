class TechnicalAnalyzer {
  // RSI (Relative Strength Index)
  static calculateRSI(closes, period = 14) {
    if (closes.length < period) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i < period; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains = change;
      else gains = 0;
      if (change < 0) losses = Math.abs(change);
      else losses = 0;

      avgGain = (avgGain * (period - 1) + gains) / period;
      avgLoss = (avgLoss * (period - 1) + losses) / period;
    }

    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    return rsi;
  }

  // MACD (Moving Average Convergence Divergence)
  static calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
    const ema12 = this.calculateEMA(closes, fastPeriod);
    const ema26 = this.calculateEMA(closes, slowPeriod);

    if (!ema12 || !ema26) return null;

    const macdLine = ema12 - ema26;
    const signalLine = this.calculateEMA([...closes.slice(0, -1), macdLine], signalPeriod);
    const histogram = macdLine - signalLine;

    return { macdLine, signalLine, histogram };
  }

  // EMA (Exponential Moving Average)
  static calculateEMA(data, period) {
    if (data.length < period) return null;

    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }

    let ema = sum / period;
    const k = 2 / (period + 1);

    for (let i = period; i < data.length; i++) {
      ema = data[i] * k + ema * (1 - k);
    }

    return ema;
  }

  // SMA (Simple Moving Average)
  static calculateSMA(data, period) {
    if (data.length < period) return null;
    let sum = 0;
    for (let i = data.length - period; i < data.length; i++) {
      sum += data[i];
    }
    return sum / period;
  }

  // Bandas de Bollinger
  static calculateBollingerBands(closes, period = 20, stdDeviation = 2) {
    const sma = this.calculateSMA(closes, period);
    if (!sma) return null;

    let sumSquaredDiff = 0;
    for (let i = closes.length - period; i < closes.length; i++) {
      sumSquaredDiff += Math.pow(closes[i] - sma, 2);
    }

    const std = Math.sqrt(sumSquaredDiff / period);
    return {
      upper: sma + (std * stdDeviation),
      middle: sma,
      lower: sma - (std * stdDeviation)
    };
  }

  // Análise de Volume
  static analyzeVolume(volumes, period = 20) {
    if (volumes.length < period) return null;

    let sum = 0;
    for (let i = volumes.length - period; i < volumes.length; i++) {
      sum += volumes[i];
    }

    const avgVolume = sum / period;
    const currentVolume = volumes[volumes.length - 1];

    return {
      average: avgVolume,
      current: currentVolume,
      ratio: currentVolume / avgVolume
    };
  }
}

module.exports = TechnicalAnalyzer;
