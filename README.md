# PIXI Stock Chart

A professional Turkish-localized stock chart visualization with modular PIXI.js architecture and comprehensive responsive design. Features professional trading chart behavior (latest-data-first display), Turkish date/time formatting, React 19 compatibility, PIXI v8 optimization, advanced SVG-based grid system, dynamic axis sizing, interactive candlestick charts, smart candle snapping, and high-performance WebGL rendering with robust error handling.

## 🚀 Features

### Core Chart Features
- **Professional Trading Behavior**: Latest-data-first display like professional trading platforms
- **Turkish Localization**: Native Turkish date/time formatting (tr-TR locale)
  - X-axis: Turkish month names (16 Tem, 15 Haz, etc.)
  - CrossHair: 24-hour time format (HH:MM)
- **Interactive Candlestick Charts**: Professional-grade stock price visualization
- **SVG-Based Grid System**: Professional trading chart grid patterns with major/minor lines
- **Dynamic Axis Sizing**: Responsive axis dimensions based on content and container size
- **Hybrid Crosshair System**: SVG overlay with PIXI.js rendering for optimal performance
- **Smart Candle Snapping**: Crosshair automatically snaps to candle centers
- **Real-time Price Tracking**: Live price and date display with golden crosshair
- **Pan & Zoom**: Smooth navigation with mouse and wheel interactions
- **Fully Responsive Design**: Eliminated hardcoded dimensions, adaptive to all screen sizes

### Performance & Visual
- **WebGL Rendering**: High-performance graphics powered by PIXI.js v8 with error handling
- **Performance Monitoring**: Track FPS, render times, and memory usage
- **Professional Grid Pattern**: SVG-based grid system with major/minor lines like professional trading platforms
- **Dynamic Text Measurement**: Canvas-based text sizing for precise axis dimensions
- **Responsive Architecture**: Adapts to different screen sizes with throttled resize and dynamic axis sizing
- **Smooth Interactions**: Lag-free mouse tracking and chart updates
- **Memory Optimized**: Comprehensive cleanup and null-safety checks

### Technical Architecture
- **Modular System**: Utility-based grid functions for better maintainability
- **Responsive Hook System**: Custom useResizeObserver and useResponsiveAxis hooks
- **Dynamic Sizing**: Eliminated hardcoded axis dimensions with Canvas-based text measurement
- **React 19 Compatible**: Built with React 19.1.0 and modern hooks
- **PIXI v8 Optimized**: Full compatibility with latest PIXI.js architecture
- **SVG Integration**: Advanced SVG pattern-based grid system
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
- **Responsive System** - Dynamic axis sizing with ResizeObserver and Canvas text measurement
- **SVG Grid Patterns** - Professional trading chart grid system with major/minor lines
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
- **Turkish Date formatting**: Automatic date parsing with Turkish month names (tr-TR locale)
- **Professional Display**: Shows latest 72 candles by default (configurable)
- **Latest-First Behavior**: Chart starts from most recent data like professional trading platforms

