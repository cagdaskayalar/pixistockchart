import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { isPointInChartBounds, xToIndex } from '../utils/coordinateUtils';
import { yToPrice } from '../utils/priceCalculations';

const SvgCrosshair = forwardRef(({ 
	stockData, 
	viewState, 
	chartBounds, 
	margin,
	onCandleHover 
}, ref) => {
	const [crosshair, setCrosshair] = useState({
		visible: false,
		x: 0,
		y: 0,
		price: 0,
		time: '',
		dataIndex: -1
	});

	const svgRef = useRef(null);

	// Expose updateCrosshair method to parent
	useImperativeHandle(ref, () => ({
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
							x={chartBounds.right + 2}
							y={crosshair.y - 10}
							width="60"
							height="20"
							fill="#FFD700"
							opacity="0.9"
							rx="2"
						/>
						<text
							x={chartBounds.right + 32}
							y={crosshair.y + 4}
							textAnchor="middle"
							fontSize="12"
							fill="#000"
							fontWeight="bold"
						>
							${crosshair.price.toFixed(2)}
						</text>
					</g>

					{/* Time label on X axis */}
					<g>
						<rect
							x={crosshair.x - 40}
							y={chartBounds.bottom + 2}
							width="80"
							height="20"
							fill="#FFD700"
							opacity="0.9"
							rx="2"
						/>
						<text
							x={crosshair.x}
							y={chartBounds.bottom + 16}
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
