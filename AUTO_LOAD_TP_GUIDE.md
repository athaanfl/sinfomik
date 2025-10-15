# 📚 Auto-Load TP dari Excel ATP - Implementation Guide

## 🎯 **Fitur Baru:**

Fitur ini memungkinkan guru untuk **otomatis mendapatkan kolom TP (Tujuan Pembelajaran)** dari file Excel ATP yang sudah di-upload, berdasarkan:
- **Mata Pelajaran** yang diajar
- **Fase** (A, B, atau C) berdasarkan tingkat kelas
- **Tingkat Kelas** (angka pertama dari nama kelas)

**Sebelumnya:** Guru harus klik "Tambah TP" manual satu per satu
**Sekarang:** TP auto-load dari Excel ATP berdasarkan kelas yang dipilih

---

## 🔧 **Perubahan yang Dilakukan:**

### 1. **Backend - New API Endpoint**

#### File: `backend/src/controllers/excelController.js`

**Fungsi Baru:** `getTpByMapelFaseKelas()`

```javascript
exports.getTpByMapelFaseKelas = async (req, res) => {
  // Mengambil TP dari Excel ATP berdasarkan:
  // - id_mapel: ID mata pelajaran
  // - fase: Fase (A/B/C)
  // - id_kelas: ID kelas (untuk ekstrak tingkat kelas)
  
  // Flow:
  // 1. Get nama_kelas from database
  // 2. Ekstrak tingkat kelas (angka pertama): "1 Gumujeng" → 1
  // 3. Baca file Excel ATP
  // 4. Filter TP yang sesuai dengan tingkat kelas
  // 5. Return list TP dengan urutan, deskripsi, semester, dan KKTP
}
```

**Response Format:**
```json
{
  "success": true,
  "mapel": "CITIZENSHIP",
  "fase": "A",
  "nama_kelas": "1 Gumujeng",
  "tingkat_kelas": 1,
  "total_tp": 6,
  "tp_list": [
    {
      "urutan_tp": 1,
      "tujuan_pembelajaran": "Peserta didik mengenal bendera negara.",
      "semester": 1,
      "kktp": "75",
      "kelas_excel": 1
    },
    {
      "urutan_tp": 2,
      "tujuan_pembelajaran": "Peserta didik mengenal lagu kebangsaan.",
      "semester": 1,
      "kktp": "75",
      "kelas_excel": 1
    }
    // ... more TP
  ]
}
```

#### File: `backend/src/routes/excelRoutes.js`

**Route Baru:**
```javascript
// GET /api/excel/tp/:id_mapel/:fase/:id_kelas
router.get('/tp/:id_mapel/:fase/:id_kelas', excelController.getTpByMapelFaseKelas);
```

**Contoh Request:**
```
GET http://localhost:5000/api/excel/tp/6/A/5
```
- `6` = id_mapel (CITIZENSHIP)
- `A` = fase
- `5` = id_kelas (1 Gumujeng)

---

### 2. **Frontend - API Function**

#### File: `frontend/src/api/guru.js`

**Function Baru:**
```javascript
export const getTpByMapelFaseKelas = async (id_mapel, fase, id_kelas) => {
  if (!id_mapel || !fase || !id_kelas) {
    throw new Error("ID Mapel, Fase, dan ID Kelas diperlukan untuk mengambil TP.");
  }
  return fetchData(`${API_BASE_URL}/api/excel/tp/${id_mapel}/${fase}/${id_kelas}`);
};
```

---

### 3. **Frontend - Input Nilai Component**

#### File: `frontend/src/features/guru/inputNilai.js`

**State Baru:**
```javascript
const [tpDescriptions, setTpDescriptions] = useState({}); // Deskripsi TP dari Excel
const [isLoadingTp, setIsLoadingTp] = useState(false); // Loading state
```

**Function Baru:** `loadTpFromAtp()`

```javascript
const loadTpFromAtp = async (mapelId, kelasId) => {
  // 1. Determine fase based on tingkat kelas
  //    Kelas 1-2 → Fase A
  //    Kelas 3-4 → Fase B
  //    Kelas 5-6 → Fase C
  
  // 2. Call API getTpByMapelFaseKelas()
  
  // 3. Auto-set TP columns berdasarkan response
  
  // 4. Set TP descriptions untuk tooltip
  
  // 5. Initialize KKM dari KKTP Excel
}
```

