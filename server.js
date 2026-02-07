require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // serve frontend.html

const sessions = new Map(); // numberId → { sock, status }
const ADMIN = { username: process.env.ADMIN_USERNAME, password: process.env.ADMIN_PASSWORD };

// Login admin sederhana
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN.username && password === ADMIN.password) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, message: 'Login berhasil' });
  }
  res.status(401).json({ error: 'Username atau password salah' });
});

// Middleware cek admin
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token dibutuhkan' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') throw new Error();
    next();
  } catch {
    res.status(403).json({ error: 'Akses hanya untuk admin' });
  }
};

// List semua sesi
app.get('/api/sessions', requireAdmin, (req, res) => {
  const list = [...sessions.entries()].map(([id, data]) => ({
    id,
    status: data.status || 'unknown'
  }));
  res.json(list);
});

// Tambah & connect nomor baru
app.post('/api/connect', requireAdmin, async (req, res) => {
  const { numberId } = req.body;
  if (!numberId || !numberId.startsWith('62') || numberId.length < 10) {
    return res.status(400).json({ error: 'Nomor tidak valid (contoh: 6281234567890)' });
  }
  if (sessions.has(numberId)) {
    return res.json({ message: 'Nomor sudah ada' });
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(`auth-${numberId}`);
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
        io.emit('status', { numberId, status: 'connected' });
      }

      if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason !== DisconnectReason.loggedOut) {
          // auto reconnect bisa ditambah di sini nanti
        } else {
          sessions.delete(numberId);
        }
        io.emit('status', { numberId, status: 'disconnected' });
      }
    });

    sessions.set(numberId, { sock, status: 'connecting' });
    res.json({ message: 'Memulai koneksi...', numberId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kirim pesan (demo sederhana)
app.post('/api/send', requireAdmin, async (req, res) => {
  const { numberId, to, text } = req.body;
  const session = sessions.get(numberId);
  if (!session || !session.sock) return res.status(400).json({ error: 'Sesi tidak ditemukan atau belum connect' });

  try {
    await session.sock.sendMessage(`${to}@s.whatsapp.net`, { text });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve halaman utama
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/frontend.html');
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server jalan di http://localhost:${PORT}`);
  console.log('Buka browser → http://localhost:4000');
});
