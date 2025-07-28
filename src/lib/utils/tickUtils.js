import { scaleLinear } from 'd3-scale';

/**
 * @fileoverview Professional tick generation utilities using D3's algorithms
 * Provides "nice" tick values and formatting for trading chart axes,
 * following D3's standard practices for human-readable tick marks.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * @typedef {Object} TickInfo
 * @property {number} value - The tick value (price or coordinate)
 * @property {string} formattedValue - Human-readable formatted string
 * @property {number} position - Y coordinate for price ticks, X coordinate for time ticks
 * @property {string} key - Unique key for React rendering
 */

/**
 * @typedef {Object} PriceTickConfig
 * @property {number} minPrice - Minimum price in the visible range
 * @property {number} maxPrice - Maximum price in the visible range
 * @property {number} chartTop - Top coordinate of chart area
 * @property {number} chartBottom - Bottom coordinate of chart area
 * @property {number} [desiredTickCount=8] - Desired number of ticks (D3 may adjust)
 * @property {number} [verticalPadding=0] - Vertical padding for tick positioning
 */

/**
 * @typedef {Object} TimeTickConfig
 * @property {number[]} dataIndices - Array of data indices for time ticks
 * @property {number} canvasWidth - Width per candle in pixels
 * @property {number} chartLeft - Left coordinate of chart area
 * @property {number} [maxTicks=10] - Maximum number of time ticks to display
 */

/**
 * Generates professional price ticks using D3's "nice" algorithm.
 * Creates human-readable, evenly-spaced price levels like 50.25, 50.50, 50.75
 * instead of arbitrary values like 50.22, 50.31, 50.44.
 * 
 * @param {PriceTickConfig} config - Configuration for price tick generation
 * @returns {TickInfo[]} Array of professional tick information objects
 * 
 * @example
 * // Generate price ticks for a price range
 * const priceTicks = generatePriceTicks({
 *   minPrice: 50.12,
 *   maxPrice: 52.47,
 *   chartTop: 50,
 *   chartBottom: 400,
 *   desiredTickCount: 8
 * });
 * // Result: [
 * //   { value: 50.25, formattedValue: "50.25", position: 375, key: "price-0" },
 * //   { value: 50.50, formattedValue: "50.50", position: 350, key: "price-1" },
 * //   ...
 * // ]
 * 
 * @example
 * // With custom tick count
 * const priceTicks = generatePriceTicks({
 *   minPrice: 100.00,
 *   maxPrice: 105.00,
 *   chartTop: 60,
 *   chartBottom: 380,
 *   desiredTickCount: 10,
 *   verticalPadding: 5
 * });
 */
export function generatePriceTicks({
	minPrice,
	maxPrice,
	chartTop,
	chartBottom,
	desiredTickCount = 8,
	verticalPadding = 0
}) {
	// D3 linear scale for price mapping
	const priceScale = scaleLinear()
		.domain([minPrice, maxPrice])
		.range([chartBottom - verticalPadding, chartTop + verticalPadding]);

	// D3's professional tick generation
	const tickValues = priceScale.ticks(desiredTickCount);

	return tickValues.map((tickValue, index) => {
		const position = priceScale(tickValue);
		// Use our custom formatter for consistent 2-digit precision
		const formattedValue = formatPriceValue(tickValue, minPrice, maxPrice);

		return {
			value: tickValue,
			formattedValue,
			position,
			key: `price-${index}`
		};
	});
}

/**
 * Generates time-based ticks with intelligent spacing to avoid overcrowding.
 * Automatically reduces tick density when there are too many time points.
 * 
 * @param {TimeTickConfig} config - Configuration for time tick generation
 * @returns {TickInfo[]} Array of time tick information objects
 * 
 * @example
 * // Generate time ticks for visible data
 * const timeTicks = generateTimeTicks({
 *   dataIndices: [0, 5, 10, 15, 20, 25, 30],
 *   canvasWidth: 8,
 *   chartLeft: 50,
 *   maxTicks: 6
 * });
 * // Result: [
 * //   { value: 0, formattedValue: "0", position: 54, key: "time-0" },
 * //   { value: 10, formattedValue: "10", position: 134, key: "time-10" },
 * //   ...
 * // ]
 * 
 * @example
 * // Automatic tick reduction for dense data
 * const timeTicks = generateTimeTicks({
 *   dataIndices: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
 *   canvasWidth: 6,
 *   chartLeft: 60,
 *   maxTicks: 5
 * });
 * // Will automatically select every 3rd tick: [0, 3, 6, 9, 12]
 */
