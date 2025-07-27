import React, { forwardRef, useImperativeHandle } from 'react';
import { indexToX } from '../utils/coordinateUtils';

const SvgXAxis = forwardRef(({ 
	chartBounds,
	visibleData,
	timeGridIndices,
	canvasWidth,
	showGrid = true,
	height = 25 // Dynamic height prop
}, ref) => {
	
	// Expose update method to parent
	useImperativeHandle(ref, () => ({
		updateTimeData: (newVisibleData, newTimeGridIndices) => {
			// Time güncellemeleri otomatik olarak props üzerinden gelecek
		}
	}));

	if (!chartBounds || !visibleData || !timeGridIndices) return null;

	// Türkçe ay isimleri
	const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 
	                   'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

	const timeLines = timeGridIndices.map(dataIndex => {
		if (!visibleData[dataIndex]) return null;
		
		const x = indexToX(dataIndex, canvasWidth, chartBounds.left);
		
		// Türkçe tarih formatı
		let dateStr = 'N/A';
		try {
			const dateValue = visibleData[dataIndex].date;
			if (dateValue instanceof Date) {
				// Real data: Date object from JSON - Türkiye formatında kısa ay
				const day = dateValue.getDate();
				const month = monthNames[dateValue.getMonth()];
				dateStr = `${day} ${month}`;
			} else if (typeof dateValue === 'string') {
				// Mock data: string format
				if (dateValue.includes('T')) {
					// ISO format: "2025-02-10T10:09:00"
					const date = new Date(dateValue);
					const day = date.getDate();
					const month = monthNames[date.getMonth()];
					dateStr = `${day} ${month}`;
				} else {
					// Old format: "2024-01-01" - eski formatı koru
					dateStr = dateValue.split('-').slice(1).join('/');
				}
			}
		} catch (error) {
			console.warn('Date formatting error:', error);
			dateStr = 'N/A';
		}
		
		return {
			x,
			dateStr,
			key: `time-${dataIndex}`
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
