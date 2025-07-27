// JSON dosyasından OHLC verilerini oku ve dönüştür.
export async function fetchOHLCData(url) {
  const response = await fetch(url);
  
  // Response'u kontrol et
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  // Content-Type kontrolü
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Expected JSON, got:', contentType);
    console.error('Response text:', text.substring(0, 200));
    throw new Error(`Expected JSON, got: ${contentType}`);
  }
  
  const rawData = await response.json();
  // Dosya paralel objeler �eklinde: Time, Open, High, Low, Close
  if (rawData.Time && rawData.Open && rawData.High && rawData.Low && rawData.Close) {
	const keys = Object.keys(rawData.Time);
	return keys.map(i => ({
	  date: new Date(rawData.Time[i]),
	  open: +rawData.Open[i],
	  high: +rawData.High[i],
	  low: +rawData.Low[i],
	  close: +rawData.Close[i]
	}));
  }
  // Eski array veya {data: array} formatt için fallback
  const arr = Array.isArray(rawData) ? rawData : rawData.data;
  if (!Array.isArray(arr)) throw new Error("Veri formatı hatalı: Array veya paralel objeler bekleniyor.");
  return arr.map(d => ({
	date: new Date(d.Time),
	open: +d.Open,
	high: +d.High,
	low: +d.Low,
	close: +d.Close
  }));
}

// YKBNK_Min1.json dosyasından OHLC verisi almak için
export function getData() {
	// Public klasörden dosya yolu - process.env.PUBLIC_URL kullan
	const baseUrl = process.env.NODE_ENV === 'development' 
		? 'http://localhost:3000' 
		: process.env.PUBLIC_URL || '';
	return fetchOHLCData(`${baseUrl}/cagdaskayalar/pixistockchart/data/YKBNK_Min1.json`);
}
