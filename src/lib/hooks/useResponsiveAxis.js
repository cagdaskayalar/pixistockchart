import { useState, useEffect } from 'react';

/**
 * @fileoverview Responsive axis utilities and hooks for dynamic chart sizing
 * Provides hooks and utilities for measuring text dimensions, observing element resize events,
 * and calculating optimal axis dimensions based on content and container size.
 * 
 * @author Mehmet Çağdaş Kayalarlıoğulları
 * @version 1.3.0
 * @since 2024-01-01
 */

/**
 * @typedef {Object} Dimensions
 * @property {number} width - Width in pixels
 * @property {number} height - Height in pixels
 */

/**
 * @typedef {Object} AxisDimensions
 * @property {number} yAxisWidth - Y-axis width in pixels (for price labels)
 * @property {number} xAxisHeight - X-axis height in pixels (for time labels)
 */

/**
 * @typedef {Object} ContainerSize
 * @property {number} [width=800] - Container width in pixels
 * @property {number} [height=600] - Container height in pixels
 */

/**
 * Custom hook that observes resize events on a DOM element using ResizeObserver API.
 * Automatically tracks width and height changes and provides real-time dimensions.
 * 
 * @function useResizeObserver
 * @param {React.RefObject<HTMLElement>} ref - React ref object pointing to the element to observe
 * @returns {Dimensions} Object containing current width and height of the observed element
 * 
 * @example
 * // Monitor a chart container for size changes
 * const containerRef = useRef(null);
 * const { width, height } = useResizeObserver(containerRef);
 * 
 * useEffect(() => {
 *   console.log(`Container resized to: ${width}x${height}`);
 * }, [width, height]);
 * 
 * @example
 * // Use with a div element
 * return (
 *   <div ref={containerRef}>
 *     Chart content - Size: {width} x {height}
 *   </div>
 * );
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver|ResizeObserver API}
 */
export const useResizeObserver = (ref) => {
	const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

	useEffect(() => {
		const element = ref.current;
		if (!element) return;

		const resizeObserver = new ResizeObserver(entries => {
			if (entries.length > 0) {
				const { width, height } = entries[0].contentRect;
				setDimensions({ width, height });
			}
		});

		resizeObserver.observe(element);

		// Initial measurement
		const rect = element.getBoundingClientRect();
		setDimensions({ width: rect.width, height: rect.height });

		return () => {
			resizeObserver.disconnect();
		};
	}, [ref]);

	return dimensions;
};

/**
 * Measures the pixel width of text using Canvas 2D API for accurate text sizing.
 * Uses HTML5 Canvas context to calculate exact text dimensions with specified font properties.
 * Essential for dynamic axis sizing and responsive chart layouts.
 * 
 * @function measureTextWidth
 * @param {string} text - The text string to measure
 * @param {string} [fontSize='11px'] - Font size in CSS format (e.g., '11px', '1rem')
 * @param {string} [fontFamily='Arial, sans-serif'] - Font family in CSS format
 * @returns {number} The width of the text in pixels, rounded up to nearest integer
 * 
 * @example
 * // Measure a price label
 * const priceWidth = measureTextWidth('$123.45', '12px', 'monospace');
 * console.log(`Price label width: ${priceWidth}px`);
 * 
 * @example
 * // Measure time labels with different fonts
 * const timeWidth = measureTextWidth('14:30', '11px', 'Arial, sans-serif');
 * const boldTimeWidth = measureTextWidth('14:30', 'bold 11px', 'Arial');
 * 
 * @throws {Error} Throws error if Canvas 2D context is not available
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/measureText|Canvas measureText}
 */
export const measureTextWidth = (text, fontSize = '11px', fontFamily = 'Arial, sans-serif') => {
	// Canvas kullanarak text genişliği ölçme
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	context.font = `${fontSize} ${fontFamily}`;
	const width = context.measureText(text).width;
	canvas.remove();
	return Math.ceil(width);
};

/**
 * Calculates optimal axis dimensions based on label content and container size.
 * Dynamically determines Y-axis width for price labels and X-axis height for time labels.
 * Implements responsive scaling to maintain readability across different screen sizes.
 * 
 * @function calculateAxisDimensions
 * @param {string[]} [priceLabels=[]] - Array of price label strings to measure
 * @param {string[]} [timeLabels=[]] - Array of time label strings to measure  
 * @param {ContainerSize} [containerSize={}] - Container dimensions for responsive scaling
 * @returns {AxisDimensions} Calculated axis dimensions with optimal sizing
 * 
 * @example
 * // Calculate dimensions for a price chart
 * const priceLabels = ['$123.45', '$125.67', '$120.12'];
 * const timeLabels = ['09:30', '10:00', '10:30', '11:00'];
 * const containerSize = { width: 800, height: 600 };
 * 
 * const { yAxisWidth, xAxisHeight } = calculateAxisDimensions(
 *   priceLabels, 
 *   timeLabels, 
 *   containerSize
 * );
 * 
 * @example
 * // Use with minimal data for fallback sizing
 * const { yAxisWidth, xAxisHeight } = calculateAxisDimensions();
 * // Returns minimum dimensions: { yAxisWidth: 45, xAxisHeight: 25 }
 * 
 * @example
 * // Responsive scaling example
 * const smallContainer = { width: 400, height: 300 };
 * const { yAxisWidth, xAxisHeight } = calculateAxisDimensions(
 *   priceLabels,
 *   timeLabels,
 *   smallContainer
 * );
 * // Dimensions automatically scaled down for smaller containers
 * 
 * @throws {Error} No errors thrown, gracefully handles invalid inputs with defaults
 * @see {@link measureTextWidth} Used internally for text measurement
 */
export const calculateAxisDimensions = (priceLabels = [], timeLabels = [], containerSize = {}) => {
	const { width: containerWidth = 800, height: containerHeight = 600 } = containerSize;
	
	// Y-Axis width hesaplama
	let maxPriceTextWidth = 0;
	priceLabels.forEach(price => {
		const textWidth = measureTextWidth(price, '11px', 'Arial, sans-serif');
		if (textWidth > maxPriceTextWidth) {
			maxPriceTextWidth = textWidth;
		}
	});
	
	// Y-axis için: text width + padding (tick: 8px + text padding: 8px) + margin: 8px
	const yAxisWidth = Math.max(maxPriceTextWidth + 24, 45); // Minimum 45px
	
	// X-Axis height hesaplama
	let maxTimeTextWidth = 0;
	timeLabels.forEach(time => {
		const textWidth = measureTextWidth(time, '11px', 'Arial, sans-serif');
		if (textWidth > maxTimeTextWidth) {
			maxTimeTextWidth = textWidth;
		}
	});
	
	// X-axis için: text height (11px) + tick height (8px) + padding (8px)
	const xAxisHeight = Math.max(27, 25); // Minimum 25px
	
	// Responsive scaling
	const scale = Math.min(containerWidth / 800, containerHeight / 600);
	
	return {
		yAxisWidth: Math.ceil(yAxisWidth * Math.max(scale, 0.8)), // Minimum %80 scale
		xAxisHeight: Math.ceil(xAxisHeight * Math.max(scale, 0.8))
	};
};
