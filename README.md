# PIXI Stock Chart

A professional stock chart visualization with hybrid PIXI.js + SVG crosshair system, featuring interactive candlestick charts, smart candle snapping, real-time price tracking, and high-performance WebGL rendering.

## 🚀 Features

### Core Chart Features
- **Interactive Candlestick Charts**: Professional-grade stock price visualization
- **Hybrid Crosshair System**: SVG overlay with PIXI.js rendering for optimal performance
- **Smart Candle Snapping**: Crosshair automatically snaps to candle centers
- **Real-time Price Tracking**: Live price and date display with golden crosshair
- **Pan & Zoom**: Smooth navigation with mouse and wheel interactions

### Performance & Visual
- **WebGL Rendering**: High-performance graphics powered by PIXI.js v8
- **Performance Monitoring**: Track FPS, render times, and memory usage
- **Professional UI**: Golden dashed crosshair lines with price/date labels
- **Responsive Design**: Adapts to different screen sizes
- **Smooth Interactions**: Lag-free mouse tracking and chart updates

### Technical Architecture
- **Hybrid Rendering**: PIXI.js for chart + SVG for crosshair overlay
- **Modern React**: Built with React 19 and latest hooks (useImperativeHandle)
- **Component Communication**: Efficient ref-based parent-child interaction
- **Memory Optimized**: No memory leaks, clean event handling

## 🛠️ Technologies

**Core Stack:**
- **React 19.1.0** - Modern UI framework with latest hooks (useImperativeHandle, forwardRef)
- **PIXI.js 8.11.0** - High-performance 2D WebGL renderer for chart graphics
- **SVG** - Scalable vector graphics for crosshair overlay system
- **Create React App 5.0.1** - Development environment and build tools

**Architecture:**
- **Hybrid Rendering** - PIXI.js WebGL + SVG overlay for optimal performance
- **Modern React Patterns** - Hooks, refs, imperative handles, memoization
- **Component Architecture** - Modular, reusable chart components
- **Performance Optimized** - Memory management, efficient rendering, FPS monitoring

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/cagdaskayalar/pixistockchart.git
cd pixistockchart
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🎯 Usage

### Basic Interactions
- **Pan**: Click and drag to move around the chart
- **Zoom**: Use mouse wheel to zoom in/out
- **Crosshair**: Hover over chart to see real-time price and date tracking
- **Smart Snapping**: Crosshair automatically centers on candlesticks
- **Performance Metrics**: View real-time performance data in the header

### Data Source
The chart loads stock data from `/public/data/YKBNK_Min1.json` containing:
- **Time-series data**: Daily OHLC (Open, High, Low, Close) prices
- **Volume information**: Trading volume for each period
- **Date formatting**: Automatic date parsing and display (MM/DD format)

### Customization
- Modify `dataUtils.js` to change data source or add new data providers
- Adjust crosshair styling in `SvgCrosshair.js` (colors, opacity, line styles)
- Configure chart dimensions and margins in `coordinateUtils.js`

## 📁 Project Structure

```
pixistockchart/
├── public/
│   ├── data/
│   │   └── YKBNK_Min1.json      # Sample stock data
│   ├── index.html               # HTML template
│   ├── favicon.ico              # App favicon
│   └── manifest.json            # PWA manifest
├── src/
│   ├── lib/                     # Core chart library
│   │   ├── components/          # Reusable chart components
│   │   │   ├── Axis/            # X/Y axis components
│   │   │   ├── Grid/            # Chart grid components
│   │   │   ├── Overlay/         # Chart overlay components
│   │   │   ├── Performance/     # Performance monitoring
│   │   │   ├── Series/          # Data series components
│   │   │   ├── SvgCrosshair.js  # ✨ SVG crosshair overlay
│   │   │   ├── EventCapture.js  # Event handling utilities
│   │   │   └── index.js         # Components barrel export
│   │   ├── constants/           # Chart configuration constants
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useChartState.js # Chart state management
│   │   │   ├── usePerformance.js# Performance tracking
│   │   │   ├── useInteractions.js# User interactions
│   │   │   └── index.js         # Hooks barrel export
│   │   ├── utils/               # Utility functions
│   │   │   ├── coordinateUtils.js # ✨ Chart coordinate calculations
│   │   │   ├── dataUtils.js     # Stock data utilities
│   │   │   ├── pixiHelpers.js   # PIXI.js helper functions
│   │   │   ├── priceCalculations.js # Price range calculations
│   │   │   ├── renderUtils.js   # Rendering utilities
│   │   │   └── index.js         # Utils barrel export
│   │   └── StockChart.js        # ✨ Main PIXI.js chart component
│   ├── dataUtils.js             # Legacy data utilities
│   ├── index.js                 # ✨ Application entry point
│   └── styles.css               # ✨ Global styles
├── package.json                 # Dependencies and scripts
└── README.md                    # Project documentation
```