### Customization
- Modify `dataUtils.js` to change data source or add new data providers
- Adjust crosshair styling in `SvgCrosshair.js` (colors, opacity, line styles)
- Configure chart dimensions and margins in `coordinateUtils.js`
- Change Turkish localization settings in `gridUtils/index.js` and `SvgCrosshair.js`
- Adjust default candle count (72) and professional behavior in `StockChart.js`

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
│   │   ├── StockChart.js        # ✨ Main PIXI.js chart with Turkish localization & responsive design
│   │   ├── components/          # Chart components
│   │   │   ├── SvgCrosshair.js  # ✨ Turkish-localized crosshair with 24h time format
│   │   │   ├── SvgXAxis.js      # ✨ Dynamic X-axis with responsive sizing and SVG grid
│   │   │   ├── SvgYAxis.js      # ✨ Dynamic Y-axis with responsive sizing and SVG grid
│   │   │   └── SvgGrid.js       # ✨ Professional SVG grid pattern system
│   │   ├── hooks/               # Custom React hooks
│   │   │   ├── useResponsiveAxis.js # ✨ Responsive axis sizing with ResizeObserver
│   │   │   └── index.js         # Hooks barrel export
│   │   └── utils/               # Modular utility functions
│   │       ├── gridUtils/       # ✨ Modular grid system with Turkish date formatting
│   │       │   └── index.js     # Grid utilities (Turkish month names, etc.)
│   │       ├── coordinateUtils.js # ✨ Chart coordinate calculations with dynamic margins
│   │       ├── priceCalculations.js # Price formatting and calculations
│   │       ├── dataUtils.js     # Mock data generation
│   │       └── pixiHelpers.js   # PIXI.js utility functions
│   ├── dataUtils.js             # Sample data generation
│   ├── App.js                   # Main application component
│   ├── index.js                 # React app entry point
│   ├── App.css                  # Application styles
│   ├── index.css                # Global styles
│   └── styles.css               # ✨ Chart-specific responsive styles

**Key Files:**
- 🎯 **StockChart.js** - Main PIXI.js chart with responsive design and Turkish localization
- 🎯 **useResponsiveAxis.js** - Custom hook for dynamic axis sizing with ResizeObserver
- 🎯 **SvgXAxis.js & SvgYAxis.js** - Dynamic axis components with responsive sizing
- 🎯 **SvgGrid.js** - Professional SVG grid pattern system
- 🎯 **coordinateUtils.js** - Chart coordinate transformations with dynamic margins
- 🎯 **priceCalculations.js** - Price formatting and range calculations
- 🎯 **styles.css** - Responsive CSS for canvas and container elements

## 🇹🇷 Turkish Localization Features

### Date & Time Formatting
- **X-axis Labels**: Turkish month abbreviations (Oca, Şub, Mar, Nis, May, Haz, Tem, Ağu, Eyl, Eki, Kas, Ara)
- **CrossHair Time**: 24-hour format display (HH:MM) using tr-TR locale
- **Professional Format**: Day + Turkish month format (e.g., "16 Tem", "15 Haz")

### Professional Trading Behavior
- **Latest-First Display**: Chart shows most recent data first (like AAA professional platforms)
- **Default View**: Shows last 72 candles on initial load
- **Smart Navigation**: Maintains professional chart navigation patterns

## 🔧 Technical Implementation

### Modular Architecture
- **PIXI.js v8 Layer**: Enhanced chart rendering with null-safety and error handling
- **SVG Grid System**: Professional trading chart grid patterns with major/minor lines
- **Responsive Hook System**: useResizeObserver and useResponsiveAxis for dynamic sizing
- **Dynamic Text Measurement**: Canvas API-based text sizing for precise axis dimensions
- **Responsive Design**: Eliminated hardcoded values, adaptive to all screen sizes
- **Communication**: Efficient React hooks and ref-based component interaction

### PIXI v8 Compatibility Features
- **Safe Initialization**: Protected PIXI application and canvas creation
- **Null Reference Protection**: Comprehensive checks for resize operations
- **Memory Management**: Proper cleanup and resource disposal
- **Error Boundaries**: Try-catch blocks for render operations
- **Throttled Events**: 100ms throttled resize for performance optimization

### Key Technical Components
- **StockChart.js**: Enhanced PIXI.js component with responsive design and Turkish localization
- **useResponsiveAxis.js**: Custom hook with ResizeObserver and Canvas-based text measurement
- **SvgXAxis/SvgYAxis**: Dynamic axis components with responsive sizing
- **SvgGrid.js**: Professional SVG pattern-based grid system
- **coordinateUtils.js**: Chart coordinate calculations with dynamic margins

