const mineflayer = require('mineflayer');
const http = require('http');

const CONFIG = {
  host: 'ToxaKraftXXX.aternos.me',
  port: 49471,
  username: 'Burmalda229',
  version: '1.21.11',
  auth: 'offline'
};
const PASSWORD = 'mypaspas';
let isAuthenticated = false;
let lastAction = Date.now();
let reconnectAttempts = 0;

function createBotInstance() {
  const bot = mineflayer.createBot(CONFIG);

  function generateGibberish() {
    const letters = 'аьбвггдеёжзийклмнопрстуфхцчшщъыьэюяцпљу';
    const words = [];
    const wordCount = Math.random() > 0.5 ? 2 : 3;
    for (let w = 0; w < wordCount; w++) {
      const len = Math.floor(Math.random() * 4) + 3;
      let word = '';
      for (let i = 0; i < len; i++) word += letters[Math.floor(Math.random() * letters.length)];
      words.push(word);
    }
    return words.join(' ');
  }

  function randDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function doRandomMovement() {
    if (!bot.entity || !isAuthenticated) return;
    bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI / 2, true);
    const controls = ['forward', 'back', 'left', 'right', 'jump'];
    const selected = controls.filter(() => Math.random() > 0.5);
    if (selected.length === 0) selected.push('forward');
    selected.forEach(ctrl => bot.setControlState(ctrl, true));
    setTimeout(() => selected.forEach(ctrl => bot.setControlState(ctrl, false)), randDelay(1000, 3000));
  }

  function scheduleRandomChat() {
    const delayMs = randDelay(30 * 60 * 1000, 32 * 60 * 1000);
    setTimeout(() => {
      if (bot.chat && isAuthenticated) {
        bot.chat(generateGibberish());
        lastAction = Date.now();
      }
      scheduleRandomChat();
    }, delayMs);
  }

  function startRandomActions() {
    setInterval(() => {
      if (!bot.entity || !isAuthenticated) return;
      if (Math.random() > 0.3) { doRandomMovement(); lastAction = Date.now(); }
      if (Math.random() > 0.8) bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * Math.PI / 3, true);
    }, randDelay(8000, 25000));
  }

  bot.on('message', (msg) => {
    const text = msg.toString();
    if (!isAuthenticated) {
      if (text.includes('/register') || text.includes('Зарегистрируйтесь') || text.includes('Identify yourself')) {
        setTimeout(() => bot.chat(`/register ${PASSWORD} ${PASSWORD}`), randDelay(1500, 4000));
      }
      if (text.includes('/login') || text.includes('Войдите') || text.includes('Password:')) {
        setTimeout(() => bot.chat(`/login ${PASSWORD}`), randDelay(2000, 5000));
      }
      if (text.includes('уже зарегистрирован') || text.includes('already registered')) {
        setTimeout(() => bot.chat(`/login ${PASSWORD}`), randDelay(1500, 3000));
      }
      if (text.includes('Успешная регистрация') || text.includes('Вы успешно вошли') || text.includes('Success') || text.includes('Добро пожаловать') || text.includes('Welcome')) {
        console.log('✅ Авторизация успешна!');
        isAuthenticated = true;
        lastAction = Date.now();
        scheduleRandomChat();
        startRandomActions();
      }
    }
  });

  bot.once('spawn', () => {
    console.log('✅ Бот заспавнился');
    reconnectAttempts = 0;
  });

  bot.on('health', () => {
    if (bot.health <= 0 && isAuthenticated) {
      setTimeout(() => { bot.respawn(); lastAction = Date.now(); }, randDelay(3000, 5000));
    }
  });

  bot.on('kicked', (reason) => {
    console.log('❌ Кик:', reason);
    attemptReconnect();
  });

  bot.on('end', (reason) => {
    console.log('🔌 Отключён:', reason);
    attemptReconnect();
  });

  bot.on('error', (err) => {
    console.error('⚠️ Ошибка:', err.message);
    attemptReconnect();
  });

  return bot;
}

function attemptReconnect() {
  const delay = Math.min(60000, 5000 + reconnectAttempts * 2000);
  reconnectAttempts++;
  console.log(`🔄 Переподключение через ${delay/1000} сек (попытка ${reconnectAttempts})...`);
  setTimeout(() => {
    console.log('🔄 Переподключение...');
    global.bot = createBotInstance();
  }, delay);
}

const PORT = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    console.log('📡 Health check received');
  } else if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Bot running. Auth: ${isAuthenticated}. Reconnects: ${reconnectAttempts}`);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Health server listening on 0.0.0.0:${PORT}`);
});

console.log(`🤖 Запуск бота ${CONFIG.username} на ${CONFIG.host}:${CONFIG.port} (v${CONFIG.version})...`);
global.bot = createBotInstance();
