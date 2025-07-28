import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { isPointInChartBounds, xToIndex } from '../utils/coordinateUtils';
import { yToPrice } from '../utils/priceCalculations';

/**
 * @fileoverview SVG Crosshair component for professional trading charts
 * Provides interactive crosshair functionality with Turkish localization,
 * smart candle snapping, and real-time price/time display.
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
 * @property {number} volume - Trading volume
 */

/**
 * @typedef {Object} ChartBounds
 * @property {number} top - Top boundary of the chart area
 * @property {number} bottom - Bottom boundary of the chart area
 * @property {number} left - Left boundary of the chart area
 * @property {number} right - Right boundary of the chart area
 */

/**
 * @typedef {Object} ChartMargin
 * @property {number} top - Top margin in pixels
 * @property {number} bottom - Bottom margin in pixels
 * @property {number} left - Left margin in pixels
 * @property {number} right - Right margin in pixels
 */

/**
 * @typedef {Object} ViewStateRef
 * @property {Object} current - Current view state object
 * @property {Object} current.priceCalculations - Price calculation parameters
 * @property {number} current.priceCalculations.priceMin - Minimum visible price
 * @property {number} current.priceCalculations.priceDiff - Price range difference
 * @property {number} current.priceCalculations.chartTop - Chart top coordinate
 * @property {number} current.priceCalculations.chartHeight - Chart height
 * @property {number} current.canvasWidth - Width per candle in pixels
 * @property {number} current.maxCandles - Maximum visible candles
 * @property {number} current.startIndex - Starting data index for visible range
 */

/**
 * @typedef {Object} CrosshairState
 * @property {boolean} visible - Whether crosshair is currently visible
 * @property {number} x - X coordinate of crosshair
 * @property {number} y - Y coordinate of crosshair
 * @property {number} price - Price value at crosshair position
 * @property {string} time - Formatted time string for display
 * @property {number} dataIndex - Index in the data array
 */

/**
 * @callback OnCandleHoverCallback
 * @param {StockCandle} candle - The candle being hovered
 * @param {number} dataIndex - Index of the candle in visible data
 * @returns {void}
 */

/**
 * Interactive SVG crosshair component for professional trading charts.
 * Features Turkish localization, smart candle snapping, and real-time price display.
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {StockCandle[]} props.stockData - Array of stock candle data
 * @param {ViewStateRef} props.viewState - Ref object containing current view state
 * @param {ChartBounds} props.chartBounds - Chart area boundaries
 * @param {ChartMargin} props.margin - Chart margins for positioning
 * @param {OnCandleHoverCallback} [props.onCandleHover] - Callback when hovering over candles
 * @param {React.Ref} ref - Forward ref for imperative updates
 * @returns {React.ReactElement|null} SVG crosshair element or null if no chart bounds
 * 
 * @example
 * // Basic usage with required props
 * const crosshairRef = useRef();
 * 
 * <SvgCrosshair
 *   ref={crosshairRef}
 *   stockData={candleData}
 *   viewState={viewStateRef}
 *   chartBounds={{ top: 50, bottom: 400, left: 50, right: 600 }}
 *   margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
 *   onCandleHover={(candle, index) => console.log('Hovered candle:', candle)}
 * />
 * 
 * @example
 * // Update crosshair programmatically
 * crosshairRef.current?.updateCrosshair(mouseX, mouseY, true);
 * 
 * @see {@link https://github.com/cagdaskayalar/pixistockchart|GitHub Repository}
 */