**Key Files:**
- 🎯 **StockChart.js** - Main PIXI.js chart with hybrid crosshair integration
- 🎯 **SvgCrosshair.js** - SVG crosshair overlay with smart candle snapping
- 🎯 **coordinateUtils.js** - Chart coordinate transformations and bounds checking
- 🎯 **index.js** - App entry point with performance metrics display

## 🔧 Technical Implementation

### Hybrid Architecture
- **PIXI.js Layer**: Handles chart rendering, pan/zoom, mouse events
- **SVG Overlay**: Renders crosshair with `pointerEvents='none'`
- **Communication**: useImperativeHandle for efficient component interaction

### Key Components
- **StockChart.js**: Main PIXI.js component with mouse event handling
- **SvgCrosshair.js**: Crosshair overlay with smart candle snapping
- **coordinateUtils.js**: Chart coordinate calculations and transformations

### Data Flow
1. **Data Loading**: `dataUtils.js` loads JSON data from public folder
2. **Rendering**: PIXI.js renders candlesticks with WebGL acceleration
3. **Interaction**: Mouse events captured by PIXI.js, coordinates passed to SVG
4. **Display**: SVG crosshair updates with real-time price/date information

### Performance Features
- **Real-time Monitoring**: FPS, render time, memory usage tracking
- **Efficient Rendering**: Only visible candles rendered, smooth 60fps animations  
- **Memory Management**: Proper cleanup of PIXI objects, no memory leaks
- **Responsive Design**: Dynamic resizing, adaptive candle width calculation

## 🎨 Crosshair Features

- **Golden Theme**: Professional `#FFD700` color scheme
- **Smart Positioning**: X-axis snaps to candle centers, Y-axis follows mouse
- **Live Labels**: Price display ($133.40) and date (03/05)
- **Professional Styling**: Dashed lines, rounded labels, center dot
- **Chart Bounds**: Crosshair only appears within chart area

## 🚀 Recent Updates (v1.1.0)

- ✅ Implemented hybrid PIXI.js + SVG crosshair system
- ✅ Added smart candle snapping functionality  
- ✅ Fixed date field mapping and formatting
- ✅ Optimized component communication with useImperativeHandle
- ✅ Enhanced performance with non-blocking SVG overlay
- ✅ Added professional golden crosshair styling

## 🛠️ Development

### Project Setup
The project follows modern React development practices:

**Code Organization:**
- **Barrel Exports**: `index.js` files for clean imports
- **Separation of Concerns**: Components, hooks, utilities in separate folders
- **Modern Hooks**: useState, useEffect, useCallback, useRef, useImperativeHandle
- **Performance Optimization**: Memoized callbacks, efficient re-renders

**Development Commands:**
```bash
npm start          # Development server with hot reload
npm run build      # Production build
npm test           # Run test suite
npm run eject      # Eject from Create React App (not recommended)
```

**Code Quality:**
- ESLint configuration for code consistency
- React best practices and hooks rules
- Performance monitoring and memory leak prevention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mehmet Çağdaş Kayalarlıoğulları**
- Email: cagdaskaya@hotmail.com
- GitHub: [@cagdaskayalar](https://github.com/cagdaskayalar)

## 🙏 Acknowledgments

- [PIXI.js](https://pixijs.com/) - Amazing 2D WebGL renderer for high-performance graphics
- [React](https://reactjs.org/) - The best UI library with modern hooks and patterns
- [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) - Scalable vector graphics for precise crosshair rendering
- [Create React App](https://create-react-app.dev/) - Excellent development environment and build tools
- [WebGL](https://www.khronos.org/webgl/) - Hardware-accelerated graphics for smooth chart rendering

## 🎯 Future Roadmap

- 📊 **Technical Indicators**: Moving averages, RSI, MACD overlays
- 📈 **Volume Charts**: Volume histogram with price correlation
- 🎨 **Themes**: Light/dark mode toggle, custom color schemes  
- 📱 **Mobile Optimization**: Touch gestures, responsive crosshair
- 💾 **Data Sources**: Real-time WebSocket feeds, multiple exchanges
- 🔧 **Configuration**: Customizable chart settings, export functionality

---

Built with ❤️ using React, PIXI.js, and SVG
