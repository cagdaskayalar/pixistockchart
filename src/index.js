import React from 'react';
import { createRoot } from 'react-dom/client';
import StockChart from './lib/StockChart';
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

	const handlePerformanceUpdate = React.useCallback((data) => {
		setPerformanceData(data);
	}, []);

	return (
		<div className="app-container">					
			{/* Header */}
			<div className="app-header">
				<span>Professional Trading Chart</span>
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
			
			{/* Full Screen Stock Chart */}
			<div className="chart-container">
				<StockChart onPerformanceUpdate={handlePerformanceUpdate} />
			</div>
		</div>
	);
}

console.log('Rendering app...');
const root = createRoot(document.getElementById('root'));
root.render(<App />);
