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

- **React 19.1.0** - Modern UI framework with latest hooks
- **PIXI.js 8.11.0** - High-performance 2D WebGL renderer
- **SVG** - Crosshair overlay system
- **Create React App** - Development environment and build tools

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

- **Pan**: Click and drag to move around the chart
- **Zoom**: Use mouse wheel to zoom in/out
- **Crosshair**: Hover over chart to see real-time price and date tracking
- **Smart Snapping**: Crosshair automatically centers on candlesticks
- **Performance Metrics**: View real-time performance data in the header

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── SvgCrosshair.js   # SVG crosshair overlay component
│   ├── utils/
│   │   └── coordinateUtils.js # Chart coordinate utilities
│   └── StockChart.js         # Main PIXI.js chart component
├── index.js                  # Application entry point
├── styles.css               # Global styles
└── dataUtils.js             # Stock data generation utilities
```

## 🔧 Technical Implementation

### Hybrid Architecture
- **PIXI.js Layer**: Handles chart rendering, pan/zoom, mouse events
- **SVG Overlay**: Renders crosshair with `pointerEvents='none'`
- **Communication**: useImperativeHandle for efficient component interaction

### Key Components
- **StockChart.js**: Main PIXI.js component with mouse event handling
- **SvgCrosshair.js**: Crosshair overlay with smart candle snapping
- **coordinateUtils.js**: Chart coordinate calculations

### Performance Features
- Real-time FPS monitoring
- Render time tracking  
- Memory usage display
- Visible candle count
- Chart metrics (dimensions, price range)

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

- [PIXI.js](https://pixijs.com/) - Amazing 2D WebGL renderer
- [React](https://reactjs.org/) - The best UI library
- [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) - Scalable vector graphics for crosshair
- [Create React App](https://create-react-app.dev/) - Great development environment

---

Built with ❤️ using React, PIXI.js, and SVG
