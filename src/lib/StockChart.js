/**
 * @fileoverview Professional Stock Chart Component with PIXI.js WebGL Rendering
 * High-performance candlestick chart with Turkish localization, interactive crosshair,
 * responsive design, SVG overlay system, and comprehensive trading chart features.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.3.0
 * @since 2024-01-01
 */

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
import SvgYAxis from './components/SvgYAxis';
import SvgXAxis from './components/SvgXAxis';
import SvgGrid from './components/SvgGrid';
import { createChartBackground } from './utils/gridUtils';
import { useResizeObserver, calculateAxisDimensions } from './hooks/useResponsiveAxis';

/**
 * @typedef {Object} StockCandle
 * @property {Date|string} date - Date of the candle (Date object or ISO string)
 * @property {number} open - Opening price
 * @property {number} high - Highest price
 * @property {number} low - Lowest price
 * @property {number} close - Closing price
 * @property {number} [volume] - Trading volume (optional)
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {number} renderTime - Time taken for rendering in milliseconds
 * @property {number} dataCount - Number of data points processed
 * @property {number} visibleCandles - Number of currently visible candles
 * @property {number} fps - Frames per second (if available)
 * @property {string} timestamp - ISO timestamp of the measurement
 */

/**
 * @typedef {Object} ChartBounds
 * @property {number} top - Top boundary of the chart area in pixels
 * @property {number} bottom - Bottom boundary of the chart area in pixels
 * @property {number} left - Left boundary of the chart area in pixels
 * @property {number} right - Right boundary of the chart area in pixels
 */

/**
 * @typedef {Object} ViewState
 * @property {number} startIndex - Starting index in the data array for visible range
 * @property {number} maxCandles - Maximum number of candles that can fit in view
 * @property {number} canvasWidth - Width allocated per candle in pixels
 * @property {Object} priceCalculations - Price calculation parameters
 * @property {number} priceCalculations.priceMin - Minimum visible price
 * @property {number} priceCalculations.priceMax - Maximum visible price
 * @property {number} priceCalculations.priceDiff - Price range difference
 * @property {number} priceCalculations.chartTop - Chart top coordinate
 * @property {number} priceCalculations.chartHeight - Chart height in pixels
 */

/**
 * @callback OnPerformanceUpdateCallback
 * @param {PerformanceMetrics} metrics - Performance metrics object
 * @returns {void}
 */

/**
 * Professional stock chart component built with PIXI.js WebGL rendering engine.
 * Features include responsive design, Turkish localization, interactive crosshair,
 * SVG overlay system, grid patterns, and high-performance candlestick rendering.
 * 
 * Key Features:
 * - WebGL-accelerated rendering via PIXI.js v8
 * - Responsive design with dynamic axis sizing
 * - Turkish date/time localization (tr-TR)
 * - Latest-data-first display (professional trading platform style)
 * - Interactive crosshair with smart candle snapping
 * - SVG overlay system for UI elements
 * - Professional grid patterns and axis labels
 * - Real-time performance monitoring
 * - Touch and mouse interaction support
 * 
 * @component
 * @param {Object} props - Component properties
 * @param {OnPerformanceUpdateCallback} [props.onPerformanceUpdate] - Callback for performance metrics updates
 * @returns {React.ReactElement} The stock chart component with container and overlays
 * 
 * @example
 * // Basic usage
 * <StockChart />
 * 
 * @example
 * // With performance monitoring
 * <StockChart 
 *   onPerformanceUpdate={(metrics) => {
 *     console.log(`Render time: ${metrics.renderTime}ms`);
 *     console.log(`Visible candles: ${metrics.visibleCandles}`);
 *   }}
 * />
 * 
 * @example
 * // In a trading dashboard
 * function TradingDashboard() {
 *   const [performance, setPerformance] = useState(null);
 *   
 *   return (
 *     <div className="trading-dashboard">
 *       <StockChart onPerformanceUpdate={setPerformance} />
 *       {performance && (
 *         <div className="performance-info">
 *           FPS: {performance.fps} | Candles: {performance.visibleCandles}
 *         </div>
 *       )}
 *     </div>
 *   );
 * }
 * 
 * @throws {Error} Throws error if PIXI.js fails to initialize WebGL context
 * @throws {Error} Throws error if data fetching fails
 * 
 * @see {@link https://pixijs.com/|PIXI.js Documentation}
 * @see {@link https://github.com/cagdaskayalar/pixistockchart|GitHub Repository}
 */

