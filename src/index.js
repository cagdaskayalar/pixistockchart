import React from 'react';
import { createRoot } from 'react-dom/client';
import StockChart from './lib/StockChart';
import ManualViewportStockChart from './lib/ManualViewportStockChart';
import './styles.css';

function App() {
	const [performanceData, setPerformanceData] = React.useState({
		renderTime: 0,
		fps: 0,
		memoryUsage: 0,
		visibleCandles: 0,
		totalCandles: 0,
		candleWidth: 0,
		startIndex: 0,
		priceRange: '$0.00-$0.00'
	});

	// Chart type selection state
	const [chartType, setChartType] = React.useState('pixi'); // 'pixi' or 'viewport'

	const handlePerformanceUpdate = React.useCallback((data) => {
		setPerformanceData(data);
	}, []);

	const handleChartTypeChange = React.useCallback((event) => {
		setChartType(event.target.value);
		console.log('📊 Chart type changed to:', event.target.value);
	}, []);

	return (
		<div className="app-container">					
			{/* Header */}
			<div className="app-header">
				<div className="header-left">
					<span>Professional Trading Chart</span>
					
					{/* Chart Type Selection */}
					<div className="chart-type-selector">
						<label className="radio-option">
							<input
								type="radio"
								name="chartType"
								value="pixi"
								checked={chartType === 'pixi'}
								onChange={handleChartTypeChange}
							/>
							<span className="radio-label">🚀 PIXI.js</span>
						</label>
						<label className="radio-option">
							<input
								type="radio"
								name="chartType"
								value="viewport"
								checked={chartType === 'viewport'}
								onChange={handleChartTypeChange}
							/>
							<span className="radio-label">🎮 Viewport</span>
						</label>
					</div>
				</div>
				
				<div className="performance-metrics">
					<span className="render-time">🚀 Render: {performanceData.renderTime}ms</span>
					<span className="fps">📊 FPS: {performanceData.fps}</span>
					<span className="memory">💾 Memory: {performanceData.memoryUsage}MB</span>
					<span className="candles">🕯️ Candles: {performanceData.visibleCandles}/{performanceData.totalCandles}</span>
					<span className="width">📏 Width: {performanceData.candleWidth}px</span>
					<span className="index">📍 Index: {performanceData.startIndex}</span>
					<span className="price-range">💰 Range: {performanceData.priceRange}</span>
				</div>
			</div>
			
			{/* Conditional Chart Rendering */}
			<div className="chart-container">
				{chartType === 'pixi' ? (
					<StockChart onPerformanceUpdate={handlePerformanceUpdate} />
				) : (
					<ManualViewportStockChart onPerformanceUpdate={handlePerformanceUpdate} />
				)}
			</div>
		</div>
	);
}

console.log('Rendering app...');
const root = createRoot(document.getElementById('root'));
root.render(<App />);
