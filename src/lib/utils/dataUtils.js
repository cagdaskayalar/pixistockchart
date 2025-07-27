/**
 * Stock data generation utilities
 */

/**
 * Generates sample stock data for testing and demonstration
 * @param {number} days - Number of days to generate data for
 * @param {Object} options - Configuration options
 * @returns {Array} Array of stock data objects
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
 * @param {Array} data - Stock data array
 * @param {number} period - Period for calculations
 * @returns {Object} Technical indicators
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
 * @param {Array} data - Stock data array
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Array} Filtered data
 */
export const filterDataByDateRange = (data, startDate, endDate) => {
	return data.filter(item => {
		const itemDate = new Date(item.date);
		const start = new Date(startDate);
		const end = new Date(endDate);
		return itemDate >= start && itemDate <= end;
	});
};
