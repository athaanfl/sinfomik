# 📅 Filter Semester untuk Auto-Load TP - Update Guide

## 🎯 **Fitur Baru: Filter TP Berdasarkan Semester**

TP yang di-load sekarang **otomatis filter berdasarkan semester aktif**:
- **Semester Ganjil** → Load TP dengan kolom Semester = 1
- **Semester Genap** → Load TP dengan kolom Semester = 2

---

## 🔧 **Perubahan yang Dilakukan:**

### 1. **Backend - API Endpoint Update**

#### File: `backend/src/controllers/excelController.js`

**Function:** `getTpByMapelFaseKelas()`

**Changes:**
1. ✅ Tambah **query parameter `semester`**
2. ✅ Query database untuk **get semester dari TahunAjaranSemester**
3. ✅ Auto-detect semester: "Ganjil" → 1, "Genap" → 2
4. ✅ Filter Excel rows berdasarkan kolom "Semester"

**New Response Format:**
```json
{
  "success": true,
  "mapel": "CITIZENSHIP",
  "fase": "A",
  "nama_kelas": "1 Gumujeng",
  "tingkat_kelas": 1,
  "semester_filter": 1,
  "semester_text": "Ganjil",
  "total_tp": 3,
  "tp_list": [
    {
      "urutan_tp": 1,
      "tujuan_pembelajaran": "Peserta didik mengenal bendera negara.",
      "semester": 1,
      "kktp": "75",
      "kelas_excel": 1
    }
  ]
}
```

**API Call Examples:**
```bash
# Auto-detect semester from database
GET /api/excel/tp/6/A/5

# Force semester Ganjil
GET /api/excel/tp/6/A/5?semester=1

# Force semester Genap
GET /api/excel/tp/6/A/5?semester=2
```

---

### 2. **Frontend - API Function Update**

#### File: `frontend/src/api/guru.js`

**Function:** `getTpByMapelFaseKelas()`

**Changes:**
```javascript
// BEFORE:
export const getTpByMapelFaseKelas = async (id_mapel, fase, id_kelas) => {
  return fetchData(`${API_BASE_URL}/api/excel/tp/${id_mapel}/${fase}/${id_kelas}`);
};

// AFTER:
export const getTpByMapelFaseKelas = async (id_mapel, fase, id_kelas, semester = null) => {
  let url = `${API_BASE_URL}/api/excel/tp/${id_mapel}/${fase}/${id_kelas}`;
  if (semester) {
    url += `?semester=${semester}`;
  }
  return fetchData(url);
};
```

---

### 3. **Frontend - Input Nilai Component Update**

#### File: `frontend/src/features/guru/inputNilai.js`

**Function:** `loadTpFromAtp()`

**Changes:**

1. ✅ **Detect semester dari `activeTASemester`**:
```javascript
let semesterNumber = null;
if (activeTASemester && activeTASemester.semester) {
  semesterNumber = activeTASemester.semester.toLowerCase() === 'ganjil' ? 1 : 2;
}
```

2. ✅ **Pass semester parameter ke API**:
```javascript
const tpData = await guruApi.getTpByMapelFaseKelas(
  mapelId, 
  fase, 
  kelasId, 
  semesterNumber  // ← NEW!
);
```

3. ✅ **Update success message**:
```javascript
setMessage(`✅ Berhasil memuat ${tpData.total_tp} TP dari ATP ${tpData.mapel} Fase ${fase} - Semester ${semesterText} untuk ${tpData.nama_kelas}`);
```

4. ✅ **Handle empty result**:
```javascript
if (tpData.tp_list.length === 0) {
  setMessage('ℹ️ Tidak ada TP untuk semester ini. Silakan tambah TP manual.');
}
```

---

## 📊 **Cara Kerja Filter Semester:**

```
┌─────────────────────────────────────────────────────┐
│ 1. Guru login dan pilih kelas/mapel                │
│    Kelas: "1 Gumujeng - CITIZENSHIP"               │
│    Semester Aktif: Ganjil (dari TahunAjaranSemester)│
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 2. Frontend detect semester:                        │
│    activeTASemester.semester = "Ganjil"            │
│    semesterNumber = 1                               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 3. API Call dengan semester parameter:              │
│    GET /api/excel/tp/6/A/5?semester=1               │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 4. Backend baca Excel ATP CITIZENSHIP Fase A:       │
│    Filter rows WHERE:                               │
│    - Kelas = 1 (dari "1 Gumujeng")                 │
│    - Semester = 1 (Ganjil)                          │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 5. Return TP yang match:                            │
│    Total: 3 TP (hanya semester Ganjil)              │
│    - TP 1: Peserta didik mengenal bendera...       │
│    - TP 2: Peserta didik mengenal lagu...          │
│    - TP 3: Peserta didik mengenal simbol...        │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│ 6. Frontend auto-populate 3 kolom TP                │
│    Success message:                                 │
│    "✅ Berhasil memuat 3 TP dari ATP CITIZENSHIP   │
│     Fase A - Semester Ganjil untuk 1 Gumujeng"     │
└─────────────────────────────────────────────────────┘
```

