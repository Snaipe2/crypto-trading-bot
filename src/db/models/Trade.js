const mongoose = require('mongoose');

const TradeSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    default: 'BTCUSDT'
  },
  type: {
    type: String,
    enum: ['BUY', 'SELL'],
    required: true
  },
  entryPrice: {
    type: Number,
    required: true
  },
  exitPrice: {
    type: Number,
    default: null
  },
  quantity: {
    type: Number,
    required: true
  },
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['OPEN', 'CLOSED', 'CANCELLED'],
    default: 'OPEN'
  },
  profit: {
    type: Number,
    default: 0
  },
  profitPercent: {
    type: Number,
    default: 0
  },
  aiSignals: [{
    model: String,
    confidence: Number,
    signal: String
  }],
  stopLoss: Number,
  takeProfit: Number,
  orderId: String,
  notes: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Trade', TradeSchema);
