import React, { forwardRef, useImperativeHandle } from 'react';
import { indexToX } from '../utils/coordinateUtils';

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
	
	// Expose update method to parent
	useImperativeHandle(ref, () => ({
		updateGrid: (newPrices, newTimeData) => {
			// Grid güncellemeleri otomatik olarak props üzerinden gelecek
		}
	}));

	if (!chartBounds || priceDiff === 0 || !visibleData || !timeGridIndices || !showGrid) return null;

	// Price lines calculation
	const verticalPadding = (chartBounds.bottom - chartBounds.top) * 0.0125;
	const effectiveHeight = (chartBounds.bottom - chartBounds.top) - (2 * verticalPadding);

	const priceLines = [];
	for (let i = 0; i <= gridLines; i++) {
		const y = chartBounds.top + verticalPadding + (effectiveHeight / gridLines) * i;
		const price = priceMax - (priceDiff / gridLines) * i;
		
		priceLines.push({
			y,
			price: price.toFixed(2),
			key: `price-${i}`,
			isMainTick: true // Ana tick çizgileri
		});
	}

	// Time lines calculation
	const timeLines = timeGridIndices.map(dataIndex => {
		if (!visibleData[dataIndex]) return null;
		
		const x = indexToX(dataIndex, canvasWidth, chartBounds.left);
		
		return {
			x,
			key: `time-${dataIndex}`,
			isMainTick: true // Ana tick çizgileri
		};
	}).filter(Boolean);

	// Minor grid calculation (ara çizgiler için)
	const minorGridSize = 20; // px cinsinden minor grid boyutu
	const chartWidth = chartBounds.right - chartBounds.left;
	const chartHeight = chartBounds.bottom - chartBounds.top;

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
