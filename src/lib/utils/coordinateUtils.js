/**
 * @fileoverview Coordinate transformation utilities for chart rendering
 * Provides functions for converting between data indices and screen coordinates,
 * calculating chart dimensions, grid positioning, and candlestick sizing for responsive charts.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.3.0
 * @since 2024-01-01
 */

/**
 * Calculates chart margins and dimensions
 * @param {number} width - Total container width in pixels
 * @param {number} height - Total container height in pixels
 * @param {Object} [customMargins={}] - Custom margin overrides
 * @param {number} [customMargins.top] - Top margin override
 * @param {number} [customMargins.right] - Right margin override
 * @param {number} [customMargins.bottom] - Bottom margin override
 * @param {number} [customMargins.left] - Left margin override
 * @param {Object} [axisDimensions={}] - Dynamic axis dimensions
 * @param {number} [axisDimensions.yAxisWidth=50] - Y-axis width in pixels
 * @param {number} [axisDimensions.xAxisHeight=25] - X-axis height in pixels
 * @returns {Object} Margin and dimension calculations
 * @returns {Object} returns.margin - Calculated margins {top, right, bottom, left}
 * @returns {number} returns.chartWidth - Available chart width (excluding margins)
 * @returns {number} returns.chartHeight - Available chart height (excluding margins)
 * @example
 * // Calculate chart dimensions with custom axis sizes
 * const dims = calculateChartDimensions(800, 600, {}, { yAxisWidth: 60, xAxisHeight: 30 });
 * console.log(`Chart area: ${dims.chartWidth}x${dims.chartHeight}`);
 */
export const calculateChartDimensions = (width, height, customMargins = {}, axisDimensions = {}) => {
	const { yAxisWidth = 50, xAxisHeight = 25 } = axisDimensions;
	const defaultMargins = { top: 0, right: yAxisWidth, bottom: xAxisHeight, left: 0 }; // Dynamic margins
	const margin = { ...defaultMargins, ...customMargins };
	
	return {
		margin,
		chartWidth: width - margin.left - margin.right,
		chartHeight: height - margin.top - margin.bottom
	};
};

/**
 * Converts data index to X coordinate
 * @param {number} index - Data point index (0-based array index)
 * @param {number} canvasWidth - Canvas width per candle in pixels
 * @param {number} marginLeft - Left margin in pixels
 * @returns {number} X coordinate in pixels (center of candle)
 * @example
 * // Get X position for 5th candle with 10px width and 20px margin
 * const x = indexToX(4, 10, 20); // Returns 65 (20 + (4 + 0.5) * 10)
 */
export const indexToX = (index, canvasWidth, marginLeft) => {
	return marginLeft + (index + 0.5) * canvasWidth;
};

/**
 * Converts X coordinate to data index
 * @param {number} x - X coordinate
 * @param {number} canvasWidth - Canvas width per candle
 * @param {number} marginLeft - Left margin
 * @returns {number} Data index
 */
export const xToIndex = (x, canvasWidth, marginLeft) => {
	return Math.floor((x - marginLeft) / canvasWidth);
};

/**
 * Calculates time grid positions
 * @param {Array} visibleData - Visible data array
 * @param {number} maxGridLines - Maximum number of grid lines
 * @returns {Array} Array of data indices for grid lines
 */
export const calculateTimeGridIndices = (visibleData, maxGridLines = 6) => {
	const timeGridLines = Math.min(maxGridLines, visibleData.length);
	const indices = [];
	
	for (let i = 0; i < timeGridLines && i < visibleData.length; i++) {
		const dataIndex = i === timeGridLines - 1 
			? visibleData.length - 1  // Last candlestick
			: Math.floor((visibleData.length - 1) * (i / (timeGridLines - 1)));
		
		if (dataIndex >= 0 && dataIndex < visibleData.length) {
			indices.push(dataIndex);
		}
	}
	
	return indices;
};

/**
 * Calculates candlestick body dimensions
 * @param {number} canvasWidth - Canvas width per candle
 * @param {number} minBodyWidth - Minimum body width
 * @param {number} bodyWidthRatio - Body width ratio (default: 0.8)
 * @returns {number} Body width
 */
export const calculateCandleBodyWidth = (canvasWidth, minBodyWidth = 2, bodyWidthRatio = 0.8) => {
	return Math.max(minBodyWidth, canvasWidth * bodyWidthRatio);
};

/**
 * Determines if a point is within chart bounds
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Object} bounds - Chart bounds {left, top, right, bottom}
 * @returns {boolean} True if point is within bounds
 */
export const isPointInChartBounds = (x, y, bounds) => {
	return x >= bounds.left && 
		   x <= bounds.right && 
		   y >= bounds.top && 
		   y <= bounds.bottom;
};

/**
 * Calculates zoom limits for candle width
 * @param {number} minWidth - Minimum candle width
 * @param {number} maxWidth - Maximum candle width
 * @param {number} currentWidth - Current candle width
 * @param {number} zoomFactor - Zoom factor
 * @returns {number} Constrained candle width
 */
export const constrainCandleWidth = (currentWidth, zoomFactor, minWidth = 0.1, maxWidth = 100, chartWidth = null, totalDataCount = null) => {
	const newWidth = currentWidth * zoomFactor;
	
	// Eğer chart genişliği ve total data sayısı verilmişse, dinamik minimum hesapla
	let dynamicMinWidth = minWidth;
	if (chartWidth && totalDataCount && totalDataCount > 0) {
		// Tüm datayi göstermek için gereken minimum width (daha agresif)
		dynamicMinWidth = Math.max(0.01, chartWidth / totalDataCount);
		console.log(`📏 Dynamic min width: ${dynamicMinWidth.toFixed(6)}px (${totalDataCount} data points in ${chartWidth}px)`);
		console.log(`📏 Theoretical max candles: ${Math.floor(chartWidth / dynamicMinWidth)}`);
	}
	
	const constrainedWidth = Math.max(dynamicMinWidth, Math.min(maxWidth, newWidth));
	console.log(`📏 Width calculation: current=${currentWidth.toFixed(4)} * factor=${zoomFactor} = ${newWidth.toFixed(4)} → constrained=${constrainedWidth.toFixed(4)}`);
	
	return constrainedWidth;
};