
import React, { useMemo, useState } from 'react';
import { DataRow, UserProfile, ColumnMetadata } from '../types';
import Dashboard from '../components/Dashboard';
import DataTable from '../components/DataTable';
import ChartBuilder from '../components/ChartBuilder';
import { LayoutDashboard, Table as TableIcon, PieChart, Filter, Search, User, Briefcase, FileText } from 'lucide-react';

interface AnalysisPageProps {
  data: DataRow[];
  profile: UserProfile;
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ data, profile }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'charts'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalCategory, setGlobalCategory] = useState('All');

  // Intelligent metadata detection
  const metadata = useMemo(() => {
    if (data.length === 0) return [];
    const headers = Object.keys(data[0]);
    return headers.map(header => {
      const numericCount = data.filter(row => typeof row[header] === 'number').length;
      const type = numericCount > data.length / 2 ? 'number' : 'string';
      return { name: header, type } as ColumnMetadata;
    });
  }, [data]);

  const categories = useMemo(() => {
    const stringCols = metadata.filter(m => m.type === 'string');
    if (stringCols.length === 0) return [];
    const firstCol = stringCols[0].name;
    const vals = new Set(data.map(d => String(d[firstCol])).filter(v => v !== ''));
    return Array.from(vals).slice(0, 30);
  }, [data, metadata]);

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchesSearch = Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const stringCol = metadata.find(m => m.type === 'string')?.name;
      const matchesCategory = globalCategory === 'All' || (stringCol && String(row[stringCol]) === globalCategory);
      return matchesSearch && matchesCategory;
    });
  }, [data, searchTerm, globalCategory, metadata]);

  return (
    <div className="bg-[#F8F9FA] min-h-screen">
      {/* Upper Panel: Identification & Navigation */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative overflow-hidden">
        {/* Subtle accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-deepblue-900 via-gold-500 to-deepblue-900"></div>
        
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
            <div className="flex items-center gap-8">
              {/* Featured Image - Top Corner/Side Integration */}
              <div className="relative group">
                <div className="w-24 h-32 rounded-xl bg-gray-100 border-2 border-gold-200 overflow-hidden shadow-lg transition-transform hover:scale-105">
                  {profile.image ? (
                    <img src={profile.image} alt="Analyst" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User size={40} className="text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-deepblue-950 text-white p-1.5 rounded-lg shadow-xl border border-gold-500/30">
                  <Briefcase size={12} />
                </div>
              </div>

              <div>
                <h1 className="text-sm font-black text-gold-600 uppercase tracking-[0.3em] mb-1">Analista Designado</h1>
                <h2 className="text-4xl font-serif font-bold text-gray-900 mb-2">{profile.fullName || 'Analista No Identificado'}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                  <span className="flex items-center gap-2"><FileText size={14} className="text-deepblue-900"/> {profile.organization}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100">Sesión Activa</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-4 w-full lg:w-auto">
              <div className="inline-flex bg-gray-100 p-1 rounded-2xl border border-gray-200 shadow-inner">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'table', label: 'Tablas', icon: TableIcon },
                  { id: 'charts', label: 'Gráficos', icon: PieChart }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${
                      activeTab === tab.id ? 'bg-white text-deepblue-900 shadow-md ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-deepblue-950 py-4 sticky top-16 z-30 border-b border-gold-500/20 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center gap-6">
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Búsqueda rápida de registros..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-xl py-2.5 pl-11 pr-4 text-white text-sm focus:bg-white focus:text-gray-900 outline-none transition-all font-medium"
            />
          </div>

          <div className="flex items-center gap-3">
            <Filter size={16} className="text-gold-400" />
            <select 
              value={globalCategory}
              onChange={(e) => setGlobalCategory(e.target.value)}
              className="bg-white/10 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs font-bold tracking-tight outline-none cursor-pointer focus:bg-white focus:text-gray-900 transition-all"
            >
              <option value="All" className="text-gray-900">Categoría Global: Todas</option>
              {categories.map(cat => (
                <option key={cat} value={cat} className="text-gray-900">{cat}</option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex items-center gap-3 text-white/40 font-black text-[10px] uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-gold-500 animate-pulse shadow-[0_0_10px_rgba(212,175,55,0.8)]"></div>
            Análisis de {filteredData.length} registros
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        {activeTab === 'dashboard' && <Dashboard data={filteredData} metadata={metadata} profileImage={profile.image} />}
        {activeTab === 'table' && <DataTable data={filteredData} metadata={metadata} />}
        {activeTab === 'charts' && <ChartBuilder data={filteredData} metadata={metadata} />}
      </div>
    </div>
  );
};

export default AnalysisPage;
