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
	gridLines = 8
}) => {
	// Price grid graphics
	const grid = new PIXI.Graphics();
	
	for (let i = 0; i <= gridLines; i++) {
		const y = margin.top + (chartHeight / gridLines) * i;
		const price = priceMax - (priceDiff / gridLines) * i;
		
		// Grid line (v8 modern API)
		grid.moveTo(margin.left, y)
			.lineTo(margin.left + chartWidth, y)
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
		
		// Price label (left side)
		const priceTextLeft = new PIXI.Text({
			text: price.toFixed(2),
			style: {
				fontFamily: 'Arial',
				fontSize: 12,
				fill: 0x888888
			}
		});
		priceTextLeft.anchor.set(1, 0.5);
		priceTextLeft.x = margin.left - 5;
		priceTextLeft.y = y;
		container.addChild(priceTextLeft);
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
	canvasWidth
}) => {
	// Time grid graphics
	const grid = new PIXI.Graphics();
	
	// Vertical time grid lines
	for (const dataIndex of timeGridIndices) {
		// Calculate X position using indexToX utility (same as candlesticks)
		const x = indexToX(dataIndex, canvasWidth, margin.left);
		
		// Vertical grid line (v8 modern API)
		grid.moveTo(x, margin.top)
			.lineTo(x, margin.top + chartHeight)
			.stroke({ width: 1, color: 0x333333, alpha: 0.3 });
		
		// Date label (below chart)
		if (visibleData[dataIndex]) {
			const dateStr = visibleData[dataIndex].date.split('-').slice(1).join('/'); // MM/DD format
			
			const dateText = new PIXI.Text({
				text: dateStr,
				style: {
					fontFamily: 'Arial',
					fontSize: 11,
					fill: 0x888888
				}
			});
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
	const priceGrid = createPriceGrid(params);
	const timeGrid = createTimeGrid(params);
	
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
