import React, { forwardRef, useImperativeHandle } from 'react';
import { generateYAxisConfig, generateXAxisConfig, AXIS_PRESETS } from '../utils/AxisUtils';

/**
 * @fileoverview SVG Grid component for professional trading charts
 * Provides comprehensive grid system with both horizontal and vertical lines,
 * professional styling, and responsive design.
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
 * @typedef {Object} GridLine
 * @property {number} x - X coordinate for vertical lines
 * @property {number} y - Y coordinate for horizontal lines
 * @property {string|number} price - Price value for horizontal lines
 * @property {string} key - Unique key for React rendering
 * @property {boolean} isMainTick - Whether this is a major tick line
 */

/**
 * SVG-based grid component for displaying comprehensive chart grid lines.
 * Features both horizontal (price) and vertical (time) grid lines with
 * professional styling, customizable density, and responsive design.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {ChartBounds} props.chartBounds - Chart area boundaries for positioning
 * @param {StockCandle[]} props.visibleData - Array of currently visible stock data
 * @param {TimeGridIndex[]} props.timeGridIndices - Array of time grid positions and labels
 * @param {number} props.canvasWidth - Width per candle in pixels for coordinate calculation
 * @param {number} props.priceMin - Minimum price value in the visible range
 * @param {number} props.priceMax - Maximum price value in the visible range
 * @param {number} props.priceDiff - Price range difference (priceMax - priceMin)
 * @param {number} [props.gridLines=8] - Number of horizontal grid lines to display
 * @param {boolean} [props.showGrid=true] - Whether to display grid lines
 * @param {React.Ref} ref - Forward ref for imperative updates
 * @returns {React.ReactElement|null} SVG grid element or null if no chart bounds
 * 
 * @example
 * // Complete grid system
 * const gridRef = useRef();
 * 
 * <SvgGrid
 *   ref={gridRef}
 *   chartBounds={{ top: 50, bottom: 400, left: 50, right: 600 }}
 *   visibleData={candleData}
 *   timeGridIndices={timeIndices}
 *   canvasWidth={8}
 *   priceMin={100.50}
 *   priceMax={105.75}
 *   priceDiff={5.25}
 *   gridLines={10}
 *   showGrid={true}
 * />
 * 
 * @example
 * // Grid disabled
 * <SvgGrid
 *   chartBounds={chartBounds}
 *   visibleData={visibleData}
 *   timeGridIndices={timeIndices}
 *   canvasWidth={candleWidth}
 *   priceMin={priceRange.min}
 *   priceMax={priceRange.max}
 *   priceDiff={priceRange.diff}
 *   showGrid={false}
 * />
 * 
 * @example
 * // Update grid imperatively
 * useEffect(() => {
 *   gridRef.current?.updateGrid();
 * }, [dataChanged, priceRangeChanged]);
 * 
 * @throws {Error} No errors thrown, gracefully handles invalid props
 * @see {@link indexToX} Used for coordinate calculations
 * @see {@link https://github.com/cagdaskayalar/pixistockchart|GitHub Repository}
 */
