/**
 * @fileoverview Stock data generation and manipulation utilities
 * Provides functions for generating sample OHLCV data, calculating technical indicators,
 * and filtering data by date ranges for professional trading chart applications.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.3.0
 * @since 2024-01-01
 */

/**
 * Generates sample stock data for testing and demonstration
 * @param {number} [days=2000] - Number of days to generate data for
 * @param {Object} [options={}] - Configuration options
 * @param {number} [options.startPrice=100] - Starting price for the first candle
 * @param {Date} [options.startDate=new Date('2024-01-01')] - Starting date for data generation
 * @param {number} [options.volatility=6] - Price volatility factor (higher = more volatile)
 * @param {number} [options.volumeMin=500000] - Minimum volume per candle
 * @param {number} [options.volumeMax=2500000] - Maximum volume per candle
 * @returns {Array<Object>} Array of stock data objects with OHLCV properties
 * @returns {string} returns[].date - Date in YYYY-MM-DD format
 * @returns {number} returns[].open - Opening price
 * @returns {number} returns[].high - Highest price
 * @returns {number} returns[].low - Lowest price
 * @returns {number} returns[].close - Closing price
 * @returns {number} returns[].volume - Trading volume
 * @example
 * // Generate 100 days of data with custom options
 * const data = generateStockData(100, {
 *   startPrice: 50,
 *   volatility: 3,
 *   startDate: new Date('2024-06-01')
 * });
 */
export const generateStockData = (days = 2000, options = {}) => {
	const {
		startPrice = 100,
		startDate = new Date('2024-01-01'),
		volatility = 6,
		volumeMin = 500000,
		volumeMax = 2500000
	} = options;

	const data = [];
	let price = startPrice;
	
	for (let i = 0; i < days; i++) {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		
		const change = (Math.random() - 0.5) * volatility; // Volatility control
		const open = price;
		const close = price + change;
		const high = Math.max(open, close) + Math.random() * 3;
		const low = Math.min(open, close) - Math.random() * 3;
		const volume = Math.floor(Math.random() * (volumeMax - volumeMin)) + volumeMin;
		
		data.push({
			date: date.toISOString().split('T')[0],
			open: parseFloat(open.toFixed(2)),
			high: parseFloat(high.toFixed(2)),
			low: parseFloat(low.toFixed(2)),
			close: parseFloat(close.toFixed(2)),
			volume
		});
		
		price = close;
	}
	
	return data;
};

/**
 * Calculates technical indicators from stock data
 * @param {Array<Object>} data - Stock data array with OHLCV properties
 * @param {Object} data[].close - Closing price for each data point
 * @param {Object} data[].volume - Trading volume for each data point
 * @param {number} [period=20] - Period for calculations (number of candles to include)
 * @returns {Object|null} Technical indicators object, null if insufficient data
 * @returns {number} returns.sma - Simple Moving Average over the specified period
 * @returns {number} returns.avgVolume - Average volume over the specified period
 * @example
 * // Calculate 14-period indicators
 * const indicators = calculateTechnicalIndicators(stockData, 14);
 * if (indicators) {
 *   console.log(`SMA: ${indicators.sma}, Avg Volume: ${indicators.avgVolume}`);
 * }
 */
export const calculateTechnicalIndicators = (data, period = 20) => {
	if (!data || data.length < period) return null;
	
	const closes = data.map(d => d.close);
	const volumes = data.map(d => d.volume);
	
	// Simple Moving Average
	const sma = closes.slice(-period).reduce((sum, price) => sum + price, 0) / period;
	
	// Average Volume
	const avgVolume = volumes.slice(-period).reduce((sum, vol) => sum + vol, 0) / period;
	
	return {
		sma: parseFloat(sma.toFixed(2)),
		avgVolume: Math.round(avgVolume)
	};
};

/**
 * Filters data for a specific date range
 * @param {Array<Object>} data - Stock data array with date properties
 * @param {Object} data[].date - Date property (string or Date object)
 * @param {string} startDate - Start date in YYYY-MM-DD format (inclusive)
 * @param {string} endDate - End date in YYYY-MM-DD format (inclusive)
 * @returns {Array<Object>} Filtered data array containing only items within the date range
 * @throws {Error} Throws error if date format is invalid
 * @example
 * // Filter data for January 2024
 * const filtered = filterDataByDateRange(stockData, '2024-01-01', '2024-01-31');
 * console.log(`Found ${filtered.length} items in date range`);
 */
export const filterDataByDateRange = (data, startDate, endDate) => {
	return data.filter(item => {
		const itemDate = new Date(item.date);
		const start = new Date(startDate);
		const end = new Date(endDate);
		return itemDate >= start && itemDate <= end;
	});
};
