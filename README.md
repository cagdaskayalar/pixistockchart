# PIXI Stock Chart

A professional stock chart visualization with modular PIXI.js architecture and comprehensive responsive design. Features React 19 compatibility, PIXI v8 optimization, advanced grid system, interactive candlestick charts, smart candle snapping, and high-performance WebGL rendering with robust error handling.

## 🚀 Features

### Core Chart Features
- **Interactive Candlestick Charts**: Professional-grade stock price visualization
- **Modular Grid System**: Advanced utility-based grid rendering with price and time grids
- **Hybrid Crosshair System**: SVG overlay with PIXI.js rendering for optimal performance
- **Smart Candle Snapping**: Crosshair automatically snaps to candle centers
- **Real-time Price Tracking**: Live price and date display with golden crosshair
- **Pan & Zoom**: Smooth navigation with mouse and wheel interactions
- **Responsive Design**: Full responsive behavior with window resize handling

### Performance & Visual
- **WebGL Rendering**: High-performance graphics powered by PIXI.js v8 with error handling
- **Performance Monitoring**: Track FPS, render times, and memory usage
- **Professional UI**: Golden dashed crosshair lines with price/date labels
- **Responsive Architecture**: Adapts to different screen sizes with throttled resize
- **Smooth Interactions**: Lag-free mouse tracking and chart updates
- **Memory Optimized**: Comprehensive cleanup and null-safety checks

### Technical Architecture
- **Modular System**: Utility-based grid functions for better maintainability
- **React 19 Compatible**: Built with React 19.1.0 and modern hooks
- **PIXI v8 Optimized**: Full compatibility with latest PIXI.js architecture
- **Error Resilient**: Comprehensive error handling and null-safety
- **Component Communication**: Efficient ref-based parent-child interaction

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
│   │   ├── StockChart.js        # ✨ Main PIXI.js chart with PIXI v8 compatibility
│   │   ├── coordinateUtils.js   # Chart coordinate calculations
│   │   ├── priceCalculations.js # Price formatting and calculations
│   │   └── utils/               # Modular utility functions
│   │       └── gridUtils/       # ✨ Modular grid rendering system
│   │           └── index.js     # Grid utility functions (createCompleteGrid, etc.)
│   ├── dataUtils.js             # Sample data generation
│   ├── App.js                   # Main application component
│   ├── index.js                 # React app entry point
│   ├── App.css                  # Application styles
│   ├── index.css                # Global styles
│   └── styles.css               # ✨ Chart-specific responsive styles
│   │   │   └── index.js         # Hooks barrel export
**Key Files:**
- 🎯 **StockChart.js** - Main PIXI.js chart with PIXML v8 compatibility and responsive design
- 🎯 **gridUtils/index.js** - Modular grid system with utility functions
- 🎯 **coordinateUtils.js** - Chart coordinate transformations and bounds checking
- 🎯 **priceCalculations.js** - Price formatting and range calculations
- 🎯 **styles.css** - Responsive CSS for canvas and container elements

## 🔧 Technical Implementation

### Modular Architecture
- **PIXI.js v8 Layer**: Enhanced chart rendering with null-safety and error handling
- **Grid Utilities**: Modular grid system with createCompleteGrid, createPriceGrid, createTimeGrid
- **Responsive Design**: Throttled resize handling with canvas size optimization
- **Communication**: Efficient React hooks and ref-based component interaction

### PIXI v8 Compatibility Features
- **Safe Initialization**: Protected PIXI application and canvas creation
- **Null Reference Protection**: Comprehensive checks for resize operations
- **Memory Management**: Proper cleanup and resource disposal
- **Error Boundaries**: Try-catch blocks for render operations
- **Throttled Events**: 100ms throttled resize for performance optimization

### Key Technical Components
- **StockChart.js**: Enhanced PIXI.js component with v8 safety and responsive handling
- **gridUtils**: Modular grid rendering system with utility-based architecture
- **coordinateUtils.js**: Chart coordinate calculations and transformations

### Data Flow
1. **Data Loading**: `dataUtils.js` loads JSON data from public folder
2. **Rendering**: PIXI.js renders candlesticks with WebGL acceleration
- **coordinateUtils.js**: Chart coordinate transformations with bounds checking
- **priceCalculations.js**: Price formatting, range calculations, and display logic
- **Responsive System**: CSS and JavaScript-based responsive canvas handling

### Grid System Architecture
1. **Modular Functions**: createCompleteGrid, createPriceGrid, createTimeGrid utilities
2. **PIXI Graphics**: Direct PIXI.Graphics API usage for optimal performance
3. **Clean Separation**: Grid logic separated from chart rendering for maintainability
4. **Configurable**: Easy customization of grid styling and intervals

### Rendering Pipeline
1. **Initialization**: Safe PIXI application creation with null checks
2. **Grid Rendering**: Modular grid system with utility functions
3. **Chart Drawing**: Candlestick rendering with optimized performance
4. **Event Handling**: Mouse tracking with throttled resize events
5. **Cleanup**: Proper resource disposal and memory management

### Performance Features
- **Real-time Monitoring**: FPS, render time, memory usage tracking
- **Efficient Rendering**: Only visible elements rendered, smooth 60fps animations  
- **Memory Management**: Comprehensive cleanup of PIXI objects, null-safety checks
- **Responsive Design**: Throttled resize events (100ms), adaptive canvas sizing

## 🚀 Recent Updates (v1.2.0)

- ✅ **PIXI v8 Compatibility**: Full compatibility with PIXI.js 8.11.0
- ✅ **Modular Grid System**: Implemented utility-based grid architecture
- ✅ **Enhanced Responsive Design**: Fixed canvas resizing and responsiveness
- ✅ **Error Handling**: Comprehensive null-safety and error boundaries
- ✅ **React 19 Support**: Optimized for React 19.1.0 compatibility
- ✅ **Performance Optimization**: Throttled resize events and memory improvements
- ✅ **Architecture Refactoring**: Modular utilities replacing component dependencies

## 🛠️ Development

### Project Setup
The project follows modern React development practices with PIXI v8 compatibility:

**Code Organization:**
- **Modular Architecture**: Utility-based functions for better maintainability
- **PIXI v8 Integration**: Manual implementation with comprehensive error handling
- **React 19 Compatibility**: Latest hooks and component patterns
- **Responsive Design**: Mobile-first approach with adaptive canvas sizing
- **Performance Focused**: Memory optimization and efficient rendering

**Development Commands:**
```bash
npm start          # Development server with hot reload
npm run build      # Production build optimized for PIXI v8
npm test           # Run test suite
npm run eject      # Eject from Create React App (not recommended)
```

**Technical Requirements:**
- Node.js 16+ for optimal React 19 compatibility
- Modern browser with WebGL support for PIXI.js rendering
- Minimum 2GB RAM for development environment

**Code Quality:**
- ESLint configuration for code consistency
- React 19 best practices and modern hooks patterns
- PIXI v8 compatibility guidelines and error handling
- Performance monitoring and comprehensive memory leak prevention

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
