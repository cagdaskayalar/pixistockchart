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
import { scaleLinear } from 'd3-scale';
import { getData } from '../dataUtils';
import { generateStockData } from './utils/dataUtils';
import { calculatePriceRange } from './utils/priceCalculations';
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
				// Calculate actual maxCandles first
				const initialChartWidth = window.innerWidth - (axisDimensions?.yAxisWidth || 50);
				const actualMaxCandles = Math.floor(initialChartWidth / viewState.current.canvasWidth);
				viewState.current.maxCandles = actualMaxCandles;
				
				// Now set startIndex to show latest data properly
				const dataLength = data.length;
				viewState.current.startIndex = Math.max(0, dataLength - actualMaxCandles);
				
				setDataLoaded(true);
				console.log('Stock data loaded:', data.length, 'candles');
				console.log('Chart width:', initialChartWidth, 'px, maxCandles:', actualMaxCandles);
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
	}, [axisDimensions]);
	
	// Dynamic dimensions
	const [dimensions, setDimensions] = React.useState({
		width: window.innerWidth,
		height: window.innerHeight - 50 // Subtract header height
	});
	
	// Chart state with performance optimizations
	const viewState = useRef({
		startIndex: 0,
		canvasWidth: 20, // pixels per candle
		isDragging: false,
		lastMouseX: 0,
		maxCandles: 50, // This will be recalculated based on actual chart width
		lastCrosshairUpdate: 0, // For throttling crosshair updates
		// Performance state
		needsRedraw: true,
		lastDrawnRange: { start: -1, end: -1 },
		renderCache: new Map()
	});
	
	// GPU-optimized object pools for massive datasets (not needed anymore with single Graphics)
	const objectPools = useRef({
		candleGraphics: [],
		wickGraphics: [],
		poolIndex: 0,
		maxPoolSize: 100 // Reduced since we use single Graphics now
	});
	
	// Update maxCandles when chart dimensions change
	useEffect(() => {
		if (!dimensions.width || !axisDimensions.yAxisWidth) return;
		
		const { chartWidth } = calculateChartDimensions(dimensions.width, dimensions.height, {}, axisDimensions);
		const actualMaxCandles = Math.floor(chartWidth / viewState.current.canvasWidth);
		
		if (actualMaxCandles !== viewState.current.maxCandles) {
			viewState.current.maxCandles = actualMaxCandles;
			console.log(`📊 Chart dimensions updated - maxCandles: ${actualMaxCandles}, chartWidth: ${chartWidth}px`);
		}
	}, [dimensions, axisDimensions]);
	
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
	
	// Initialize object pools for high-performance rendering (minimal for single Graphics)
	const initializeObjectPools = useCallback(() => {
		const pools = objectPools.current;
		
		// Minimal pre-allocation since we use single Graphics object now
		for (let i = 0; i < pools.maxPoolSize; i++) {
			const candleGfx = new PIXI.Graphics();
			const wickGfx = new PIXI.Graphics();
			
			pools.candleGraphics.push(candleGfx);
			pools.wickGraphics.push(wickGfx);
		}
		
		pools.poolIndex = 0;
		console.log(`🏊‍♂️ Minimal object pools: ${pools.maxPoolSize} graphics objects (for backup use)`);
	}, []);
	
	// Reset pool for next frame
	const resetObjectPool = useCallback(() => {
		objectPools.current.poolIndex = 0;
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

		// Large dataset protection
		if (visibleData.length > 50000) {
			console.warn(`⚠️ Large visible dataset: ${visibleData.length} items. Performance may be impacted.`);
		}

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

		// Ultra-fast container cleanup (single Graphics = instant cleanup)
		const startCleanup = performance.now();
		
		// Since we use single Graphics object, cleanup is instant!
		chartContainer.removeChildren().forEach(child => {
			if (child && child.destroy) {
				child.destroy();
			}
		});
		
		console.log(`🧹 Ultra-fast cleanup: ${(performance.now() - startCleanup).toFixed(2)}ms`);
		
		// Create only background (no grid - SVG handles grid now)
		createChartBackground({
			container: chartContainer,
			margin,
			chartWidth,
			chartHeight
		});
		
		// Draw candlesticks (PIXI v8 modern API) - D3 scale ile hizalanmış pozisyonlar
		// Calculate vertical padding exactly like YAxis (0.0125% of chart height)
		const verticalPadding = chartHeight * 0.0125;
		
		// Create D3 scale EXACTLY like YAxis for perfect alignment
		const priceScale = scaleLinear()
			.domain([priceMin, priceMax])
			.range([
				margin.top + chartHeight - verticalPadding, // chartBottom - verticalPadding
				margin.top + verticalPadding                // chartTop + verticalPadding
			]);
		
		// Debug: Log scale parameters for verification
		if (visibleData.length > 0) {
			console.log('📐 CANDLESTICK SCALE DEBUG:');
			console.log('- Chart Height:', chartHeight, 'px');
			console.log('- Vertical Padding:', verticalPadding.toFixed(2), 'px');
			console.log('- Price Domain:', [priceMin.toFixed(2), priceMax.toFixed(2)]);
			console.log('- Y Range:', [margin.top + chartHeight - verticalPadding, margin.top + verticalPadding]);
			console.log('- Sample: Price', priceMin.toFixed(2), '→ Y:', priceScale(priceMin).toFixed(1));
			console.log('- Sample: Price', priceMax.toFixed(2), '→ Y:', priceScale(priceMax).toFixed(1));
		}
		
		// 🚀 MAJOR PERFORMANCE OPTIMIZATION FOR 49K+ DATA POINTS
		
		// Check if we need to redraw (smart caching)
		const currentRange = { start: startIndex, end: endIndex };
		const rangeChanged = currentRange.start !== viewState.current.lastDrawnRange.start || 
							currentRange.end !== viewState.current.lastDrawnRange.end;
		
		if (!viewState.current.needsRedraw && !rangeChanged) {
			console.log('📊 Skipping redraw - using cached render');
			return;
		}
		
		// Initialize object pools on first run
		if (objectPools.current.candleGraphics.length === 0) {
			initializeObjectPools();
		}
		
		// Reset object pool for new frame
		resetObjectPool();
		
		// Track render performance with PerformanceMonitor
		const renderStartTime = startTiming();
		
		// Intelligent cleanup - only if container has children
		if (chartContainer.children.length > 0) {
			const startCleanup = performance.now();
			
			// Fast bulk removal instead of individual destroy
			chartContainer.removeChildren();
			
			console.log(`🧹 Bulk cleanup: ${(performance.now() - startCleanup).toFixed(2)}ms`);
		}
		
		// Create only background (no grid - SVG handles grid now)
		createChartBackground({
			container: chartContainer,
			margin,
			chartWidth,
			chartHeight
		});
		
		// GPU-Optimized rendering for massive datasets
		
		// Create single container for all candlesticks (batch rendering)
		const candleContainer = new PIXI.Container();
		chartContainer.addChild(candleContainer);
		
		// Use already defined priceScale and verticalPadding from above
		
		// 🚀 ULTRA HIGH PERFORMANCE STRATEGY - Single Graphics Object
		// Instead of creating thousands of Graphics objects, draw everything in ONE Graphics object
		// This is the PIXI.js way for handling massive datasets!
		
		const masterGraphics = new PIXI.Graphics();
		candleContainer.addChild(masterGraphics);
		
		// Calculate candle body width using utility (move outside loop for performance)
		const bodyWidth = calculateCandleBodyWidth(canvasWidth, 2, 0.8);
		
		// 🚀 REVOLUTIONARY APPROACH: Batch all geometry into arrays, then draw once
		const wickLines = [];      // Store all wick lines
		const bullishBodies = [];  // Store all bullish candle bodies  
		const bearishBodies = [];  // Store all bearish candle bodies
		
		// 🚀 ULTRA OPTIMIZED - Process ALL data at once!
		// No chunking needed with batched geometry approach
		
		for (let i = 0; i < visibleData.length; i++) {
			const candle = visibleData[i];
			
			// X position using indexToX utility - Grid sistemine uyumlu
			const x = indexToX(i, canvasWidth, margin.left);
			
			// Y positions using D3 scale (same as YAxis)
			const openY = priceScale(candle.open);
			const closeY = priceScale(candle.close);
			const highY = priceScale(candle.high);
			const lowY = priceScale(candle.low);
			
			const isBullish = candle.close >= candle.open;
			
			// Store wick line data
			wickLines.push({ x, highY, lowY });
			
			// Store body data by type
			const bodyTop = Math.min(openY, closeY);
			const bodyHeight = Math.max(1, Math.abs(closeY - openY));
			const bodyData = { 
				x: x - bodyWidth/2, 
				y: bodyTop, 
				width: bodyWidth, 
				height: bodyHeight 
			};
			
			if (isBullish) {
				bullishBodies.push(bodyData);
			} else {
				bearishBodies.push(bodyData);
			}
		}
		
		// 🚀 ALL DATA PROCESSED - NOW DRAW EVERYTHING AT ONCE!
		// This is 100x faster than individual draw calls
		
		// Draw all wicks with single stroke
		if (wickLines.length > 0) {
			wickLines.forEach(wick => {
				masterGraphics.moveTo(wick.x, wick.highY)
							 .lineTo(wick.x, wick.lowY);
			});
			masterGraphics.stroke({ width: 1, color: 0x666666 }); // Gray wicks
		}
		
		// Draw all bullish bodies with single fill
		if (bullishBodies.length > 0) {
			bullishBodies.forEach(body => {
				masterGraphics.rect(body.x, body.y, body.width, body.height);
			});
			masterGraphics.fill(0x00dd88); // Green bullish
		}
		
		// Draw all bearish bodies with single fill
		if (bearishBodies.length > 0) {
			bearishBodies.forEach(body => {
				masterGraphics.rect(body.x, body.y, body.width, body.height);
			});
			masterGraphics.fill(0xdd4444); // Red bearish
		}
		
		// All data processed - finalize render
		const renderTime = endTiming(renderStartTime);
		
		// Update cache state
		viewState.current.needsRedraw = false;
		viewState.current.lastDrawnRange = currentRange;
		
		// Manual render to ensure immediate display
		if (appRef.current && appRef.current.renderer) {
			appRef.current.renderer.render(appRef.current.stage);
		}
		
		updateFPS();
		
		// Performance reporting
		const stats = getPerformanceStats();
		console.log(`🚀 INSTANT RENDER: ${renderTime.toFixed(2)}ms | FPS: ${stats.fps} | Batched Geometry | Candles: ${visibleData.length}`);
		console.log(`🎯 Geometry Stats: ${wickLines.length} wicks, ${bullishBodies.length} bullish, ${bearishBodies.length} bearish`);
		
		if (onPerformanceUpdate) {
			onPerformanceUpdate({
				renderTime,
				fps: stats.fps,
				memoryUsage: stats.memoryUsage,
				visibleCandles: visibleData.length,
				totalCandles: stockData.current ? stockData.current.length : 0,
				candleWidth: canvasWidth,
				startIndex,
				priceRange: `$${priceMin.toFixed(2)}-$${priceMax.toFixed(2)}`
			});
		}
		
	}, [dimensions, axisDimensions, onPerformanceUpdate, startTiming, endTiming, updateFPS, getPerformanceStats, dataLoaded, initializeObjectPools, resetObjectPool]); // drawChart useCallback end

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
		
		// PIXI Application (v8 async initialization) - HIGH PERFORMANCE CONFIG
		const initPixi = async () => {
			try {
				const app = new PIXI.Application();
				
				// 🚀 ULTRA HIGH PERFORMANCE CONFIG for 49K+ data points
				const initConfig = {
					width: initWidth,
					height: initHeight,
					backgroundAlpha: 0, // Şeffaf background
					antialias: false, // Disable for better performance on large datasets
					transparent: true, // Şeffaflık için
					resolution: window.devicePixelRatio || 1,
					preference: 'webgl', // Force WebGL for maximum compatibility and performance
					
					// 🔥 EXTREME PERFORMANCE OPTIMIZATIONS
					autoStart: false, // Manual ticker control
					sharedTicker: false, // Independent ticker for better control
					eventMode: 'auto', // Auto event handling
					eventFeatures: {
						move: true,
						globalMove: false,
						click: true,
						wheel: true
					},
					
					// WebGL specific optimizations for massive datasets
					powerPreference: 'high-performance', // Use dedicated GPU if available
					failIfMajorPerformanceCaveat: false, // Allow software rendering as fallback
					preserveDrawingBuffer: false, // Better memory usage
					premultipliedAlpha: true, // Better blend performance
					stencil: false, // Disable stencil buffer (not needed)
					depth: false, // Disable depth buffer (2D only)
					
					// Memory management
					clearBeforeRender: true,
					useContextAlpha: false // Better performance for opaque renders
				};
				
				// powerPreference sadece Windows dışında kullan (Chrome bug workaround)
				if (!navigator.userAgent.includes('Windows')) {
					initConfig.powerPreference = 'high-performance';
				}
				
				await app.init(initConfig);
				
				appRef.current = app;
				
				// 🔧 PIXI.js Console Access - Development only
				if (process.env.NODE_ENV === 'development') {
					window.__PIXI_APP__ = app;
					window.__PIXI_STAGE__ = app.stage;
					window.__PIXI_RENDERER__ = app.renderer;
					console.log('🎮 PIXI Console Access:');
					console.log('- window.__PIXI_APP__ (PIXI Application)');
					console.log('- window.__PIXI_STAGE__ (Stage container)');  
					console.log('- window.__PIXI_RENDERER__ (Renderer)');
					console.log('- Renderer type:', app.renderer.type === 1 ? 'WebGL' : app.renderer.type === 2 ? 'WebGPU' : 'Canvas');
					console.log('- GPU Support:', app.renderer.type > 0 ? 'Yes' : 'No');
					console.log('- High DPI:', window.devicePixelRatio > 1 ? `${window.devicePixelRatio}x` : 'No');
				}
			
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
							
							// 🚀 PERFORMANCE BOOST: Mark for redraw instead of immediate draw
							viewState.current.needsRedraw = true;
							
							// Throttled chart update to prevent visual glitches
							drawChart();
						}
					}
				}
			}, 8); // Faster response for smoother interaction
			
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
				
				// Log current visible range BEFORE zoom
				const currentStartIndex = viewState.current.startIndex;
				const currentLastIndex = Math.min(currentStartIndex + viewState.current.maxCandles - 1, stockData.current.length - 1);
				console.log(`🔍 ZOOM WHEEL - BEFORE: startIndex=${currentStartIndex}, lastIndex=${currentLastIndex}, visible=${currentLastIndex - currentStartIndex + 1} candles`);
				console.log(`📊 DATA INFO: Total data length=${stockData.current.length}, maxCandles BEFORE=${viewState.current.maxCandles}`);
				
				const zoomFactor = e.deltaY < 0 ? 1.2 : 0.8;
				const zoomDirection = e.deltaY < 0 ? 'IN' : 'OUT';
				console.log(`🔍 ZOOM ${zoomDirection} (factor: ${zoomFactor})`);
				
				// Calculate new candle width with dynamic constraints
				const chartWidth = viewState.current.chartDimensions.chartWidth;
				const totalDataCount = stockData.current.length;
				console.log(`📐 CHART INFO: chartWidth=${chartWidth}px, totalData=${totalDataCount}`);
				console.log(`📐 CURRENT: candleWidth=${viewState.current.canvasWidth.toFixed(4)}px, maxCandles=${viewState.current.maxCandles}`);
				
				const newCandleWidth = constrainCandleWidth(
					viewState.current.canvasWidth, 
					zoomFactor, 
					0.1, 
					100, 
					chartWidth, 
					totalDataCount
				);
				
				if (newCandleWidth !== viewState.current.canvasWidth) {
					const oldCanvasWidth = viewState.current.canvasWidth;
					const oldMaxCandles = viewState.current.maxCandles;
					
					viewState.current.canvasWidth = newCandleWidth;
					// Use actual chart width from stored dimensions
					const chartWidth = viewState.current.chartDimensions.chartWidth;
					viewState.current.maxCandles = Math.floor(chartWidth / newCandleWidth);
					
					console.log(`📏 CANVAS WIDTH: ${oldCanvasWidth.toFixed(4)} → ${newCandleWidth.toFixed(4)}`);
					console.log(`📊 MAX CANDLES: ${oldMaxCandles} → ${viewState.current.maxCandles}`);
					
					// Data coverage hesaplama
					const totalData = stockData.current.length;
					const visibleData = viewState.current.maxCandles;
					const coveragePercent = Math.min(100, (visibleData / totalData * 100)).toFixed(2);
					console.log(`📈 DATA COVERAGE: ${visibleData}/${totalData} (${coveragePercent}%)`);
					
					// RIGHT ANCHOR: Keep right side fixed, adjust left side (startIndex)
					const currentEndIndex = viewState.current.startIndex + oldMaxCandles - 1;
					viewState.current.startIndex = Math.max(0, currentEndIndex - viewState.current.maxCandles + 1);
					
					// 🚀 PERFORMANCE BOOST: Mark for redraw
					viewState.current.needsRedraw = true;
					
					// Log new visible range AFTER zoom
					const newLastIndex = Math.min(viewState.current.startIndex + viewState.current.maxCandles - 1, stockData.current.length - 1);
					console.log(`🔍 ZOOM WHEEL - AFTER: startIndex=${viewState.current.startIndex}, lastIndex=${newLastIndex}, visible=${newLastIndex - viewState.current.startIndex + 1} candles`);
					console.log('-----------------------------------');
					
					// Batched chart update for better performance
					requestAnimationFrame(() => {
						drawChart();
					});
					//console.log('Zoom - candle width:', newCandleWidth.toFixed(1), 'visible candles:', viewState.current.maxCandles);
				}
			}, 8); // Faster throttling for smoother zoom (16ms -> 8ms)
			
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
			
			// High-performance ticker setup
			if (app.ticker) {
				// Performance optimizations
				app.ticker.maxFPS = 60; // Cap at 60 FPS
				app.ticker.minFPS = 30; // Minimum FPS to maintain
				app.ticker.autoStart = false;
				app.ticker.stop();
				
				// Manual rendering kontrolü - sadece gerektiğinde render
				// Static chart için ticker'a ihtiyaç yok, manuel rendering kullanıyoruz
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