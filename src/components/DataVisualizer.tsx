import React, { useState, useMemo } from 'react';
import { DataFrame } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart2,
  TrendingUp,
  PieChart as PieIcon,
  Layers,
  ArrowUpDown,
  Filter,
  Sparkles,
  Palette,
  Maximize2,
  Minimize2,
  Table as TableIcon
} from 'lucide-react';

interface DataVisualizerProps {
  data: DataFrame;
  title?: string;
  onSwitchToTable?: () => void;
}

type ChartType = 'bar' | 'bar-horizontal' | 'line' | 'area' | 'pie';

const PALETTES = {
  emerald: {
    name: 'Emerald Matrix',
    colors: ['#8CFFB7', '#10B981', '#059669', '#34D399', '#6EE7B7', '#047857', '#A7F3D0'],
  },
  cyber: {
    name: 'Cyberpunk Neon',
    colors: ['#06B6D4', '#8B5CF6', '#EC4899', '#3B82F6', '#F43F5E', '#A855F7', '#67E8F9'],
  },
  sunset: {
    name: 'Warm Sunset',
    colors: ['#F59E0B', '#F97316', '#EF4444', '#EAB308', '#FB923C', '#DC2626', '#FDE047'],
  },
  electric: {
    name: 'Electric Blue',
    colors: ['#38BDF8', '#6366F1', '#A855F7', '#2563EB', '#0284C7', '#818CF8', '#93C5FD'],
  },
};

