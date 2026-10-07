import React, { useState, useRef } from 'react';
import { useI18n } from '../lib/i18n';
import { clearAllData, exportData, importData } from '../lib/db';
import { Download, Upload, Trash2, Globe } from 'lucide-react';

export function Settings() {
  const { t, language, setLanguage } = useI18n();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tracenime-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const result = await importData(json);
      setImportResult(`IMPORTED: ${result.added} NEW, ${result.updated} UPDATED, ${result.skipped} SKIPPED`);
      setTimeout(() => setImportResult(null), 5000);
    } catch {
      setImportResult('INVALID EXPORT FILE');
      setTimeout(() => setImportResult(null), 5000);
    }
    e.target.value = '';
  };

  const handleClearAll = async () => {
    await clearAllData();
    setShowClearConfirm(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#FF4D00]">
      {/* Header */}
      <section className="px-4 sm:px-8 pt-32 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 bg-black" />
            <span className="font-mono-custom text-xs font-bold uppercase tracking-widest">// CONFIGURATION</span>
          </div>
          <h1
            className="font-display text-black mb-8"
            style={{ fontSize: 'clamp(3rem, 12vw, 12rem)' }}
          >
            SETTINGS
          </h1>
          <div className="border-t-2 border-black" />
        </div>
      </section>

      {/* Content */}
      <section className="bg-black text-white px-4 sm:px-8 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Language */}
          <div className="border-brutal-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe size={20} className="text-[#FF4D00]" />
              <h2 className="font-display text-lg">{t('settings.language')}</h2>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 btn-brutal text-sm ${
                  language === 'en'
                    ? 'bg-[#FF4D00] border-[#FF4D00] text-black'
                    : 'border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                ENGLISH
              </button>
              <button
                onClick={() => setLanguage('id')}
                className={`flex-1 btn-brutal text-sm ${
                  language === 'id'
                    ? 'bg-[#FF4D00] border-[#FF4D00] text-black'
                    : 'border-white text-white hover:bg-white hover:text-black'
                }`}
              >
                BAHASA INDONESIA
              </button>
            </div>
          </div>

          {/* Data */}
          <div className="border-brutal-white p-6">
            <h2 className="font-display text-lg mb-6">DATA MANAGEMENT</h2>
            <div className="space-y-3">
              <button
                onClick={handleExport}
                className="w-full btn-brutal border-white text-white hover:bg-white hover:text-black flex items-center justify-center gap-3"
              >
                <Download size={16} />
                EXPORT DATA
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full btn-brutal border-white text-white hover:bg-white hover:text-black flex items-center justify-center gap-3"
              >
                <Upload size={16} />
                IMPORT DATA
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
              {importResult && (
                <div className="border-brutal-white bg-white/5 p-4 font-mono-custom text-xs text-[#FF4D00]">
                  {importResult}
                </div>
              )}
            </div>
          </div>

          {/* Clear Data */}
          <div className="border-brutal-white p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 size={20} className="text-red-400" />
              <h2 className="font-display text-lg">DANGER ZONE</h2>
            </div>
            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="w-full btn-brutal border-red-400 text-red-400 hover:bg-red-400 hover:text-black"
              >
                {t('settings.clearData')}
              </button>
            ) : (
              <div className="space-y-4">
                <p className="font-mono-custom text-xs text-white/80">{t('settings.clearConfirm')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClearAll}
                    className="btn-brutal text-xs bg-red-400 border-red-400 text-black hover:bg-black hover:text-red-400"
                  >
                    CONFIRM DELETE
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="btn-brutal text-xs border-white text-white hover:bg-white hover:text-black"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