---

## 📝 **Mapping Semester:**

### **Database Format:**
```sql
SELECT semester FROM TahunAjaranSemester WHERE is_aktif = 1;
-- Result: "Ganjil" or "Genap"
```

### **Excel Format:**
```
| Tujuan Pembelajaran | Kelas | Semester |
|---------------------|-------|----------|
| TP 1                | 1     | 1        |  ← Ganjil
| TP 2                | 1     | 1        |  ← Ganjil
| TP 3                | 1     | 2        |  ← Genap
| TP 4                | 2     | 1        |  ← Ganjil
```

### **Conversion Logic:**
```javascript
// Backend (excelController.js):
if (kelasRow.semester) {
  semesterFilter = kelasRow.semester.toLowerCase() === 'ganjil' ? 1 : 2;
}

// Frontend (inputNilai.js):
let semesterNumber = activeTASemester.semester.toLowerCase() === 'ganjil' ? 1 : 2;
```

---

## 🧪 **Testing:**

### **Test Scenario 1: Semester Ganjil**

**Setup:**
- Database: `TahunAjaranSemester` → semester = "Ganjil", is_aktif = 1
- Excel: Ada 3 TP untuk Kelas 1, Semester 1

**Expected Result:**
```
✅ Berhasil memuat 3 TP dari ATP CITIZENSHIP Fase A - Semester Ganjil untuk 1 Gumujeng

Tabel:
| Nama | TP 1 | TP 2 | TP 3 | UAS | Final |
```

### **Test Scenario 2: Semester Genap**

**Setup:**
- Database: `TahunAjaranSemester` → semester = "Genap", is_aktif = 1
- Excel: Ada 2 TP untuk Kelas 1, Semester 2

**Expected Result:**
```
✅ Berhasil memuat 2 TP dari ATP CITIZENSHIP Fase A - Semester Genap untuk 1 Gumujeng

Tabel:
| Nama | TP 1 | TP 2 | UAS | Final |
```

### **Test Scenario 3: Tidak Ada TP untuk Semester Ini**

**Setup:**
- Database: semester = "Genap"
- Excel: Tidak ada TP untuk Kelas 1, Semester 2

**Expected Result:**
```
ℹ️ Tidak ada TP untuk semester ini. Silakan tambah TP manual.

Tabel tetap ada TP 1 (default), bisa tambah manual.
```

---

## 🔍 **Console Log untuk Debug:**

```javascript
// Console log yang akan muncul:
Loading TP for: 1 Gumujeng (tingkat 1) - Fase A - Semester 1
TP Data received: {success: true, total_tp: 3, semester_filter: 1, ...}
Setting 3 TP columns: [1, 2, 3]
```

---

## 📋 **Backend SQL Query:**

```sql
-- Get kelas info with semester
SELECT 
  k.nama_kelas, 
  k.id_ta_semester, 
  tas.semester 
FROM Kelas k 
LEFT JOIN TahunAjaranSemester tas ON k.id_ta_semester = tas.id_ta_semester 
WHERE k.id_kelas = ?;
```

**Result:**
```
nama_kelas: "1 Gumujeng"
id_ta_semester: 2
semester: "Ganjil"  ← Digunakan untuk filter
```

---

## ✅ **Summary:**

| Feature | Status |
|---------|--------|
| **Auto-detect semester** | ✅ Done |
| **Filter TP by semester** | ✅ Done |
| **Success message with semester info** | ✅ Done |
| **Handle empty result** | ✅ Done |
| **Backward compatible** | ✅ Done (semester optional) |

---

## 🚀 **Cara Test di Browser:**

1. **Login sebagai guru**
2. **Pilih kelas** "1 Gumujeng - CITIZENSHIP"
3. **Lihat console** untuk semester detection:
   ```
   Loading TP for: 1 Gumujeng (tingkat 1) - Fase A - Semester 1
   ```
4. **Lihat success message**:
   ```
   ✅ Berhasil memuat X TP dari ATP CITIZENSHIP Fase A - Semester Ganjil untuk 1 Gumujeng
   ```
5. **Check tabel** - kolom TP sesuai semester aktif

---

**Fitur semester filter sudah selesai!** 🎉

Sekarang TP akan otomatis filter berdasarkan semester yang sedang berjalan.
