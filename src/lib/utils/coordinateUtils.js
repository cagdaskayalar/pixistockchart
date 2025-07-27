/**
 * Coordinate transformation utilities for chart rendering
 */

/**
 * Calculates chart margins and dimensions
 * @param {number} width - Total width
 * @param {number} height - Total height
 * @param {Object} customMargins - Custom margin overrides
 * @returns {Object} Margin and dimension calculations
 */
export const calculateChartDimensions = (width, height, customMargins = {}) => {
	const defaultMargins = { top: 40, right: 150, bottom: 60, left: 100 };
	const margin = { ...defaultMargins, ...customMargins };
	
	return {
		margin,
		chartWidth: width - margin.left - margin.right,
		chartHeight: height - margin.top - margin.bottom
	};
};

/**
 * Converts data index to X coordinate
 * @param {number} index - Data point index
 * @param {number} canvasWidth - Canvas width per candle
 * @param {number} marginLeft - Left margin
 * @returns {number} X coordinate
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
export const constrainCandleWidth = (currentWidth, zoomFactor, minWidth = 4, maxWidth = 100) => {
	const newWidth = currentWidth * zoomFactor;
	return Math.max(minWidth, Math.min(maxWidth, newWidth));
};