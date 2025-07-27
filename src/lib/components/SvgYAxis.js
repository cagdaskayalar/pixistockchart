import React, { forwardRef, useImperativeHandle } from 'react';

const SvgYAxis = forwardRef(({ 
	chartBounds,
	priceMin,
	priceMax,
	priceDiff,
	gridLines = 8,
	showGrid = true,
	width = 50 // Dynamic width prop
}, ref) => {
	
	// Expose update method to parent
	useImperativeHandle(ref, () => ({
		updatePrices: (newPriceMin, newPriceMax, newPriceDiff) => {
			// Price güncellemeleri otomatik olarak props üzerinden gelecek
		}
	}));

	if (!chartBounds || priceDiff === 0) return null;

	// Chart yüksekliğinin %1.25'i kadar padding (üst ve alt için)
	const verticalPadding = (chartBounds.bottom - chartBounds.top) * 0.0125;
	const effectiveHeight = (chartBounds.bottom - chartBounds.top) - (2 * verticalPadding);

	const priceLines = [];
	for (let i = 0; i <= gridLines; i++) {
		const y = chartBounds.top + verticalPadding + (effectiveHeight / gridLines) * i;
		const price = priceMax - (priceDiff / gridLines) * i;
		
		priceLines.push({
			y,
			price: price.toFixed(2),
			key: `price-${i}`
		});
	}

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
