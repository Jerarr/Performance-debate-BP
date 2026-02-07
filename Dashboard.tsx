
import React, { useMemo } from 'react';
import { DataRow, ColumnMetadata } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { TrendingUp, Calculator, Hash, ArrowUpRight, ArrowDownRight, Activity, Percent } from 'lucide-react';

interface DashboardProps {
  data: DataRow[];
  metadata: ColumnMetadata[];
  profileImage: string | null;
}

const Dashboard: React.FC<DashboardProps> = ({ data, metadata, profileImage }) => {
  const numCols = useMemo(() => metadata.filter(m => m.type === 'number'), [metadata]);
  const strCols = useMemo(() => metadata.filter(m => m.type === 'string'), [metadata]);

  const kpis = useMemo(() => {
    if (data.length === 0 || numCols.length === 0) return [];
    const mainCol = numCols[0].name;
    const values = data.map(d => Number(d[mainCol])).filter(v => !isNaN(v));
    
    const count = data.length;
    const avg = values.reduce((a, b) => a + b, 0) / (values.length || 1);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return [
      { label: 'Total Registros', value: count, icon: Hash, color: 'text-deepblue-900', bg: 'bg-blue-50' },
      { label: `Promedio (${mainCol})`, value: avg.toLocaleString(undefined, {maximumFractionDigits: 2}), icon: Calculator, color: 'text-gold-700', bg: 'bg-gold-50' },
      { label: 'Valor Máximo', value: max.toLocaleString(), icon: ArrowUpRight, color: 'text-green-700', bg: 'bg-green-50' },
      { label: 'Valor Mínimo', value: min.toLocaleString(), icon: ArrowDownRight, color: 'text-red-700', bg: 'bg-red-50' },
    ];
  }, [data, numCols]);

  const chartData = useMemo(() => {
    const stringCol = strCols[0]?.name;
    const numCol = numCols[0]?.name;
    if (!stringCol || !numCol) return [];
    
    const grouped: { [key: string]: number[] } = {};
    data.slice(0, 100).forEach(d => {
      const key = String(d[stringCol]);
      grouped[key] = grouped[key] || [];
      grouped[key].push(Number(d[numCol]));
    });

    return Object.keys(grouped).slice(0, 10).map(key => ({
      name: key,
      value: grouped[key].reduce((a, b) => a + b, 0) / grouped[key].length
    })).sort((a, b) => b.value - a.value);
  }, [data, numCols, strCols]);

  const COLORS = ['#1e3a8a', '#d4af37', '#64748b', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex items-center gap-5 transition-transform hover:-translate-y-1">
            <div className={`p-4 rounded-2xl ${kpi.bg}`}>
              <kpi.icon className={kpi.color} size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
              <h3 className="text-2xl font-serif font-bold text-gray-900">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analysis Summary */}
        <div className="lg:col-span-2 bg-white rounded-[40px] p-10 shadow-xl border border-gray-100">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h3 className="text-2xl font-serif font-bold text-gray-900">Variables de Alto Impacto</h3>
              <p className="text-sm text-gray-400 font-medium">Promedios segmentados por la categoría principal</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-2xl">
              <TrendingUp className="text-gold-500" />
            </div>
          </div>

          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} 
                  angle={-30} 
                  textAnchor="end"
                />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 11}} />
                <Tooltip 
                  cursor={{fill: '#F8FAFC'}}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '16px' }}
                />
                <Bar dataKey="value" fill="#d4af37" radius={[10, 10, 0, 0]} barSize={36}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1e3a8a' : '#d4af37'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Proportional Distribution */}
        <div className="bg-white rounded-[40px] p-10 shadow-xl border border-gray-100 flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-3 mb-2">
                <Percent className="text-deepblue-900" size={20} />
                <h4 className="text-xl font-serif font-bold text-gray-900">Distribución</h4>
              </div>
              <p className="text-sm text-gray-400 font-medium">Análisis porcentual del Top 5</p>
           </div>
           
           <div className="h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.slice(0, 5)}
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {chartData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Activity className="text-gold-500 opacity-20 mb-1" size={32} />
              </div>
           </div>

           <div className="mt-6 grid grid-cols-2 gap-3">
              {chartData.slice(0, 4).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: COLORS[idx]}}></div>
                  <span className="text-[10px] font-bold text-gray-600 truncate">{entry.name}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
