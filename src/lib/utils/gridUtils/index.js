import * as PIXI from 'pixi.js';
import { indexToX } from '../coordinateUtils';

/**
 * Creates price grid (horizontal lines) and price labels
 * @param {Object} params - Grid parameters
 * @param {Object} params.container - PIXI Container to add grid elements
 * @param {Object} params.margin - Chart margins {top, left, right, bottom}
 * @param {number} params.chartWidth - Chart area width
 * @param {number} params.chartHeight - Chart area height
 * @param {number} params.priceMin - Minimum price value
 * @param {number} params.priceMax - Maximum price value 
 * @param {number} params.priceDiff - Price range (max - min)
 * @param {number} params.gridLines - Number of horizontal grid lines (default: 8)
 */
export const createPriceGrid = ({
	container,
	margin,
	chartWidth,
	chartHeight,
	priceMin,
	priceMax,
	priceDiff,
	gridLines = 8,
	totalWidth = 0 // Yeni parametre: tam ekran genişliği
}) => {
	// Price grid graphics
	const grid = new PIXI.Graphics();
	
	// Chart yüksekliğinin %3'ü kadar padding (üst ve alt için)
	const verticalPadding = chartHeight * 0.0125;
	const effectiveHeight = chartHeight - (2 * verticalPadding);
	
	for (let i = 0; i <= gridLines; i++) {
		const y = margin.top + verticalPadding + (effectiveHeight / gridLines) * i;
		const price = priceMax - (priceDiff / gridLines) * i;
		
		// Grid line - sadece chart alanı içinde (v8 modern API)
		grid.moveTo(margin.left, y)  // Chart alanının sol sınırından başla
			.lineTo(margin.left + chartWidth, y)  // Chart alanının sağ sınırında bitir
			.stroke({ width: 1, color: 0x333333, alpha: 0.3 });
		
		// Price label (right side)
		const priceTextRight = new PIXI.Text({
			text: price.toFixed(2),
			style: {
				fontFamily: 'Arial',
				fontSize: 12,
				fill: 0x888888
			}
		});
		priceTextRight.anchor.set(0, 0.5);
		priceTextRight.x = margin.left + chartWidth + 5;
		priceTextRight.y = y;
		container.addChild(priceTextRight);
		
		// Price label (left side) - REMOVED for full-screen layout
		// Sol taraftaki Y-Axis tamamen kaldırıldı
	}
	
	container.addChild(grid);
	return grid;
};

/**
 * Creates time grid (vertical lines) and date labels
 * @param {Object} params - Grid parameters
 * @param {Object} params.container - PIXI Container to add grid elements
 * @param {Object} params.margin - Chart margins {top, left, right, bottom}
 * @param {number} params.chartHeight - Chart area height
 * @param {Array} params.visibleData - Array of visible candle data
 * @param {Array} params.timeGridIndices - Array of indices for time grid lines
 * @param {number} params.canvasWidth - Pixels per candle
 */
export const createTimeGrid = ({
	container,
	margin,
	chartHeight,
	visibleData,
	timeGridIndices,
	canvasWidth,
	totalHeight = 0 // Yeni parametre: tam ekran yüksekliği
}) => {
	// Time grid graphics
	const grid = new PIXI.Graphics();
	
	// Vertical time grid lines
	for (const dataIndex of timeGridIndices) {
		// Calculate X position using indexToX utility (same as candlesticks)
		const x = indexToX(dataIndex, canvasWidth, margin.left);
		
		// Vertical grid line - sadece chart alanı içinde (v8 modern API)
		grid.moveTo(x, margin.top)  // Chart alanının üst sınırından başla
			.lineTo(x, margin.top + chartHeight)  // Chart alanının alt sınırında bitir
			.stroke({ width: 1, color: 0x333333, alpha: 0.3 });
		
		// Date label (below chart)
		if (visibleData[dataIndex]) {
			// Handle Date object (from real JSON data) or string (from mock data)
		// X-Axis için Türkiye formatında tarih (16 Tem, 15 Haz formatı)
		let dateStr = 'N/A';
		try {
			const dateValue = visibleData[dataIndex].date;
			if (dateValue instanceof Date) {
				// Real data: Date object from JSON - Türkiye formatında kısa ay
				const day = dateValue.getDate();
				const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 
				                   'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
				const month = monthNames[dateValue.getMonth()];
				dateStr = `${day} ${month}`;
			} else if (typeof dateValue === 'string') {
				// Mock data: string format
				if (dateValue.includes('T')) {
					// ISO format: "2025-02-10T10:09:00"
					const date = new Date(dateValue);
					const day = date.getDate();
					const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 
					                   'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
					const month = monthNames[date.getMonth()];
					dateStr = `${day} ${month}`;
				} else {
					// Old format: "2024-01-01" - eski formatı koru
					dateStr = dateValue.split('-').slice(1).join('/');
				}
			}
		} catch (error) {
			console.warn('Date formatting error:', error);
			dateStr = 'N/A';
		}			const dateText = new PIXI.Text({
				text: dateStr,
				style: {
					fontFamily: 'Arial',
					fontSize: 11,
					fill: 0x888888
				}
			});
			
			// Merkez hizalama tüm date label'lar için
			dateText.anchor.set(0.5, 0);
			dateText.x = x;
			
			dateText.y = margin.top + chartHeight + 8;
			container.addChild(dateText);
		}
	}
	
	container.addChild(grid);
	return grid;
};

/**
 * Creates complete grid system (price + time)
 * @param {Object} params - All grid parameters
 */
export const createCompleteGrid = (params) => {
	const priceGrid = createPriceGrid({
		...params,
		totalWidth: params.totalWidth
	});
	const timeGrid = createTimeGrid({
		...params,
		totalHeight: params.totalHeight
	});
	
	return {
		priceGrid,
		timeGrid,
		// Clean up function
		destroy: () => {
			if (priceGrid && priceGrid.destroy) priceGrid.destroy();
			if (timeGrid && timeGrid.destroy) timeGrid.destroy();
		}
	};
};