/**
 * Professional Trading Chart Component with PIXI.js and SVG overlay
 * Features Turkish localization, real-time crosshair, dynamic grid, and high-performance rendering
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onPerformanceUpdate] - Callback for performance metrics updates
 * @param {number} props.onPerformanceUpdate.renderTime - Render time in milliseconds
 * @param {number} props.onPerformanceUpdate.fps - Current FPS
 * @param {number} props.onPerformanceUpdate.memoryUsage - Memory usage in MB
 * @param {number} props.onPerformanceUpdate.visibleCandles - Number of visible candles
 * @param {number} props.onPerformanceUpdate.totalCandles - Total number of candles
 * @param {number} props.onPerformanceUpdate.candleWidth - Current candle width in pixels
 * @param {number} props.onPerformanceUpdate.startIndex - Current start index in dataset
 * @param {string} props.onPerformanceUpdate.priceRange - Formatted price range string
 * @returns {JSX.Element} Stock chart component with canvas and SVG overlays
 * @example
 * // Basic usage with performance monitoring
 * <StockChart onPerformanceUpdate={(metrics) => {
 *   console.log(`FPS: ${metrics.fps}, Render: ${metrics.renderTime}ms`);
 * }} />
 */
const StockChart = ({ onPerformanceUpdate }) => {
	const canvasRef = useRef(null);
	const appRef = useRef(null);
	const chartContainerRef = useRef(null);
	const svgCrosshairRef = useRef(null); // SVG crosshair reference
	const svgYAxisRef = useRef(null); // SVG Y-axis reference
	const svgXAxisRef = useRef(null); // SVG X-axis reference
	const svgGridRef = useRef(null); // SVG grid reference
	
	// Stock data state for async loading
	const stockData = useRef(null);
	const [dataLoaded, setDataLoaded] = useState(false);
	
	// Responsive axis dimensions
	const containerDimensions = useResizeObserver(chartContainerRef);
	const [axisDimensions, setAxisDimensions] = useState({ yAxisWidth: 50, xAxisHeight: 25 });
	
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
	
	// Calculate dynamic axis dimensions based on data and container size
	useEffect(() => {
		if (!dataLoaded || !stockData.current || !containerDimensions.width) return;
		
		// Get visible data for label calculation
		const { startIndex, maxCandles } = viewState.current;
		const endIndex = Math.min(startIndex + maxCandles, stockData.current.length);
		const visibleData = stockData.current.slice(startIndex, endIndex);
		
		// Calculate price range for label generation
		const priceCalculations = calculatePriceRange(visibleData);
		if (!priceCalculations || priceCalculations.priceDiff === 0) return;
		
		// Generate price labels
		const priceLabels = [];
		const gridLines = 8;
		for (let i = 0; i <= gridLines; i++) {
			const price = priceCalculations.priceMax - (priceCalculations.priceDiff / gridLines) * i;
			priceLabels.push(price.toFixed(2));
		}
		
		// Generate time labels (simplified)
		const timeLabels = ['11 Tem', '12 Tem', '13 Tem']; // Örnek değerler
		
		// Calculate dynamic axis dimensions
		const newAxisDimensions = calculateAxisDimensions(
			priceLabels, 
			timeLabels, 
			containerDimensions
		);
		
		setAxisDimensions(newAxisDimensions);
	}, [dataLoaded, containerDimensions, viewState.current?.startIndex]);
	
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

		// Calculate chart dimensions using utility with dynamic axis dimensions
		const { margin, chartWidth, chartHeight } = calculateChartDimensions(width, height, {}, axisDimensions);

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
		
		// Create only background (no grid - SVG handles grid now)
		createChartBackground({
			container: chartContainer,
			margin,
			chartWidth,
			chartHeight
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
	}, [dimensions, axisDimensions, onPerformanceUpdate, startTiming, endTiming, updateFPS, getPerformanceStats, smoothRender, dataLoaded]); // drawChart useCallback end

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
			const { margin, chartWidth, chartHeight } = calculateChartDimensions(newWidth, newHeight, {}, axisDimensions);
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
	}, [drawChart, getRafThrottled, axisDimensions]);
	
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
			const { margin, chartWidth, chartHeight } = calculateChartDimensions(initWidth, initHeight, {}, axisDimensions);
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
	}, [dimensions, axisDimensions, drawChart, handleCandleHover, getRafThrottled, registerCleanup]);
	
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
			
			{/* SVG Grid (Background grid pattern) */}
			{dataLoaded && viewState.current.priceCalculations && stockData.current && viewState.current.chartDimensions && (
				<SvgGrid 
					ref={svgGridRef}
					chartBounds={viewState.current.chartDimensions ? {
						left: viewState.current.chartDimensions.margin.left,
						top: viewState.current.chartDimensions.margin.top,
						right: viewState.current.chartDimensions.margin.left + viewState.current.chartDimensions.chartWidth,
						bottom: viewState.current.chartDimensions.margin.top + viewState.current.chartDimensions.chartHeight
					} : null}
					priceMin={viewState.current.priceCalculations.priceMin}
					priceMax={viewState.current.priceCalculations.priceMax}
					priceDiff={viewState.current.priceCalculations.priceDiff}
					visibleData={(() => {
						const { startIndex, maxCandles } = viewState.current;
						const endIndex = Math.min(startIndex + maxCandles, stockData.current.length);
						return stockData.current.slice(startIndex, endIndex);
					})()}
					timeGridIndices={(() => {
						const { startIndex, maxCandles } = viewState.current;
						const endIndex = Math.min(startIndex + maxCandles, stockData.current.length);
						const visibleData = stockData.current.slice(startIndex, endIndex);
						return calculateTimeGridIndices(visibleData, 6);
					})()}
					canvasWidth={viewState.current.canvasWidth}
					gridLines={8}
					showGrid={true}
				/>
			)}
			
			{/* SVG Y-Axis (Price labels) */}
			{dataLoaded && viewState.current.priceCalculations && (
				<SvgYAxis 
					ref={svgYAxisRef}
					chartBounds={viewState.current.chartDimensions ? {
						left: viewState.current.chartDimensions.margin.left,
						top: viewState.current.chartDimensions.margin.top,
						right: viewState.current.chartDimensions.margin.left + viewState.current.chartDimensions.chartWidth,
						bottom: viewState.current.chartDimensions.margin.top + viewState.current.chartDimensions.chartHeight
					} : null}
					priceMin={viewState.current.priceCalculations.priceMin}
					priceMax={viewState.current.priceCalculations.priceMax}
					priceDiff={viewState.current.priceCalculations.priceDiff}
					gridLines={8}
					showGrid={true}
					width={axisDimensions.yAxisWidth}
				/>
			)}
			
			{/* SVG X-Axis (Time labels) */}
			{dataLoaded && stockData.current && viewState.current.chartDimensions && (
				<SvgXAxis 
					ref={svgXAxisRef}
					chartBounds={viewState.current.chartDimensions ? {
						left: viewState.current.chartDimensions.margin.left,
						top: viewState.current.chartDimensions.margin.top,
						right: viewState.current.chartDimensions.margin.left + viewState.current.chartDimensions.chartWidth,
						bottom: viewState.current.chartDimensions.margin.top + viewState.current.chartDimensions.chartHeight
					} : null}
					visibleData={(() => {
						const { startIndex, maxCandles } = viewState.current;
						const endIndex = Math.min(startIndex + maxCandles, stockData.current.length);
						return stockData.current.slice(startIndex, endIndex);
					})()}
					timeGridIndices={(() => {
						const { startIndex, maxCandles } = viewState.current;
						const endIndex = Math.min(startIndex + maxCandles, stockData.current.length);
						const visibleData = stockData.current.slice(startIndex, endIndex);
						return calculateTimeGridIndices(visibleData, 6);
					})()}
					canvasWidth={viewState.current.canvasWidth}
					showGrid={true}
					height={axisDimensions.xAxisHeight}
				/>
			)}
			
			{/* SVG Crosshair */}
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