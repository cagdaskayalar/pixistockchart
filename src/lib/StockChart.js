import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { getData } from '../dataUtils';
import { generateStockData } from './utils/dataUtils';
import { calculatePriceRange, priceToY } from './utils/priceCalculations';
import { getCandlestickColor } from './utils/pixiHelpers';
import { 
	calculateChartDimensions, 
	indexToX, 
	calculateTimeGridIndices, 
	calculateCandleBodyWidth,
	constrainCandleWidth
} from './utils/coordinateUtils';
import SvgCrosshair from './components/SvgCrosshair';
import { createCompleteGrid } from './utils/gridUtils';

const StockChart = ({ onPerformanceUpdate }) => {
	const canvasRef = useRef(null);
	const appRef = useRef(null);
	const chartContainerRef = useRef(null);
	const svgCrosshairRef = useRef(null); // SVG crosshair reference
	
	// Stock data state for async loading
	const stockData = useRef(null);
	const [dataLoaded, setDataLoaded] = useState(false);
	
	// Load real data from JSON
	useEffect(() => {
		const loadData = async () => {
			try {
				console.log('Loading stock data from JSON...');
				// Real JSON data from src/dataUtils.js
				const data = await getData();
				stockData.current = data;
				
				// Set startIndex to show the latest data (professional behavior)
				// Show last 150 candles or available data length if less
				const maxCandlesToShow = 72;
				const dataLength = data.length;
				viewState.current.startIndex = Math.max(0, dataLength - maxCandlesToShow);
				
				setDataLoaded(true);
				console.log('Stock data loaded:', data.length, 'candles');
				console.log('Starting from index:', viewState.current.startIndex, '(showing latest data)');
			} catch (error) {
				console.error('Error loading stock data:', error);
				// Fallback to mock data if needed
				const fallbackData = generateStockData(2000);
				stockData.current = fallbackData;
				
				// Set startIndex for fallback data too
				const maxCandlesToShow = 72;
				const dataLength = fallbackData.length;
				viewState.current.startIndex = Math.max(0, dataLength - maxCandlesToShow);
				
				setDataLoaded(true);
			}
		};
		
		if (!stockData.current) {
			loadData();
		}
	}, []);
	
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
	
	// Performance optimizations hook - temporarily disabled to fix black screen
	// const {
	// 	returnContainerGraphics,
	// 	smoothRender
	// } = usePerformanceOptimizations();
	
	// Performance optimizations - STABLE MANUAL IMPLEMENTATION (prevents infinite recompile)
	// Using useCallback with empty deps to create stable functions
	
	// RAF Throttle - stable implementation  
	const getRafThrottled = useCallback((key, func, delay = 16) => {
		let lastCall = 0;
		let rafId = null;
		return (...args) => {
			const now = Date.now();
			if (now - lastCall >= delay) {
				lastCall = now;
				if (rafId) cancelAnimationFrame(rafId);
				rafId = requestAnimationFrame(() => func(...args));
			}
		};
	}, []);
	
	// Memory cleanup - stable implementation
	const memoryTasks = useRef(new Map());
	const registerCleanup = useCallback((key, cleanupFn) => {
		memoryTasks.current.set(key, cleanupFn);
	}, []);
	
	// Performance monitoring - stable implementation
	const performanceState = useRef({
		lastFpsUpdate: Date.now(),
		frameCount: 0,
		fps: 60,
		renderTimes: [],
		avgRenderTime: 0
	});
	
	const startTiming = useCallback(() => performance.now(), []);
	const endTiming = useCallback((startTime) => {
		const renderTime = performance.now() - startTime;
		performanceState.current.renderTimes.push(renderTime);
		if (performanceState.current.renderTimes.length > 10) {
			performanceState.current.renderTimes.shift();
		}
		performanceState.current.avgRenderTime = performanceState.current.renderTimes.reduce((a, b) => a + b, 0) / performanceState.current.renderTimes.length;
		return renderTime;
	}, []);
	
	const updateFPS = useCallback(() => {
		performanceState.current.frameCount++;
		const now = Date.now();
		if (now - performanceState.current.lastFpsUpdate >= 1000) {
			performanceState.current.fps = performanceState.current.frameCount;
			performanceState.current.frameCount = 0;
			performanceState.current.lastFpsUpdate = now;
		}
	}, []);
	
	const getPerformanceStats = useCallback(() => ({
		fps: performanceState.current.fps,
		memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0,
		avgRenderTime: Math.round(performanceState.current.avgRenderTime * 100) / 100
	}), []);
	
	// Smooth render - stable implementation
	const smoothRender = useCallback((container, callback, options = {}) => {
		// Batch cleanup for performance when many children
		if (container.children.length > 30) {
			const children = container.removeChildren();
			// Defer destroy calls to prevent frame drops
			requestAnimationFrame(() => {
				children.forEach(child => {
					if (child && child.destroy) {
						child.destroy();
					}
				});
			});
		} else {
			// Normal cleanup for small containers
			callback();
		}
		
		// Always execute callback
		if (container.children.length <= 30) {
			callback();
		}
	}, []);
	
	// Execute cleanup tasks on unmount
	React.useEffect(() => {
		const taskMap = memoryTasks.current;
		return () => {
			taskMap.forEach((cleanupFn) => {
				try {
					cleanupFn();
				} catch (error) {
					console.warn('Cleanup task failed:', error);
				}
			});
			taskMap.clear();
		};
	}, []);
	
	// Chart drawing function (optimized with smooth rendering to prevent black screen flicker)
	const drawChart = useCallback(() => {
		const chartContainer = chartContainerRef.current;
		if (!chartContainer || !appRef.current || !appRef.current.stage) return;
		
		// Check if data is loaded
		if (!stockData.current || !dataLoaded) {
			console.log('Waiting for data to load...');
			return;
		}

		const { width, height } = dimensions;

		// Calculate chart dimensions using utility
		const { margin, chartWidth, chartHeight } = calculateChartDimensions(width, height);

		const { startIndex, maxCandles, canvasWidth } = viewState.current;
		const endIndex = Math.min(startIndex + maxCandles, stockData.current.length);
		const visibleData = stockData.current.slice(startIndex, endIndex);

		if (visibleData.length === 0) return;

		// Price range calculation using utility
		const { priceMin, priceMax, priceDiff } = calculatePriceRange(visibleData);

		// Store price calculation values for crosshair
		viewState.current.priceCalculations = {
			priceMin,
			priceMax,
			priceDiff,
			chartTop: margin.top,
			chartHeight
		};

		// Safe container cleanup with smooth rendering to prevent black screen
		smoothRender(chartContainer, () => {
			// Clear container (normal destroy approach)
			if (chartContainer.children.length > 0) {
				chartContainer.removeChildren().forEach(child => {
					if (child && child.destroy) {
						child.destroy();
					}
				});
			}
		}, { preserveContent: false }); // Don't preserve content since we're clearing

		// Track render performance with PerformanceMonitor
		const renderStartTime = startTiming();
		
		// Background (PIXI v8 modern API)
		const bg = new PIXI.Graphics();
		bg.rect(margin.left, margin.top, chartWidth, chartHeight)
			.fill(0x1a1a1a)
			.rect(margin.left, margin.top, chartWidth, chartHeight)
			.stroke({ width: 1, color: 0x444444 });
		
		chartContainer.addChild(bg);
		
		// Calculate time grid indices using utility
		const timeGridIndices = calculateTimeGridIndices(visibleData, 6);
		
		// Create modular grid system using utility functions
		createCompleteGrid({
			container: chartContainer,
			margin,
			chartWidth,
			chartHeight,
			priceMin,
			priceMax,
			priceDiff,
			visibleData,
			timeGridIndices,
			canvasWidth,
			gridLines: 8,
			totalWidth: width,   // Tam ekran genişliği
			totalHeight: height  // Tam ekran yüksekliği
		});
		
		// Draw candlesticks (PIXI v8 modern API) - Grid ile hizalanmış pozisyonlar
		visibleData.forEach((candle, i) => {
			// X position using indexToX utility - Grid sistemine uyumlu
			const x = indexToX(i, canvasWidth, margin.left);
			
			// Calculate candle body width using utility
			const bodyWidth = calculateCandleBodyWidth(canvasWidth, 2, 0.8);
			
			// Y positions using utility
			const openY = priceToY(candle.open, priceMin, priceDiff, margin.top, chartHeight);
			const closeY = priceToY(candle.close, priceMin, priceDiff, margin.top, chartHeight);
			const highY = priceToY(candle.high, priceMin, priceDiff, margin.top, chartHeight);
			const lowY = priceToY(candle.low, priceMin, priceDiff, margin.top, chartHeight);
			
			const color = getCandlestickColor(candle);
			
			// Candlestick graphics (PIXI v8 modern API)
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
		
		
	
		
		// Performance tracking with PerformanceMonitor
		const renderTime = endTiming(renderStartTime);
		updateFPS();
		
		// Safe manual render to prevent black/white screen glitches
		if (appRef.current && appRef.current.renderer && appRef.current.stage) {
			try {
				// Only render if stage has children to prevent null errors
				if (appRef.current.stage.children && appRef.current.stage.children.length > 0) {
					appRef.current.renderer.render(appRef.current.stage);
				}
			} catch (error) {
				console.warn('Manual render error (safe to ignore):', error);
			}
		}
		
		// Add small delay to prevent black screen flicker
		requestAnimationFrame(() => {
			// Get comprehensive performance stats from PerformanceMonitor
			const perfStats = getPerformanceStats();
			
			// Send performance data to parent using PerformanceMonitor data
			if (onPerformanceUpdate) {
				onPerformanceUpdate({
					renderTime: Math.round(renderTime * 100) / 100,
					fps: perfStats.fps,
					memoryUsage: perfStats.memoryUsage,
					visibleCandles: visibleData.length,
					totalCandles: stockData.current.length,
					candleWidth: Math.round(canvasWidth * 10) / 10,
					startIndex: startIndex,
					priceRange: `$${priceMin.toFixed(2)}-$${priceMax.toFixed(2)}`
				});
			}
		});
		
		//console.log(`Chart drawn: ${visibleData.length} candles, width=${canvasWidth.toFixed(1)}px`);
	}, [dimensions, onPerformanceUpdate, startTiming, endTiming, updateFPS, getPerformanceStats, smoothRender, dataLoaded]); // drawChart useCallback end

	// Callback for SVG crosshair when hovering over candles - memoized
	const handleCandleHover = React.useMemo(() => (candle, dataIndex) => {
		// Optional: Add any additional hover logic here
		// console.log('Hovering over candle:', candle, 'at index:', dataIndex);
	}, []);

	// Handle window resize
	React.useEffect(() => {
		const handleResize = getRafThrottled('resize', () => {
			const newWidth = window.innerWidth;
			const newHeight = window.innerHeight - 50;
			
			// Update React state
			setDimensions({ width: newWidth, height: newHeight });
			
			// Update chart dimensions in viewState
			const { margin, chartWidth, chartHeight } = calculateChartDimensions(newWidth, newHeight);
			viewState.current.chartDimensions = { margin, chartWidth, chartHeight };
			
			// Update maxCandles based on new chart width
			viewState.current.maxCandles = Math.floor(chartWidth / viewState.current.canvasWidth);
			
			// PIXI v8 safe resize handling - prevent null reference errors
			if (appRef.current && appRef.current.renderer && appRef.current.stage) {
				try {
					// Safe resize with null checks
					appRef.current.renderer.resize(newWidth, newHeight);
					
					// Also update canvas style for responsive behavior
					if (appRef.current.canvas) {
						appRef.current.canvas.style.width = '100%';
						appRef.current.canvas.style.height = '100%';
						appRef.current.canvas.style.display = 'block';
					}
					
					// Only redraw if stage has children (prevents null errors)
					if (appRef.current.stage.children.length > 0) {
						drawChart();
					}
				} catch (error) {
					console.warn('PIXI resize error (safe to ignore):', error);
					// Fallback: force redraw without resize
					drawChart();
				}
			}
		}, 100); // 100ms throttle for resize
		
		window.addEventListener('resize', handleResize);
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, [drawChart, getRafThrottled]);
	
	useEffect(() => {
		console.log('StockChart: Creating professional chart...');
		
		// Get current dimensions at initialization time
		const initWidth = window.innerWidth;
		const initHeight = window.innerHeight - 50;
		
		// Update dimensions state if different
		if (dimensions.width !== initWidth || dimensions.height !== initHeight) {
			setDimensions({ width: initWidth, height: initHeight });
		}
		
		// PIXI Application (v8 async initialization)
		const initPixi = async () => {
			try {
				const app = new PIXI.Application();
				await app.init({
					width: initWidth,
					height: initHeight,
					backgroundColor: 0x0a0a0a,
					antialias: true,
					// V8 specific options to prevent render errors and improve responsiveness
					autoStart: false, // Don't auto start ticker
					sharedTicker: false // Use independent ticker
					// REMOVED: resizeTo: window (causes null length error in v8)
				});
				
				appRef.current = app;
			
			// Register cleanup task for PIXI app with MemoryManager
			registerCleanup('pixi-app', () => {
				if (appRef.current) {
					try {
						// PIXI v8 safe destroy - step by step cleanup
						
						// 1. Stop ticker first
						if (appRef.current.ticker) {
							appRef.current.ticker.stop();
						}
						
						// 2. Clean stage
						if (appRef.current.stage) {
							appRef.current.stage.removeChildren();
							appRef.current.stage.destroy({ children: true, texture: true });
						}
						
						// 3. Clean renderer
						if (appRef.current.renderer) {
							appRef.current.renderer.destroy();
						}
						
						// 4. Don't call app.destroy() to avoid _cancelResize error in v8
						
					} catch (error) {
						console.warn('PIXI cleanup error:', error);
					} finally {
						appRef.current = null;
					}
				}
			});

			// Proper canvas mounting for responsive behavior
			if (canvasRef.current && app.canvas) {
				// Clear any existing canvas
				canvasRef.current.innerHTML = '';
				
				// Set responsive canvas styles
				app.canvas.style.width = '100%';
				app.canvas.style.height = '100%';
				app.canvas.style.display = 'block';
				
				// Add canvas to DOM
				canvasRef.current.appendChild(app.canvas);
			}
			
			// Chart container - safe initialization
			if (app.stage) {
				const chartContainer = new PIXI.Container();
				app.stage.addChild(chartContainer);
				chartContainerRef.current = chartContainer;
			}
			
			// Store chart dimensions for event handlers
			const { margin, chartWidth, chartHeight } = calculateChartDimensions(initWidth, initHeight);
			viewState.current.chartDimensions = { margin, chartWidth, chartHeight };
			
			// Initial state - use actual chart width instead of hardcoded margin
			viewState.current.maxCandles = Math.floor(chartWidth / viewState.current.canvasWidth);
			
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
			
			// Mouse move (pan + crosshair tracking) - using ThrottleManager
			const handleMouseMove = getRafThrottled('mouseMove', (e) => {
				const rect = canvasRef.current.getBoundingClientRect();
				const mouseX = e.clientX - rect.left;
				const mouseY = e.clientY - rect.top;
				
				// Update SVG crosshair via ref (if available) - always enabled
				if (svgCrosshairRef.current) {
					svgCrosshairRef.current.updateCrosshair(mouseX, mouseY, true);
				}
				
				// Pan logic (only when dragging)
				if (viewState.current.isDragging) {
					const deltaX = e.clientX - viewState.current.lastMouseX;
					const candlesMoved = Math.round(deltaX / viewState.current.canvasWidth);
					
					if (Math.abs(candlesMoved) > 0) {
						// Update start index (professional stock chart behavior)
						let newStartIndex = viewState.current.startIndex - candlesMoved;
						newStartIndex = Math.max(0, Math.min(stockData.current.length - viewState.current.maxCandles, newStartIndex));
						
						if (newStartIndex !== viewState.current.startIndex) {
							viewState.current.startIndex = newStartIndex;
							viewState.current.lastMouseX = e.clientX;
							// Throttled chart update to prevent visual glitches
							drawChart();
						}
					}
				}
			}, 16);
			
			// Mouse up
			const handleMouseUp = () => {
				viewState.current.isDragging = false;
				canvas.style.cursor = 'crosshair';
			};

			// Mouse leave - hide crosshair
			const handleMouseLeave = () => {
				if (svgCrosshairRef.current) {
					svgCrosshairRef.current.updateCrosshair(0, 0, false);
				}
			};
			
			// Wheel (zoom) - using ThrottleManager for performance  
			const handleWheel = getRafThrottled('wheel', (e) => {
				e.preventDefault();
				
				const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8;
				
				// Calculate new candle width with constraints using utility
				const newCandleWidth = constrainCandleWidth(viewState.current.canvasWidth, zoomFactor, 4, 100);
				
				if (newCandleWidth !== viewState.current.canvasWidth) {
					viewState.current.canvasWidth = newCandleWidth;
					// Use actual chart width from stored dimensions
					const chartWidth = viewState.current.chartDimensions.chartWidth;
					viewState.current.maxCandles = Math.floor(chartWidth / newCandleWidth);
					
					// Adjust start index to keep similar view
					const centerIndex = viewState.current.startIndex + viewState.current.maxCandles / 2;
					viewState.current.startIndex = Math.max(0, Math.floor(centerIndex - viewState.current.maxCandles / 2));
					viewState.current.startIndex = Math.min(stockData.current.length - viewState.current.maxCandles, viewState.current.startIndex);
					
					// Direct chart update since wheel is already throttled
					drawChart();
					//console.log('Zoom - candle width:', newCandleWidth.toFixed(1), 'visible candles:', viewState.current.maxCandles);
				}
			}, 16);
			
			canvas.addEventListener('mousedown', handleMouseDown);
			canvas.addEventListener('mousemove', handleMouseMove);
			canvas.addEventListener('mouseup', handleMouseUp);
			canvas.addEventListener('mouseleave', handleMouseLeave);
			canvas.addEventListener('wheel', handleWheel, { passive: false });
			document.addEventListener('mouseup', handleMouseUp); // Global mouse up
			
			// Store event handlers for cleanup
			appRef.current._eventHandlers = {
				handleMouseDown,
				handleMouseMove,
				handleMouseUp,
				handleMouseLeave,
				handleWheel,
				canvas
			};
			
			// Register cleanup task for event listeners with MemoryManager
			registerCleanup('event-listeners', () => {
				if (appRef.current?._eventHandlers) {
					const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel, canvas } = appRef.current._eventHandlers;
					canvas.removeEventListener('mousedown', handleMouseDown);
					canvas.removeEventListener('mousemove', handleMouseMove);
					canvas.removeEventListener('mouseup', handleMouseUp);
					canvas.removeEventListener('mouseleave', handleMouseLeave);
					canvas.removeEventListener('wheel', handleWheel);
					document.removeEventListener('mouseup', handleMouseUp);
				}
			});
			
			// Start the ticker manually after setup is complete with controlled rendering
			if (app.ticker) {
				// Disable auto render to prevent conflicts with our manual rendering
				app.ticker.autoStart = false;
				app.ticker.stop();
				
				// Only start ticker if we need animation (we control rendering manually)
				// app.ticker.start(); // Commented out - we control rendering manually
			}
			
		} catch (error) {
			console.error('PIXI initialization error:', error);
		}
		}; // initPixi async function'ını kapat
		
		initPixi().catch(console.error);
		
		// Cleanup
		return () => {
			if (appRef.current?._eventHandlers) {
				const { handleMouseDown, handleMouseMove, handleMouseUp, handleMouseLeave, handleWheel, canvas } = appRef.current._eventHandlers;
				canvas.removeEventListener('mousedown', handleMouseDown);
				canvas.removeEventListener('mousemove', handleMouseMove);
				canvas.removeEventListener('mouseup', handleMouseUp);
				canvas.removeEventListener('mouseleave', handleMouseLeave);
				canvas.removeEventListener('wheel', handleWheel);
				document.removeEventListener('mouseup', handleMouseUp);
			}
			
			// Safe PIXI cleanup for v8
			if (appRef.current) {
				try {
					// 1. Stop ticker first
					if (appRef.current.ticker) {
						appRef.current.ticker.stop();
					}
					
					// 2. Clean stage
					if (appRef.current.stage) {
						appRef.current.stage.removeChildren();
						appRef.current.stage.destroy({ children: true, texture: true });
					}
					
					// 3. Clean renderer
					if (appRef.current.renderer) {
						appRef.current.renderer.destroy();
					}
					
					// 4. Don't call app.destroy() to avoid _cancelResize error
					
				} catch (error) {
					console.warn('PIXI cleanup error in useEffect:', error);
				} finally {
					appRef.current = null;
				}
			}
		};
	}, [dimensions, drawChart, handleCandleHover, getRafThrottled, registerCleanup]);
	
	// Redraw chart when data is loaded
	useEffect(() => {
		if (dataLoaded && stockData.current) {
			console.log('Data loaded, redrawing chart...');
			// Small delay to ensure PIXI is ready
			setTimeout(() => {
				drawChart();
			}, 100);
		}
	}, [dataLoaded, drawChart]);
	
	return (
		<div className="stock-chart-container" style={{ position: 'relative' }}>
			{!dataLoaded && (
				<div style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					color: '#888',
					fontSize: '16px',
					zIndex: 1000
				}}>
					Loading stock data...
				</div>
			)}
			<div ref={canvasRef} className="canvas-container" />
			<SvgCrosshair ref={svgCrosshairRef}
				stockData={stockData.current}
				viewState={viewState}
				chartBounds={viewState.current.chartDimensions ? {
					left: viewState.current.chartDimensions.margin.left,
					top: viewState.current.chartDimensions.margin.top,
					right: viewState.current.chartDimensions.margin.left + viewState.current.chartDimensions.chartWidth,
					bottom: viewState.current.chartDimensions.margin.top + viewState.current.chartDimensions.chartHeight
				} : null}
				margin={viewState.current.chartDimensions?.margin}
				onCandleHover={handleCandleHover}
			/>
		</div>
	);
};

export default StockChart;