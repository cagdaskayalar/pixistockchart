import React, { useEffect, useRef, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { generateStockData } from './utils/dataUtils';
import { calculatePriceRange, priceToY } from './utils/priceCalculations';
import { destroyContainerChildren, getCandlestickColor } from './utils/pixiHelpers';
import { 
	calculateChartDimensions, 
	indexToX, 
	calculateTimeGridIndices, 
	calculateCandleBodyWidth,
	constrainCandleWidth,
	xToIndex,
	isPointInChartBounds 
} from './utils/coordinateUtils';

const StockChart = ({ onPerformanceUpdate }) => {
	const canvasRef = useRef(null);
	const appRef = useRef(null);
	const chartContainerRef = useRef(null);
	const crosshairContainerRef = useRef(null); // Ayrı crosshair layer
	
	// Crosshair state (throttled updates için)
	const [crosshair, setCrosshair] = React.useState({
		visible: false,
		x: 0,
		y: 0,
		dataIndex: -1,
		candle: null
	});
	
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
		maxCandles: 50,
		lastCrosshairUpdate: 0 // For throttling crosshair updates
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
		
		// Proper cleanup using utility - destroy all children to prevent memory leaks
		destroyContainerChildren(chartContainer);
		
		// Calculate chart dimensions using utility
		const { margin, chartWidth, chartHeight } = calculateChartDimensions(width, height);
		
		const { startIndex, maxCandles, canvasWidth } = viewState.current;
		const endIndex = Math.min(startIndex + maxCandles, stockData.current.length);
		const visibleData = stockData.current.slice(startIndex, endIndex);
		
		if (visibleData.length === 0) return;
		
		// Price range calculation using utility
		const { priceMin, priceMax, priceDiff } = calculatePriceRange(visibleData);
		
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
		
		// Vertical time grid (X-axis) - Calculate grid indices using utility
		const timeGridIndices = calculateTimeGridIndices(visibleData, 6);
		
		// Grid çizgileri için seçilen candlestick index'leri
		for (const dataIndex of timeGridIndices) {
			// Candlestick ile TAM AYNI X pozisyon formülü - using indexToX utility
			const x = indexToX(dataIndex, canvasWidth, margin.left);
			
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
		
		chartContainer.addChild(grid);
		
		// Draw candlesticks (PIXI v8 modern API)
		visibleData.forEach((candle, i) => {
			// X position using indexToX utility (but here i is local index, not data index)
			const x = indexToX(i, canvasWidth, margin.left);
			
			// Calculate candle body width using utility
			const bodyWidth = calculateCandleBodyWidth(canvasWidth, 2, 0.8);
			
			// Y positions using utility
			const openY = priceToY(candle.open, priceMin, priceDiff, margin.top, chartHeight);
			const closeY = priceToY(candle.close, priceMin, priceDiff, margin.top, chartHeight);
			const highY = priceToY(candle.high, priceMin, priceDiff, margin.top, chartHeight);
			const lowY = priceToY(candle.low, priceMin, priceDiff, margin.top, chartHeight);
			
			const color = getCandlestickColor(candle);
			
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
	
	// Separate crosshair drawing function for better performance
	const drawCrosshair = useCallback(() => {
		const crosshairContainer = crosshairContainerRef.current;
		if (!crosshairContainer) return;
		
		// Clear previous crosshair
		destroyContainerChildren(crosshairContainer);
		
		// Only draw if visible and valid
		if (crosshair.visible && crosshair.dataIndex >= 0) {
			const { margin, chartWidth, chartHeight } = calculateChartDimensions(dimensions.width, dimensions.height);
			
			const crosshairGfx = new PIXI.Graphics();
			
			// Vertical line (time) - snap to nearest candlestick
			const { canvasWidth } = viewState.current;
			const snapX = indexToX(crosshair.dataIndex, canvasWidth, margin.left);
			
			crosshairGfx.moveTo(snapX, margin.top)
						.lineTo(snapX, margin.top + chartHeight)
						.stroke({ width: 1, color: 0xffff00, alpha: 0.8 });
			
			// Horizontal line (price)  
			crosshairGfx.moveTo(margin.left, crosshair.y)
						.lineTo(margin.left + chartWidth, crosshair.y)
						.stroke({ width: 1, color: 0xffff00, alpha: 0.8 });
			
			crosshairContainer.addChild(crosshairGfx);
		}
	}, [crosshair, dimensions]);
	
	// Update crosshair when state changes
	React.useEffect(() => {
		drawCrosshair();
	}, [drawCrosshair]);
	
	// Handle window resize
	React.useEffect(() => {
		const handleResize = () => {
			const newWidth = window.innerWidth;
			const newHeight = window.innerHeight - 50;
			setDimensions({ width: newWidth, height: newHeight });
			
			// Update chart dimensions in viewState
			const { margin, chartWidth, chartHeight } = calculateChartDimensions(newWidth, newHeight);
			viewState.current.chartDimensions = { margin, chartWidth, chartHeight };
			
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
			
			// Crosshair container (separate layer for better performance)
			const crosshairContainer = new PIXI.Container();
			app.stage.addChild(crosshairContainer);
			crosshairContainerRef.current = crosshairContainer;
			
			// Initial state
			viewState.current.maxCandles = Math.floor((width - 250) / viewState.current.canvasWidth); // 250 = toplam margin
			
			// Store chart dimensions for event handlers
			const { margin, chartWidth, chartHeight } = calculateChartDimensions(width, height);
			viewState.current.chartDimensions = { margin, chartWidth, chartHeight };
			
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
			
			// Mouse move (pan + crosshair tracking) - optimized with throttling
			const handleMouseMove = (e) => {
				const rect = canvasRef.current.getBoundingClientRect();
				const mouseX = e.clientX - rect.left;
				const mouseY = e.clientY - rect.top;
				
				// Get chart dimensions from viewState
				const { margin, chartWidth, chartHeight } = viewState.current.chartDimensions || {};
				if (!margin) return; // Safety check
				
				// Chart bounds for boundary checking
				const bounds = {
					left: margin.left,
					top: margin.top,
					right: margin.left + chartWidth,
					bottom: margin.top + chartHeight
				};
				
				// Crosshair tracking (only when not dragging for better performance)
				if (!viewState.current.isDragging && isPointInChartBounds(mouseX, mouseY, bounds)) {
					// Calculate which candlestick we're hovering over (snap to nearest)
					const rawIndex = xToIndex(mouseX, viewState.current.canvasWidth, margin.left);
					const dataIndex = Math.max(0, Math.min(rawIndex, viewState.current.maxCandles - 1));
					
					const { startIndex } = viewState.current;
					const endIndex = Math.min(startIndex + viewState.current.maxCandles, stockData.current.length);
					const visibleData = stockData.current.slice(startIndex, endIndex);
					
					if (dataIndex >= 0 && dataIndex < visibleData.length) {
						const hoveredCandle = visibleData[dataIndex];
						
						// Throttle crosshair updates to prevent excessive re-renders
						const now = Date.now();
						if (!viewState.current.lastCrosshairUpdate || now - viewState.current.lastCrosshairUpdate > 16) { // ~60fps
							setCrosshair({
								visible: true,
								x: mouseX, // Keep original X for smooth movement
								y: mouseY,
								dataIndex: dataIndex,
								candle: hoveredCandle
							});
							viewState.current.lastCrosshairUpdate = now;
						}
					} else {
						setCrosshair(prev => ({ ...prev, visible: false }));
					}
				} else if (!isPointInChartBounds(mouseX, mouseY, bounds)) {
					setCrosshair(prev => ({ ...prev, visible: false }));
				}
				
				// Existing pan logic
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
				
				// Calculate new candle width with constraints using utility
				const newCandleWidth = constrainCandleWidth(viewState.current.canvasWidth, zoomFactor, 4, 100);
				
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