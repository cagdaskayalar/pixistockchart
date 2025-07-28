import React, { forwardRef, useImperativeHandle } from 'react';
import { generateYAxisConfig, AXIS_PRESETS } from '../utils/AxisUtils';

/**
 * @fileoverview SVG Y-Axis component for professional trading charts
 * Provides price-based vertical axis with dynamic scaling,
 * responsive design, and professional grid lines.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.3.0
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
 * @typedef {Object} TickInfo
 * @property {number} value - The tick value (price or coordinate)
 * @property {string} formattedValue - Human-readable formatted string
 * @property {number} position - Y coordinate for price ticks, X coordinate for time ticks
 * @property {string} key - Unique key for React rendering
 */

/**
 * @typedef {Object} PriceGridLine
 * @property {number} y - Y coordinate of the price line
 * @property {string} price - Formatted price string for display
 * @property {string} key - Unique key for React rendering
 */

/**
 * SVG-based Y-axis component for displaying price labels and horizontal grid lines.
 * Features dynamic price scaling, responsive text sizing, and professional
 * trading chart appearance with customizable grid display.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {ChartBounds} props.chartBounds - Chart area boundaries for positioning
 * @param {number} props.priceMin - Minimum price value in the visible range
 * @param {number} props.priceMax - Maximum price value in the visible range
 * @param {number} props.priceDiff - Price range difference (priceMax - priceMin)
 * @param {number} [props.gridLines=8] - Number of horizontal grid lines to display
 * @param {boolean} [props.showGrid=true] - Whether to display horizontal grid lines
 * @param {number} [props.width=50] - Width of the Y-axis area in pixels
 * @param {React.Ref} ref - Forward ref for imperative updates
 * @returns {React.ReactElement|null} SVG Y-axis element or null if no chart bounds
 * 
 * @example
 * // Basic Y-axis usage
 * const yAxisRef = useRef();
 * 
 * <SvgYAxis
 *   ref={yAxisRef}
 *   chartBounds={{ top: 50, bottom: 400, left: 50, right: 600 }}
 *   priceMin={100.50}
 *   priceMax={105.75}
 *   priceDiff={5.25}
 *   gridLines={10}
 *   showGrid={true}
 *   width={60}
 * />
 * 
 * @example
 * // Without grid lines
 * <SvgYAxis
 *   chartBounds={chartBounds}
 *   priceMin={priceRange.min}
 *   priceMax={priceRange.max}
 *   priceDiff={priceRange.diff}
 *   showGrid={false}
 * />
 * 
 * @example
 * // Update axis imperatively
 * useEffect(() => {
 *   yAxisRef.current?.forceUpdate();
 * }, [priceDataChanged]);
 * 
 * @throws {Error} No errors thrown, gracefully handles invalid props
 * @see {@link https://github.com/cagdaskayalar/pixistockchart|GitHub Repository}
 */

/**
 * @typedef {Object} PriceGridLine
 * @property {number} y - Y coordinate for the grid line
 * @property {string} price - Formatted price string with 2 decimal places
 * @property {string} key - Unique key for React rendering
 */

/**
 * SVG-based Y-axis component for professional trading charts.
 * Features dynamic price scaling, responsive design, and clean grid lines.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {ChartBounds} props.chartBounds - Chart area boundaries
 * @param {number} props.priceMin - Minimum price in the visible range
 * @param {number} props.priceMax - Maximum price in the visible range
 * @param {number} props.priceDiff - Price difference (max - min)
 * @param {number} [props.gridLines=8] - Number of horizontal grid lines
 * @param {boolean} [props.showGrid=true] - Whether to show grid lines
 * @param {number} [props.width=50] - Width of the Y-axis area in pixels
 * @param {React.Ref} ref - Forward ref for imperative updates
 * @returns {React.ReactElement|null} Y-axis component or null if invalid price range
 * 
 * @example
 * // Basic usage with required props
 * const yAxisRef = useRef();
 * 
 * <SvgYAxis
 *   ref={yAxisRef}
 *   chartBounds={{ top: 50, bottom: 400, left: 50, right: 600 }}
 *   priceMin={95.50}
 *   priceMax={104.50}
 *   priceDiff={9.00}
 *   gridLines={8}
 *   showGrid={true}
 *   width={60}
 * />
 * 
 * @example
 * // Update price range programmatically
 * yAxisRef.current?.updatePrices(newMin, newMax, newDiff);
 * 
 * @see {@link https://github.com/cagdaskayalar/pixistockchart|GitHub Repository}
 */
const SvgYAxis = forwardRef(({ 
	chartBounds,
	priceMin,
	priceMax,
	priceDiff,
	gridLines = 8,
	showGrid = true,
	width = 50 // Dynamic width prop
}, ref) => {
	/**
	 * Exposes updatePrices method to parent component via imperative handle
	 * @type {Object}
	 * @property {function} updatePrices - Updates price range for the axis
	 */
	useImperativeHandle(ref, () => ({
		/**
		 * Updates price range for the Y-axis (currently handled via props)
		 * @param {number} newPriceMin - New minimum price
		 * @param {number} newPriceMax - New maximum price
		 * @param {number} newPriceDiff - New price difference
		 * @returns {void}
		 * @deprecated Price updates are now handled automatically via props
		 * 
		 * @example
		 * // Update price range (handled automatically via props)
		 * yAxisRef.current.updatePrices(95.50, 104.50, 9.00);
		 */
		updatePrices: (newPriceMin, newPriceMax, newPriceDiff) => {
			// Price güncellemeleri otomatik olarak props üzerinden gelecek
		}
	}));

	if (!chartBounds || priceDiff === 0) return null;

	/**
	 * @type {Object}
	 * @description Complete Y-axis configuration using centralized AxisUtils
	 */
	const yAxisConfig = generateYAxisConfig({
		chartBounds,
		priceMin,
		priceMax,
		desiredTickCount: gridLines,
		minTickSpacing: AXIS_PRESETS.PRICE_AXIS.minTickSpacing,
		maxPriceTicks: AXIS_PRESETS.PRICE_AXIS.maxPriceTicks
	});

	const { priceLines } = yAxisConfig;

	return (
		<div style={{
			position: 'absolute',
			right: 0,
			top: 0,
			width: `${width}px`,
			height: '100%',
			pointerEvents: 'none',
			zIndex: 5
		}}>
			<svg
				width={width}
				height="100%"
				style={{
					position: 'absolute',
					top: 0,
					left: 0
				}}
			>
				{/* Y-Axis white line - chart'ın sol kenarından */}
				<line
					x1="0"
					y1={chartBounds.top}
					x2="0"
					y2={chartBounds.bottom}
					stroke="#ffffff"
					strokeWidth="2"
					opacity="1"
				/>
				
				{/* Price labels and inner ticks */}
				{priceLines.map(line => (
					<g key={line.key}>
						{/* Inner tick mark - chart içine doğru */}
						<line
							x1="0"
							y1={line.y}
							x2="8"
							y2={line.y}
							stroke="#ffffff"
							strokeWidth="1"
							opacity="0.8"
						/>
						
						{/* Price text - sağ tarafta */}
						<text
							x="12"
							y={line.y + 4}
							textAnchor="start"
							fontSize="11"
							fill="#ffffff"
							fontFamily="Arial, sans-serif"
							fontWeight="400"
						>
							{line.price}
						</text>
					</g>
				))}
			</svg>
		</div>
	);
});

SvgYAxis.displayName = 'SvgYAxis';

export default SvgYAxis;
