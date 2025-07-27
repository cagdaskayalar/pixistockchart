/**
 * PIXI.js helper utilities for chart rendering
 */
import * as PIXI from 'pixi.js';

/**
 * Safely destroys PIXI container children to prevent memory leaks
 * @param {PIXI.Container} container - PIXI container
 */
export const destroyContainerChildren = (container) => {
	if (!container) return;
	
	while (container.children.length > 0) {
		const child = container.children[0];
		container.removeChild(child);
		if (child.destroy) {
			child.destroy({ children: true, texture: false });
		}
	}
};

/**
 * Creates a PIXI Graphics object for background
 * @param {number} x - X position
 * @param {number} y - Y position  
 * @param {number} width - Width
 * @param {number} height - Height
 * @param {number} fillColor - Fill color (hex)
 * @param {number} strokeColor - Stroke color (hex)
 * @param {number} strokeWidth - Stroke width
 * @returns {PIXI.Graphics} Background graphics object
 */
export const createBackground = (x, y, width, height, fillColor = 0x1a1a1a, strokeColor = 0x444444, strokeWidth = 1) => {
	return new PIXI.Graphics()
		.rect(x, y, width, height)
		.fill(fillColor)
		.rect(x, y, width, height)
		.stroke({ width: strokeWidth, color: strokeColor });
};

/**
 * Creates a PIXI Text object with common styling
 * @param {string} text - Text content
 * @param {Object} style - Text style options
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {Object} anchor - Anchor point {x, y}
 * @returns {PIXI.Text} Text object
 */
export const createText = (text, style = {}, x = 0, y = 0, anchor = { x: 0, y: 0 }) => {
	const defaultStyle = {
		fontFamily: 'Arial',
		fontSize: 12,
		fill: 0x888888
	};
	
	const textObj = new PIXI.Text({
		text,
		style: { ...defaultStyle, ...style }
	});
	
	textObj.anchor.set(anchor.x, anchor.y);
	textObj.x = x;
	textObj.y = y;
	
	return textObj;
};

/**
 * Creates a grid line using PIXI Graphics
 * @param {number} x1 - Start X
 * @param {number} y1 - Start Y
 * @param {number} x2 - End X
 * @param {number} y2 - End Y
 * @param {Object} style - Line style {width, color, alpha}
 * @returns {PIXI.Graphics} Grid line graphics
 */
export const createGridLine = (x1, y1, x2, y2, style = {}) => {
	const defaultStyle = { width: 1, color: 0x333333, alpha: 0.3 };
	const lineStyle = { ...defaultStyle, ...style };
	
	return new PIXI.Graphics()
		.moveTo(x1, y1)
		.lineTo(x2, y2)
		.stroke(lineStyle);
};

/**
 * Creates a candlestick graphics object
 * @param {number} x - X position
 * @param {number} highY - High price Y position
 * @param {number} lowY - Low price Y position
 * @param {number} openY - Open price Y position
 * @param {number} closeY - Close price Y position
 * @param {number} bodyWidth - Body width
 * @param {number} color - Candle color
 * @returns {PIXI.Graphics} Candlestick graphics
 */
export const createCandlestick = (x, highY, lowY, openY, closeY, bodyWidth, color) => {
	const candle = new PIXI.Graphics();
	
	// Wick (high-low line)
	candle.moveTo(x, highY)
		  .lineTo(x, lowY)
		  .stroke({ width: 1, color });
	
	// Body
	const bodyTop = Math.min(openY, closeY);
	const bodyHeight = Math.max(1, Math.abs(closeY - openY));
	candle.rect(x - bodyWidth/2, bodyTop, bodyWidth, bodyHeight)
		  .fill(color);
	
	return candle;
};

/**
 * Gets appropriate candlestick color
 * @param {Object} candle - Candle data object with open and close prices
 * @param {number} greenColor - Color for bullish candles
 * @param {number} redColor - Color for bearish candles
 * @returns {number} Color value
 */
export const getCandlestickColor = (candle, greenColor = 0x00dd88, redColor = 0xdd4444) => {
	return candle.close >= candle.open ? greenColor : redColor;
};

/**
 * Creates common text styles for chart elements
 */
export const TEXT_STYLES = {
	title: {
		fontFamily: 'Arial',
		fontSize: 16,
		fill: 0xffffff,
		fontWeight: 'bold'
	},
	priceLabel: {
		fontFamily: 'Arial',
		fontSize: 12,
		fill: 0x888888
	},
	dateLabel: {
		fontFamily: 'Arial',
		fontSize: 11,
		fill: 0x888888
	},
	info: {
		fontFamily: 'Arial',
		fontSize: 11,
		fill: 0xaaaaaa
	}
};

/**
 * Common chart colors
 */
export const CHART_COLORS = {
	background: 0x1a1a1a,
	border: 0x444444,
	grid: 0x333333,
	text: {
		primary: 0xffffff,
		secondary: 0x888888,
		muted: 0xaaaaaa
	},
	candle: {
		bullish: 0x00dd88,
		bearish: 0xdd4444
	}
};
