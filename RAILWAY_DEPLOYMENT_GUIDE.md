# 🚂 Railway Deployment Guide - Sinfomik

## 📌 Overview
Panduan lengkap untuk deploy aplikasi Sinfomik (sistem manajemen akademik) ke Railway.app.

## 🏗️ Arsitektur
- **Backend**: Express.js (Node.js) dengan SQLite
- **Frontend**: React (akan di-build dan di-serve dari backend)
- **Database**: SQLite (file-based, tersimpan di volume Railway)

## 📝 Langkah-langkah Deployment

### 1️⃣ Persiapan Repository
```bash
# Pastikan semua perubahan sudah di-commit
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 2️⃣ Setup Railway Project

1. **Buat akun Railway**: Kunjungi [railway.app](https://railway.app) dan sign up dengan GitHub
2. **New Project**: Klik "New Project" > "Deploy from GitHub repo"
3. **Pilih Repository**: Pilih repository `sinfomik`
4. **Configure**: Railway akan otomatis detect Node.js project

### 3️⃣ Environment Variables

Masuk ke project Settings > Variables, tambahkan:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=buat-secret-key-yang-kuat-minimal-32-karakter-random
FRONTEND_URL=https://your-app-name.up.railway.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

**⚠️ PENTING**: 
- Ganti `JWT_SECRET` dengan string random yang kuat
- `FRONTEND_URL` akan otomatis sesuai domain Railway Anda
- Bisa generate JWT_SECRET dengan: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### 4️⃣ Setup Volume (Untuk Database SQLite)

Railway perlu volume persistent untuk SQLite:

1. Di dashboard project > klik service Anda
2. Pilih tab "Settings"
3. Scroll ke "Volumes"
4. Klik "Add Volume"
5. Mount Path: `/app/backend` (lokasi database)

### 5️⃣ Deploy

Railway akan otomatis deploy setelah push ke GitHub. Monitor di tab "Deployments".

### 6️⃣ Post-Deployment

1. **Get Domain**: Railway memberikan domain otomatis `xxx.up.railway.app`
2. **Update FRONTEND_URL**: Di environment variables, set `FRONTEND_URL` ke domain Railway Anda
3. **Redeploy**: Railway akan otomatis redeploy
4. **Test**: Buka domain Railway Anda dan test login

## 🔧 Custom Domain (Optional)

1. Di Settings > Domains
2. Klik "Add Domain"
3. Masukkan custom domain Anda
4. Update DNS records sesuai instruksi Railway

## 🗄️ Database Management

### Inisialisasi Database (First Deploy)
SSH ke container Railway:
```bash
# Di Railway dashboard > klik service > Connect via CLI
railway run bash
cd backend
node src/init_db.js
```

### Backup Database
Download database file dari Railway:
```bash
railway run cat backend/academic_dashboard.db > backup.db
```

## 🐛 Troubleshooting

### Build Failed
- Cek logs di Railway dashboard
- Pastikan `package.json` di backend & frontend sudah benar
- Verify Node version compatibility

### Database Error
- Pastikan volume sudah di-mount
- Cek permissions di `/app/backend`
- Verify SQLite file exists

### CORS Error
- Pastikan `FRONTEND_URL` environment variable sudah benar
- Cek backend CORS config di `server.js`

### 502 Bad Gateway
- Pastikan backend listen di PORT dari environment variable
- Cek health endpoint: `https://your-app.railway.app/health`

## 📊 Monitoring

Railway menyediakan:
- **Logs**: Real-time logs dari aplikasi
- **Metrics**: CPU, Memory, Network usage
- **Deployments**: History dan rollback

## 💰 Pricing

Railway memberikan:
- **$5 credit gratis/bulan** untuk hobby plan
- Bayar sesuai usage setelahnya
- Estimasi: ~$5-10/bulan untuk app sederhana

## 🔒 Security Checklist

- ✅ JWT_SECRET adalah random dan kuat
- ✅ NODE_ENV=production
- ✅ Rate limiting aktif
- ✅ Helmet middleware aktif
- ✅ CORS configured properly
- ✅ No sensitive data di git

## 🔄 Update Aplikasi

Setiap push ke GitHub akan trigger auto-deploy:
```bash
git add .
git commit -m "Update feature XYZ"
git push origin main
```

## 📱 PWA Features

PWA akan tetap berfungsi setelah deploy:
- Service Worker untuk offline access
- Install prompt di mobile
- Push notifications (jika diaktifkan)

## 🆘 Support

Jika ada masalah:
1. Cek Railway logs
2. Test local dulu: `npm run dev`
3. Review environment variables
4. Railway Discord community: [discord.gg/railway](https://discord.gg/railway)

---

**Happy Deploying! 🚀**