**UI Changes:**
```jsx
{/* Loading indicator */}
{isLoadingTp && <p className="message info">⏳ Memuat TP dari ATP...</p>}

{/* Show TP description */}
<div className="tp-item" title={tpDescriptions[tpNum] || 'Tidak ada deskripsi'}>
  <span>TP {tpNum}</span>
  {tpDescriptions[tpNum] && (
    <small className="tp-description">
      {tpDescriptions[tpNum].substring(0, 50)}...
    </small>
  )}
</div>
```

---

## 📋 **Cara Kerja (Flow):**

```
┌─────────────────────────────────────────────────────┐
│ 1. Guru login dan pilih kelas/mapel                │
│    Contoh: "1 Gumujeng - CITIZENSHIP"              │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 2. useEffect() triggered                            │
│    - fetchStudents()                                │
│    - loadExistingGrades()                           │
│    - loadTpFromAtp() ← NEW!                         │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 3. loadTpFromAtp() logic:                           │
│    - Ekstrak tingkat kelas: "1 Gumujeng" → 1       │
│    - Determine fase: tingkat 1 → Fase A            │
│    - Call API: /api/excel/tp/6/A/5                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 4. Backend getTpByMapelFaseKelas():                 │
│    - Query database: get "1 Gumujeng"              │
│    - Ekstrak tingkat: 1                             │
│    - Query CapaianPembelajaran: get file_path       │
│    - Read Excel: "ATP CITIZENSHIP Fase A"           │
│    - Filter rows where Kelas column = 1            │
│    - Return filtered TP list                        │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 5. Frontend receives response:                      │
│    {                                                │
│      "total_tp": 6,                                 │
│      "tp_list": [                                   │
│        { "urutan_tp": 1, "tujuan_pembelajaran": ... }│
│        { "urutan_tp": 2, "tujuan_pembelajaran": ... }│
│        ...                                          │
│      ]                                              │
│    }                                                │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 6. Auto-set TP columns:                             │
│    - setTpColumns([1, 2, 3, 4, 5, 6])              │
│    - setTpDescriptions({                            │
│        1: "Peserta didik mengenal bendera...",     │
│        2: "Peserta didik mengenal lagu...",        │
│        ...                                          │
│      })                                             │
│    - setKkm({ TP1: 75, TP2: 75, ... })             │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 7. UI Updated:                                      │
│    ┌───────────────────────────────────────────┐   │
│    │ Manajemen Kolom TP                        │   │
│    │ ✅ Berhasil memuat 6 TP dari ATP...       │   │
│    │                                           │   │
│    │ [TP 1] Peserta didik mengenal bendera... │   │
│    │ [TP 2] Peserta didik mengenal lagu...    │   │
│    │ [TP 3] Peserta didik mengenal simbol...  │   │
│    │ ...                                       │   │
│    └───────────────────────────────────────────┘   │
│                                                     │
│    Tabel Input Nilai:                               │
│    ┌───────────┬────┬────┬────┬─────┬───────┐     │
│    │ Nama      │ TP1│ TP2│ TP3│ UAS │ Final │     │
│    ├───────────┼────┼────┼────┼─────┼───────┤     │
│    │ Andi      │    │    │    │     │   -   │     │
│    │ Budi      │    │    │    │     │   -   │     │
│    └───────────┴────┴────┴────┴─────┴───────┘     │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 **Mapping Tingkat Kelas ke Fase:**

Logika di `loadTpFromAtp()`:

```javascript
// Ekstrak angka pertama dari nama_kelas
const tingkatKelas = parseInt(kelasName.match(/^(\d+)/)?.[1] || '1');

