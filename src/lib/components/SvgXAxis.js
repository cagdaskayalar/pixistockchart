import React, { forwardRef, useImperativeHandle } from 'react';
import { generateXAxisConfig, formatTurkishDate, TURKISH_MONTH_NAMES, AXIS_PRESETS } from '../utils/AxisUtils';

/**
 * @fileoverview SVG X-Axis component for professional trading charts
 * Provides time-based horizontal axis with Turkish date formatting,
 * responsive design, and professional grid lines.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.3.0
 * @since 2024-01-01
 */

/**
 * @typedef {Object} StockCandle
 * @property {Date|string} date - Date of the candle (Date object or ISO string)
 * @property {number} open - Opening price
 * @property {number} high - Highest price  
 * @property {number} low - Lowest price
 * @property {number} close - Closing price
 * @property {number} [volume] - Trading volume (optional)
 */

/**
 * @typedef {Object} ChartBounds
 * @property {number} top - Top boundary of the chart area in pixels
 * @property {number} bottom - Bottom boundary of the chart area in pixels
 * @property {number} left - Left boundary of the chart area in pixels
 * @property {number} right - Right boundary of the chart area in pixels
 */

/**
 * @typedef {Object} TimeGridIndex
 * @property {number} index - Index in the visible data array
 * @property {number} x - X coordinate for the grid line
 * @property {string} label - Formatted time label for display
 */

/**
 * @typedef {Object} TickInfo
 * @property {number} value - The tick value (price or coordinate)
 * @property {string} formattedValue - Human-readable formatted string
 * @property {number} position - Y coordinate for price ticks, X coordinate for time ticks
 * @property {string} key - Unique key for React rendering
 */

/**
 * @typedef {Object} TimeGridLine
 * @property {number} x - X coordinate for the grid line
 * @property {string} dateStr - Formatted date string in Turkish
 * @property {string} key - Unique key for React rendering
 */

/**
 * SVG-based X-axis component for displaying time labels and grid lines.
 * Features Turkish date/time formatting, responsive text sizing, and
 * professional trading chart appearance with customizable grid display.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {ChartBounds} props.chartBounds - Chart area boundaries for positioning
 * @param {StockCandle[]} props.visibleData - Array of currently visible stock data
 * @param {TimeGridIndex[]|number[]} props.timeGridIndices - Array of time grid positions and labels or simple indices
 * @param {number} props.canvasWidth - Width per candle in pixels for coordinate calculation
 * @param {boolean} [props.showGrid=true] - Whether to display vertical grid lines
 * @param {number} [props.height=25] - Height of the X-axis area in pixels
 * @param {React.Ref} ref - Forward ref for imperative updates
 * @returns {React.ReactElement|null} SVG X-axis element or null if no chart bounds
 * 
 * @example
 * // Basic X-axis usage
 * const xAxisRef = useRef();
 * 
 * <SvgXAxis
 *   ref={xAxisRef}
 *   chartBounds={{ top: 50, bottom: 400, left: 50, right: 600 }}
 *   visibleData={candleData}
 *   timeGridIndices={[0, 10, 20, 30]}
 *   canvasWidth={8}
 *   showGrid={true}
 *   height={30}
 * />
 * 
 * @example
 * // Without grid lines
 * <SvgXAxis
 *   chartBounds={chartBounds}
 *   visibleData={visibleData}
 *   timeGridIndices={timeIndices}
 *   canvasWidth={candleWidth}
 *   showGrid={false}
 * />
 * 
 * @example
 * // Update axis imperatively
 * useEffect(() => {
 *   xAxisRef.current?.forceUpdate();
 * }, [dataChanged]);
 * 
 * @throws {Error} No errors thrown, gracefully handles invalid props
 * @see {@link indexToX} Used for coordinate calculations
 * @see {@link https://github.com/cagdaskayalar/pixistockchart|GitHub Repository}
 */
const SvgXAxis = forwardRef(({
	chartBounds,
	visibleData,
	timeGridIndices,
	canvasWidth,
	showGrid = true,
	height = 25
}, ref) => {
	/**
	 * Exposes updateTimeData method to parent component via imperative handle
	 * @type {Object}
	 * @property {function} updateTimeData - Updates time data for the axis
	 */
	useImperativeHandle(ref, () => ({
		/**
		 * Updates time data for the X-axis (currently handled via props)
		 * @param {StockCandle[]} newVisibleData - New visible data array
		 * @param {number[]} newTimeGridIndices - New time grid indices
		 * @returns {void}
		 * @deprecated Time updates are now handled automatically via props
		 * 
		 * @example
		 * // Update time data (handled automatically via props)
		 * xAxisRef.current.updateTimeData(newVisibleData, newTimeGridIndices);
		 */
		updateTimeData: (newVisibleData, newTimeGridIndices) => {
			// Time güncellemeleri otomatik olarak props üzerinden gelecek
		}
	}));

	if (!chartBounds || !visibleData || !timeGridIndices) return null;

	/**
	 * @type {Object}
	 * @description Complete X-axis configuration using centralized AxisUtils
	 */
	const xAxisConfig = generateXAxisConfig({
		chartBounds,
		timeGridIndices,
		canvasWidth,
		minTickSpacing: AXIS_PRESETS.TIME_AXIS.minTickSpacing,
		maxTimeTicks: AXIS_PRESETS.TIME_AXIS.maxTimeTicks
	});

	const { timeTicks } = xAxisConfig;

	/**
	 * @type {TimeGridLine[]}
	 * @description Array of time grid lines with D3-optimized positions and Turkish formatted dates
	 */
	const timeLines = timeTicks.map(tick => {
		const dataIndex = tick.value;
		if (!visibleData[dataIndex]) return null;
		
		// Use the optimized position from D3 tick system
		const x = tick.position;
		
		// Use centralized Turkish date formatting
		const dateStr = formatTurkishDate(visibleData[dataIndex].date, TURKISH_MONTH_NAMES);
		
		return {
			x,
			dateStr,
			key: tick.key
		};
	}).filter(Boolean);

	return (
		<div style={{
			position: 'absolute',
			bottom: 0,
			left: 0,
			width: '100%',
			height: `${height}px`,
			pointerEvents: 'none',
			zIndex: 5
		}}>
			<svg
				width="100%"
				height={height}
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0
				}}
			>
				{/* X-Axis white line - chart'ın alt kenarından */}
				<line
					x1={chartBounds.left}
					y1="0"
					x2={chartBounds.right}
					y2="0"
					stroke="#ffffff"
					strokeWidth="2"
					opacity="1"
				/>
				
				{/* Date labels and inner ticks */}
				{timeLines.map(line => (
					<g key={line.key}>
						{/* Inner tick mark - aşağıya doğru */}
						<line
							x1={line.x}
							y1="0"
							x2={line.x}
							y2="8"
							stroke="#ffffff"
							strokeWidth="1"
							opacity="0.8"
						/>
						
						{/* Date text - alt tarafta */}
						<text
							x={line.x}
							y={height - 6}
							textAnchor="middle"
							fontSize="11"
							fill="#ffffff"
							fontFamily="Arial, sans-serif"
							fontWeight="400"
						>
							{line.dateStr}
						</text>
					</g>
				))}
			</svg>
		</div>
	);
});

SvgXAxis.displayName = 'SvgXAxis';

export default SvgXAxis;
