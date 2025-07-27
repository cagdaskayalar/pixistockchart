# PIXI Stock Chart

A professional stock chart visualization built with React and PIXI.js, featuring interactive candlestick charts with pan/zoom capabilities and real-time performance monitoring.

## 🚀 Features

- **Interactive Candlestick Charts**: Professional-grade stock price visualization
- **Pan & Zoom**: Smooth navigation with mouse and wheel interactions
- **Real-time Performance Monitoring**: Track FPS, render times, and memory usage
- **WebGL Rendering**: High-performance graphics powered by PIXI.js v8
- **Responsive Design**: Adapts to different screen sizes
- **Modern React**: Built with React 19 and hooks

## 🛠️ Technologies

- **React 19.1.0** - Modern UI framework with latest hooks
- **PIXI.js 8.11.0** - High-performance 2D WebGL renderer
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
- **Performance Metrics**: View real-time performance data in the header

## 📁 Project Structure

```
src/
├── lib/
│   └── StockChart.js     # Main chart component with PIXI.js integration
├── index.js              # Application entry point
├── styles.css            # Global styles
└── dataUtils.js          # Stock data generation utilities
```

## 🔧 Development

The project uses modern JavaScript features and follows React best practices:

- **Hooks**: useState, useEffect, useCallback, useRef
- **Performance Optimization**: Memoized callbacks and efficient rendering
- **Event Handling**: Proper cleanup and passive event listeners
- **Modern PIXI.js API**: Latest graphics rendering methods

## 📊 Performance Features

- Real-time FPS monitoring
- Render time tracking
- Memory usage display
- Visible candle count
- Chart metrics (width, index, price range)

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
- [Create React App](https://create-react-app.dev/) - Great development environment

---

Built with ❤️ using React and PIXI.js

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