const SvgGrid = forwardRef(({ 
	chartBounds,
	priceMin,
	priceMax,
	priceDiff,
	visibleData,
	timeGridIndices,
	canvasWidth,
	gridLines = 8,
	showGrid = true 
}, ref) => {
	/**
	 * Exposes updateGrid method to parent component via imperative handle
	 * @type {Object}
	 * @property {function} updateGrid - Updates grid data for both price and time axes
	 */
	useImperativeHandle(ref, () => ({
		/**
		 * Updates grid data for both price and time dimensions (currently handled via props)
		 * @param {PriceUpdateData} newPrices - New price range data
		 * @param {TimeUpdateData} newTimeData - New time grid data
		 * @returns {void}
		 * @deprecated Grid updates are now handled automatically via props
		 * 
		 * @example
		 * // Update grid data (handled automatically via props)
		 * gridRef.current.updateGrid(
		 *   { priceMin: 90, priceMax: 110, priceDiff: 20 },
		 *   { visibleData: newData, timeGridIndices: newIndices, canvasWidth: 10 }
		 * );
		 */
		updateGrid: (newPrices, newTimeData) => {
			// Grid güncellemeleri otomatik olarak props üzerinden gelecek
		}
	}));

	if (!chartBounds || priceDiff === 0 || !visibleData || !timeGridIndices || !showGrid) return null;

	/**
	 * @type {number}
	 * @description Chart dimensions for rendering calculations
	 */
	const chartHeight = chartBounds.bottom - chartBounds.top;
	const chartWidth = chartBounds.right - chartBounds.left;

	/**
	 * @type {Object}
	 * @description Complete Y-axis configuration using centralized AxisUtils
	 */
	const yAxisConfig = generateYAxisConfig({
		chartBounds,
		priceMin,
		priceMax,
		desiredTickCount: Math.max(gridLines, 10),
		minTickSpacing: 45, // Increased for better grid readability
		maxPriceTicks: AXIS_PRESETS.PRICE_AXIS.maxPriceTicks
	});

	/**
	 * @type {Object}
	 * @description Complete X-axis configuration using centralized AxisUtils
	 */
	const xAxisConfig = generateXAxisConfig({
		chartBounds,
		timeGridIndices,
		canvasWidth,
		minTickSpacing: 45, // Grid spacing (different from axis labels)
		maxTimeTicks: 12
	});

	/**
	 * @type {GridLine[]}
	 * @description Horizontal price grid lines with D3-generated positions
	 */
	const priceLines = yAxisConfig.priceLines.map(line => ({
		...line,
		isMainTick: true
	}));

	/**
	 * @type {GridLine[]}
	 * @description Vertical time grid lines with optimized positions
	 */
	const timeLines = xAxisConfig.timeTicks.map(tick => ({
		x: tick.position,
		key: tick.key,
		isMainTick: true
	}));

	// Minor grid calculation (ara çizgiler için)
	const minorGridSize = 20; // px cinsinden minor grid boyutu

	return (
		<div style={{
			position: 'absolute',
			left: chartBounds.left,
			top: chartBounds.top,
			width: chartWidth,
			height: chartHeight,
			pointerEvents: 'none',
			zIndex: 1 // Chart'ın arkasında, crosshair'in önünde
		}}>
			<svg
				width={chartWidth}
				height={chartHeight}
				style={{
					position: 'absolute',
					top: 0,
					left: 0
				}}
			>
				{/* SVG Patterns Definition */}
				<defs>
					{/* Minor grid pattern - küçük kareler */}
					<pattern 
						id="minorGrid" 
						width={minorGridSize} 
						height={minorGridSize} 
						patternUnits="userSpaceOnUse"
					>
						<path 
							d={`M ${minorGridSize} 0 L 0 0 0 ${minorGridSize}`} 
							fill="none" 
							stroke="#222222" 
							strokeWidth="0.5"
							opacity="0.2"
						/>
					</pattern>
					
					{/* Major grid pattern - ana çizgiler için */}
					<pattern 
						id="majorGrid" 
						width={chartWidth} 
						height={chartHeight} 
						patternUnits="userSpaceOnUse"
					>
						{/* Horizontal major lines */}
						{priceLines.map(line => (
							<line
								key={`major-h-${line.key}`}
								x1="0"
								y1={line.y - chartBounds.top}
								x2={chartWidth}
								y2={line.y - chartBounds.top}
								stroke="#444444"
								strokeWidth="1"
								opacity="0.4"
							/>
						))}
						
						{/* Vertical major lines */}
						{timeLines.map(line => (
							<line
								key={`major-v-${line.key}`}
								x1={line.x - chartBounds.left}
								y1="0"
								x2={line.x - chartBounds.left}
								y2={chartHeight}
								stroke="#444444"
								strokeWidth="1"
								opacity="0.4"
							/>
						))}
					</pattern>
				</defs>
				
				{/* Minor grid background */}
				<rect
					x="0"
					y="0"
					width={chartWidth}
					height={chartHeight}
					fill="url(#minorGrid)"
				/>
				
				{/* Major grid overlay */}
				<rect
					x="0"
					y="0"
					width={chartWidth}
					height={chartHeight}
					fill="url(#majorGrid)"
				/>
			</svg>
		</div>
	);
});

SvgGrid.displayName = 'SvgGrid';

export default SvgGrid;
