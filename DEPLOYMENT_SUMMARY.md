# Deployment Summary - Railway.app

## 📦 File Baru yang Dibuat:

1. **`.env.example`** - Template environment variables untuk backend
2. **`frontend/.env.example`** - Template environment variables untuk frontend  
3. **`frontend/.env.production.example`** - Config production frontend
4. **`Procfile`** - Railway start command
5. **`railway.json`** - Railway build configuration
6. **`RAILWAY_DEPLOYMENT_GUIDE.md`** - Panduan lengkap deployment
7. **`DEPLOYMENT_CHECKLIST.md`** - Quick start checklist

## 🔧 File yang Diubah:

### 1. **`backend/src/server.js`**
**Perubahan:**
- ✅ Import module `path` untuk serve static files
- ✅ Update CORS config untuk production (wildcard Railway domains)
- ✅ Tambah logic serve React build files di production mode
- ✅ Handle React routing dengan fallback ke index.html
- ✅ Pisahkan endpoint `/api` dan `/health` dari static serving

**Code snippet:**
```javascript
// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    const frontendBuildPath = path.join(__dirname, '../../frontend/build');
    app.use(express.static(frontendBuildPath));
    
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
    });
}
```

### 2. **`backend/package.json`**
**Perubahan:**
- ✅ Tambah script `"build"` untuk build frontend

**Script baru:**
```json
"build": "cd ../frontend && npm install && npm run build"
```

## 🌍 Environment Variables yang Diperlukan:

### Backend (Railway):
```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-generated-strong-secret-key-here
FRONTEND_URL=https://your-app-name.up.railway.app
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=500
```

### Frontend (Optional - Build Time):
```env
REACT_APP_API_BASE_URL=
GENERATE_SOURCEMAP=false
```

## 📝 Cara Deploy:

### 1. Generate JWT Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Push ke GitHub:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### 3. Deploy di Railway:
1. Buat project baru di [railway.app](https://railway.app)
2. Connect GitHub repository `sinfomik`
3. Set environment variables di Settings > Variables
4. Deploy otomatis akan berjalan
5. Dapatkan domain Railway (xxx.up.railway.app)
6. Update `FRONTEND_URL` dengan domain tersebut
7. Redeploy otomatis

### 4. Inisialisasi Database:
```bash
railway run bash
cd backend
node src/init_db.js
exit
```

### 5. Test:
Buka `https://your-app-name.up.railway.app`

## ✅ Arsitektur Deployment:

```
Railway Container (Ephemeral Storage)
├── Frontend (React Build) → Served by Express as static files
└── Backend (Express API)   → Serves frontend + API endpoints
    └── SQLite Database     → ⚠️ Demo only - resets on redeploy
```

**⚠️ PENTING - SQLite untuk Demo/Testing:**
- Railway menggunakan **ephemeral storage**
- Database SQLite akan **reset setiap redeploy**
- **OK untuk demo** dan testing deployment
- **Untuk production**, gunakan PostgreSQL, MongoDB, atau database cloud lainnya

**Keuntungan Arsitektur:**
- ✅ Single domain (no CORS issues)
- ✅ Single deployment (simpler)
- ✅ Lower cost (one service)
- ✅ Faster (no cross-domain requests)

## 🔒 Security:

- ✅ Helmet middleware aktif
- ✅ Rate limiting (500 req/15min global, 5 req/15min untuk login)
- ✅ CORS properly configured
- ✅ JWT authentication
- ✅ Environment-based configuration
- ✅ No sensitive data in git

## 💰 Cost:

- Railway free tier: **$5 credit/month**
- Estimated usage: **$5-10/month**
- Pay-as-you-go after free credit

## 📊 Monitoring:

Railway Dashboard provides:
- Real-time logs
- CPU/Memory metrics
- Network usage
- Deployment history
- Easy rollback

## 🆘 Troubleshooting:

| Issue | Solution |
|-------|----------|
| Build failed | Check logs, verify package.json, test local build |
| Database error | Run init_db.js via Railway CLI, check file permissions |
| Data hilang | Normal behavior - ephemeral storage resets on deploy |
| CORS error | Verify FRONTEND_URL matches Railway domain |
| 502 Gateway | Check PORT env var, test /health endpoint |

## 📱 PWA Features:

PWA tetap berfungsi setelah deployment:
- ✅ Offline access via service worker
- ✅ Install prompt on mobile
- ✅ App manifest for home screen
- ✅ Push notifications ready

## 🔄 Updates:

Auto-deploy on every push to main:
```bash
git add .
git commit -m "Update feature X"
git push origin main
```

## 📚 Dokumentasi:

- `RAILWAY_DEPLOYMENT_GUIDE.md` - Panduan lengkap
- `DEPLOYMENT_CHECKLIST.md` - Quick start
- `.env.example` - Environment variables template

---

**Status: ✅ READY TO DEPLOY**

Semua file sudah disiapkan. Tinggal follow langkah di `DEPLOYMENT_CHECKLIST.md`!
