import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';

// Sample stock data generator
const generateStockData = (days = 2000) => {
	const data = [];
	let price = 100;
	const startDate = new Date('2024-01-01');
	
	for (let i = 0; i < days; i++) {
		const date = new Date(startDate);
		date.setDate(startDate.getDate() + i);
		
		const change = (Math.random() - 0.5) * 6; // More volatility
		const open = price;
		const close = price + change;
		const high = Math.max(open, close) + Math.random() * 3;
		const low = Math.min(open, close) - Math.random() * 3;
		const volume = Math.floor(Math.random() * 2000000) + 500000;
		
		data.push({
			date: date.toISOString().split('T')[0],
			open: parseFloat(open.toFixed(2)),
			high: parseFloat(high.toFixed(2)),
			low: parseFloat(low.toFixed(2)),
			close: parseFloat(close.toFixed(2)),
			volume
		});
		
		price = close;
	}
	
	return data;
};

const StockChart = ({ onPerformanceUpdate }) => {
	const canvasRef = useRef(null);
	const appRef = useRef(null);
	const chartContainerRef = useRef(null);
	
	// Memoize stock data to prevent regeneration
	const stockData = useRef(null);
	if (!stockData.current) {
		stockData.current = generateStockData(2000);
	}
	
	// Dynamic dimensions
	const [dimensions, setDimensions] = React.useState({
		width: window.innerWidth,
		height: window.innerHeight - 50 // Subtract header height
	});
	
	// Chart state
	const viewState = useRef({
		startIndex: 0,
		canvasWidth: 20, // pixels per candle
		isDragging: false,
		lastMouseX: 0,
		maxCandles: 50
	});
	
	// Performance tracking
	const performanceState = useRef({
		renderTime: 0,
		fps: 0,
		frameCount: 0,
		lastFpsUpdate: Date.now(),
		memoryUsage: 0
	});
	
	// Chart drawing function (optimized with memory management)
	const drawChart = useCallback(() => {
		const startTime = performance.now();
		
		const chartContainer = chartContainerRef.current;
		if (!chartContainer) return;
		
		const { width, height } = dimensions;
		
		// Proper cleanup - destroy all children to prevent memory leaks
		while (chartContainer.children.length > 0) {
			const child = chartContainer.children[0];
			chartContainer.removeChild(child);
			if (child.destroy) {
				child.destroy({ children: true, texture: false });
			}
		}
		
		const margin = { top: 40, right: 150, bottom: 60, left: 100 }; // Daha geni� Y-axis alanlar�
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;
		
		const { startIndex, maxCandles, canvasWidth } = viewState.current;
		const endIndex = Math.min(startIndex + maxCandles, stockData.current.length);
		const visibleData = stockData.current.slice(startIndex, endIndex);
		
		if (visibleData.length === 0) return;
		
		// Price range calculation
		const prices = visibleData.flatMap(d => [d.open, d.high, d.low, d.close]);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const priceRange = maxPrice - minPrice;
		const padding = priceRange * 0.1;
		const priceMin = minPrice - padding;
		const priceMax = maxPrice + padding;
		const priceDiff = priceMax - priceMin;
		
		// Background (PIXI v8 modern API)
		const bg = new PIXI.Graphics()
			.rect(margin.left, margin.top, chartWidth, chartHeight)
			.fill(0x1a1a1a)
			.rect(margin.left, margin.top, chartWidth, chartHeight)
			.stroke({ width: 1, color: 0x444444 });
		
		chartContainer.addChild(bg);
		
		// Price grid
		const grid = new PIXI.Graphics();
		
		const gridLines = 8;
		for (let i = 0; i <= gridLines; i++) {
			const y = margin.top + (chartHeight / gridLines) * i;
			const price = priceMax - (priceDiff / gridLines) * i;
			
			// Grid line (v8 modern API)
			grid.moveTo(margin.left, y)
				.lineTo(margin.left + chartWidth, y)
				.stroke({ width: 1, color: 0x333333, alpha: 0.3 });
			
			// Price label (sağda)
			const priceText = new PIXI.Text({
				text: price.toFixed(2),
				style: {
					fontFamily: 'Arial',
					fontSize: 12,
					fill: 0x888888
				}
			});
			priceText.anchor.set(0, 0.5);
			priceText.x = margin.left + chartWidth + 20; // Daha uzak
			priceText.y = y;
			chartContainer.addChild(priceText);
			
			// Price label (solda da - profesyonel görünüm)
			const priceTextLeft = new PIXI.Text({
				text: price.toFixed(2),
				style: {
					fontFamily: 'Arial',
					fontSize: 12,
					fill: 0x888888
				}
			});
			priceTextLeft.anchor.set(1, 0.5);
			priceTextLeft.x = margin.left - 15; // Daha uzak
			priceTextLeft.y = y;
			chartContainer.addChild(priceTextLeft);
		}
		
		// Vertical time grid (X-axis) - Candlestick pozisyonlar� ile tam senkronize
		const timeGridLines = Math.min(6, visibleData.length);
		
		// Grid �izgileri i�in se�ilen candlestick index'leri
		for (let i = 0; i < timeGridLines && i < visibleData.length; i++) {
			const dataIndex = i === timeGridLines - 1 
				? visibleData.length - 1  // Son candlestick
				: Math.floor((visibleData.length - 1) * (i / (timeGridLines - 1)));
			
			if (dataIndex >= 0 && dataIndex < visibleData.length) {
				// Candlestick ile TAM AYNI X pozisyon formülü
				const x = margin.left + (dataIndex + 0.5) * canvasWidth;
				
				// Vertical grid line (v8 modern API)
				grid.moveTo(x, margin.top)
					.lineTo(x, margin.top + chartHeight)
					.stroke({ width: 1, color: 0x333333, alpha: 0.3 });
				
				// Date label (candlestick'in tam altında)
				const dateStr = visibleData[dataIndex].date.split('-').slice(1).join('/'); // MM/DD format
				
				const dateText = new PIXI.Text({
					text: dateStr,
					style: {
						fontFamily: 'Arial',
						fontSize: 11,
						fill: 0x888888
					}
				});
				dateText.anchor.set(0.5, 0);
				dateText.x = x; // Candlestick ile tam aynı X pozisyonu
				dateText.y = margin.top + chartHeight + 8;
				chartContainer.addChild(dateText);
			}
		}
		
		chartContainer.addChild(grid);
		
		// Draw candlesticks (PIXI v8 modern API)
		visibleData.forEach((candle, i) => {
			const x = margin.left + (i + 0.5) * canvasWidth;
			const bodyWidth = Math.max(2, canvasWidth * 0.8);
			
			// Y positions
			const openY = margin.top + chartHeight - ((candle.open - priceMin) / priceDiff) * chartHeight;
			const closeY = margin.top + chartHeight - ((candle.close - priceMin) / priceDiff) * chartHeight;
			const highY = margin.top + chartHeight - ((candle.high - priceMin) / priceDiff) * chartHeight;
			const lowY = margin.top + chartHeight - ((candle.low - priceMin) / priceDiff) * chartHeight;
			
			const isGreen = candle.close >= candle.open;
			const color = isGreen ? 0x00dd88 : 0xdd4444;
			
			const candleGfx = new PIXI.Graphics();
			
			// Wick (high-low line) - v8 modern API
			candleGfx.moveTo(x, highY)
					 .lineTo(x, lowY)
					 .stroke({ width: 1, color: color });
			
			// Body - v8 modern API
			const bodyTop = Math.min(openY, closeY);
			const bodyHeight = Math.max(1, Math.abs(closeY - openY));
			candleGfx.rect(x - bodyWidth/2, bodyTop, bodyWidth, bodyHeight)
					 .fill(color);
			
			chartContainer.addChild(candleGfx);
		});
		
		// Title and info (PIXI v8 modern API)
		const title = new PIXI.Text({
			text: 'Professional Stock Chart',
			style: {
				fontFamily: 'Arial',
				fontSize: 16,
				fill: 0xffffff,
				fontWeight: 'bold'
			}
		});
		title.x = margin.left;
		title.y = 10;
		chartContainer.addChild(title);
		
		// Status info
		const info = new PIXI.Text({
			text: `Range: ${startIndex}-${endIndex} (${visibleData.length} candles) | Candle Width: ${canvasWidth.toFixed(1)}px | Price: $${priceMin.toFixed(2)}-$${priceMax.toFixed(2)}`,
			style: {
				fontFamily: 'Arial',
				fontSize: 11,
				fill: 0xaaaaaa
			}
		});
		info.x = margin.left;
		info.y = height - 25;
		chartContainer.addChild(info);
		
		// Performance tracking (throttled to prevent excessive updates)
		const endTime = performance.now();
		performanceState.current.renderTime = endTime - startTime;
		performanceState.current.frameCount++;
		
		// FPS calculation and performance updates (throttled to every 500ms)
		const now = Date.now();
		if (now - performanceState.current.lastFpsUpdate >= 500) {
			performanceState.current.fps = Math.round((performanceState.current.frameCount * 1000) / (now - performanceState.current.lastFpsUpdate));
			performanceState.current.frameCount = 0;
			performanceState.current.lastFpsUpdate = now;
			
			// Memory usage (if available) - only update every 500ms
			if (performance.memory) {
				performanceState.current.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
			}
			
			// Send performance data to parent (throttled)
			if (onPerformanceUpdate) {
				onPerformanceUpdate({
					renderTime: Math.round(performanceState.current.renderTime * 100) / 100,
					fps: performanceState.current.fps,
					memoryUsage: performanceState.current.memoryUsage,
					visibleCandles: visibleData.length,
					totalCandles: stockData.current.length,
					candleWidth: Math.round(canvasWidth * 10) / 10,
					startIndex: startIndex,
					priceRange: `$${priceMin.toFixed(2)}-$${priceMax.toFixed(2)}`
				});
			}
			
			// Periodic garbage collection suggestion (only in development)
			if (process.env.NODE_ENV === 'development' && window.gc) {
				window.gc();
			}
		}
		
		//console.log(`Chart drawn: ${visibleData.length} candles, width=${canvasWidth.toFixed(1)}px`);
	}, [dimensions, stockData, onPerformanceUpdate]);
	
	// Handle window resize
	React.useEffect(() => {
		const handleResize = () => {
			const newWidth = window.innerWidth;
			const newHeight = window.innerHeight - 50;
			setDimensions({ width: newWidth, height: newHeight });
			
			if (appRef.current) {
				// PIXI v8'de renderer.resize yerine app.renderer.resize
				appRef.current.renderer.resize(newWidth, newHeight);
				drawChart();
			}
		};
		
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [drawChart]);
	
	useEffect(() => {
		console.log('StockChart: Creating professional chart...');
		
		const { width, height } = dimensions;
		
		// PIXI Application (v8 async initialization)
		const initPixi = async () => {
			const app = new PIXI.Application();
			await app.init({
				width,
				height,
				backgroundColor: 0x0a0a0a,
				antialias: true
			});
			
			appRef.current = app;
			
			if (canvasRef.current) {
				canvasRef.current.appendChild(app.canvas); // v8'de app.view yerine app.canvas
			}
			
			// Chart container
			const chartContainer = new PIXI.Container();
			app.stage.addChild(chartContainer);
			chartContainerRef.current = chartContainer;
			
			// Initial state
			viewState.current.maxCandles = Math.floor((width - 250) / viewState.current.canvasWidth); // 250 = toplam margin
			
			// Draw initial chart
			drawChart();
			
			// Event handlers
			const canvas = app.canvas; // v8'de app.view yerine app.canvas
			canvas.style.cursor = 'crosshair';
			
			// Mouse down
			const handleMouseDown = (e) => {
				viewState.current.isDragging = true;
				viewState.current.lastMouseX = e.clientX;
				canvas.style.cursor = 'grabbing';
			};
			
			// Mouse move (pan)
			const handleMouseMove = (e) => {
				if (!viewState.current.isDragging) return;
				
				const deltaX = e.clientX - viewState.current.lastMouseX;
				const candlesMoved = Math.round(deltaX / viewState.current.canvasWidth);
				
				if (Math.abs(candlesMoved) > 0) {
					// Update start index (professional stock chart behavior)
					let newStartIndex = viewState.current.startIndex - candlesMoved;
					newStartIndex = Math.max(0, Math.min(stockData.current.length - viewState.current.maxCandles, newStartIndex));
					
					if (newStartIndex !== viewState.current.startIndex) {
						viewState.current.startIndex = newStartIndex;
						viewState.current.lastMouseX = e.clientX;
						drawChart();
						//console.log('Pan to index:', newStartIndex);
					}
				}
			};
			
			// Mouse up
			const handleMouseUp = () => {
				viewState.current.isDragging = false;
				canvas.style.cursor = 'crosshair';
			};
			
			// Wheel (zoom)
			const handleWheel = (e) => {
				e.preventDefault();
				
				const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8;
				let newCandleWidth = viewState.current.canvasWidth * zoomFactor;
				
				// Zoom limits
				newCandleWidth = Math.max(4, Math.min(100, newCandleWidth));
				
				if (newCandleWidth !== viewState.current.canvasWidth) {
					viewState.current.canvasWidth = newCandleWidth;
					viewState.current.maxCandles = Math.floor((dimensions.width - 250) / newCandleWidth); // 250 = toplam margin
					
					// Adjust start index to keep similar view
					const centerIndex = viewState.current.startIndex + viewState.current.maxCandles / 2;
					viewState.current.startIndex = Math.max(0, Math.floor(centerIndex - viewState.current.maxCandles / 2));
					viewState.current.startIndex = Math.min(stockData.current.length - viewState.current.maxCandles, viewState.current.startIndex);
					
					drawChart();
					//console.log('Zoom - candle width:', newCandleWidth.toFixed(1), 'visible candles:', viewState.current.maxCandles);
				}
			};
			
			canvas.addEventListener('mousedown', handleMouseDown);
			canvas.addEventListener('mousemove', handleMouseMove);
			canvas.addEventListener('mouseup', handleMouseUp);
			canvas.addEventListener('wheel', handleWheel, { passive: false });
			document.addEventListener('mouseup', handleMouseUp); // Global mouse up
			
			// Store event handlers for cleanup
			appRef.current._eventHandlers = {
				handleMouseDown,
				handleMouseMove,
				handleMouseUp,
				handleWheel,
				canvas
			};
		};
		
		initPixi().catch(console.error);
		
		// Cleanup
		return () => {
			if (appRef.current?._eventHandlers) {
				const { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, canvas } = appRef.current._eventHandlers;
				canvas.removeEventListener('mousedown', handleMouseDown);
				canvas.removeEventListener('mousemove', handleMouseMove);
				canvas.removeEventListener('mouseup', handleMouseUp);
				canvas.removeEventListener('wheel', handleWheel);
				document.removeEventListener('mouseup', handleMouseUp);
			}
			
			if (appRef.current) {
				appRef.current.destroy(true);
			}
		};
	}, [dimensions, drawChart]);
	
	return (
		<div className="stock-chart-container">
			<div ref={canvasRef} className="canvas-container" />
			<div className="info-bar">
				<span>Professional Stock Chart</span>
				<span>Drag to pan | Scroll to zoom | {stockData.current.length} data points</span>
			</div>
		</div>
	);
};

export default StockChart;