# WA Sewa Nomor - Multi Device WhatsApp Rental Platform

Website sederhana untuk sewa nomor WhatsApp menggunakan multi-device (unofficial).

**Peringatan penting**:
- Ini **bukan** WhatsApp resmi → risiko ban tinggi jika dipakai spam/massal.
- Untuk testing/personal use saja.
- Jangan gunakan nomor penting.

## Fitur
- Multi-session (banyak nomor WA di 1 server)
- Admin panel: tambah nomor, monitor status, pakai semua nomor
- User dashboard: chat via web setelah "sewa" (simulasi)
- QR code pairing via socket.io real-time
- Tailwind CSS modern UI

## Tech Stack
- Backend: Node.js, Express, Socket.io, @whiskeysockets/baileys
- Frontend: React, Tailwind CSS
- Database: (belum) – nanti bisa tambah MongoDB untuk user & pembayaran

## Cara Install & Run

### Backend
```bash
cd backend
npm install
cp .env.example .env
# edit .env (JWT_SECRET, PORT, dll)
node index.js
