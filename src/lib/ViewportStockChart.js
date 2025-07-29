/**
 * @fileoverview Advanced Stock Chart Component with PIXI Viewport Integration
 * Professional-grade candlestick chart with zoom, pan, and advanced viewport controls.
 * Built on top of the high-performance StockChart foundation with pixi-viewport.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 2.0.0
 * @since 2024-01-01
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { scaleLinear } from 'd3-scale';
import { getData } from '../dataUtils';
import { generateStockData } from './utils/dataUtils';
import { calculatePriceRange } from './utils/priceCalculations';
import { 
	calculateCandleBodyWidth
} from './utils/coordinateUtils';
import { createChartBackground } from './utils/gridUtils';
import { useResizeObserver } from './hooks/useResponsiveAxis';

/**
 * Advanced Stock Chart with PIXI Viewport Integration
 * Features professional pan/zoom controls, right-anchor zoom, momentum scrolling
 * @component
 * @param {Object} props - Component props
 * @param {Function} [props.onPerformanceUpdate] - Performance metrics callback
 * @returns {JSX.Element} Advanced stock chart with viewport controls
 */
const ViewportStockChart = ({ onPerformanceUpdate }) => {
	const canvasRef = useRef(null);
	const appRef = useRef(null);
	const viewportRef = useRef(null);
	const chartContainerRef = useRef(null);
	
	// Stock data state
	const stockData = useRef(null);
	const [dataLoaded, setDataLoaded] = useState(false);
	
	// Responsive axis dimensions
	useResizeObserver(canvasRef);
	
	// Load real data from JSON
	useEffect(() => {
		const loadData = async () => {
			try {
				console.log('📊 ViewportStockChart: Loading stock data...');
				const data = await getData();
				stockData.current = data;
				setDataLoaded(true);
				console.log('✅ ViewportStockChart: Data loaded -', data.length, 'candles');
			} catch (error) {
				console.error('❌ ViewportStockChart: Error loading data:', error);
				// Fallback to mock data
				const fallbackData = generateStockData(2000);
				stockData.current = fallbackData;
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
		height: window.innerHeight - 50
	});
	
	// Viewport state
	const viewportState = useRef({
		worldWidth: 10000, // Large world for smooth panning
		worldHeight: 1000,
		canvasWidth: 20, // pixels per candle
		needsRedraw: true,
		lastDrawnRange: { start: -1, end: -1 },
		// Performance tracking
		lastFpsUpdate: Date.now(),
		frameCount: 0,
		fps: 60,
		renderTimes: [],
		avgRenderTime: 0
	});
	
	// Performance monitoring
	const startTiming = useCallback(() => performance.now(), []);
	const endTiming = useCallback((startTime) => {
		const renderTime = performance.now() - startTime;
		viewportState.current.renderTimes.push(renderTime);
		if (viewportState.current.renderTimes.length > 10) {
			viewportState.current.renderTimes.shift();
		}
		viewportState.current.avgRenderTime = viewportState.current.renderTimes.reduce((a, b) => a + b, 0) / viewportState.current.renderTimes.length;
		return renderTime;
	}, []);
	
	const updateFPS = useCallback(() => {
		viewportState.current.frameCount++;
		const now = Date.now();
		if (now - viewportState.current.lastFpsUpdate >= 1000) {
			viewportState.current.fps = viewportState.current.frameCount;
			viewportState.current.frameCount = 0;
			viewportState.current.lastFpsUpdate = now;
		}
	}, []);
	
	// Chart drawing function with viewport integration
	const drawChart = useCallback(() => {
		if (!chartContainerRef.current || !appRef.current || !viewportRef.current) return;
		if (!stockData.current || !dataLoaded) {
			console.log('⏳ ViewportStockChart: Waiting for data...');
			return;
		}
		
		// Get visible data based on viewport position
		const viewport = viewportRef.current;
		const worldLeft = viewport.left;
		const worldRight = viewport.right;
		
		// Calculate visible candles based on viewport bounds
		const startIndex = Math.max(0, Math.floor(worldLeft / viewportState.current.canvasWidth));
		const endIndex = Math.min(stockData.current.length, Math.ceil(worldRight / viewportState.current.canvasWidth));
		const visibleData = stockData.current.slice(startIndex, endIndex);

		if (visibleData.length === 0) return;

		// Track render performance
		const renderStartTime = startTiming();

		// Price range calculation
		const { priceMin, priceMax } = calculatePriceRange(visibleData);

		// Ultra-fast container cleanup
		const chartContainer = chartContainerRef.current;
		chartContainer.removeChildren().forEach(child => {
			if (child && child.destroy) {
				child.destroy();
			}
		});

		// Create background
		createChartBackground({
			container: chartContainer,
			margin: { top: 0, left: 0, right: 0, bottom: 0 }, // Viewport handles margins
			chartWidth: viewportState.current.worldWidth,
			chartHeight: viewportState.current.worldHeight
		});

		// Create price scale for viewport world coordinates
		const priceScale = scaleLinear()
			.domain([priceMin, priceMax])
			.range([viewportState.current.worldHeight * 0.9, viewportState.current.worldHeight * 0.1]);

		// Create single Graphics object for all candles (high performance)
		const masterGraphics = new PIXI.Graphics();
		chartContainer.addChild(masterGraphics);

		// Calculate candle body width
		const bodyWidth = calculateCandleBodyWidth(viewportState.current.canvasWidth, 2, 0.8);

		// Batch all geometry
		const wickLines = [];
		const bullishBodies = [];
		const bearishBodies = [];

		// Process visible data
		for (let i = 0; i < visibleData.length; i++) {
			const candle = visibleData[i];
			const dataIndex = startIndex + i;

			// X position in world coordinates
			const x = dataIndex * viewportState.current.canvasWidth;

			// Y positions using price scale
			const openY = priceScale(candle.open);
			const closeY = priceScale(candle.close);
			const highY = priceScale(candle.high);
			const lowY = priceScale(candle.low);

			const isBullish = candle.close >= candle.open;

			// Store geometry data
			wickLines.push({ x, highY, lowY });

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

		// Draw all geometry at once (ultra performance)
		if (wickLines.length > 0) {
			wickLines.forEach(wick => {
				masterGraphics.moveTo(wick.x, wick.highY)
							 .lineTo(wick.x, wick.lowY);
			});
			masterGraphics.stroke({ width: 1, color: 0x666666 });
		}

		if (bullishBodies.length > 0) {
			bullishBodies.forEach(body => {
				masterGraphics.rect(body.x, body.y, body.width, body.height);
			});
			masterGraphics.fill(0x00dd88);
		}

		if (bearishBodies.length > 0) {
			bearishBodies.forEach(body => {
				masterGraphics.rect(body.x, body.y, body.width, body.height);
			});
			masterGraphics.fill(0xdd4444);
		}

		// Finalize render
		const renderTime = endTiming(renderStartTime);
		updateFPS();

		console.log(`🚀 ViewportStockChart: Rendered ${visibleData.length} candles in ${renderTime.toFixed(2)}ms`);

		// Performance callback
		if (onPerformanceUpdate) {
			onPerformanceUpdate({
				renderTime,
				fps: viewportState.current.fps,
				memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0,
				visibleCandles: visibleData.length,
				totalCandles: stockData.current.length,
				candleWidth: viewportState.current.canvasWidth,
				startIndex,
				priceRange: `$${priceMin.toFixed(2)}-$${priceMax.toFixed(2)}`
			});
		}

	}, [onPerformanceUpdate, startTiming, endTiming, updateFPS, dataLoaded]);

	// Initialize PIXI with Viewport - MINIMAL SAFE APPROACH
	useEffect(() => {
		console.log('🚀 ViewportStockChart: Initializing with MINIMAL config...');
		
		const initPixiWithViewport = async () => {
			try {
				// STEP 1: Create PIXI Application with MINIMAL config
				const app = new PIXI.Application();
				
				await app.init({
					width: dimensions.width,
					height: dimensions.height,
					backgroundAlpha: 0,
					transparent: true,
					antialias: false,
					// MINIMAL config - no advanced options
					autoStart: true
				});

				appRef.current = app;

				// STEP 2: Mount canvas BEFORE creating viewport
				if (canvasRef.current && app.canvas) {
					canvasRef.current.innerHTML = '';
					app.canvas.style.width = '100%';
					app.canvas.style.height = '100%';
					app.canvas.style.display = 'block';
					canvasRef.current.appendChild(app.canvas);
				}

				// STEP 3: Create viewport with ABSOLUTE MINIMAL config
				const viewport = new Viewport();
				
				// STEP 4: Initialize viewport AFTER creation
				viewport.init({
					screenWidth: dimensions.width,
					screenHeight: dimensions.height,
					worldWidth: viewportState.current.worldWidth,
					worldHeight: viewportState.current.worldHeight,
					interaction: app.renderer.events
				});

				// STEP 5: Add to stage
				app.stage.addChild(viewport);
				viewportRef.current = viewport;

				// STEP 6: ONLY essential plugins - NO complex ones
				viewport.drag();  // Basic drag only
				viewport.wheel(); // Basic wheel only

				// STEP 7: Create chart container
				const chartContainer = new PIXI.Container();
				viewport.addChild(chartContainer);
				chartContainerRef.current = chartContainer;

				// STEP 8: Position to latest data
				if (stockData.current) {
					const latestDataX = stockData.current.length * viewportState.current.canvasWidth;
					viewport.center = { 
						x: latestDataX - dimensions.width/2, 
						y: viewportState.current.worldHeight/2 
					};
				}

				// STEP 9: Simple event handlers - NO complex debouncing
				viewport.on('moved', () => {
					if (dataLoaded && chartContainerRef.current) {
						setTimeout(drawChart, 16);
					}
				});

				// STEP 10: Draw initial chart
				drawChart();

				console.log('✅ ViewportStockChart: MINIMAL initialization complete');

			} catch (error) {
				console.error('❌ ViewportStockChart: MINIMAL init error:', error);
				// Fallback: show message
				if (canvasRef.current) {
					canvasRef.current.innerHTML = `
						<div style="color: red; padding: 20px; text-align: center;">
							Viewport initialization failed. Using PIXI.js mode instead.
						</div>
					`;
				}
			}
		};

		if (dataLoaded) {
			initPixiWithViewport();
		}

		// MINIMAL cleanup
		return () => {
			if (viewportRef.current) {
				try {
					viewportRef.current.destroy();
				} catch (e) {
					console.warn('Viewport cleanup warning:', e);
				}
				viewportRef.current = null;
			}
			
			if (appRef.current) {
				try {
					if (appRef.current.ticker) {
						appRef.current.ticker.stop();
					}
					appRef.current.destroy();
				} catch (e) {
					console.warn('PIXI cleanup warning:', e);
				}
				appRef.current = null;
			}
		};
	}, [dimensions, dataLoaded, drawChart]);

	// Handle window resize
	useEffect(() => {
		const handleResize = () => {
			const newWidth = window.innerWidth;
			const newHeight = window.innerHeight - 50;
			
			setDimensions({ width: newWidth, height: newHeight });
			
			// Update viewport dimensions
			if (viewportRef.current && appRef.current) {
				appRef.current.renderer.resize(newWidth, newHeight);
				viewportRef.current.resize(newWidth, newHeight);
			}
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return (
		<div className="viewport-stock-chart-container" style={{ position: 'relative' }}>
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
					Loading advanced chart with viewport...
				</div>
			)}
			<div ref={canvasRef} className="viewport-canvas-container" />
			
			{/* Viewport-specific controls overlay */}
			<div className="viewport-controls" style={{
				position: 'absolute',
				top: '10px',
				right: '10px',
				background: 'rgba(0,0,0,0.8)',
				padding: '10px',
				borderRadius: '5px',
				color: 'white',
				fontSize: '12px',
				zIndex: 1000
			}}>
				<div>🎮 Viewport Controls:</div>
				<div>• Drag to pan</div>
				<div>• Wheel to zoom</div>
				<div>• Pinch to zoom (touch)</div>
			</div>
		</div>
	);
};

export default ViewportStockChart;