### Data Flow
1. **Data Loading**: `dataUtils.js` loads JSON data from public folder
2. **Responsive Calculation**: `useResponsiveAxis.js` calculates dynamic axis dimensions
3. **Rendering**: PIXI.js renders candlesticks with WebGL acceleration
4. **SVG Grid Overlay**: Professional grid patterns with major/minor lines
5. **Dynamic Layout**: Responsive margins and sizing based on content measurement
- **coordinateUtils.js**: Chart coordinate transformations with bounds checking
- **priceCalculations.js**: Price formatting, range calculations, and display logic
- **Responsive System**: CSS and JavaScript-based responsive canvas handling

### Grid System Architecture
1. **SVG Pattern System**: Professional trading chart grid patterns with major/minor lines
2. **Dynamic Spacing**: Grid intervals adapt to chart dimensions and zoom level
3. **Clean Separation**: Grid logic separated from chart rendering for maintainability
4. **Professional Design**: Matches industry-standard trading platform appearance

### Rendering Pipeline
1. **Initialization**: Safe PIXI application creation with null checks
2. **Responsive Calculation**: Dynamic axis sizing based on content and container
3. **SVG Grid Rendering**: Professional trading chart grid patterns
4. **Chart Drawing**: Candlestick rendering with optimized performance
5. **Event Handling**: Mouse tracking with responsive resize events
6. **Cleanup**: Proper resource disposal and memory management

### Performance Features
- **Real-time Monitoring**: FPS, render time, memory usage tracking
- **Efficient Rendering**: Only visible elements rendered, smooth 60fps animations
- **Responsive System**: Dynamic axis sizing with Canvas-based text measurement
- **Memory Management**: Comprehensive cleanup of PIXI objects, null-safety checks
- **Adaptive Design**: Eliminates hardcoded dimensions, scales to any screen size

## 🚀 Recent Updates (v1.3.0)

- ✅ **Fully Responsive Design**: Eliminated all hardcoded axis dimensions (50px/25px)
- ✅ **Dynamic Axis Sizing**: Canvas-based text measurement for precise dimensions
- ✅ **ResizeObserver Integration**: Real-time container size tracking
- ✅ **SVG Grid Pattern System**: Professional trading chart grid with major/minor lines
- ✅ **Responsive Hook Architecture**: Custom useResizeObserver and useResponsiveAxis hooks
- ✅ **Dynamic Margin Calculation**: Adaptive chart margins based on content
- ✅ **Professional Grid Design**: Industry-standard trading platform appearance
- ✅ **Canvas Text Measurement**: Precise text sizing without DOM manipulation
- ✅ **Modular Component System**: Separated axis components with dynamic props
- ✅ **Performance Optimized**: Efficient responsive calculations and rendering

### Previous Updates (v1.2.0)

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
- **Responsive System**: Dynamic axis sizing with ResizeObserver and Canvas measurement
- **SVG Integration**: Professional grid patterns with major/minor lines
- **PIXI v8 Integration**: Manual implementation with comprehensive error handling
- **React 19 Compatibility**: Latest hooks and component patterns
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
- Responsive design patterns with dynamic sizing
- PIXI v8 compatibility guidelines and error handling
- Performance monitoring and comprehensive memory leak prevention

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ‍💻 Author

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
## 📄 License

## 📄 License

This project is licensed under a **Dual License** model:

### 🆓 MIT License (Non-Commercial Use)
- **Free for personal, educational, and open-source projects**
- Full access to source code and modification rights
- No commercial usage permitted

### 💼 Commercial License Required
- **Paid license required for all commercial use cases:**
  - SaaS platforms and enterprise applications
  - Internal business tools and client consulting work
  - Products generating revenue or commercial value
  - Any business or organizational use

> ⚠️ **Important Notice:** Commercial use without a valid license is prohibited and may result in legal action.

**To Purchase Commercial License:**
- 📧 Contact: [cagdaskaya@hotmail.com](mailto:cagdaskaya@hotmail.com)
- 📋 Please see the [LICENSE](LICENSE) file for complete terms
- 🌐 GitHub: [@cagdaskayalar](https://github.com/cagdaskayalar)
Built with ❤️ using React, PIXI.js, and SVG
