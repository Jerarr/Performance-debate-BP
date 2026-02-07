
import React, { useState, useMemo } from 'react';
import { DataRow, ColumnMetadata } from '../types';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area
} from 'recharts';
import { Settings, BarChart as BarIcon, LineChart as LineIcon, PieChart as PieIcon, Layers, BarChart3 } from 'lucide-react';

interface ChartBuilderProps {
  data: DataRow[];
  metadata: ColumnMetadata[];
}

type ChartType = 'bar' | 'line' | 'pie' | 'histogram';

const ChartBuilder: React.FC<ChartBuilderProps> = ({ data, metadata }) => {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxis, setXAxis] = useState<string>(metadata.find(m => m.type === 'string')?.name || metadata[0].name);
  const [yAxis, setYAxis] = useState<string>(metadata.find(m => m.type === 'number')?.name || metadata[0].name);

  // General Chart Data Processing
  const chartData = useMemo(() => {
    if (chartType === 'histogram') {
      const values = data.map(d => Number(d[yAxis])).filter(v => !isNaN(v));
      if (values.length === 0) return [];
      const min = Math.min(...values);
      const max = Math.max(...values);
      const bins = 10;
      const step = (max - min) / bins;
      const distribution = Array.from({ length: bins }).map((_, i) => ({
        range: `${(min + i * step).toFixed(1)} - ${(min + (i + 1) * step).toFixed(1)}`,
        frequency: 0
      }));
      values.forEach(v => {
        const binIndex = Math.min(Math.floor((v - min) / step), bins - 1);
        distribution[binIndex].frequency++;
      });
      return distribution;
    }

    // Categorical grouping for other charts
    const grouped: { [key: string]: number[] } = {};
    data.slice(0, 500).forEach(d => {
      const xVal = String(d[xAxis] || 'N/A');
      const yVal = Number(d[yAxis]) || 0;
      if (!grouped[xVal]) grouped[xVal] = [];
      grouped[xVal].push(yVal);
    });

    return Object.keys(grouped).map(key => ({
      name: key,
      value: grouped[key].reduce((a, b) => a + b, 0) / grouped[key].length
    })).sort((a, b) => b.value - a.value).slice(0, 15);
  }, [data, xAxis, yAxis, chartType]);

  const COLORS = ['#1e3a8a', '#d4af37', '#64748b', '#3b82f6', '#10b981', '#F59E0B', '#EF4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fadeIn">
      {/* Sidebar Controls */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
          <div className="flex items-center gap-3 mb-8">
            <Settings className="text-gold-600" size={18} />
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Ajustes Visuales</h3>
          </div>
          
          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Arquitectura</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'bar', icon: BarIcon, label: 'Barras' },
                  { id: 'line', icon: LineIcon, label: 'Evolución' },
                  { id: 'pie', icon: PieIcon, label: 'Sector' },
                  { id: 'histogram', icon: BarChart3, label: 'Histograma' }
                ].map(type => (
                  <button 
                    key={type.id}
                    onClick={() => setChartType(type.id as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all border ${chartType === type.id ? 'bg-deepblue-950 text-white border-deepblue-950 shadow-lg scale-105' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                  >
                    <type.icon size={18} />
                    <span className="text-[9px] font-black uppercase tracking-tight">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-5 pt-4 border-t border-gray-50">
              {chartType !== 'histogram' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Dimensión (X)</label>
                  <select 
                    value={xAxis}
                    onChange={(e) => setXAxis(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-gold-300"
                  >
                    {metadata.filter(m => m.type === 'string').map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Métrica (Y)</label>
                <select 
                  value={yAxis}
                  onChange={(e) => setYAxis(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:ring-2 focus:ring-gold-300"
                >
                  {metadata.filter(m => m.type === 'number').map(m => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-deepblue-950 rounded-3xl p-6 text-white shadow-xl">
           <div className="flex items-center gap-3 mb-4">
              <Layers className="text-gold-500" size={16} />
              <h4 className="text-[10px] font-bold uppercase tracking-widest">Contexto Académico</h4>
           </div>
           <p className="text-[10px] text-blue-200/50 leading-relaxed">
             Los histogramas permiten visualizar la frecuencia de distribución de sus datos numéricos en 10 intervalos automáticos.
           </p>
        </div>
      </div>

      {/* Viewport */}
      <div className="lg:col-span-3 bg-white rounded-[40px] p-12 shadow-2xl border border-gray-100 flex flex-col min-h-[600px]">
        <div className="mb-12 border-b border-gray-50 pb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
              {chartType === 'histogram' ? `Distribución de ${yAxis}` : `Análisis Comparativo`}
            </h2>
            <p className="text-sm text-gray-400 font-medium mt-1">
              Visualizando <span className="text-gold-600 font-black">{yAxis}</span> {chartType !== 'histogram' ? `por ${xAxis}` : 'en intervalos de frecuencia'}
            </p>
          </div>
        </div>

        <div className="flex-grow">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'histogram' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 9, fontWeight: 700}} height={50} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="frequency" fill="#1e3a8a" radius={[10, 10, 0, 0]} />
              </BarChart>
            ) : chartType === 'bar' ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 9, fontWeight: 700}} height={60} angle={-25} textAnchor="end" />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                <Tooltip cursor={{fill: '#F8FAFC'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#d4af37" radius={[10, 10, 0, 0]} barSize={40} />
              </BarChart>
            ) : chartType === 'line' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} height={60} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#1e3a8a" strokeWidth={4} fillOpacity={1} fill="url(#colorVal)" />
              </AreaChart>
            ) : (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="45%"
                  innerRadius={110}
                  outerRadius={160}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" />
              </PieChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ChartBuilder;
