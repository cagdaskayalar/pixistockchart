/**
 * Price calculation utilities for chart rendering
 */

/**
 * Calculates price range and scaling information for chart rendering
 * @param {Array} visibleData - Array of visible stock data
 * @param {number} paddingPercent - Padding percentage for price range (default: 0.1 = 10%)
 * @returns {Object} Price calculation results
 */
export const calculatePriceRange = (visibleData, paddingPercent = 0.1) => {
	if (!visibleData || visibleData.length === 0) {
		return {
			minPrice: 0,
			maxPrice: 0,
			priceRange: 0,
			priceMin: 0,
			priceMax: 0,
			priceDiff: 0
		};
	}

	// Extract all price values
	const prices = visibleData.flatMap(d => [d.open, d.high, d.low, d.close]);
	const minPrice = Math.min(...prices);
	const maxPrice = Math.max(...prices);
	const priceRange = maxPrice - minPrice;
	const padding = priceRange * paddingPercent;
	const priceMin = minPrice - padding;
	const priceMax = maxPrice + padding;
	const priceDiff = priceMax - priceMin;

	return {
		minPrice,
		maxPrice,
		priceRange,
		priceMin,
		priceMax,
		priceDiff
	};
};

/**
 * Converts price value to Y coordinate on chart
 * @param {number} price - Price value
 * @param {number} priceMin - Minimum price in range
 * @param {number} priceDiff - Price difference (max - min)
 * @param {number} chartTop - Chart area top position
 * @param {number} chartHeight - Chart area height
 * @returns {number} Y coordinate
 */
export const priceToY = (price, priceMin, priceDiff, chartTop, chartHeight) => {
	return chartTop + chartHeight - ((price - priceMin) / priceDiff) * chartHeight;
};

/**
 * Converts Y coordinate to price value
 * @param {number} y - Y coordinate
 * @param {number} priceMin - Minimum price in range
 * @param {number} priceDiff - Price difference (max - min)
 * @param {number} chartTop - Chart area top position
 * @param {number} chartHeight - Chart area height
 * @returns {number} Price value
 */
export const yToPrice = (y, priceMin, priceDiff, chartTop, chartHeight) => {
	const normalizedY = (chartTop + chartHeight - y) / chartHeight;
	return priceMin + (normalizedY * priceDiff);
};

/**
 * Calculates grid line positions for price axis
 * @param {number} priceMin - Minimum price
 * @param {number} priceMax - Maximum price
 * @param {number} gridLines - Number of grid lines
 * @returns {Array} Array of price values for grid lines
 */
export const calculatePriceGridLines = (priceMin, priceMax, gridLines = 8) => {
	const priceDiff = priceMax - priceMin;
	const gridValues = [];
	
	for (let i = 0; i <= gridLines; i++) {
		const price = priceMax - (priceDiff / gridLines) * i;
		gridValues.push(parseFloat(price.toFixed(2)));
	}
	
	return gridValues;
};

/**
 * Formats price for display
 * @param {number} price - Price value
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, decimals = 2) => {
	return `$${price.toFixed(decimals)}`;
};

/**
 * Calculates price change percentage
 * @param {number} currentPrice - Current price
 * @param {number} previousPrice - Previous price
 * @returns {Object} Change amount and percentage
 */
export const calculatePriceChange = (currentPrice, previousPrice) => {
	const change = currentPrice - previousPrice;
	const changePercent = (change / previousPrice) * 100;
	
	return {
		change: parseFloat(change.toFixed(2)),
		changePercent: parseFloat(changePercent.toFixed(2)),
		isPositive: change >= 0
	};
};
