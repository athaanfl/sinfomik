# 🎓 Sinfomik - Sistem Informasi Manajemen Akademik

Sistem manajemen akademik berbasis web untuk sekolah dengan fitur lengkap untuk admin, guru, dan siswa.

## 🚀 Deployment Status

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template)

**Deployment Platform:** Railway.app  
**Status:** ✅ Ready to Deploy  
**Architecture:** Monolithic (Frontend + Backend in one service)

## ✨ Fitur Utama

### 👨‍💼 Admin
- Management siswa, guru, kelas, mata pelajaran
- Management tahun ajaran dan semester
- Promosi kelas otomatis
- Enroll siswa & guru ke kelas
- Analytics & dashboard lengkap
- Export/Import data via Excel
- Management KKM

### 👨‍🏫 Guru
- Input nilai siswa (per CP atau per mapel)
- Rekap nilai kelas
- Export nilai ke Excel/PDF
- Template Excel untuk import nilai
- Dashboard wali kelas
- Analytics pembelajaran

### 👨‍🎓 Siswa
- Lihat nilai per mata pelajaran
- Dashboard raport
- Tracking capaian pembelajaran (CP)
- View KKM per mapel

## 🛠️ Tech Stack

### Backend
- **Framework:** Express.js (Node.js)
- **Database:** SQLite (file-based)
- **Authentication:** JWT (JSON Web Tokens)
- **Security:** Helmet, CORS, Rate Limiting
- **Excel Processing:** ExcelJS, XLSX
- **PDF Export:** jsPDF, jsPDF-AutoTable

### Frontend
- **Framework:** React 18
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **PWA:** Workbox (Progressive Web App)
- **HTTP Client:** Axios
- **Routing:** React Router DOM

## 📦 Quick Start - Local Development

### Prerequisites
- Node.js 16+ 
- npm atau yarn

### Installation

1. **Clone repository:**
   ```bash
   git clone https://github.com/athaanfl/sinfomik.git
   cd sinfomik
   ```

2. **Setup Backend:**
   ```bash
   cd backend
   npm install
   cp ../.env.example .env
   # Edit .env sesuai kebutuhan
   node src/init_db.js  # Initialize database
   npm run dev
   ```

3. **Setup Frontend (terminal baru):**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm start
   ```

4. **Access:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

**Guru:**
- Username: `guru1` (atau nama guru lain)
- Password: `guru123`

**Siswa:**
- Username: `siswa1` (atau NISN siswa)
- Password: `siswa123`

## 🚂 Deploy to Railway

### Quick Deploy (Recommended)

1. **Push ke GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Railway deployment"
   git push origin main
   ```

2. **Railway Setup:**
   - Kunjungi [railway.app](https://railway.app)
   - Login dengan GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Pilih repository `sinfomik`

3. **Environment Variables:**
   
   Masuk ke Settings → Variables, tambahkan:
   ```env
   NODE_ENV=production
   PORT=5000
   JWT_SECRET=<generate-random-32-chars>
   FRONTEND_URL=https://your-app.railway.app
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=500
   ```
   
   Generate JWT_SECRET:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Add Volume (For SQLite):**
   - Settings → Volumes → Add Volume
   - Mount Path: `/app/backend`
   - Size: 1GB

5. **Deploy & Initialize:**
   ```bash
   # Connect via Railway CLI
   railway run bash
   cd backend
   node src/init_db.js
   exit
   ```

6. **Done!** Access your app at `https://your-app.railway.app`

### Detailed Documentation

- 📖 [Railway Deployment Guide](RAILWAY_DEPLOYMENT_GUIDE.md)
- ✅ [Deployment Checklist](DEPLOYMENT_CHECKLIST.md)
- 📊 [Deployment Summary](DEPLOYMENT_SUMMARY.md)

## 📁 Project Structure

```
sinfomik/
├── backend/
│   ├── src/
│   │   ├── server.js              # Main entry point
│   │   ├── config/db.js           # Database configuration
│   │   ├── controllers/           # Route controllers
│   │   ├── middlewares/           # Auth & file upload
│   │   ├── routes/                # API routes
│   │   └── scripts/               # Utility scripts
│   ├── academic_dashboard.db      # SQLite database
│   └── package.json
│
├── frontend/
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── api/                   # API client functions
│   │   ├── components/            # Reusable components
│   │   ├── context/               # React Context (Auth)
│   │   ├── features/              # Feature modules
│   │   ├── pages/                 # Page components
│   │   ├── App.js                 # Main app component
│   │   └── service-worker.js     # PWA service worker
│   └── package.json
│
├── .env.example                   # Environment template
├── railway.json                   # Railway config
├── Procfile                       # Start command
└── README.md                      # This file
```

## 🔒 Security Features

- ✅ JWT-based authentication
- ✅ Password hashing with bcrypt
- ✅ Helmet.js for HTTP headers security
- ✅ CORS configuration
- ✅ Rate limiting (anti brute-force)
- ✅ SQL injection protection
- ✅ XSS protection
- ✅ Input validation & sanitization

## 📊 Database Schema

SQLite database dengan tabel utama:
- `users` - User accounts (admin, guru, siswa)
- `siswa` - Student details
- `guru` - Teacher details
- `kelas` - Classes
- `mata_pelajaran` - Subjects
- `ta_semester` - Academic years & semesters
- `capaian_pembelajaran` - Learning outcomes
- `nilai` - Grades/scores
- `kkm` - Minimum passing criteria

## 📱 PWA Features

- ✅ Offline access dengan service worker
- ✅ Install prompt untuk mobile devices
- ✅ App manifest untuk home screen
- ✅ Responsive design (mobile-first)
- ✅ Fast loading dengan caching strategy

## 📈 Analytics

Dashboard analytics untuk:
- Statistik siswa & guru
- Distribusi nilai per kelas
- Trend prestasi per semester
- Capaian pembelajaran per mata pelajaran
- KKM achievement rate

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Athaan FL**  
GitHub: [@athaanfl](https://github.com/athaanfl)

## 🆘 Support

- 📧 Email: [your-email@example.com]
- 💬 Issues: [GitHub Issues](https://github.com/athaanfl/sinfomik/issues)
- 📖 Docs: See `/docs` folder

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

## 🎯 Roadmap

- [ ] Multi-language support (EN/ID)
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Advanced analytics with ML
- [ ] Parent portal
- [ ] Online attendance system
- [ ] Assignment submission system
- [ ] Video conference integration

---

**Made with ❤️ for better education management**