export const DataVisualizer: React.FC<DataVisualizerProps> = ({ data, onSwitchToTable }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [paletteKey, setPaletteKey] = useState<keyof typeof PALETTES>('emerald');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('none');
  const [topLimit, setTopLimit] = useState<number>(15);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Analyze columns to find categories and metrics
  const columnAnalysis = useMemo(() => {
    if (!data || !data.columns || data.rows.length === 0) {
      return { numericCols: [], stringCols: [] };
    }

    const numericCols: string[] = [];
    const stringCols: string[] = [];

    data.columns.forEach((col, idx) => {
      // Check first 15 non-null values
      let numericCount = 0;
      let nonNullCount = 0;

      for (let r = 0; r < Math.min(data.rows.length, 20); r++) {
        const val = data.rows[r]?.[idx];
        if (val !== null && val !== undefined && val !== '') {
          nonNullCount++;
          if (typeof val === 'number') {
            numericCount++;
          } else if (typeof val === 'string' && !isNaN(Number(val.trim())) && val.trim() !== '') {
            numericCount++;
          }
        }
      }

      if (nonNullCount > 0 && numericCount / nonNullCount >= 0.7) {
        numericCols.push(col);
      } else {
        stringCols.push(col);
      }
    });

    return { numericCols, stringCols };
  }, [data]);

  // Dimension & Metric column state
  const [selectedDimension, setSelectedDimension] = useState<string>(() => {
    return columnAnalysis.stringCols[0] || data.columns[0] || '';
  });

  const [selectedMetric, setSelectedMetric] = useState<string>(() => {
    return columnAnalysis.numericCols[0] || (data.columns[1] ? data.columns[1] : '__COUNT__');
  });

  // Keep state in sync if data columns change
  React.useEffect(() => {
    if (!data.columns.includes(selectedDimension)) {
      setSelectedDimension(columnAnalysis.stringCols[0] || data.columns[0] || '');
    }
    if (selectedMetric !== '__COUNT__' && !data.columns.includes(selectedMetric)) {
      setSelectedMetric(columnAnalysis.numericCols[0] || '__COUNT__');
    }
  }, [data, columnAnalysis]);

  // Process data for charts
  const processedChartData = useMemo(() => {
    if (!data || !data.columns || data.rows.length === 0 || !selectedDimension) {
      return [];
    }

    const dimIdx = data.columns.indexOf(selectedDimension);
    const isCountMode = selectedMetric === '__COUNT__';
    const metricIdx = isCountMode ? -1 : data.columns.indexOf(selectedMetric);

    if (dimIdx === -1) return [];

    // Aggregate by dimension
    const map = new Map<string, { label: string; value: number }>();

    data.rows.forEach((row) => {
      const rawDim = row[dimIdx];
      const dimLabel = rawDim === null || rawDim === undefined ? '(Empty)' : String(rawDim);

      let val = 1;
      if (!isCountMode && metricIdx !== -1) {
        const rawVal = row[metricIdx];
        const parsed = Number(rawVal);
        val = isNaN(parsed) ? 0 : parsed;
      }

      if (map.has(dimLabel)) {
        const existing = map.get(dimLabel)!;
        existing.value += val;
      } else {
        map.set(dimLabel, { label: dimLabel, value: val });
      }
    });

    let result = Array.from(map.values());

    // Sort if requested
    if (sortOrder === 'desc') {
      result.sort((a, b) => b.value - a.value);
    } else if (sortOrder === 'asc') {
      result.sort((a, b) => a.value - b.value);
    }

    // Limit top N if dataset is large
    if (topLimit > 0 && result.length > topLimit) {
      result = result.slice(0, topLimit);
    }

    return result;
  }, [data, selectedDimension, selectedMetric, sortOrder, topLimit]);

  // Summary statistics
  const stats = useMemo(() => {
    if (processedChartData.length === 0) return null;
    const values = processedChartData.map((d) => d.value);
    const sum = values.reduce((acc, v) => acc + v, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const topItem = processedChartData.reduce((prev, curr) => (curr.value > prev.value ? curr : prev));

    return {
      total: sum,
      average: avg,
      max,
      min,
      count: processedChartData.length,
      topItem,
    };
  }, [processedChartData]);

  const activeColors = PALETTES[paletteKey].colors;

  // Custom Dark Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      const percent = stats && stats.total > 0 ? ((item.value / stats.total) * 100).toFixed(1) : null;
      return (
        <div className="bg-black/95 border border-[#8CFFB7]/40 rounded-xl p-3 shadow-2xl backdrop-blur-md text-xs font-mono">
          <p className="text-slate-300 font-semibold mb-1 text-sm">{item.payload.label}</p>
          <div className="flex items-center gap-2 text-[#8CFFB7]">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || activeColors[0] }} />
            <span>
              {selectedMetric === '__COUNT__' ? 'Count' : selectedMetric}:{' '}
              <span className="font-bold">{typeof item.value === 'number' ? item.value.toLocaleString() : item.value}</span>
            </span>
          </div>
          {percent && (
            <p className="text-slate-400 text-[11px] mt-1">
              Share: <span className="text-white font-medium">{percent}%</span> of visible total
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`bg-black/95 border border-[#8CFFB7]/30 rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-4 z-50 flex flex-col bg-black' : 'mt-3'
      }`}
    >
      {/* Visualizer Top Bar */}
      <div className="p-3 bg-black/80 border-b border-[#8CFFB7]/20 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#8CFFB7]/15 rounded-lg border border-[#8CFFB7]/30 text-[#8CFFB7]">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <span>Interactive Data Visualizer</span>
              <span className="text-[10px] bg-[#8CFFB7]/20 text-[#8CFFB7] px-1.5 py-0.5 rounded font-mono">
                {processedChartData.length} Data Points
              </span>
            </h4>
          </div>
        </div>

        {/* View & Display Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Chart Type Selector */}
          <div className="flex items-center bg-black/70 border border-[#8CFFB7]/30 rounded-xl p-1 gap-1">
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                chartType === 'bar' ? 'bg-[#8CFFB7] text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Vertical Bar Chart"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bar</span>
            </button>
            <button
              onClick={() => setChartType('bar-horizontal')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                chartType === 'bar-horizontal' ? 'bg-[#8CFFB7] text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Horizontal Bar Chart"
            >
              <ArrowUpDown className="w-3.5 h-3.5 rotate-90" />
              <span className="hidden sm:inline">H-Bar</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                chartType === 'line' ? 'bg-[#8CFFB7] text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Line Chart"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Line</span>
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                chartType === 'area' ? 'bg-[#8CFFB7] text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Area Chart"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Area</span>
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all ${
                chartType === 'pie' ? 'bg-[#8CFFB7] text-black font-semibold' : 'text-slate-400 hover:text-white'
              }`}
              title="Donut / Pie Chart"
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Pie</span>
            </button>
          </div>

          {/* Palette Selector */}
          <div className="relative flex items-center gap-1 bg-black/70 border border-[#8CFFB7]/30 rounded-xl px-2 py-1 text-xs">
            <Palette className="w-3.5 h-3.5 text-[#8CFFB7]" />
            <select
              value={paletteKey}
              onChange={(e) => setPaletteKey(e.target.value as keyof typeof PALETTES)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs"
            >
              {Object.entries(PALETTES).map(([k, v]) => (
                <option key={k} value={k} className="bg-slate-900 text-white">
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 bg-black/70 border border-[#8CFFB7]/30 rounded-xl text-slate-300 hover:text-white hover:border-[#8CFFB7] transition-all"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Chart'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-[#8CFFB7]" /> : <Maximize2 className="w-3.5 h-3.5 text-[#8CFFB7]" />}
          </button>

          {/* Return to Table Button */}
          {onSwitchToTable && (
            <button
              onClick={onSwitchToTable}
              className="flex items-center gap-1 px-2.5 py-1 bg-black/70 hover:bg-[#8CFFB7]/15 border border-[#8CFFB7]/30 rounded-xl text-slate-300 hover:text-white transition-all text-xs"
            >
              <TableIcon className="w-3.5 h-3.5 text-[#8CFFB7]" />
              <span>Table</span>
            </button>
          )}
        </div>
      </div>

      {/* Axis & Dimension Configuration Strip */}
      <div className="p-3 bg-black/60 border-b border-[#8CFFB7]/15 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Dimension / X Axis */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Category (X):</span>
            <select
              value={selectedDimension}
              onChange={(e) => setSelectedDimension(e.target.value)}
              className="bg-black border border-[#8CFFB7]/30 rounded-lg px-2.5 py-1 text-xs text-[#8CFFB7] focus:outline-none focus:border-[#8CFFB7] font-mono cursor-pointer"
            >
              {data.columns.map((col) => (
                <option key={col} value={col} className="bg-slate-900 text-white">
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Metric / Y Axis */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Metric (Y):</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              className="bg-black border border-[#8CFFB7]/30 rounded-lg px-2.5 py-1 text-xs text-[#8CFFB7] focus:outline-none focus:border-[#8CFFB7] font-mono cursor-pointer"
            >
              <option value="__COUNT__" className="bg-slate-900 text-[#8CFFB7]">
                ★ Record Count (Frequency)
              </option>
              {data.columns.map((col) => (
                <option key={col} value={col} className="bg-slate-900 text-white">
                  {col}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Sort:</span>
            <div className="flex items-center bg-black border border-[#8CFFB7]/30 rounded-lg p-0.5">
              <button
                onClick={() => setSortOrder('none')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  sortOrder === 'none' ? 'bg-[#8CFFB7]/25 text-[#8CFFB7] font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Default
              </button>
              <button
                onClick={() => setSortOrder('desc')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  sortOrder === 'desc' ? 'bg-[#8CFFB7]/25 text-[#8CFFB7] font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                High → Low
              </button>
              <button
                onClick={() => setSortOrder('asc')}
                className={`px-2 py-0.5 rounded text-[11px] ${
                  sortOrder === 'asc' ? 'bg-[#8CFFB7]/25 text-[#8CFFB7] font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Low → High
              </button>
            </div>
          </div>
        </div>

        {/* Limit points filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400 font-medium">Show:</span>
          <select
            value={topLimit}
            onChange={(e) => setTopLimit(Number(e.target.value))}
            className="bg-black border border-[#8CFFB7]/30 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none font-mono cursor-pointer"
          >
            <option value={10}>Top 10</option>
            <option value={15}>Top 15</option>
            <option value={25}>Top 25</option>
            <option value={0}>All Points</option>
          </select>
        </div>
      </div>

      {/* KPI Stats Highlights Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-black/40 border-b border-[#8CFFB7]/10 text-xs">
          <div className="bg-black/60 border border-[#8CFFB7]/20 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Sum</span>
            <span className="text-base font-bold text-[#8CFFB7] font-mono">
              {stats.total.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
          </div>
          <div className="bg-black/60 border border-[#8CFFB7]/20 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Average</span>
            <span className="text-base font-bold text-white font-mono">
              {stats.average.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </span>
          </div>
          <div className="bg-black/60 border border-[#8CFFB7]/20 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Top Category</span>
            <span className="text-xs font-semibold text-[#8CFFB7] truncate block" title={stats.topItem.label}>
              {stats.topItem.label} ({stats.topItem.value.toLocaleString()})
            </span>
          </div>
          <div className="bg-black/60 border border-[#8CFFB7]/20 rounded-xl p-2.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Range (Min - Max)</span>
            <span className="text-xs font-mono text-slate-300 block">
              {stats.min.toLocaleString()} — {stats.max.toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Main Chart Canvas */}
      <div className={`p-4 flex-1 ${isFullscreen ? 'h-full min-h-[500px]' : 'h-80 md:h-96'}`}>
        {processedChartData.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <BarChart2 className="w-8 h-8 text-slate-600" />
            <p className="text-xs">No chartable data could be generated for the selected axes.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={processedChartData} margin={{ top: 15, right: 20, left: 0, bottom: 25 }}>
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeColors[0]} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={activeColors[1] || activeColors[0]} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#8CFFB7" strokeOpacity={0.1} />
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="url(#barGradient)" radius={[6, 6, 0, 0]}>
                  {processedChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={activeColors[index % activeColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'bar-horizontal' ? (
              <BarChart
                data={processedChartData}
                layout="vertical"
                margin={{ top: 15, right: 30, left: 30, bottom: 15 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#8CFFB7" strokeOpacity={0.1} />
                <XAxis type="number" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis
                  dataKey="label"
                  type="category"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {processedChartData.map((_, index) => (
                    <Cell key={`cell-h-${index}`} fill={activeColors[index % activeColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={processedChartData} margin={{ top: 15, right: 20, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#8CFFB7" strokeOpacity={0.1} />
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={activeColors[0]}
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#000', stroke: activeColors[0], strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: activeColors[0], stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={processedChartData} margin={{ top: 15, right: 20, left: 0, bottom: 25 }}>
                <defs>
                  <linearGradient id="areaColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeColors[0]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={activeColors[0]} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#8CFFB7" strokeOpacity={0.1} />
                <XAxis
                  dataKey="label"
                  stroke="#64748B"
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={50}
                />
                <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={activeColors[0]}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#areaColor)"
                />
              </AreaChart>
            ) : (
              <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(val) => <span className="text-slate-300 text-xs font-mono">{val}</span>}
                />
                <Pie
                  data={processedChartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="label"
                >
                  {processedChartData.map((_, index) => (
                    <Cell
                      key={`pie-cell-${index}`}
                      fill={activeColors[index % activeColors.length]}
                      stroke="#000"
                      strokeWidth={1.5}
                    />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
