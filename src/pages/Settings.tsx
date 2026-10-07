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
      setImportResult(t('settings.importSuccess', {
        added: result.added,
        updated: result.updated,
        skipped: result.skipped,
      }));
      setTimeout(() => setImportResult(null), 5000);
    } catch {
      setImportResult('Invalid export file.');
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
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full bg-[#FF6B50] pulse-dot" />
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight-custom">{t('settings.title')}</h1>
      </div>

      <div className="space-y-6">
        {/* Language */}
        <div className="bg-[#111] rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Globe size={18} className="text-[#FF6B50]" />
            <h2 className="text-white font-medium">{t('settings.language')}</h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                language === 'en'
                  ? 'bg-[#FF6B50] text-black'
                  : 'bg-[#1a1a1a] text-[#888] hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('id')}
              className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                language === 'id'
                  ? 'bg-[#FF6B50] text-black'
                  : 'bg-[#1a1a1a] text-[#888] hover:text-white'
              }`}
            >
              Bahasa Indonesia
            </button>
          </div>
        </div>

        {/* Data */}
        <div className="bg-[#111] rounded-3xl p-5">
          <h2 className="text-white font-medium mb-4">Data</h2>
          <div className="space-y-3">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222] text-[#888] hover:text-white transition-colors"
            >
              <Download size={18} />
              <span className="text-sm">{t('settings.export')}</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a1a1a] hover:bg-[#222] text-[#888] hover:text-white transition-colors"
            >
              <Upload size={18} />
              <span className="text-sm">{t('settings.import')}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            {importResult && (
              <p className="text-sm text-[#888] px-4 py-2 bg-[#1a1a1a] rounded-xl">{importResult}</p>
            )}
          </div>
        </div>

        {/* Clear Data */}
        <div className="bg-[#111] rounded-3xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <Trash2 size={18} className="text-red-400" />
            <h2 className="text-white font-medium">{t('settings.clearData')}</h2>
          </div>
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium transition-colors"
            >
              {t('settings.clearData')}
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-[#888]">{t('settings.clearConfirm')}</p>
              <div className="flex gap-2">
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm font-medium transition-colors"
                >
                  {t('misc.delete')}
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-[#888] text-sm transition-colors"
                >
                  {t('misc.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