export function generateTimeTicks({
	dataIndices,
	canvasWidth,
	chartLeft,
	maxTicks = 10
}) {
	// Automatic tick reduction for dense data
	let selectedIndices = dataIndices;
	
	if (dataIndices.length > maxTicks) {
		const step = Math.ceil(dataIndices.length / maxTicks);
		selectedIndices = dataIndices.filter((_, index) => index % step === 0);
		
		// Always include the last tick if it's not already included
		const lastIndex = dataIndices[dataIndices.length - 1];
		if (!selectedIndices.includes(lastIndex)) {
			selectedIndices.push(lastIndex);
		}
	}

	return selectedIndices.map((dataIndex, index) => {
		const position = chartLeft + (dataIndex * canvasWidth) + (canvasWidth / 2);
		
		return {
			value: dataIndex,
			formattedValue: dataIndex.toString(),
			position,
			key: `time-${dataIndex}`
		};
	});
}

/**
 * Calculates optimal tick count based on chart dimensions and content density.
 * Prevents tick overcrowding while maintaining readability.
 * 
 * @param {number} chartHeight - Height of the chart area in pixels
 * @param {number} chartWidth - Width of the chart area in pixels
 * @param {Object} [options={}] - Optional configuration
 * @param {number} [options.minTickSpacing=40] - Minimum spacing between ticks in pixels
 * @param {number} [options.maxPriceTicks=12] - Maximum price ticks regardless of space
 * @param {number} [options.maxTimeTicks=15] - Maximum time ticks regardless of space
 * @returns {Object} Optimal tick counts for both axes
 * @returns {number} returns.priceTicks - Recommended number of price ticks
 * @returns {number} returns.timeTicks - Recommended number of time ticks
 * 
 * @example
 * // Calculate optimal tick counts for chart dimensions
 * const { priceTicks, timeTicks } = calculateOptimalTickCount(350, 800);
 * // Result: { priceTicks: 8, timeTicks: 12 }
 * 
 * @example
 * // With custom spacing requirements
 * const { priceTicks, timeTicks } = calculateOptimalTickCount(400, 1000, {
 *   minTickSpacing: 50,
 *   maxPriceTicks: 10,
 *   maxTimeTicks: 20
 * });
 */
export function calculateOptimalTickCount(
	chartHeight, 
	chartWidth, 
	options = {}
) {
	const {
		minTickSpacing = 40,
		maxPriceTicks = 12,
		maxTimeTicks = 15
	} = options;

	// Calculate based on available space
	const priceTicks = Math.min(
		Math.floor(chartHeight / minTickSpacing),
		maxPriceTicks
	);
	
	const timeTicks = Math.min(
		Math.floor(chartWidth / minTickSpacing),
		maxTimeTicks
	);

	return {
		priceTicks: Math.max(priceTicks, 3), // Minimum 3 ticks
		timeTicks: Math.max(timeTicks, 3)   // Minimum 3 ticks
	};
}

/**
 * Formats price values using Turkish number format with consistent 2-digit precision.
 * Always displays exactly 2 decimal places for professional financial appearance.
 * 
 * @param {number} price - Price value to format
 * @param {number} [minPrice] - Minimum price in range (unused, kept for compatibility)
 * @param {number} [maxPrice] - Maximum price in range (unused, kept for compatibility)
 * @returns {string} Formatted price string with Turkish locale and 2 decimal places
 * 
 * @example
 * // Basic price formatting with 2 decimal places
 * const formatted = formatPriceValue(50.6);
 * // Result: "50,60" (Turkish locale with 2 digits)
 * 
 * @example
 * // Always 2 decimal places regardless of range
 * const formatted = formatPriceValue(1.2);
 * // Result: "1,20" (consistent 2-digit precision)
 */
export function formatPriceValue(price, minPrice, maxPrice) {
	// Always use exactly 2 decimal places for professional financial display
	const decimalPlaces = 2;
	
	return price.toLocaleString('tr-TR', {
		minimumFractionDigits: decimalPlaces,
		maximumFractionDigits: decimalPlaces
	});
}
