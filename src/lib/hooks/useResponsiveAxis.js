import { useState, useEffect } from 'react';

/**
 * useResizeObserver - Element boyut değişikliklerini izler
 * @param {React.RefObject} ref - İzlenecek element ref'i
 * @returns {Object} - { width, height } boyut bilgileri
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
 * measureTextWidth - SVG text elementinin genişliğini ölçer
 * @param {string} text - Ölçülecek text
 * @param {string} fontSize - Font boyutu (örn: "11px")
 * @param {string} fontFamily - Font ailesi
 * @returns {number} - Text genişliği (px)
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
 * calculateAxisDimensions - Axis boyutlarını dinamik olarak hesaplar
 * @param {Array} priceLabels - Price label'ları array'i
 * @param {Array} timeLabels - Time label'ları array'i 
 * @param {Object} containerSize - Container boyutları { width, height }
 * @returns {Object} - Axis boyutları { yAxisWidth, xAxisHeight }
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