const SvgCrosshair = forwardRef(({ 
	stockData, 
	viewState, 
	chartBounds, 
	margin,
	onCandleHover 
}, ref) => {
	/**
	 * @type {CrosshairState}
	 * @description Internal state for crosshair position and visibility
	 */
	const [crosshair, setCrosshair] = useState({
		visible: false,
		x: 0,
		y: 0,
		price: 0,
		time: '',
		dataIndex: -1
	});

	/**
	 * @type {React.RefObject<SVGSVGElement>}
	 * @description Reference to the SVG element for direct DOM access
	 */
	const svgRef = useRef(null);

	/**
	 * Exposes updateCrosshair method to parent component via imperative handle
	 * @type {Object}
	 * @property {function} updateCrosshair - Updates crosshair position and visibility
	 */
	useImperativeHandle(ref, () => ({
		/**
		 * Updates crosshair position based on mouse coordinates
		 * @param {number} mouseX - Mouse X coordinate in pixels
		 * @param {number} mouseY - Mouse Y coordinate in pixels  
		 * @param {boolean} enabled - Whether crosshair should be enabled
		 * @returns {void}
		 * @throws {Error} No error thrown, gracefully handles invalid states
		 * 
		 * @example
		 * // Enable crosshair at specific position
		 * crosshairRef.current.updateCrosshair(250, 150, true);
		 * 
		 * @example
		 * // Disable crosshair
		 * crosshairRef.current.updateCrosshair(0, 0, false);
		 */
		updateCrosshair: (mouseX, mouseY, enabled) => {
			if (!enabled || !stockData || !viewState.current || !chartBounds) {
				setCrosshair(prev => ({ ...prev, visible: false }));
				return;
			}

			// Chart bounds kontrolü
			if (!isPointInChartBounds(mouseX, mouseY, chartBounds)) {
				setCrosshair(prev => ({ ...prev, visible: false }));
				return;
			}

			// Price calculation values check
			if (!viewState.current.priceCalculations) {
				setCrosshair(prev => ({ ...prev, visible: false }));
				return;
			}

			const { priceMin, priceDiff, chartTop, chartHeight } = viewState.current.priceCalculations;

			// Calculate actual price at mouse Y position
			const actualPrice = yToPrice(mouseY, priceMin, priceDiff, chartTop, chartHeight);

			// Hangi muma denk geldiğini hesapla
			const rawIndex = xToIndex(mouseX, viewState.current.canvasWidth, margin.left);
			const dataIndex = Math.max(0, Math.min(rawIndex, viewState.current.maxCandles - 1));
			
			const { startIndex } = viewState.current;
			const endIndex = Math.min(startIndex + viewState.current.maxCandles, stockData.length);
			const visibleData = stockData.slice(startIndex, endIndex);

			if (dataIndex >= 0 && dataIndex < visibleData.length) {
				const candle = visibleData[dataIndex];
				
				// Snap to candle center for X coordinate
				const candleX = margin.left + (dataIndex * viewState.current.canvasWidth) + (viewState.current.canvasWidth / 2);
				
				// Crosshair için sadece HH:MM formatı
				let formattedTime = 'N/A';
				try {
					const dateValue = candle.date;
					if (dateValue instanceof Date) {
						// Real data: Date object from JSON - sadece saat:dakika
						formattedTime = dateValue.toLocaleTimeString('tr-TR', { 
							hour: '2-digit',
							minute: '2-digit',
							hour12: false // 24 saat formatı
						});
					} else if (typeof dateValue === 'string') {
						// Mock data: string format
						if (dateValue.includes('T')) {
							// ISO format: "2025-02-10T10:09:00"
							const date = new Date(dateValue);
							formattedTime = date.toLocaleTimeString('tr-TR', { 
								hour: '2-digit',
								minute: '2-digit',
								hour12: false // 24 saat formatı
							});
						} else {
							// Old format: "2024-01-01" - sadece index göster
							formattedTime = `#${startIndex + dataIndex}`;
						}
					} else {
						// Date yoksa index numarası göster
						formattedTime = `#${startIndex + dataIndex}`;
					}
				} catch (error) {
					console.error('Date formatting error:', error);
					formattedTime = candle.date?.toString() || `#${startIndex + dataIndex}`;
				}

				setCrosshair({
					visible: true,
					x: candleX, // Snap to candle center
					y: mouseY,  // Follow mouse Y exactly
					price: actualPrice, // Use calculated price at mouse Y position
					time: formattedTime,
					dataIndex: startIndex + dataIndex
				});

				// Parent component'e bildir
				if (onCandleHover) {
					onCandleHover(candle, dataIndex);
				}
			}
		}
	}));

	if (!chartBounds) return null;

	return (
		<svg
			ref={svgRef}
			style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%',
				pointerEvents: 'none', // SVG sadece görsel - mouse events'leri PIXI'ye bırak
				zIndex: 10
			}}
		>
			{crosshair.visible && (
				<g>
					{/* Vertical line */}
					<line
						x1={crosshair.x}
						y1={chartBounds.top}
						x2={crosshair.x}
						y2={chartBounds.bottom}
						stroke="#FFD700"
						strokeWidth="1"
						strokeDasharray="2,2"
						opacity="0.8"
					/>
					
					{/* Horizontal line */}
					<line
						x1={chartBounds.left}
						y1={crosshair.y}
						x2={chartBounds.right}
						y2={crosshair.y}
						stroke="#FFD700"
						strokeWidth="1"
						strokeDasharray="2,2"
						opacity="0.8"
					/>

					{/* Price label on Y axis */}
					<g>
						<rect
							x={chartBounds.right}
							y={crosshair.y - 10}
							width="60"
							height="20"
							fill="#FFD700"
							opacity="0.9"
							rx="2"
						/>
						<text
							x={chartBounds.right + 25}
							y={crosshair.y + 4}
							textAnchor="middle"
							fontSize="12"
							fill="#000"
							fontWeight="bold"
						>
							{crosshair.price.toFixed(2)}
						</text>
					</g>

					{/* Time label on X axis */}
					<g>
						<rect
							x={crosshair.x - 40}
							y={chartBounds.bottom}
							width="80"
							height="20"
							fill="#FFD700"
							opacity="0.9"
							rx="2"
						/>
						<text
							x={crosshair.x}
							y={chartBounds.bottom + 15}
							textAnchor="middle"
							fontSize="11"
							fill="#000"
							fontWeight="bold"
						>
							{crosshair.time}
						</text>
					</g>

					{/* Center dot */}
					<circle
						cx={crosshair.x}
						cy={crosshair.y}
						r="3"
						fill="#FFD700"
						stroke="#000"
						strokeWidth="1"
						opacity="0.9"
					/>
				</g>
			)}
		</svg>
	);
});

export default SvgCrosshair;
