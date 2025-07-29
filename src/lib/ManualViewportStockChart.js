/**
 * @fileoverview Manual Viewport Stock Chart Component (PIXI Viewport Alternative)
 * High-performance candlestick chart with manual pan/zoom implementation
 * Built without pixi-viewport dependency to avoid ticker conflicts
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları  
 * @version 2.1.0
 * @since 2024-01-01
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as PIXI from 'pixi.js';
import { scaleLinear } from 'd3-scale';
import { getData } from '../dataUtils';
import { generateStockData } from './utils/dataUtils';
import { calculatePriceRange } from './utils/priceCalculations';
import { useResizeObserver } from './hooks/useResponsiveAxis';

/**
 * Manual Viewport Stock Chart - No pixi-viewport dependency
 * Features manual pan/zoom with pure PIXI.js implementation
 */
const ManualViewportStockChart = ({ onPerformanceUpdate }) => {
	const canvasRef = useRef(null);
	const appRef = useRef(null);
	const chartContainerRef = useRef(null);
	
	// Stock data state
	const stockData = useRef(null);
	const [dataLoaded, setDataLoaded] = useState(false);
	
	// Responsive dimensions
	useResizeObserver(canvasRef);
	
	// Dynamic dimensions
	const [dimensions, setDimensions] = React.useState({
		width: window.innerWidth,
		height: window.innerHeight - 50
	});
	
	// 🚀 PERFORMANCE: Object pooling for graphics
	const graphicsPool = useRef([]);
	
	const getPooledGraphics = () => {
		if (graphicsPool.current.length > 0) {
			const graphics = graphicsPool.current.pop();
			graphics.clear();
			return graphics;
		}
		return new PIXI.Graphics();
	};
	
	const returnToPool = (graphics) => {
		if (graphics && graphicsPool.current.length < 10) {
			graphics.clear();
			graphicsPool.current.push(graphics);
		} else if (graphics && graphics.destroy) {
			graphics.destroy();
		}
	};
	
	// Manual viewport state - SCREEN-BASED COORDINATE SYSTEM
	const manualViewport = useRef({
		// World coordinates - Screen-based like PIXI.js
		worldWidth: 10000,
		worldHeight: 2000,
		// Camera position - Screen coordinates
		cameraX: 0,
		cameraY: 0,
		// Zoom level - Start with more reasonable zoom
		zoomX: 3, // Increased initial zoom for better visibility
		zoomY: 1,
		// Interaction state
		isDragging: false,
		lastMouseX: 0,
		lastMouseY: 0,
		// Rendering
		canvasWidth: 8, // Smaller candle width for more data visibility
		needsRedraw: true,
		// Performance & Caching
		fps: 60,
		frameCount: 0,
		lastFpsUpdate: Date.now(),
		renderTimes: [],
		lastRenderHash: '', // Cache key for avoiding unnecessary redraws
		renderCache: new Map(), // Graphics object cache
		lastCameraX: -1, // Track camera movement
		lastZoomX: -1 // Track zoom changes
	});
	
	// Load data
	useEffect(() => {
		const loadData = async () => {
			try {
				console.log('📊 ManualViewportStockChart: Loading data...');
				const data = await getData();
				stockData.current = data;
				setDataLoaded(true);
				console.log('✅ Data loaded:', data.length, 'candles');
			} catch (error) {
				console.error('❌ Data loading error:', error);
				const fallbackData = generateStockData(2000);
				stockData.current = fallbackData;
				setDataLoaded(true);
			}
		};
		
		if (!stockData.current) {
			loadData();
		}
	}, []);
	
	// Performance monitoring
	const startTiming = useCallback(() => performance.now(), []);
	const endTiming = useCallback((startTime) => {
		const renderTime = performance.now() - startTime;
		manualViewport.current.renderTimes.push(renderTime);
		if (manualViewport.current.renderTimes.length > 10) {
			manualViewport.current.renderTimes.shift();
		}
		return renderTime;
	}, []);
	
	const updateFPS = useCallback(() => {
		manualViewport.current.frameCount++;
		const now = Date.now();
		if (now - manualViewport.current.lastFpsUpdate >= 1000) {
			manualViewport.current.fps = manualViewport.current.frameCount;
			manualViewport.current.frameCount = 0;
			manualViewport.current.lastFpsUpdate = now;
		}
	}, []);
	
	// World to screen coordinate conversion - SCREEN-BASED COORDINATES
	const worldToScreen = useCallback((worldX, worldY) => {
		const viewport = manualViewport.current;
		return {
			x: (worldX - viewport.cameraX) * viewport.zoomX,
			y: worldY // Direct world Y to screen Y (no flip needed now)
		};
	}, []);
	
	// Screen to world coordinate conversion - SCREEN-BASED COORDINATES
	const screenToWorld = useCallback((screenX, screenY) => {
		const viewport = manualViewport.current;
		return {
			x: screenX / viewport.zoomX + viewport.cameraX,
			y: screenY // Direct screen Y to world Y
		};
	}, []);
	
	// Get visible data based on camera position
	const getVisibleData = useCallback(() => {
		if (!stockData.current) return [];
		
		const viewport = manualViewport.current;
		const screenWidth = dimensions.width;
		
		// Calculate world bounds visible on screen
		const leftWorld = screenToWorld(0, 0).x;
		const rightWorld = screenToWorld(screenWidth, 0).x;
		
		// Convert to data indices
		const startIndex = Math.max(0, Math.floor(leftWorld / viewport.canvasWidth));
		const endIndex = Math.min(stockData.current.length, Math.ceil(rightWorld / viewport.canvasWidth));
		
		return stockData.current.slice(startIndex, endIndex);
	}, [dimensions.width, screenToWorld]);
	
	// Draw chart with manual viewport - PERFORMANCE OPTIMIZED
	const drawChart = useCallback(() => {
		if (!chartContainerRef.current || !appRef.current) return;
		if (!stockData.current || !dataLoaded) return;
		
		// 🚀 SMART CACHE: Check if redraw is really needed
		const currentHash = `${manualViewport.current.cameraX.toFixed(2)}_${manualViewport.current.zoomX.toFixed(4)}_${dimensions.width}_${dimensions.height}`;
		if (currentHash === manualViewport.current.lastRenderHash && !manualViewport.current.needsRedraw) {
			console.log('📈 Cache Hit: Skipping redraw');
			return;
		}
		
		const renderStartTime = startTiming();
		const visibleData = getVisibleData();
		
		if (visibleData.length === 0) return;
		
		// Calculate price range
		const { priceMin, priceMax } = calculatePriceRange(visibleData);
		
		// Clear container with pooled graphics return
		const chartContainer = chartContainerRef.current;
		chartContainer.children.forEach(child => {
			if (child instanceof PIXI.Graphics) {
				returnToPool(child);
			} else if (child && child.destroy) {
				child.destroy();
			}
		});
		chartContainer.removeChildren();
		
		// Create price scale for world coordinates - PIXI.js STYLE SCALING
		// Use screen-based scaling like PIXI.js version
		const margin = { top: 20, bottom: 60, left: 80, right: 120 };
		const chartHeight = dimensions.height - margin.top - margin.bottom;
		const verticalPadding = chartHeight * 0.0125; // Same as PIXI.js version
		
		const priceScale = scaleLinear()
			.domain([priceMin, priceMax])
			.range([
				chartHeight - verticalPadding,  // Bottom (higher Y in world space)
				verticalPadding                 // Top (lower Y in world space)
			]);
		
		// Create single Graphics object
		const masterGraphics = new PIXI.Graphics();
		chartContainer.addChild(masterGraphics);
		
		// DYNAMIC BODY WIDTH - EXTREME GÜÇLÜ KORUMA (Asla kaybolmasın!)
		const viewport = manualViewport.current;
		const screenCandleWidth = viewport.canvasWidth * viewport.zoomX;
		
		// PROFESYONEL BODY WIDTH - AAA Kalitesi (Dynamic Scaling)
		let bodyWidth = Math.max(2, Math.floor(screenCandleWidth * 0.8)); // Dynamic scaling with 80% proportion
		
		// Wick width - PROFESYONEL AAA KALİTESİ (Dynamic Scaling)
		let wickWidth = Math.max(1, Math.floor(screenCandleWidth / 48)); // Dynamic scaling
	
		
		console.log(`� AAA Candlestick Rendering: width=${screenCandleWidth.toFixed(2)}px, bodyWidth=${bodyWidth.toFixed(1)}px, wickWidth=${wickWidth}px, zoom=${viewport.zoomX.toFixed(2)}x`);

		// Batch geometry
		const wickLines = [];
		const bullishBodies = [];
		const bearishBodies = [];
		
		// Get start index in original data
		const leftWorld = screenToWorld(0, 0).x;
		const dataStartIndex = Math.max(0, Math.floor(leftWorld / viewport.canvasWidth));
		
		// Process visible data
		for (let i = 0; i < visibleData.length; i++) {
			const candle = visibleData[i];
			const dataIndex = dataStartIndex + i;
			
			// World coordinates
			const worldX = dataIndex * viewport.canvasWidth;
			const worldY = {
				open: priceScale(candle.open),
				close: priceScale(candle.close),
				high: priceScale(candle.high),
				low: priceScale(candle.low)
			};
			
			// Convert to screen coordinates
			const screen = {
				x: worldToScreen(worldX, 0).x,
				open: worldToScreen(0, worldY.open).y,
				close: worldToScreen(0, worldY.close).y,
				high: worldToScreen(0, worldY.high).y,
				low: worldToScreen(0, worldY.low).y
			};
			
			const isBullish = candle.close >= candle.open;
			
			// Store wick data - professional color coding
			const wickColor = isBullish ? 0x00dd88 : 0xdd4444; // Color coding (not used in batched approach)
			
			wickLines.push({ 
				x: screen.x, 
				highY: screen.high, 
				lowY: screen.low,
				width: wickWidth,
				color: wickColor // For potential future use
			});
			
			// Body calculation with minimum height for visibility
			const bodyTop = Math.min(screen.open, screen.close);
			let bodyHeight = Math.abs(screen.close - screen.open);
			
			// 🏆 PROFESYONEL BODY HEIGHT - DOJI İçin Özel İnce Çizgi
			if (bodyHeight === 0) {
				// DOJI candle (open=close) - çok ince yatay çizgi (1px)
				bodyHeight = 1; // Sabit 1px ince çizgi
			} else if (screenCandleWidth < 4) {
				// Ultra zoom out - ensure visibility
				bodyHeight = Math.max(1, bodyHeight);
			} else if (screenCandleWidth < 8) {
				// Zoom out - professional minimum
				bodyHeight = Math.max(1, bodyHeight); // 2px'den 1px'e düşürdük
			} else if (screenCandleWidth < 16) {
				// Normal zoom - balanced proportions
				bodyHeight = Math.max(1, bodyHeight); // 2px'den 1px'e düşürdük
			} else {
				// High zoom - natural proportions (no minimum override)
				bodyHeight = Math.max(1, bodyHeight);
			}
			
			const bodyData = { 
				x: screen.x - bodyWidth/2, 
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
		
		// 🚀 AAA PROFESYONEL WİCK ÇİZİMİ - Batched Geometry (StockChart.js Style)
		if (wickLines.length > 0) {
			// Create single Graphics object for all wicks (AAA Performance)
			const wickGraphics = getPooledGraphics();
			
			// Draw all wicks with batched geometry
			wickLines.forEach(wick => {
				// Professional line drawing - precise positioning
				wickGraphics.moveTo(wick.x, wick.highY);
				wickGraphics.lineTo(wick.x, wick.lowY);
			});
			
			// Single stroke operation for all wicks (AAA Efficiency)
			wickGraphics.stroke({ 
				width: wickWidth, 
				color: 0x888888, // Professional neutral gray
				cap: 'round',    // Smooth line caps
				join: 'round'    // Smooth line joins
			});
			
			// Add to container
			chartContainer.addChild(wickGraphics);
			
			console.log(`🏆 AAA Wick Rendering: ${wickLines.length} wicks drawn with batched geometry (${wickWidth}px width)`);
		} else {
			console.log(`❌ No wicks to draw!`);
		}
		
		// 🏆 AAA PROFESYONEL BODY ÇİZİMİ - Single Graphics with Batched Geometry
		
		// Create single graphics object for all bodies (Maximum Performance)
		const bodyGraphics = getPooledGraphics();
		
		// Draw all bullish bodies with professional styling
		if (bullishBodies.length > 0) {
			// Professional bullish color with slight transparency for depth
			bodyGraphics.beginFill(0x00dd88); // Professional green
			bodyGraphics.lineStyle(0); // No border for clean look
			
			bullishBodies.forEach(body => {
				// Professional minimum sizes with proportional scaling
				const finalWidth = Math.max(2, body.width);
				const finalHeight = Math.max(1, body.height);
				
				// Precise rectangle positioning
				bodyGraphics.drawRect(body.x, body.y, finalWidth, finalHeight);
			});
			bodyGraphics.endFill();
		}
		
		// Draw all bearish bodies with professional styling
		if (bearishBodies.length > 0) {
			// Professional bearish color
			bodyGraphics.beginFill(0xdd4444); // Professional red
			bodyGraphics.lineStyle(0); // No border for clean look
			
			bearishBodies.forEach(body => {
				// Professional minimum sizes with proportional scaling
				const finalWidth = Math.max(2, body.width);
				const finalHeight = Math.max(1, body.height);
				
				// Precise rectangle positioning
				bodyGraphics.drawRect(body.x, body.y, finalWidth, finalHeight);
			});
			bodyGraphics.endFill();
		}
		
		// Add to container (single graphics object for all bodies)
		chartContainer.addChild(bodyGraphics);
		
		console.log(`🏆 AAA Body Rendering: ${bullishBodies.length} bullish + ${bearishBodies.length} bearish bodies with batched geometry`);
		
		// Update performance
		const renderTime = endTiming(renderStartTime);
		updateFPS();
		
		// 🚀 UPDATE CACHE STATE
		manualViewport.current.lastRenderHash = currentHash;
		manualViewport.current.needsRedraw = false;
		manualViewport.current.lastCameraX = manualViewport.current.cameraX;
		manualViewport.current.lastZoomX = manualViewport.current.zoomX;
		
		console.log(`🚀 ManualViewport: ${visibleData.length} candles in ${renderTime.toFixed(2)}ms`);
		
		// Performance callback
		if (onPerformanceUpdate) {
			onPerformanceUpdate({
				renderTime,
				fps: manualViewport.current.fps,
				memoryUsage: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0,
				visibleCandles: visibleData.length,
				totalCandles: stockData.current.length,
				candleWidth: manualViewport.current.canvasWidth,
				startIndex: dataStartIndex,
				priceRange: `$${priceMin.toFixed(2)}-$${priceMax.toFixed(2)}`
			});
		}
		
	}, [dataLoaded, getVisibleData, worldToScreen, screenToWorld, startTiming, endTiming, updateFPS, onPerformanceUpdate, dimensions.width, dimensions.height]);
	
	// Initialize PIXI application (simple, no viewport dependency)
	useEffect(() => {
		console.log('🚀 ManualViewportStockChart: Initializing...');
		
		const initPIXI = async () => {
			try {
				const app = new PIXI.Application();
				
				await app.init({
					width: dimensions.width,
					height: dimensions.height,
					backgroundAlpha: 0,
					transparent: true,
					antialias: true, // Enable antialiasing for better quality
					resolution: window.devicePixelRatio || 1, // High DPI support
					powerPreference: 'high-performance', // Use dedicated GPU if available
					clearBeforeRender: true,
					preserveDrawingBuffer: false, // Better memory usage
					premultipliedAlpha: true, // Better blend performance
					autoDensity: true // Automatic canvas density scaling
				});
				
				appRef.current = app;
				
				// Mount canvas
				if (canvasRef.current && app.canvas) {
					canvasRef.current.innerHTML = '';
					app.canvas.style.width = '100%';
					app.canvas.style.height = '100%';
					app.canvas.style.display = 'block';
					canvasRef.current.appendChild(app.canvas);
				}
				
				// Create chart container
				const chartContainer = new PIXI.Container();
				app.stage.addChild(chartContainer);
				chartContainerRef.current = chartContainer;
				
				// Position camera to show latest data - PROFESSIONAL TRADING PLATFORM STYLE
				if (stockData.current) {
					const totalDataWidth = stockData.current.length * manualViewport.current.canvasWidth;
					const visibleWorldWidth = dimensions.width / manualViewport.current.zoomX;
					
					// Set camera to show latest data (rightmost) - like professional trading platforms
					manualViewport.current.cameraX = Math.max(0, totalDataWidth - visibleWorldWidth);
					manualViewport.current.cameraY = 0; // Y=0 for screen coordinates
					
					console.log(`📹 Initial Camera Position: X=${manualViewport.current.cameraX.toFixed(1)} (showing latest ${Math.ceil(visibleWorldWidth / manualViewport.current.canvasWidth)} candles)`);
				}
				
				// Mouse interaction
				const canvas = app.canvas;
				
				// Mouse down - SADECE X EKSENİ PAN
				const handleMouseDown = (e) => {
					manualViewport.current.isDragging = true;
					manualViewport.current.lastMouseX = e.clientX;
					// manualViewport.current.lastMouseY = e.clientY; // Y ekseni tracking kaldırıldı
					canvas.style.cursor = 'ew-resize'; // Yatay resize cursor
				};
				
				// Mouse move (pan - SADECE X EKSENİ)
				const handleMouseMove = (e) => {
					if (manualViewport.current.isDragging) {
						const deltaX = e.clientX - manualViewport.current.lastMouseX;
						// const deltaY = e.clientY - manualViewport.current.lastMouseY; // Y ekseni devre dışı
						
						// SADECE X ekseni pan - Y ekseni sabit
						const viewport = manualViewport.current;
						const newCameraX = viewport.cameraX - deltaX / viewport.zoomX;
						
						// CAMERA BOUNDS KONTROLÜ
						if (stockData.current) {
							const totalDataWidth = stockData.current.length * viewport.canvasWidth;
							const screenWidth = dimensions.width;
							
							// Visible screen width in world coordinates
							const visibleWorldWidth = screenWidth / viewport.zoomX;
							
							// Camera X bounds
							const minCameraX = 0; // En sol (data başlangıcı)
							const maxCameraX = totalDataWidth - visibleWorldWidth; // En sağ (data sonu)
							
							// Clamp camera position
							viewport.cameraX = Math.max(minCameraX, Math.min(maxCameraX, newCameraX));
							
							console.log(`📹 Camera X: ${viewport.cameraX.toFixed(1)} (bounds: ${minCameraX.toFixed(1)} - ${maxCameraX.toFixed(1)})`);
						} else {
							viewport.cameraX = newCameraX;
						}
						
						// Y ekseni sabit kalıyor - sadece güncelleme
						manualViewport.current.lastMouseX = e.clientX;
						// manualViewport.current.lastMouseY = e.clientY; // Y ekseni takip etmesin
						
						// 🚀 SMART REDRAW: Only if camera actually moved
						if (Math.abs(viewport.cameraX - manualViewport.current.lastCameraX) > 0.1) {
							manualViewport.current.needsRedraw = true;
							requestAnimationFrame(drawChart);
						}
					}
				};
				
				// Mouse up
				const handleMouseUp = () => {
					manualViewport.current.isDragging = false;
					canvas.style.cursor = 'crosshair';
				};
				
				// Mouse wheel (BOUNDS KONTROLÜ ile smart zoom)
				const handleWheel = (e) => {
					e.preventDefault();
					
					const viewport = manualViewport.current;
					const currentScreenCandleWidth = viewport.canvasWidth * viewport.zoomX;
					
					// AKILLI ZOOM: Candlestick boyutuna göre zoom factor
					let zoomFactor;
					
					if (e.deltaY < 0) {
						// ZOOM IN
						if (currentScreenCandleWidth < 5) {
							zoomFactor = 1.3; // Hızlı zoom in (küçükken)
						} else if (currentScreenCandleWidth < 20) {
							zoomFactor = 1.15; // Orta zoom in
						} else {
							zoomFactor = 1.05; // Yavaş zoom in (büyükken)
						}
					} else {
						// ZOOM OUT
						if (currentScreenCandleWidth > 15) {
							zoomFactor = 0.85; // Hızlı zoom out (büyükken)
						} else if (currentScreenCandleWidth > 5) {
							zoomFactor = 0.9; // Orta zoom out
						} else {
							zoomFactor = 0.95; // Yavaş zoom out (küçükken)
						}
					}
					
					// Mouse position for zoom center
					const rect = canvas.getBoundingClientRect();
					const mouseX = e.clientX - rect.left;
					const mouseY = e.clientY - rect.top;
					
					// World position under mouse
					const worldPos = screenToWorld(mouseX, mouseY);
					
					// Apply zoom - SADECE X EKSENİ
					viewport.zoomX *= zoomFactor;
					// viewport.zoomY *= zoomFactor; // Y zoom sabit kalsın
					
					// EXTREME ZOOM LIMITS - KESİNLİKLE KAYBOLMASIN!
					// Minimum zoom: Candlestick en az 2.5px olsun (EXTREME koruma)
					const minZoom = 2.5 / viewport.canvasWidth;
					// Maximum zoom: Candlestick en fazla 80px olsun
					const maxZoom = 80 / viewport.canvasWidth;
					
					viewport.zoomX = Math.max(minZoom, Math.min(maxZoom, viewport.zoomX));
					// viewport.zoomY = Math.max(minZoom, Math.min(maxZoom, viewport.zoomY)); // Y zoom sabit
					
					// Adjust camera to keep mouse position fixed - SADECE X EKSENİ
					const newScreenPos = worldToScreen(worldPos.x, worldPos.y);
					viewport.cameraX += (newScreenPos.x - mouseX) / viewport.zoomX;
					// viewport.cameraY += (newScreenPos.y - mouseY) / viewport.zoomY; // Y camera sabit
					
					// CAMERA BOUNDS KONTROLÜ - Zoom sonrası
					if (stockData.current) {
						const totalDataWidth = stockData.current.length * viewport.canvasWidth;
						const screenWidth = dimensions.width;
						const visibleWorldWidth = screenWidth / viewport.zoomX;
						
						const minCameraX = 0;
						const maxCameraX = totalDataWidth - visibleWorldWidth;
						viewport.cameraX = Math.max(minCameraX, Math.min(maxCameraX, viewport.cameraX));
						
						// Görünen mum sayısını hesapla
						const visibleCandles = Math.ceil(visibleWorldWidth / viewport.canvasWidth);
						
						// Debug log
						const finalScreenCandleWidth = viewport.canvasWidth * viewport.zoomX;
						console.log(`🔍 Smart Zoom: ${currentScreenCandleWidth.toFixed(1)}px → ${finalScreenCandleWidth.toFixed(1)}px | Görünen: ${visibleCandles}/${stockData.current.length} mum`);
					}
					
					// 🚀 SMART REDRAW: Only if zoom actually changed
					if (Math.abs(viewport.zoomX - manualViewport.current.lastZoomX) > 0.001) {
						manualViewport.current.needsRedraw = true;
						requestAnimationFrame(drawChart);
					}
				};
				
				// Event listeners
				canvas.addEventListener('mousedown', handleMouseDown);
				canvas.addEventListener('mousemove', handleMouseMove);
				canvas.addEventListener('mouseup', handleMouseUp);
				canvas.addEventListener('wheel', handleWheel, { passive: false });
				document.addEventListener('mouseup', handleMouseUp);
				
				// Store for cleanup
				app._eventHandlers = {
					handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, canvas
				};
				
				// Initial draw
				drawChart();
				
				console.log('✅ ManualViewportStockChart: Initialized successfully');
				
			} catch (error) {
				console.error('❌ ManualViewportStockChart: Init error:', error);
			}
		};
		
		if (dataLoaded) {
			initPIXI();
		}
		
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
				try {
					appRef.current.destroy();
				} catch (e) {
					console.warn('PIXI cleanup warning:', e);
				}
				appRef.current = null;
			}
		};
	}, [dimensions, dataLoaded, drawChart, worldToScreen, screenToWorld]);
	
	// Handle resize
	useEffect(() => {
		const handleResize = () => {
			const newWidth = window.innerWidth;
			const newHeight = window.innerHeight - 50;
			
			setDimensions({ width: newWidth, height: newHeight });
			
			if (appRef.current && appRef.current.renderer) {
				appRef.current.renderer.resize(newWidth, newHeight);
			}
		};
		
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);
	
	return (
		<div className="manual-viewport-chart-container" style={{ position: 'relative' }}>
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
					Loading manual viewport chart...
				</div>
			)}
			<div ref={canvasRef} className="manual-viewport-canvas" />
			
			{/* Manual controls info */}
			<div className="manual-viewport-controls" style={{
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
				<div>🎮 Manual Viewport:</div>
				<div>• Drag to pan</div>
				<div>• Wheel to zoom</div>
				<div>• No ticker conflicts!</div>
			</div>
		</div>
	);
};

export default ManualViewportStockChart;
