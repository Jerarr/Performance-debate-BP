
import React, { useRef, useState } from 'react';
import { UserProfile, DataRow } from '../types';
import { Upload, CheckCircle, ArrowRight, UserPlus, Building, Image as ImageIcon, ShieldCheck, Database } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProfilePageProps {
  profile: UserProfile;
  onProfileUpdate: (profile: UserProfile) => void;
  onDataImport: (data: DataRow[], fileName: string) => void;
  onNavigateToAnalysis: () => void;
  dataImported: boolean;
  importedFileName: string;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ 
  profile, 
  onProfileUpdate, 
  onDataImport, 
  onNavigateToAnalysis,
  dataImported,
  importedFileName
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataStats, setDataStats] = useState<{ rows: number, cols: number } | null>(null);

  const robustParseValue = (val: any): number | string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') return val;
    
    let clean = String(val).trim();
    if (clean === '') return '';

    // Limpieza de formatos de moneda, porcentaje y separadores
    const numericCandidate = clean.replace(/[^\d.,-]/g, '').replace(',', '.');
    const parsed = parseFloat(numericCandidate);
    
    // Si es un número válido y no parece un texto alfanumérico largo
    if (!isNaN(parsed) && /^[\d.,\s$%+-]+$/.test(clean)) {
      return parsed;
    }
    
    return clean;
  };

  const processDataRows = (rawRows: any[]): DataRow[] => {
    return rawRows.map(row => {
      const cleanRow: DataRow = {};
      Object.keys(row).forEach(key => {
        cleanRow[key] = robustParseValue(row[key]);
      });
      return cleanRow;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = (event) => {
      try {
        let jsonData: DataRow[] = [];
        
        if (isExcel) {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet);
          jsonData = processDataRows(rawRows);
        } else {
          // Procesamiento de CSV
          const text = event.target?.result as string;
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
          if (lines.length < 2) throw new Error("Archivo insuficiente");

          const headers = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(h => h.trim().replace(/^"|"$/g, ''));
          const rawRows = lines.slice(1).map(line => {
            const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = (values[index] || '').trim().replace(/^"|"$/g, '');
            });
            return row;
          });
          jsonData = processDataRows(rawRows);
        }
        
        const cols = jsonData.length > 0 ? Object.keys(jsonData[0]).length : 0;
        setDataStats({ rows: jsonData.length, cols });
        onDataImport(jsonData, file.name);
      } catch (err) {
        console.error("Error al procesar:", err);
        alert("Error procesando el archivo. Verifique el formato.");
      } finally {
        setIsProcessing(false);
      }
    };

    if (isExcel) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onProfileUpdate({ ...profile, image: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Perfil */}
        <section className="space-y-8 animate-fadeIn">
          <div className="border-l-4 border-gold-500 pl-6">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Perfil Analítico</h1>
            <p className="text-gray-500">Gestión de identidad y organización.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold-50 rounded-full -mr-32 -mt-32 opacity-20"></div>
            
            <div className="space-y-8 relative z-10">
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => imageInputRef.current?.click()}
                  className="group relative w-40 h-40 rounded-3xl overflow-hidden cursor-pointer bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center transition-all hover:border-gold-400 shadow-sm"
                >
                  {profile.image ? (
                    <img src={profile.image} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto text-gray-300 group-hover:text-gold-500 mb-2" size={32} />
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Subir Imagen</span>
                    </div>
                  )}
                  <input type="file" ref={imageInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) => onProfileUpdate({...profile, fullName: e.target.value})}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-gold-400 outline-none font-medium text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Organización</label>
                  <input
                    type="text"
                    value={profile.organization}
                    onChange={(e) => onProfileUpdate({...profile, organization: e.target.value})}
                    placeholder="Nombre del Club/Empresa"
                    className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-gold-400 outline-none font-medium text-gray-700"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Depuración de Datos */}
        <section className="space-y-8 animate-fadeIn delay-100">
          <div className="border-l-4 border-deepblue-900 pl-6">
            <h1 className="text-4xl font-serif font-bold text-gray-900 mb-2">Datos Diversos</h1>
            <p className="text-gray-500">Soporte automático para Excel y CSV.</p>
          </div>

          <div className="bg-deepblue-950 rounded-3xl shadow-2xl p-10 text-white min-h-[500px] flex flex-col justify-between">
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-gold-400 font-bold text-xl mb-1 text-balance">Carga de Documentos</h3>
                  <p className="text-blue-200/60 text-sm">Ahora procesando Excel (.xlsx, .xls) y CSV.</p>
                </div>
                <Database className="text-gold-500" size={24} />
              </div>

              <div 
                onClick={() => !isProcessing && fileInputRef.current?.click()}
                className={`group border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                  dataImported ? 'border-gold-500 bg-gold-500/5' : 'border-white/10 hover:border-gold-500 hover:bg-white/5'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept=".csv, .xlsx, .xls" 
                  className="hidden" 
                />
                
                {isProcessing ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <span className="text-gold-400 font-bold uppercase tracking-widest text-xs">Analizando Celdas...</span>
                  </div>
                ) : dataImported ? (
                  <div className="text-center">
                    <CheckCircle className="text-gold-500 mx-auto mb-4" size={48} />
                    <p className="text-2xl font-bold text-white mb-2">{importedFileName}</p>
                    <div className="inline-flex gap-4 px-4 py-2 bg-white/5 rounded-full text-[10px] font-bold uppercase tracking-widest text-gold-400">
                      <span>{dataStats?.rows} Registros</span>
                      <span>{dataStats?.cols} Columnas</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="text-gold-500 mb-4" size={40} />
                    <p className="text-xl font-bold mb-1">Subir Archivo</p>
                    <p className="text-blue-200/40 text-sm text-center">Formatos soportados: CSV, XLSX y XLS.</p>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onNavigateToAnalysis}
              disabled={!dataImported || !profile.fullName}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-2xl flex items-center justify-center gap-3 ${
                dataImported && profile.fullName 
                ? 'bg-gold-500 text-deepblue-950 hover:bg-gold-400 hover:-translate-y-1' 
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
              }`}
            >
              Comenzar Auditoría Visual
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
