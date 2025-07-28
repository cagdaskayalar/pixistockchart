import { generatePriceTicks, generateTimeTicks, calculateOptimalTickCount } from '../utils/tickUtils';

/**
 * @fileoverview Common axis utilities for professional trading charts
 * Provides shared functionality for both X and Y axis components,
 * following DRY principles and centralizing axis-related calculations.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * @typedef {Object} ChartBounds
 * @property {number} top - Top boundary of the chart area in pixels
 * @property {number} bottom - Bottom boundary of the chart area in pixels
 * @property {number} left - Left boundary of the chart area in pixels
 * @property {number} right - Right boundary of the chart area in pixels
 */

/**
 * @typedef {Object} AxisConfig
 * @property {ChartBounds} chartBounds - Chart area boundaries
 * @property {number} [minTickSpacing=40] - Minimum spacing between ticks in pixels
 * @property {number} [maxTicks=12] - Maximum number of ticks to display
 * @property {number} [verticalPadding=0] - Vertical padding for Y-axis calculations
 */

/**
 * @typedef {Object} PriceAxisResult
 * @property {Object[]} priceTicks - Array of professional price tick objects
 * @property {Object[]} priceLines - Array of grid line objects for rendering
 * @property {number} optimalTickCount - Calculated optimal number of ticks
 */

/**
 * @typedef {Object} TimeAxisResult
 * @property {Object[]} timeTicks - Array of professional time tick objects
 * @property {Object[]} timeLines - Array of time line objects for rendering
 * @property {number} optimalTickCount - Calculated optimal number of ticks
 */

/**
 * Generates professional Y-axis (price) configuration with D3-based calculations.
 * Centralizes all Y-axis related computations including tick generation,
 * optimal spacing, and grid line positioning.
 * 
 * @param {Object} config - Y-axis configuration parameters
 * @param {ChartBounds} config.chartBounds - Chart area boundaries
 * @param {number} config.priceMin - Minimum price value in the visible range
 * @param {number} config.priceMax - Maximum price value in the visible range
 * @param {number} [config.desiredTickCount=8] - Desired number of price ticks
 * @param {number} [config.minTickSpacing=35] - Minimum spacing between Y-axis ticks
 * @param {number} [config.maxPriceTicks=12] - Maximum number of price ticks
 * @param {number} [config.verticalPadding] - Auto-calculated if not provided
 * @returns {PriceAxisResult} Complete Y-axis configuration object
 * 
 * @example
 * // Generate complete Y-axis configuration
 * const yAxisConfig = generateYAxisConfig({
 *   chartBounds: { top: 50, bottom: 400, left: 50, right: 600 },
 *   priceMin: 100.25,
 *   priceMax: 105.75,
 *   desiredTickCount: 10
 * });
 * 
 * @example
 * // Use the generated configuration
 * const { priceTicks, priceLines, optimalTickCount } = yAxisConfig;
 * console.log(`Generated ${optimalTickCount} price ticks`);
 */
export function generateYAxisConfig({
	chartBounds,
	priceMin,
	priceMax,
	desiredTickCount = 8,
	minTickSpacing = 35,
	maxPriceTicks = 12,
	verticalPadding
}) {
	// Auto-calculate vertical padding if not provided
	const calculatedPadding = verticalPadding ?? (chartBounds.bottom - chartBounds.top) * 0.0125;
	
	// Calculate chart dimensions
	const chartHeight = chartBounds.bottom - chartBounds.top;

	// Calculate optimal tick count using D3 algorithms
	const { priceTicks: optimalTickCount } = calculateOptimalTickCount(chartHeight, 200, {
		minTickSpacing,
		maxPriceTicks: Math.max(desiredTickCount, maxPriceTicks)
	});

	// Generate professional price ticks using D3
	const priceTicks = generatePriceTicks({
		minPrice: priceMin,
		maxPrice: priceMax,
		chartTop: chartBounds.top,
		chartBottom: chartBounds.bottom,
		desiredTickCount: optimalTickCount,
		verticalPadding: calculatedPadding
	});

	// Convert ticks to grid lines format
	const priceLines = priceTicks.map(tick => ({
		y: tick.position,
		price: tick.formattedValue,
		key: tick.key
	}));

	return {
		priceTicks,
		priceLines,
		optimalTickCount,
		verticalPadding: calculatedPadding
	};
}

