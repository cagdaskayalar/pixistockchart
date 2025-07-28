import React from 'react';
import StockChart from './lib/StockChart';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>PIXI Stock Chart</h1>
        <p>Professional Turkish-localized stock chart with responsive design</p>
      </header>
      <main className="chart-container">
        <StockChart />
      </main>
    </div>
  );
}

export default App;
