# SINFOMIK Unified Color Scheme Documentation

## Overview
Aplikasi SINFOMIK kini menggunakan skema warna yang seragam dan nyaman untuk mata dengan tema **Blue-Indigo** yang konsisten di seluruh fitur.

## Color Palette

### Primary Colors
- **Blue**: `#3b82f6` (blue-500) - Warna utama
- **Indigo**: `#6366f1` (indigo-500) - Warna sekunder
- **Light Blue**: `#eff6ff` (blue-50) - Background light
- **Light Indigo**: `#eef2ff` (indigo-50) - Background light

### Gradient Combinations
```css
/* Primary gradients */
from-blue-500 to-indigo-600    /* Main headers and buttons */
from-blue-50 to-indigo-100     /* Background gradients */
from-blue-400 to-indigo-400    /* Card elements */
```

### Status Colors (unchanged for accessibility)
- **Success**: `#10b981` (green-500)
- **Error**: `#ef4444` (red-500)
- **Warning**: `#f59e0b` (yellow-500)
- **Info**: `#3b82f6` (blue-500)

## Usage

### Import Color Scheme
```javascript
import { colorScheme, getStatusClasses, getButtonClasses, getCardClasses, getHeaderClasses } from '../../styles/colorScheme';
```

### CSS Classes
```javascript
// Use utility functions
const buttonClass = getButtonClasses('primary');
const cardClass = getCardClasses();
const headerClass = getHeaderClasses();
const statusClass = getStatusClasses('success');
```

### Direct Tailwind Classes
```javascript
// Headers
className="bg-gradient-to-r from-blue-500 to-indigo-600"

// Backgrounds  
className="bg-gradient-to-br from-blue-50 to-indigo-100"

// Buttons
className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"

// Text gradients
className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"

// Icons
className="text-blue-500"
```

## Files Updated

### Admin Features
- ✅ `course.js` - Subject management
- ✅ `grade.js` - Grade type management  
- ✅ `teacher.js` - Teacher management
- ✅ `student.js` - Student management
- ✅ `teacherClassEnroll.js` - Teacher-class assignments
- ✅ `classManagement.js` - Class management

### Guru Features
- ✅ `cp.js` - Capaian pembelajaran
- ✅ `inputNilai.js` - Grade input
- ⏳ `rekapNilai.js` - Grade summary
- ⏳ `WaliKelasGradeView.js` - Class grade overview

### Global Styles
- ✅ `colorScheme.js` - Color utility functions
- ✅ `unified-theme.css` - Global CSS variables and classes
- ✅ `index.css` - Updated main stylesheet

## Design Principles

1. **Consistency**: All features use the same blue-indigo color scheme
2. **Accessibility**: Maintained proper contrast ratios
3. **Visual Hierarchy**: Different shades for different importance levels
4. **User Experience**: Calming and professional color scheme
5. **Maintainability**: Centralized color definitions

## Benefits

- 🎨 **Visual Harmony**: Consistent look across all features
- 👁️ **Eye Comfort**: Soft blue tones reduce eye strain
- 🏢 **Professional**: Clean, modern appearance
- 🔧 **Maintainable**: Easy to update colors globally
- ♿ **Accessible**: Proper contrast for readability

## Next Steps

1. Apply to remaining guru features
2. Update student dashboard if needed
3. Consider dark theme variant
4. User testing for accessibility compliance
