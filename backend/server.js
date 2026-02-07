require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static('../frontend')); // serve frontend dari folder atas

const sessions = new Map(); // numberId → { sock, status }

const ADMIN = { user: process.env.ADMIN_USER || 'admin', pass: process.env.ADMIN_PASS || 'adminpro2026' };

// Login admin
app.post('/api/login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN.user && pass === ADMIN.pass) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Login salah' });
  }
});

// Middleware admin
const authAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token dibutuhkan' });
  try {
    jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Forbidden' });
  }
};

app.get('/api/sessions', authAdmin, (req, res) => {
  const list = Array.from(sessions.keys()).map(id => ({
    id,
    status: sessions.get(id)?.status || 'unknown'
  }));
  res.json(list);
});

app.post('/api/connect', authAdmin, async (req, res) => {
  let { numberId } = req.body;
  numberId = numberId.replace(/[^0-9]/g, '');
  if (!numberId.startsWith('62') || numberId.length < 10) {
    return res.status(400).json({ error: 'Nomor WA harus dimulai 62' });
  }

  if (sessions.has(numberId)) return res.json({ message: 'Sudah terhubung' });

  try {
    const { state, saveCreds } = await useMultiFileAuthState(`auth_${numberId}`);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, qr, lastDisconnect } = update;

      if (qr) {
        io.emit('qr', { numberId, qr });
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'open') {
        sessions.set(numberId, { sock, status: 'connected' });
        io.emit('status-update', { numberId, status: 'connected' });
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
          // reconnect auto nanti bisa ditambah
        } else {
          sessions.delete(numberId);
        }
        io.emit('status-update', { numberId, status: 'disconnected' });
      }
    });

    sessions.set(numberId, { sock, status: 'connecting' });
    res.json({ success: true, message: 'Sedang menghubungkan...' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server aktif di http://localhost:${PORT}`);
  console.log('Buka http://localhost:4000 untuk dashboard');
});