// Mapping fase
if (tingkatKelas >= 1 && tingkatKelas <= 2) fase = 'A';
else if (tingkatKelas >= 3 && tingkatKelas <= 4) fase = 'B';
else if (tingkatKelas >= 5 && tingkatKelas <= 6) fase = 'C';
```

**Contoh:**
- "1 Gumujeng" → Fase A
- "2 Someah" → Fase A
- "3 A" → Fase B
- "5 IPA" → Fase C

---

## 📝 **Struktur Excel ATP:**

File Excel harus memiliki struktur:

**Sheet Name:** `ATP [NamaMapel] Fase [A/B/C]`
- Contoh: `ATP CITIZENSHIP Fase A`

**Header Row (Row 5):**
```
| Elemen | CP | Tujuan Pembelajaran (TP) | KKTP | Materi Pokok | Kelas | Semester |
```

**Data Rows (Row 6+):**
```
| Pancasila | ... | Peserta didik mengenal bendera negara. | 75 | Bendera | 1 | 1 |
| ...       | ... | Peserta didik mengenal lagu kebangsaan. | 75 | Lagu    | 1 | 1 |
```

**Kolom Penting:**
- **Index 2:** Tujuan Pembelajaran (TP)
- **Index 5:** Kelas (angka: 1, 2, 3, dst)
- **Index 6:** Semester (1 atau 2)
- **Index 3:** KKTP (untuk KKM)

---

## 🧪 **Testing:**

### 1. **Test Backend Endpoint:**

```bash
# Method 1: Using curl (Git Bash/WSL)
curl http://localhost:5000/api/excel/tp/6/A/5

# Method 2: Using PowerShell
Invoke-WebRequest -Uri "http://localhost:5000/api/excel/tp/6/A/5"

# Method 3: Using test script
node test_tp_endpoint.js
```

**Expected Response:**
```json
{
  "success": true,
  "mapel": "CITIZENSHIP",
  "fase": "A",
  "nama_kelas": "1 Gumujeng",
  "tingkat_kelas": 1,
  "total_tp": 6,
  "tp_list": [ ... ]
}
```

### 2. **Test Frontend:**

1. Login sebagai guru
2. Pilih kelas "1 Gumujeng - CITIZENSHIP"
3. Perhatikan:
   - Loading indicator muncul: "⏳ Memuat TP dari ATP..."
   - Success message: "✅ Berhasil memuat 6 TP dari ATP..."
   - Kolom TP auto-populate (TP 1, TP 2, ..., TP 6)
   - Hover di TP item untuk lihat deskripsi

---

## ⚠️ **Fallback ke Manual Mode:**

Jika API gagal (error atau tidak ada TP):
- Tetap bisa tambah TP manual dengan klik "Tambah TP (Manual)"
- Existing grades akan di-load
- KKM default = 75

---

## 🎨 **UI Improvements:**

### Before:
```
Manajemen Kolom TP
[Tambah TP]

[TP 1] [×]
```

### After:
```
Manajemen Kolom TP
⏳ Memuat TP dari ATP...
✅ Berhasil memuat 6 TP dari ATP CITIZENSHIP Fase A untuk 1 Gumujeng

[Tambah TP (Manual)] [Atur KKM]

[TP 1] Peserta didik mengenal bendera negara...
[TP 2] Peserta didik mengenal lagu kebangsaan... [×]
[TP 3] Peserta didik mengenal simbol Pancasila... [×]
```

---

## 🚀 **Next Steps:**

### Optional Enhancements:

1. **Add Fase to Kelas Table:**
   ```sql
   ALTER TABLE Kelas ADD COLUMN fase TEXT;
   ```
   - Lebih flexible untuk mapping fase

2. **Show TP Description in Modal:**
   ```jsx
   <Tooltip content={tpDescriptions[tpNum]}>
     <th>TP {tpNum}</th>
   </Tooltip>
   ```

3. **Filter by Semester:**
   - Tambah parameter `semester` di API
   - Filter TP berdasarkan semester aktif

4. **Cache TP Data:**
   ```javascript
   const [tpCache, setTpCache] = useState({});
   // Avoid re-fetching same data
   ```

---

## 📚 **Files Modified:**

### Backend:
- ✅ `backend/src/controllers/excelController.js` (+160 lines)
- ✅ `backend/src/routes/excelRoutes.js` (+2 lines)

### Frontend:
- ✅ `frontend/src/api/guru.js` (+10 lines)
- ✅ `frontend/src/features/guru/inputNilai.js` (+80 lines)

### Testing:
- ✅ `backend/test_tp_endpoint.js` (new file)
- ✅ `backend/read_atp_detail.js` (analysis script)

---

## 🎯 **Summary:**

✅ **Auto-load TP** dari Excel ATP berdasarkan kelas
✅ **Filter TP** sesuai tingkat kelas (dari kolom "Kelas" di Excel)
✅ **Auto-set KKM** dari kolom KKTP
✅ **Show TP descriptions** dengan tooltip
✅ **Fallback** ke manual mode jika error
✅ **Success notification** untuk user feedback

**Result:** Guru tidak perlu manual klik "Tambah TP" satu per satu lagi! 🎉