/**
 * Generates professional X-axis (time) configuration with D3-based calculations.
 * Centralizes all X-axis related computations including time tick generation,
 * intelligent spacing, and date formatting coordination.
 * 
 * @param {Object} config - X-axis configuration parameters
 * @param {ChartBounds} config.chartBounds - Chart area boundaries
 * @param {number[]} config.timeGridIndices - Array of time grid indices
 * @param {number} config.canvasWidth - Width per candle in pixels
 * @param {number} [config.minTickSpacing=80] - Minimum spacing between X-axis ticks
 * @param {number} [config.maxTimeTicks=12] - Maximum number of time ticks
 * @returns {TimeAxisResult} Complete X-axis configuration object
 * 
 * @example
 * // Generate complete X-axis configuration
 * const xAxisConfig = generateXAxisConfig({
 *   chartBounds: { top: 50, bottom: 400, left: 50, right: 600 },
 *   timeGridIndices: [0, 5, 10, 15, 20, 25],
 *   canvasWidth: 8,
 *   minTickSpacing: 100
 * });
 * 
 * @example
 * // Use the generated configuration
 * const { timeTicks, optimalTickCount } = xAxisConfig;
 * console.log(`Generated ${optimalTickCount} time ticks`);
 */
export function generateXAxisConfig({
	chartBounds,
	timeGridIndices,
	canvasWidth,
	minTickSpacing = 80,
	maxTimeTicks = 12
}) {
	// Calculate chart dimensions
	const chartWidth = chartBounds.right - chartBounds.left;

	// Calculate optimal tick count using D3 algorithms
	const { timeTicks: optimalTickCount } = calculateOptimalTickCount(300, chartWidth, {
		minTickSpacing,
		maxTimeTicks,
		maxPriceTicks: 8 // Not used for time axis, but required by function
	});

	// Generate professional time ticks using D3
	const timeTicks = generateTimeTicks({
		dataIndices: timeGridIndices,
		canvasWidth,
		chartLeft: chartBounds.left,
		maxTicks: optimalTickCount
	});

	return {
		timeTicks,
		optimalTickCount,
		chartWidth
	};
}

/**
 * Formats Turkish date string from various date input formats.
 * Centralizes date formatting logic used by both axis components.
 * 
 * @param {Date|string} dateValue - Date value in various formats
 * @param {string[]} monthNames - Array of Turkish month names
 * @returns {string} Formatted Turkish date string
 * 
 * @example
 * // Format different date types
 * const monthNames = ['Oca', 'Şub', 'Mar', ...];
 * const formatted1 = formatTurkishDate(new Date(), monthNames);
 * const formatted2 = formatTurkishDate('2025-02-10T10:09:00', monthNames);
 * const formatted3 = formatTurkishDate('2024-01-01', monthNames);
 */
export function formatTurkishDate(dateValue, monthNames) {
	let dateStr = 'N/A';
	
	try {
		if (dateValue instanceof Date) {
			// Real data: Date object from JSON - Türkiye formatında kısa ay
			const day = dateValue.getDate();
			const month = monthNames[dateValue.getMonth()];
			dateStr = `${day} ${month}`;
		} else if (typeof dateValue === 'string') {
			// Mock data: string format
			if (dateValue.includes('T')) {
				// ISO format: "2025-02-10T10:09:00"
				const date = new Date(dateValue);
				const day = date.getDate();
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
	}
	
	return dateStr;
}

/**
 * Standard Turkish month names for consistent date formatting across axes.
 * @type {string[]}
 * @constant
 */
export const TURKISH_MONTH_NAMES = [
	'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 
	'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'
];

/**
 * Standard axis configuration presets for consistent styling.
 * @type {Object}
 * @constant
 */
export const AXIS_PRESETS = {
	// Y-Axis (Price) presets
	PRICE_AXIS: {
		minTickSpacing: 35,
		maxPriceTicks: 12,
		defaultTickCount: 8
	},
	
	// X-Axis (Time) presets  
	TIME_AXIS: {
		minTickSpacing: 80,
		maxTimeTicks: 12,
		defaultTickCount: 8
	},
	
	// Grid presets
	GRID: {
		minorGridSize: 20,
		majorGridOpacity: 0.4,
		minorGridOpacity: 0.2
	}
};
