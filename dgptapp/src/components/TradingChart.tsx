// src/components/TradingChart.tsx
"use client";

import React, { useEffect, useRef, memo, useState } from 'react';
import {
    createChart, ColorType, LineStyle, IChartApi, ISeriesApi,
    CandlestickSeriesPartialOptions, CandlestickData, UTCTimestamp, SeriesType
} from 'lightweight-charts';

// --- CoinGecko API Helper ---
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3/coins/bitcoin/ohlc?vs_currency=usd&days=90";
const parseCoinGeckoData = (cgData: number[][]): CandlestickData[] => {
    if (!Array.isArray(cgData)) { console.error("Invalid CoinGecko data:", cgData); return []; }
    return cgData.map(item => ({
        time: Math.floor(item[0] / 1000) as UTCTimestamp, open: item[1], high: item[2], low: item[3], close: item[4],
    })).sort((a, b) => a.time - b.time);
};
// --- End API Helper ---

interface TradingChartProps {
    backgroundColor?: string; lineColor?: string; textColor?: string; upColor?: string; downColor?: string;
}

const TradingChartComponent: React.FC<TradingChartProps> = memo(({
    backgroundColor = '#0d1117', lineColor = '#30363d', textColor = '#c9d1d9',
    upColor = '#238636', downColor = '#DA3633'
}) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null); // For robust resizing

    const [chartData, setChartData] = useState<CandlestickData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Effect to Fetch Data
    useEffect(() => {
        let isMounted = true; setIsLoading(true); setError(null); console.log("TradingChart: Fetching data...");
        fetch(COINGECKO_API_URL)
            .then(response => { if (!response.ok) { return response.text().then(text => { throw new Error(`CoinGecko API Error: ${response.status} - ${text || 'Status Text Unavailable'}`); }); } return response.json(); })
            .then(data => { if (isMounted) { const parsedData = parseCoinGeckoData(data); if (parsedData.length > 0) { setChartData(parsedData); setError(null); console.log(`TradingChart: Data loaded: ${parsedData.length} points.`); } else { setError("No chart data available."); console.warn("TradingChart: No data points parsed.", data); } setIsLoading(false); }})
            .catch(err => { if (isMounted) { console.error("TradingChart: Fetch error:", err); setError(err.message || "Failed to load chart data"); setIsLoading(false); }});
        return () => { isMounted = false; };
    }, []);

    // Effect to Create/Update Chart
    useEffect(() => {
        if (!chartContainerRef.current) { console.log("TradingChart: Container ref not ready."); return; }
        if (isLoading) { console.log("TradingChart: Data is loading, chart update deferred."); return; }
        if (error) { console.log(`TradingChart: Error present (${error}), not updating chart.`); return; }
        if (chartData.length === 0) { console.log("TradingChart: No chart data, not updating chart."); if(seriesRef.current && chartRef.current) { try { chartRef.current.removeSeries(seriesRef.current); seriesRef.current = null; } catch(e){} } return; }

        const computedStyle = getComputedStyle(document.documentElement);
        const themeBgColor = computedStyle.getPropertyValue('--bg-color').trim() || backgroundColor;
        const themeLineColor = computedStyle.getPropertyValue('--border-color').trim() || lineColor;
        const themeTextColor = computedStyle.getPropertyValue('--text-color').trim() || textColor;
        const themeUpColor = computedStyle.getPropertyValue('--success-color').trim() || upColor;
        const themeDownColor = computedStyle.getPropertyValue('--error-color').trim() || downColor;

        const candleSeriesOptions: CandlestickSeriesPartialOptions = {
            upColor: themeUpColor, downColor: themeDownColor, borderDownColor: themeDownColor,
            borderUpColor: themeUpColor, wickDownColor: themeDownColor, wickUpColor: themeUpColor,
            priceFormat: { type: 'price', precision: 4, minMove: 0.0001 },
        };

        let chartInitialized = false;

        // 1. Initialize chart only once
        if (!chartRef.current) {
            const container = chartContainerRef.current;
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;
            console.log(`TradingChart: Initializing chart instance in container W: ${containerWidth}, H: ${containerHeight}`);
            if (containerWidth === 0 || containerHeight === 0) { console.warn("Container has zero dimensions!"); }

            chartRef.current = createChart(container, {
                 width: containerWidth, height: containerHeight,
                 layout: { background: { type: ColorType.Solid, color: themeBgColor }, textColor: themeTextColor },
                 grid: { vertLines: { color: themeLineColor, style: LineStyle.Dashed }, horzLines: { color: themeLineColor, style: LineStyle.Dashed } },
                 timeScale: { timeVisible: true, secondsVisible: false, borderColor: themeLineColor, fixLeftEdge: true, fixRightEdge: true },
                 rightPriceScale: { borderColor: themeLineColor },
                 crosshair: { vertLine: { color: '#C3BCDB44'}, horzLine: { color: '#C3BCDB44'} },
                 handleScroll: { mouseWheel: true, pressedMouseMove: true }, handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
            });
            console.log("TradingChart: Chart object created.");
            chartInitialized = true; // Mark that we just initialized
        } else {
             // Apply option updates if chart already exists
             chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight, layout: { background: { type: ColorType.Solid, color: themeBgColor }, textColor: themeTextColor }});
        }

        // 2. Add or Update Series
        const setupSeriesAndData = () => {
            if (!chartRef.current) { console.error("Chart ref gone during series setup."); return; }
            if (!seriesRef.current) {
                console.log("TradingChart: Adding Candlestick series...");
                try {
                    seriesRef.current = (chartRef.current.addSeries as any)('Candlestick', candleSeriesOptions);
                    console.log("TradingChart: Candlestick series added.");
                } catch (seriesError: any) {
                     console.error("TradingChart Error: Failed to add series:", seriesError);
                     setError(`Chart series init failed: ${seriesError.message}`);
                     return; // Important to stop further processing on this path
                }
            } else {
                seriesRef.current.applyOptions(candleSeriesOptions);
            }

            if (seriesRef.current && chartData.length > 0) {
                 console.log("TradingChart: Data check before setData:", JSON.stringify(chartData.slice(0, 3)));
                 if (chartData[0]) { console.log("First data point types:", { time: typeof chartData[0].time, open: typeof chartData[0].open, /* ... */ }); }
                try {
                    seriesRef.current.setData(chartData);
                    chartRef.current?.timeScale().scrollToRealTime();
                    console.log("TradingChart: Data set successfully.");
                } catch (setDataError: any) {
                    console.error("TradingChart Error: Failed to set data:", setDataError);
                    setError(`Chart data update failed: ${setDataError.message}`);
                }
            } else {
                console.warn("TradingChart: Series ref or chartData not available for setData.");
            }
        };

        if (chartInitialized) {
            // If chart was just initialized, delay series setup slightly
            const timerId = setTimeout(setupSeriesAndData, 50); // Short delay (e.g., 50ms)
            return () => clearTimeout(timerId); // Cleanup timeout
        } else {
            // If chart already existed, setup/update series immediately
            setupSeriesAndData();
        }


        // 3. Handle Resizing (using ResizeObserver for robustness)
        const container = chartContainerRef.current;
        if (container && !resizeObserverRef.current) { // Setup observer only once
            resizeObserverRef.current = new ResizeObserver(entries => {
                if (!entries || !entries.length) { return; }
                const { width, height } = entries[0].contentRect;
                chartRef.current?.resize(width, height);
                 console.log(`TradingChart: Resized to W: ${width}, H: ${height}`);
            });
            resizeObserverRef.current.observe(container);
        }

        // Cleanup for effect: disconnect observer
        return () => {
            resizeObserverRef.current?.disconnect();
        };

    }, [chartData, isLoading, error, backgroundColor, lineColor, textColor, upColor, downColor]);


     // Effect for chart removal on unmount
     useEffect(() => {
         return () => {
             if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
             if (resizeObserverRef.current) { resizeObserverRef.current.disconnect(); resizeObserverRef.current = null; }
         };
     }, []);


    return (
        <div ref={chartContainerRef} style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
             {isLoading && <div style={overlayStyle}>Loading Chart Data...</div>}
             {error && !isLoading && <div style={{...overlayStyle, color: 'var(--error-color)'}}>Error: {error}</div>}
        </div>
    );
});

TradingChartComponent.displayName = 'TradingChartComponent';
export default TradingChartComponent;

const overlayStyle: React.CSSProperties = { /* ... same ... */ };