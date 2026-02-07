
import React, { useState, useMemo } from 'react';
import { DataRow, ColumnMetadata } from '../types';
import { ChevronUp, ChevronDown, Download, ChevronLeft, ChevronRight, SlidersHorizontal, Search } from 'lucide-react';

interface DataTableProps {
  data: DataRow[];
  metadata: ColumnMetadata[];
}

const PAGE_SIZE = 10;

const DataTable: React.FC<DataTableProps> = ({ data, metadata }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});
  const [rangeFilters, setRangeFilters] = useState<{ [key: string]: { min: string, max: string } }>({});
  const [showFilters, setShowFilters] = useState(false);

  // Sorting logic
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtering Logic
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Apply column text filters
    Object.keys(columnFilters).forEach(col => {
      const val = columnFilters[col].toLowerCase();
      if (val) {
        filtered = filtered.filter(row => String(row[col]).toLowerCase().includes(val));
      }
    });

    // Apply numerical range filters
    Object.keys(rangeFilters).forEach(col => {
      const { min, max } = rangeFilters[col];
      if (min) filtered = filtered.filter(row => Number(row[col]) >= Number(min));
      if (max) filtered = filtered.filter(row => Number(row[col]) <= Number(max));
    });

    // Apply sort
    if (sortConfig) {
      const { key, direction } = sortConfig;
      filtered.sort((a, b) => {
        const aVal = a[key] ?? '';
        const bVal = b[key] ?? '';
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, columnFilters, rangeFilters, sortConfig]);

  // Pagination Logic
  const totalPages = Math.ceil(processedData.length / PAGE_SIZE);
  const paginatedData = processedData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'elite_audit_data.csv';
    a.click();
  };

  return (
    <div className="bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden animate-fadeIn">
      {/* Table Header Controls */}
      <div className="p-8 border-b border-gray-100 bg-gray-50/30 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-xl font-serif font-bold text-gray-900">Repositorio de Datos</h3>
          <p className="text-xs text-gray-400 mt-1 uppercase font-black tracking-widest">Auditoría de {processedData.length} registros hallados</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-gold-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <SlidersHorizontal size={14} />
            Filtros Avanzados
          </button>
          <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-5 py-2.5 bg-deepblue-950 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gold-600 transition-all shadow-md"
          >
            <Download size={14} />
            Exportar
          </button>
        </div>
      </div>

      {/* Advanced Filter Bar */}
      {showFilters && (
        <div className="p-8 bg-gray-50 border-b border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slideDown">
          {metadata.map(col => (
            <div key={col.name} className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{col.name}</label>
              {col.type === 'string' ? (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={12} />
                  <input 
                    type="text"
                    placeholder="Filtrar por texto..."
                    className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-8 pr-3 text-xs outline-none focus:ring-1 focus:ring-gold-500"
                    onChange={(e) => {
                      setColumnFilters(prev => ({ ...prev, [col.name]: e.target.value }));
                      setCurrentPage(1);
                    }}
                  />
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="number"
                    placeholder="Mín"
                    className="w-1/2 bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-gold-500"
                    onChange={(e) => {
                      setRangeFilters(prev => ({ ...prev, [col.name]: { ...prev[col.name], min: e.target.value } }));
                      setCurrentPage(1);
                    }}
                  />
                  <input 
                    type="number"
                    placeholder="Máx"
                    className="w-1/2 bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs outline-none focus:ring-1 focus:ring-gold-500"
                    onChange={(e) => {
                      setRangeFilters(prev => ({ ...prev, [col.name]: { ...prev[col.name], max: e.target.value } }));
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-gray-100">
              {metadata.map((col) => (
                <th 
                  key={col.name}
                  onClick={() => handleSort(col.name)}
                  className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] cursor-pointer hover:bg-gray-50 transition-colors relative"
                >
                  <div className="flex items-center gap-2">
                    {col.name}
                    <div className="flex flex-col opacity-30">
                      <ChevronUp size={10} className={sortConfig?.key === col.name && sortConfig.direction === 'asc' ? 'text-gold-600 opacity-100' : ''} />
                      <ChevronDown size={10} className={sortConfig?.key === col.name && sortConfig.direction === 'desc' ? 'text-gold-600 opacity-100' : ''} />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedData.map((row, i) => (
              <tr key={i} className="hover:bg-gold-50/10 transition-colors">
                {metadata.map((col) => (
                  <td key={col.name} className="px-6 py-5 text-sm text-gray-600 font-medium">
                    {col.type === 'number' ? (
                      <span className="font-mono text-deepblue-900 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                        {Number(row[col.name]).toLocaleString()}
                      </span>
                    ) : (
                      <span className="truncate block max-w-[200px]">{String(row[col.name] || '-')}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Mostrando {Math.min(processedData.length, (currentPage - 1) * PAGE_SIZE + 1)} - {Math.min(processedData.length, currentPage * PAGE_SIZE)} de {processedData.length}
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => prev - 1)}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gold-600 disabled:opacity-30 transition-all shadow-sm"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
              const pageNum = idx + 1; // Simplified for UI
              return (
                <button 
                  key={idx}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === pageNum ? 'bg-deepblue-950 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'}`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-500 hover:text-gold-600 disabled:opacity-30 transition-all shadow-sm"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
