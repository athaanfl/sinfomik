# 🚀 Quick Start - Railway Deployment

## ✅ Checklist Persiapan

### 1. File Konfigurasi (Sudah Dibuat)
- ✅ `.env.example` - Template environment variables
- ✅ `Procfile` - Railway start command
- ✅ `railway.json` - Railway build config
- ✅ `RAILWAY_DEPLOYMENT_GUIDE.md` - Panduan lengkap

### 2. Kode Yang Berubah

#### Backend (`backend/src/server.js`)
**Perubahan:**
- ✅ Menambahkan `path` module untuk serve static files
- ✅ Menambahkan logic untuk serve React build di production
- ✅ Handle React routing (SPA) dengan fallback ke index.html
- ✅ Memisahkan endpoint `/api` untuk API info

**Script baru di `backend/package.json`:**
```json
"build": "cd ../frontend && npm install && npm run build"
```

#### Frontend
**Perubahan:**
- ✅ Sudah menggunakan `REACT_APP_API_BASE_URL` di semua file API
- ✅ Fallback ke `http://localhost:5000` untuk development

**Environment Variables untuk Production:**
```env
# Di Railway, set ini ke kosong atau domain yang sama
REACT_APP_API_BASE_URL=
```

**Note:** Karena backend akan serve frontend dari domain yang sama, tidak perlu URL terpisah.

### 3. Environment Variables untuk Railway

#### Backend Variables (WAJIB):
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=generate-secret-kuat-minimal-32-karakter
FRONTEND_URL=https://your-app-name.up.railway.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### Frontend Variables (Optional):
```env
# Kosongkan atau hapus karena akan served dari backend
REACT_APP_API_BASE_URL=
```

### 4. Cara Deploy ke Railway

#### Step-by-step:

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Buat Project di Railway:**
   - Kunjungi [railway.app](https://railway.app)
   - Klik "New Project" > "Deploy from GitHub repo"
   - Pilih repository `sinfomik`

3. **Set Environment Variables:**
   - Masuk ke Settings > Variables
   - Tambahkan semua variables di atas
   - **PENTING:** Ganti `JWT_SECRET` dengan nilai unik!

4. **Deploy:**
   - Railway akan otomatis build & deploy
   - Tunggu hingga status "Success"
   - Dapatkan domain: `xxx.up.railway.app`

5. **Update FRONTEND_URL:**
   - Kembali ke Settings > Variables
   - Update `FRONTEND_URL` dengan domain Railway Anda
   - Railway akan otomatis redeploy

6. **Inisialisasi Database (First Time):**
   ```bash
   # Di Railway dashboard > Connect via CLI
   railway run bash
   cd backend
   node src/init_db.js
   exit
   ```

7. **Test:**
   - Buka `https://your-app-name.up.railway.app`
   - Login dengan default credentials
   - Cek semua fitur berfungsi

⚠️ **CATATAN PENTING - SQLite di Railway**:
Railway menggunakan **ephemeral storage**. Setiap redeploy akan **reset database**. Untuk production:
- Gunakan PostgreSQL (Railway provide plugin gratis)
- Atau migrate ke database cloud
- Backup database regular jika tetap pakai SQLite

### 5. Database Backup

**Download database dari Railway:**
```bash
railway run cat backend/academic_dashboard.db > backup-$(date +%Y%m%d).db
```

### 6. Update Aplikasi

Setiap push ke GitHub akan auto-deploy:
```bash
git add .
git commit -m "Update feature X"
git push origin main
```

### 7. Monitoring

Railway dashboard menyediakan:
- **Logs:** Real-time application logs
- **Metrics:** CPU, Memory, Network usage
- **Deployments:** History & rollback

### 8. Troubleshooting

#### Build Failed:
```bash
# Cek logs di Railway dashboard
# Test local build:
cd frontend && npm run build
```

#### Database Error:
```bash
# SSH ke Railway:
railway run bash
cd backend
ls -la academic_dashboard.db
# Pastikan file exists dan readable
```

#### CORS Error:
```bash
# Pastikan FRONTEND_URL di Railway variables sudah benar
# Cek di Railway logs apakah CORS config terbaca
```

#### 502 Bad Gateway:
```bash
# Cek apakah server listen di PORT dari env variable
# Test health endpoint: https://your-app.railway.app/health
```

### 9. Security Checklist

- ✅ JWT_SECRET adalah random dan strong
- ✅ NODE_ENV=production
- ✅ Rate limiting aktif (500 req/15min)
- ✅ Helmet middleware enabled
- ✅ CORS configured properly
- ✅ No `.env` files di git
- ✅ SQLite database di persistent volume

### 10. Cost Estimation

Railway Pricing:
- **$5 credit gratis/bulan** (hobby plan)
- Pay-as-you-go setelahnya
- Estimasi: **$5-10/bulan** untuk app ini

### 11. PWA Features

PWA akan tetap berfungsi:
- ✅ Service Worker untuk offline access
- ✅ Install prompt di mobile devices
- ✅ App manifest untuk home screen

---

## 📞 Support

- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Railway Discord: [discord.gg/railway](https://discord.gg/railway)
- Panduan lengkap: Lihat `RAILWAY_DEPLOYMENT_GUIDE.md`

---

**Ready to deploy! 🚀**
