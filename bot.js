const mineflayer = require('mineflayer');

const CONFIG = {
  host: 'ToxaKraftXXX.aternos.me',
  port: 49471,
  username: 'Burmalda229',
  version: '1.21.11',
  auth: 'offline'
};

const PASSWORD = 'mypaspas';
let isAuthenticated = false;
let lastHumanAction = Date.now();

const bot = mineflayer.createBot(CONFIG);

function generateGibberish() {
  const letters = 'аьбвггдеёжзийклмнопрстуфхцчшщъыьэюяцпљу';
  const words = [];
  const wordCount = Math.random() > 0.5 ? 2 : 3;
  
  for (let w = 0; w < wordCount; w++) {
    const len = Math.floor(Math.random() * 4) + 3;
    let word = '';
    for (let i = 0; i < len; i++) {
      word += letters[Math.floor(Math.random() * letters.length)];
    }
    words.push(word);
  }
  return words.join(' ');
}

function randDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function doRandomMovement() {
  if (!bot.entity || !isAuthenticated) return;
  
  bot.look(
    Math.random() * Math.PI * 2,
    (Math.random() - 0.5) * Math.PI / 2,
    true
  );
  
  const controls = ['forward', 'back', 'left', 'right', 'jump'];
  const selected = controls.filter(() => Math.random() > 0.5);
  if (selected.length === 0) selected.push('forward');
  
  selected.forEach(ctrl => bot.setControlState(ctrl, true));
  
  setTimeout(() => {
    selected.forEach(ctrl => bot.setControlState(ctrl, false));
  }, randDelay(1000, 3000));
}

function scheduleRandomChat() {
  const delayMs = randDelay(30 * 60 * 1000, 32 * 60 * 1000);
  setTimeout(() => {
    if (bot.chat && isAuthenticated) {
      const phrase = generateGibberish();
      bot.chat(phrase);
      console.log(`[Чат] Отправлено: "${phrase}"`);
      lastHumanAction = Date.now();
    }
    scheduleRandomChat();
  }, delayMs);
}

function startRandomActions() {
  setInterval(() => {
    if (!bot.entity || !isAuthenticated) return;
    
    if (Math.random() > 0.3) {
      doRandomMovement();
      lastHumanAction = Date.now();
    }
    
    if (Math.random() > 0.8) {
      bot.look(
        Math.random() * Math.PI * 2,
        (Math.random() - 0.5) * Math.PI / 3,
        true
      );
    }
  }, randDelay(8000, 25000));
}

bot.on('message', (msg) => {
  const text = msg.toString();
  console.log(`[Чат] ${text}`);
  
  if (text.includes('/register') || text.includes('Зарегистрируйтесь') || text.includes('Identify yourself')) {
    if (!isAuthenticated) {
      setTimeout(() => {
        console.log('🔑 Отправка /register...');
        bot.chat(`/register ${PASSWORD} ${PASSWORD}`);
      }, randDelay(1500, 4000));
    }
  }
  
  if (text.includes('/login') || text.includes('Войдите') || text.includes('Password:')) {
    if (!isAuthenticated) {
      setTimeout(() => {
        console.log('🔑 Отправка /login...');
        bot.chat(`/login ${PASSWORD}`);
      }, randDelay(2000, 5000));
    }
  }
  
  if (text.includes('Успешная регистрация') || 
      text.includes('Вы успешно вошли') || 
      text.includes('Success') ||
      text.includes('Добро пожаловать') ||
      text.includes('Welcome')) {
    if (!isAuthenticated) {
      console.log('✅ Авторизация успешна!');
      isAuthenticated = true;
      lastHumanAction = Date.now();
      
      scheduleRandomChat();
      startRandomActions();
    }
  }
  
  if (text.includes('уже зарегистрирован') || text.includes('already registered')) {
    setTimeout(() => {
      console.log('🔑 Пробуем только /login...');
      bot.chat(`/login ${PASSWORD}`);
    }, randDelay(1500, 3000));
  }
});

bot.once('spawn', () => {
  console.log('✅ Бот заспавнился, жду запрос авторизации...');
});

bot.on('health', () => {
  if (bot.health <= 0 && isAuthenticated) {
    console.log('💀 Бот умер, жду возрождения...');
    setTimeout(() => {
      bot.respawn();
      console.log('🔄 Возрождён');
      lastHumanAction = Date.now();
    }, randDelay(3000, 5000));
  }
});

bot.on('kicked', (reason) => {
  console.log('❌ Кикнут:', reason);
  process.exit(1);
});

bot.on('end', (reason) => {
  console.log('🔌 Отключён:', reason);
});

bot.on('error', (err) => {
  console.error('⚠️ Ошибка:', err.message);
});

console.log(`🤖 Запуск бота ${CONFIG.username} на ${CONFIG.host}:${CONFIG.port} (v${CONFIG.version}) с AuthMe...`);
