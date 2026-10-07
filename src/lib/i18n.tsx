import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Language = 'en' | 'id';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.history': 'History',
    'nav.watchlist': 'Watchlist',
    'nav.favorites': 'Favorites',
    'nav.statistics': 'Statistics',
    'nav.settings': 'Settings',
    'nav.about': 'About',
    'nav.startSearching': 'Start searching',
    // Hero
    'hero.title': '/tracenime',
    'hero.subtitle': 'Identify anime from any screenshot',
    'hero.dropzone': 'Drop an image here, click to browse, or paste (Ctrl+V)',
    'hero.or': 'or paste an image URL',
    'hero.urlPlaceholder': 'https://example.com/image.jpg',
    'hero.recentSearches': 'Recent searches',
    // Options
    'options.cutBorders': 'Trim black borders',
    'options.anilistId': 'Limit to AniList ID',
    'options.search': 'Search',
    'options.searching': 'Searching...',
    'options.changeImage': 'Change image',
    // Results
    'results.similarity': 'Similarity',
    'results.episode': 'Episode',
    'results.time': 'Time',
    'results.openAnilist': 'Open on AniList',
    'results.favorite': 'Add to favorites',
    'results.unfavorite': 'Remove from favorites',
    'results.saveWatchlist': 'Save to watchlist',
    'results.fromCache': 'from cache',
    'results.searchAgain': 'Search again',
    // Low confidence
    'lowConfidence.title': 'Low confidence result',
    'lowConfidence.message': 'The result may be inaccurate. Try removing subtitles/watermarks, using a clearer frame, or avoiding heavy edits.',
    'lowConfidence.note': 'trace.moe matches only real anime scenes, not fan art or illustrations.',
    // Quota
    'quota.remaining': '{count} searches left',
    'quota.tooltip': '{used} of {total} used',
    // History
    'history.title': 'History',
    'history.empty': 'No searches yet. Upload a screenshot to get started.',
    'history.deleteAll': 'Clear all',
    'history.confirmDelete': 'Are you sure you want to clear all history?',
    // Favorites
    'favorites.title': 'Favorites',
    'favorites.empty': 'No favorites yet. Save scenes you love.',
    // Watchlist
    'watchlist.title': 'Watchlist',
    'watchlist.empty': 'Your watchlist is empty.',
    'watchlist.planned': 'Plan to Watch',
    'watchlist.watching': 'Watching',
    'watchlist.completed': 'Completed',
    'watchlist.dropped': 'Dropped',
    'watchlist.filterAll': 'All',
    'watchlist.notes': 'Notes',
    'watchlist.rating': 'Rating',
    'watchlist.lastEpisode': 'Last episode',
    'watchlist.foundAt': 'Found at ep. {episode}, {time}',
    // Settings
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.defaultCutBorders': 'Trim borders by default',
    'settings.clearData': 'Clear all data',
    'settings.clearConfirm': 'This will delete all history, favorites, watchlist, and caches. Continue?',
    'settings.export': 'Export data',
    'settings.import': 'Import data',
    'settings.importSuccess': 'Imported: {added} new, {updated} updated, {skipped} skipped',
    // About
    'about.title': 'About',
    'about.description': 'Tracenime identifies anime from screenshots using trace.moe and enriches results with AniList metadata.',
    'about.credits': 'Powered by trace.moe & AniList',
    'about.notAffiliated': 'Not affiliated with trace.moe or AniList.',
    'about.privacy': 'All your data is stored locally in your browser. Uploaded images are never stored on any server.',
    // Errors
    'error.offline': 'You appear to be offline. Search requires a connection.',
    'error.generic': 'Something went wrong. Please try again.',
    'error.quotaExhausted': 'Search quota exhausted. Try again later.',
    'error.rateLimited': 'Too many requests. Please wait {seconds} seconds.',
    'error.timeout': 'Request timed out. Please try again.',
    // Statistics
    'stats.title': 'Statistics',
    'stats.totalSearches': 'Total searches',
    'stats.topAnime': 'Most searched anime',
    'stats.topGenres': 'Top genres',
    'stats.empty': 'No statistics yet. Start searching!',
    // Misc
    'misc.loading': 'Loading...',
    'misc.retry': 'Retry',
    'misc.cancel': 'Cancel',
    'misc.save': 'Save',
    'misc.delete': 'Delete',
    'misc.copy': 'Copy',
    'misc.copied': 'Copied!',
    'misc.noStreaming': 'No official streaming links found.',
    'misc.whereToWatch': 'Where to watch',
    'misc.animeInfo': 'Anime info',
    'misc.genres': 'Genres',
    'misc.episodes': 'Episodes',
    'misc.status': 'Status',
    'misc.season': 'Season',
    'misc.nextEpisode': 'Next episode',
  },
  id: {
    'nav.home': 'Beranda',
    'nav.history': 'Riwayat',
    'nav.watchlist': 'Daftar Tonton',
    'nav.favorites': 'Favorit',
    'nav.statistics': 'Statistik',
    'nav.settings': 'Pengaturan',
    'nav.about': 'Tentang',
    'nav.startSearching': 'Mulai mencari',
    'hero.title': '/tracenime',
    'hero.subtitle': 'Identifikasi anime dari screenshot',
    'hero.dropzone': 'Letakkan gambar di sini, klik untuk memilih, atau tempel (Ctrl+V)',
    'hero.or': 'atau tempel URL gambar',
    'hero.urlPlaceholder': 'https://contoh.com/gambar.jpg',
    'hero.recentSearches': 'Pencarian terakhir',
    'options.cutBorders': 'Potong batas hitam',
    'options.anilistId': 'Batasi ke ID AniList',
    'options.search': 'Cari',
    'options.searching': 'Mencari...',
    'options.changeImage': 'Ganti gambar',
    'results.similarity': 'Kemiripan',
    'results.episode': 'Episode',
    'results.time': 'Waktu',
    'results.openAnilist': 'Buka di AniList',
    'results.favorite': 'Tambah ke favorit',
    'results.unfavorite': 'Hapus dari favorit',
    'results.saveWatchlist': 'Simpan ke daftar tonton',
    'results.fromCache': 'dari cache',
    'results.searchAgain': 'Cari lagi',
    'lowConfidence.title': 'Hasil kepercayaan rendah',
    'lowConfidence.message': 'Hasil mungkin tidak akurat. Coba hapus subtitle/watermark, gunakan frame yang lebih jelas.',
    'lowConfidence.note': 'trace.moe hanya mencocokkan adegan anime asli, bukan fan art.',
    'quota.remaining': '{count} pencarian tersisa',
    'quota.tooltip': '{used} dari {total} terpakai',
    'history.title': 'Riwayat',
    'history.empty': 'Belum ada pencarian. Unggah screenshot untuk memulai.',
    'history.deleteAll': 'Hapus semua',
    'history.confirmDelete': 'Yakin ingin menghapus semua riwayat?',
    'favorites.title': 'Favorit',
    'favorites.empty': 'Belum ada favorit. Simpan scene yang kamu suka.',
    'watchlist.title': 'Daftar Tonton',
    'watchlist.empty': 'Daftar tonton kosong.',
    'watchlist.planned': 'Rencana Tonton',
    'watchlist.watching': 'Sedang Ditonton',
    'watchlist.completed': 'Selesai',
    'watchlist.dropped': 'Dihentikan',
    'watchlist.filterAll': 'Semua',
    'watchlist.notes': 'Catatan',
    'watchlist.rating': 'Nilai',
    'watchlist.lastEpisode': 'Episode terakhir',
    'watchlist.foundAt': 'Ditemukan di ep. {episode}, {time}',
    'settings.title': 'Pengaturan',
    'settings.language': 'Bahasa',
    'settings.defaultCutBorders': 'Potong batas secara default',
    'settings.clearData': 'Hapus semua data',
    'settings.clearConfirm': 'Ini akan menghapus semua riwayat, favorit, daftar tonton, dan cache. Lanjutkan?',
    'settings.export': 'Ekspor data',
    'settings.import': 'Impor data',
    'settings.importSuccess': 'Diimpor: {added} baru, {updated} diperbarui, {skipped} dilewati',
    'about.title': 'Tentang',
    'about.description': 'Tracenime mengidentifikasi anime dari screenshot menggunakan trace.moe dan memperkaya hasil dengan metadata AniList.',
    'about.credits': 'Didukung oleh trace.moe & AniList',
    'about.notAffiliated': 'Tidak berafiliasi dengan trace.moe atau AniList.',
    'about.privacy': 'Semua data disimpan secara lokal di browser Anda. Gambar yang diunggah tidak pernah disimpan di server mana pun.',
    'error.offline': 'Anda tampaknya offline. Pencarian memerlukan koneksi.',
    'error.generic': 'Terjadi kesalahan. Silakan coba lagi.',
    'error.quotaExhausted': 'Kuota pencarian habis. Coba lagi nanti.',
    'error.rateLimited': 'Terlalu banyak permintaan. Harap tunggu {seconds} detik.',
    'error.timeout': 'Permintaan habis waktu. Silakan coba lagi.',
    'stats.title': 'Statistik',
    'stats.totalSearches': 'Total pencarian',
    'stats.topAnime': 'Anime paling dicari',
    'stats.topGenres': 'Genre teratas',
    'stats.empty': 'Belum ada statistik. Mulai mencari!',
    'misc.loading': 'Memuat...',
    'misc.retry': 'Coba lagi',
    'misc.cancel': 'Batal',
    'misc.save': 'Simpan',
    'misc.delete': 'Hapus',
    'misc.copy': 'Salin',
    'misc.copied': 'Tersalin!',
    'misc.noStreaming': 'Tidak ada link streaming resmi ditemukan.',
    'misc.whereToWatch': 'Tempat menonton',
    'misc.animeInfo': 'Info anime',
    'misc.genres': 'Genre',
    'misc.episodes': 'Episode',
    'misc.status': 'Status',
    'misc.season': 'Musim',
    'misc.nextEpisode': 'Episode berikutnya',
  },
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('tracenime-language');
    return (saved === 'id' ? 'id' : 'en') as Language;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('tracenime-language', lang);
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    let text = translations[language][key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
