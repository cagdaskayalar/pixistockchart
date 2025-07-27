import * as PIXI from 'pixi.js';

/**
 * Creates only background for chart area (no grid lines or labels)
 * Grid lines and labels are now handled by SVG components
 */
export const createChartBackground = ({
	container,
	margin,
	chartWidth,
	chartHeight
}) => {
	// Background (PIXI v8 modern API)
	const bg = new PIXI.Graphics();
	bg.rect(margin.left, margin.top, chartWidth, chartHeight)
		.fill(0x1a1a1a)
		.rect(margin.left, margin.top, chartWidth, chartHeight)
		.stroke({ width: 1, color: 0x444444 });
	
	container.addChild(bg);
	return bg;
};

/**
 * Legacy function for backward compatibility
 * Now just creates background - grid is handled by SVG
 */
export const createCompleteGrid = (params) => {
	const background = createChartBackground(params);
	
	return {
		background,
		// Clean up function
		destroy: () => {
			if (background && background.destroy) background.destroy();
		}
	};
};
