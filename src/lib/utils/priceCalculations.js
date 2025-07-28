/**
 * @fileoverview Price calculation utilities for chart rendering
 * Handles coordinate transformations between price values and screen coordinates,
 * price range calculations with padding, and grid line positioning for professional charts.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.3.0
 * @since 2024-01-01
 */

/**
 * Calculates price range and scaling information for chart rendering
 * @param {Array<Object>} visibleData - Array of visible stock data with OHLC properties
 * @param {number} visibleData[].open - Opening price
 * @param {number} visibleData[].high - Highest price
 * @param {number} visibleData[].low - Lowest price
 * @param {number} visibleData[].close - Closing price
 * @param {number} [paddingPercent=0.1] - Padding percentage for price range (0.1 = 10%)
 * @returns {Object} Price calculation results with range and scaling information
 * @returns {number} returns.minPrice - Original minimum price from data
 * @returns {number} returns.maxPrice - Original maximum price from data
 * @returns {number} returns.priceRange - Raw price range (max - min)
 * @returns {number} returns.priceMin - Minimum price with padding applied
 * @returns {number} returns.priceMax - Maximum price with padding applied
 * @returns {number} returns.priceDiff - Total price difference with padding
 * @example
 * // Calculate price range with 5% padding
 * const range = calculatePriceRange(candleData, 0.05);
 * console.log(`Chart range: ${range.priceMin} - ${range.priceMax}`);
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

	// Stack-safe price range calculation for large datasets
	let minPrice = Infinity;
	let maxPrice = -Infinity;
	
	// Loop-based min/max to avoid stack overflow with large arrays
	for (const data of visibleData) {
		const { open, high, low, close } = data;
		minPrice = Math.min(minPrice, open, high, low, close);
		maxPrice = Math.max(maxPrice, open, high, low, close);
	}
	
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
 * @param {number} price - Price value to convert
 * @param {number} priceMin - Minimum price in range (from calculatePriceRange)
 * @param {number} priceDiff - Price difference (priceMax - priceMin)
 * @param {number} chartTop - Chart area top position in pixels
 * @param {number} chartHeight - Chart area height in pixels
 * @returns {number} Y coordinate in pixels (screen coordinates)
 * @example
 * // Convert price to screen Y coordinate
 * const y = priceToY(105.50, 100, 20, 50, 400);
 * console.log(`Price 105.50 is at Y: ${y}px`);
 */
export const priceToY = (price, priceMin, priceDiff, chartTop, chartHeight) => {
	return chartTop + chartHeight - ((price - priceMin) / priceDiff) * chartHeight;
};

/**
 * Converts Y coordinate to price value
 * @param {number} y - Y coordinate in pixels (screen coordinates)
 * @param {number} priceMin - Minimum price in range (from calculatePriceRange)
 * @param {number} priceDiff - Price difference (priceMax - priceMin)
 * @param {number} chartTop - Chart area top position in pixels
 * @param {number} chartHeight - Chart area height in pixels
 * @returns {number} Price value corresponding to the Y coordinate
 * @example
 * // Convert mouse Y position to price
 * const price = yToPrice(mouseY, 100, 20, 50, 400);
 * console.log(`Mouse at Y ${mouseY}px = Price: ${price.toFixed(2)}`);
 */
export const yToPrice = (y, priceMin, priceDiff, chartTop, chartHeight) => {
	const normalizedY = (chartTop + chartHeight - y) / chartHeight;
	return priceMin + (normalizedY * priceDiff);
};

/**
 * Calculates grid line positions for price axis
 * @param {number} priceMin - Minimum price value
 * @param {number} priceMax - Maximum price value
 * @param {number} [gridLines=8] - Number of grid lines to generate
 * @returns {Array<number>} Array of price values for grid lines (from max to min)
 * @example
 * // Generate 6 grid lines between price range
 * const gridPrices = calculatePriceGridLines(100, 120, 6);
 * console.log('Grid prices:', gridPrices); // [120, 116, 112, 108, 104, 100]
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
