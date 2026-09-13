const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const AccountSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    default: 0
  },
  totalDeposited: {
    type: Number,
    default: 0
  },
  totalWithdrawn: {
    type: Number,
    default: 0
  },
  availableBalance: {
    type: Number,
    default: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  totalProfitPercent: {
    type: Number,
    default: 0
  },
  dailyProfit: {
    type: Number,
    default: 0
  },
  dailyProfitPercent: {
    type: Number,
    default: 0
  },
  winRate: {
    type: Number,
    default: 0
  },
  totalTrades: {
    type: Number,
    default: 0
  },
  winningTrades: {
    type: Number,
    default: 0
  },
  losingTrades: {
    type: Number,
    default: 0
  },
  botEnabled: {
    type: Boolean,
    default: true
  },
  tradingPair: {
    type: String,
    default: 'BTCUSDT'
  },
  riskPerTrade: {
    type: Number,
    default: 0.02
  }
}, {
  timestamps: true
});

// Hash password before saving
AccountSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
AccountSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Account', AccountSchema);
