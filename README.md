# 🚀 Crypto Trading Bot - BTCUSDT

## Descrição
Bot de trading automatizado e inteligente para BTCUSDT com análises em tempo real, múltiplas IA trabalhando simultaneamente, dashboard visual com gráficos ao vivo e gerenciamento automático de capital.

## 🎯 Características

✅ **Conexão com APIs Públicas**
- Binance API
- Múltiplas fontes de dados
- Análises sem rejeição

✅ **Trading Automático**
- Operações 24/7 no BTCUSDT
- Detecção automática de oportunidades
- Entrada proporcional ao capital

✅ **Inteligência Artificial**
- Múltiplos modelos de IA
- Análise técnica em tempo real
- Previsão de preços
- Sinais de compra/venda

✅ **Dashboard em Tempo Real**
- Gráficos interativos (Chart.js)
- Saldo da conta atualizado
- Histórico de operações
- Ganhos de lucro visual
- WebSocket para atualizações live

✅ **Gerenciamento de Capital**
- Depósitos e saques
- Controle de risco
- Stop loss e take profit
- Posicionamento automático

## 📋 Requisitos

- Node.js v16+
- npm ou yarn
- MongoDB
- Conta Binance com API keys

## 🔧 Instalação

```bash
# Clone o repositório
git clone https://github.com/Snaipe2/crypto-trading-bot.git
cd crypto-trading-bot

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Inicie o bot
npm start
```

## 🚀 Uso

### Iniciar o Bot
```bash
npm start
```

### Modo Desenvolvimento
```bash
npm run dev
```

### Acessar Dashboard
Abra seu navegador em `http://localhost:5000`

## 📊 Estrutura do Projeto

```
crypto-trading-bot/
├── src/
│   ├── index.js              # Entrada principal
│   ├── server.js             # Servidor Express
│   ├── config/               # Configurações
│   ├── api/                  # Conectores de API
│   ├── trading/              # Lógica de trading
│   ├── ai/                   # Modelos de IA
│   ├── db/                   # Banco de dados
│   ├── routes/               # Rotas da API
│   ├── websocket/            # WebSocket em tempo real
│   └── public/               # Dashboard HTML/CSS/JS
├── tests/                    # Testes
├── .env.example              # Variáveis de ambiente
└── package.json              # Dependências
```

## 🔐 Segurança

- ✅ Variáveis de ambiente protegidas
- ✅ JWT Authentication
- ✅ Hash de senhas (bcryptjs)
- ✅ CORS configurado
- ✅ Validação de entrada

## 📈 Análises Suportadas

- RSI (Relative Strength Index)
- MACD (Moving Average Convergence Divergence)
- Bandas de Bollinger
- Média Móvel (SMA/EMA)
- Análise de Volume
- Padrões de Candlestick

## 🤖 Modelos de IA

1. **Análise Técnica** - Padrões e indicadores
2. **Machine Learning** - Previsão de preços
3. **Análise de Sentimento** - Notícias e redes sociais
4. **Redes Neurais** - TensorFlow para padrões complexos

## ⚠️ Disclaimers

- Trading é arriscado. Use apenas capital que pode perder.
- Teste em conta demo antes de usar com dinheiro real.
- Monitore o bot regularmente.
- Backtest antes de colocar em produção.

## 📄 Licença

MIT License - veja LICENSE para detalhes

## 👨‍💻 Autor

Snaipe2 - 2026
