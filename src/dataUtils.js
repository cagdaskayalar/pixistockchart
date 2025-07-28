/**
 * @fileoverview Data utilities for fetching and processing OHLC stock data
 * Provides functions for fetching stock data from JSON files, handling different data formats,
 * and converting raw data to standardized OHLC format for chart consumption.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.3.0
 * @since 2024-01-01
 */

/**
 * @typedef {Object} StockCandle
 * @property {Date} date - Date object representing the candle timestamp
 * @property {number} open - Opening price for the time period
 * @property {number} high - Highest price during the time period
 * @property {number} low - Lowest price during the time period
 * @property {number} close - Closing price for the time period
 * @property {number} [volume] - Trading volume (optional)
 */

/**
 * @typedef {Object} ParallelDataFormat
 * @property {Object<string, string>} Time - Object with timestamp values
 * @property {Object<string, number>} Open - Object with opening prices
 * @property {Object<string, number>} High - Object with high prices
 * @property {Object<string, number>} Low - Object with low prices
 * @property {Object<string, number>} Close - Object with closing prices
 */

/**
 * @typedef {Object} ArrayDataFormat
 * @property {string} Time - Timestamp string
 * @property {number} Open - Opening price
 * @property {number} High - High price
 * @property {number} Low - Low price
 * @property {number} Close - Closing price
 */

/**
 * Fetches OHLC stock data from a JSON URL and converts it to standardized format.
 * Supports both parallel object format and array format data structures.
 * Handles HTTP errors and content-type validation for robust data fetching.
 * 
 * @async
 * @function fetchOHLCData
 * @param {string} url - URL pointing to the JSON data file
 * @returns {Promise<StockCandle[]>} Promise resolving to array of standardized OHLC data
 * 
 * @throws {Error} HTTP error if response status is not ok
 * @throws {Error} Content-type error if response is not JSON
 * @throws {Error} Data format error if data structure is invalid
 * 
 * @example
 * // Fetch data from a URL
 * try {
 *   const data = await fetchOHLCData('/api/stock-data.json');
 *   console.log(`Loaded ${data.length} candles`);
 *   console.log('First candle:', data[0]);
 * } catch (error) {
 *   console.error('Failed to fetch data:', error.message);
 * }
 * 
 * @example
 * // Handle different data formats automatically
 * const parallelFormatData = await fetchOHLCData('/parallel-format.json');
 * const arrayFormatData = await fetchOHLCData('/array-format.json');
 * // Both return the same StockCandle[] format
 * 
 * @see {@link getData} Convenience function for default data source
 */
export async function fetchOHLCData(url) {
  const response = await fetch(url);
  
  // Response'u kontrol et
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Content-Type kontrolü
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Expected JSON, got:', contentType);
    console.error('Response text:', text.substring(0, 200));
    throw new Error(`Expected JSON, got: ${contentType}`);
  }
  
  const rawData = await response.json();
  // Dosya paralel objeler �eklinde: Time, Open, High, Low, Close
  if (rawData.Time && rawData.Open && rawData.High && rawData.Low && rawData.Close) {
	const keys = Object.keys(rawData.Time);
	return keys.map(i => ({
	  date: new Date(rawData.Time[i]),
	  open: +rawData.Open[i],
	  high: +rawData.High[i],
	  low: +rawData.Low[i],
	  close: +rawData.Close[i]
	}));
  }
  // Eski array veya {data: array} formatt için fallback
  const arr = Array.isArray(rawData) ? rawData : rawData.data;
  if (!Array.isArray(arr)) throw new Error("Veri formatı hatalı: Array veya paralel objeler bekleniyor.");
  return arr.map(d => ({
	date: new Date(d.Time),
	open: +d.Open,
	high: +d.High,
	low: +d.Low,
	close: +d.Close
  }));
}

/**
 * Convenience function to fetch default YKBNK stock data.
 * Automatically constructs the correct URL based on environment (development vs production).
 * Uses environment variables to determine the base URL for data fetching.
 * 
 * @function getData
 * @returns {Promise<StockCandle[]>} Promise resolving to YKBNK stock data array
 * 
 * @example
 * // Fetch default YKBNK data
 * const stockData = await getData();
 * console.log(`Loaded YKBNK data: ${stockData.length} candles`);
 * 
 * @example
 * // Use in React component
 * useEffect(() => {
 *   getData()
 *     .then(data => setStockData(data))
 *     .catch(error => console.error('Data load failed:', error));
 * }, []);
 * 
 * @throws {Error} Same errors as fetchOHLCData function
 * @see {@link fetchOHLCData} Used internally for data fetching
 */
export function getData() {
	// Public klasörden dosya yolu - process.env.PUBLIC_URL kullan
	const baseUrl = process.env.NODE_ENV === 'development' 
		? 'http://localhost:3000' 
		: process.env.PUBLIC_URL || '';
	return fetchOHLCData(`${baseUrl}/cagdaskayalar/pixistockchart/data/YKBNK_Min1.json`);
}
