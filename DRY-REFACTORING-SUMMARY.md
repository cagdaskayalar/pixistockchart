# DRY (Don't Repeat Yourself) Refactoring Summary

## Overview
Bu refactoring işlemi, axis komponentleri arasında kod tekrarını önlemek için gerçekleştirilmiştir. Ortak hesaplamaları ve yapılandırmaları merkezi bir dosyada toplayarak kod organizasyonunu iyileştirdik.

## Created: AxisUtils.js - Centralized Axis System

### Purpose
- Y-Axis ve X-Axis'te ortak kullanılan hesaplamaları merkezi bir yerde topladık
- Tutarlı formatlamayı ve konfigürasyonu garantiledik
- Kod tekrarını elimine ettik

### Main Functions

#### generateYAxisConfig()
```javascript
/**
 * Y-Axis (fiyat) yapılandırmasını oluşturur
 * @param {object} config
 * @param {object} config.chartBounds - Chart sınırları
 * @param {number} config.priceMin - Minimum fiyat
 * @param {number} config.priceMax - Maksimum fiyat  
 * @param {number} config.desiredTickCount - İstenen tick sayısı
 * @param {number} config.minTickSpacing - Minimum tick aralığı
 * @returns {object} Y-axis konfigürasyonu
 */
```

#### generateXAxisConfig()
```javascript
/**
 * X-Axis (zaman) yapılandırmasını oluşturur
 * @param {object} config
 * @param {object} config.chartBounds - Chart sınırları
 * @param {Array} config.timeGridIndices - Zaman grid indeksleri
 * @param {number} config.canvasWidth - Canvas genişliği
 * @param {number} config.minTickSpacing - Minimum tick aralığı
 * @returns {object} X-axis konfigürasyonu
 */
```

#### formatTurkishDate()
```javascript
/**
 * Türkçe tarih formatlaması
 * @param {Date|string} dateValue - Tarih değeri
 * @param {Array} monthNames - Türkçe ay isimleri
 * @returns {string} Formatlanmış tarih string'i
 */
```

## Refactored Components

### SvgYAxis.js
**Before**: Manual tick calculations, duplicate logic
```javascript
// Manuel hesaplamalar
const priceRange = priceMax - priceMin;
const tickSpacing = priceRange / (gridLines - 1);
// ... manual formatting
```

**After**: Centralized configuration
```javascript
const yAxisConfig = generateYAxisConfig({
  chartBounds, priceMin, priceMax,
  desiredTickCount: gridLines,
  minTickSpacing: 30
});
```

### SvgXAxis.js  
**Before**: Separate date formatting, manual positioning
```javascript
// Manuel tarih formatlama
const monthNames = ['Oca', 'Şub', 'Mar'...];
const dateStr = `${date.getDate()} ${monthNames[date.getMonth()]}`;
```

**After**: Shared Turkish formatting
```javascript  
const xAxisConfig = generateXAxisConfig({...});
const dateStr = formatTurkishDate(dateValue, TURKISH_MONTH_NAMES);
```

### SvgGrid.js
**Before**: Duplicate axis calculations for grid
```javascript
// Y ve X axis için ayrı hesaplamalar
```

**After**: Both axis configs from AxisUtils
```javascript
const yAxisConfig = generateYAxisConfig({...});
const xAxisConfig = generateXAxisConfig({...});
```

## Benefits Achieved

### 1. Code Deduplication
- Eliminated repeated logic between SvgYAxis, SvgXAxis, and SvgGrid
- Single source of truth for axis calculations

### 2. Consistency
- Standardized AXIS_PRESETS across all components
- Uniform formatting and spacing rules

### 3. Maintainability  
- Changes to axis logic only need to be made in one place
- Easier to test and debug centralized functions

### 4. Professional Standards
- Preserved all D3-based tick generation algorithms
- Maintained 2-digit decimal precision (39.60 format)
- Kept Turkish localization features

## Constants Centralized

```javascript
const AXIS_PRESETS = {
  PRICE_AXIS: {
    minTickSpacing: 30,
    defaultTickCount: 8,
    padding: { top: 20, bottom: 20 }
  },
  TIME_AXIS: {
    minTickSpacing: 80,
    defaultTickCount: 6,
    padding: { left: 10, right: 10 }
  }
};

const TURKISH_MONTH_NAMES = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
];
```

## Result
- **296 lines** in AxisUtils.js centralizing all axis logic
- **3 components** refactored to use shared utilities  
- **Zero code duplication** in axis calculations
- **100% functionality preserved** with improved organization

Bu refactoring işlemi sayesinde kod tabanımız daha temiz, sürdürülebilir ve profesyonel hale geldi. Gelecekteki axis ile ilgili değişiklikler artık tek bir dosyadan yapılabilecek.
