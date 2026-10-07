# Tracenime

Identify anime from screenshots using trace.moe and track your finds with AniList metadata. A modern web app with a brutalist "Kinetic Orange" design aesthetic.

![Tracenime](https://img.shields.io/badge/version-1.0-FF4D00)
![React](https://img.shields.io/badge/React-18.2-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1-06B6D4)

## ✨ Features

### Core Functionality
- **Anime Identification**: Upload screenshots or paste URLs to identify anime scenes
- **Real-time Search**: Direct integration with trace.moe API
- **Smart Caching**: SHA-256 based result caching (30-day TTL, max 200 entries)
- **Quota Management**: Live tracking of remaining search attempts
- **Image Processing**: Client-side compression (640px max), thumbnail generation

### Tracking & Organization
- **Search History**: Last 50 searches with thumbnails and metadata
- **Watchlist**: Track anime with status, ratings, notes, and episode tracking
- **Favorites**: Save and organize favorite scenes
- **Statistics**: View search analytics, top anime, and genre breakdowns

### Data Management
- **Export/Import**: JSON backup and restore for all data
- **Local Storage**: All data stored in browser IndexedDB (Dexie)
- **Privacy First**: No server-side data storage, no accounts required

### User Experience
- **Bilingual**: English and Indonesian (Bahasa Indonesia)
- **Responsive**: Works on desktop, tablet, and mobile
- **Offline Support**: Core features work without internet
- **Brutalist Design**: High-contrast "Kinetic Orange" aesthetic

## 🎨 Design

The UI follows a **brutalist "Kinetic Orange"** design system:
- **Colors**: Electric Orange (#FF4D00), Deep Black (#000000), Pure White (#FFFFFF)
- **Typography**: Archivo Black (display), Space Mono (metadata), Inter (body)
- **Interactions**: Hover translations, scale transforms, marquee animations
- **Layout**: Floating pill navigation, skewed sections, service card patterns

## 🛠️ Tech Stack

- **Framework**: React 18.2 + TypeScript 5.7
- **Build Tool**: Vite 6.3
- **Styling**: Tailwind CSS 4.1
- **Routing**: React Router DOM 6.8
- **Database**: Dexie (IndexedDB wrapper)
- **Validation**: Zod
- **Icons**: Lucide React
- **Animations**: Framer Motion

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm/yarn/pnpm

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/neartana/Tracenime
cd tracenime
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:
```env
# Optional: trace.moe API key for higher quota
# Without this, uses shared anonymous quota
TRACE_MOE_API_KEY=your_api_key_here
```

Note: The app works without an API key using trace.moe's anonymous quota.

4. **Run development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The production build will be in the `dist/` directory.

## 🚀 Usage

### Identifying Anime

1. **Upload an image**: Drag & drop, click to browse, or paste (Ctrl+V)
2. **Or paste a URL**: Enter an image URL directly
3. **Optional settings**:
   - Trim black borders (improves accuracy)
   - Limit to specific AniList ID
4. **Click "SEARCH NOW"** to identify the anime

### Understanding Results

- **Similarity Badge**: Shows match confidence
  - 🟢 Green (≥90%): High confidence
  - 🟡 Yellow (80-89%): Medium confidence
  - 🔴 Red (<80%): Low confidence, may be inaccurate
- **Episode & Timestamp**: Exact location in the anime
- **Video Preview**: Hover over thumbnails to see the scene
- **Actions**: Save to watchlist, add to favorites, copy info

### Managing Your Library

- **History**: View and delete past searches
- **Watchlist**: Track anime you want to watch or are watching
- **Favorites**: Save memorable scenes
- **Statistics**: See your search patterns and top anime

### Data Backup

1. Go to **Settings**
2. Click **Export Data** to download a JSON backup
3. Use **Import Data** to restore from a backup file

## 🔒 Privacy & Security

### Data Storage
- **All data is stored locally** in your browser using IndexedDB
- **No server-side storage**: Images and search results never leave your device
- **No accounts required**: No personal information collected
- **No analytics**: No tracking or telemetry

### API Usage
- **trace.moe**: Images are sent to trace.moe for identification
- **AniList**: Metadata fetched from AniList GraphQL API
- **Quota limits**: Free tier has usage limits; API key increases quota

### Security Features
- Client-side image compression before upload
- SHA-256 hashing for cache keys
- No API keys in client bundle
- Environment variables for sensitive data

## 📁 Project Structure

```
tracenime/
├── src/
│   ├── App.tsx              # Main app component with routing
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles and design system
│   ├── lib/
│   │   ├── types.ts         # TypeScript type definitions
│   │   ├── db.ts            # Dexie database schema and queries
│   │   ├── trace.ts         # trace.moe API client
│   │   ├── anilist.ts       # AniList GraphQL client
│   │   ├── image.ts         # Image processing utilities
│   │   └── i18n.tsx         # Internationalization (EN/ID)
│   └── pages/
│       ├── Home.tsx         # Main search interface
│       ├── History.tsx      # Search history
│       ├── Watchlist.tsx    # Anime tracking
│       ├── Favorites.tsx    # Saved scenes
│       ├── Statistics.tsx   # Analytics
│       ├── Settings.tsx     # Configuration
│       └── About.tsx        # About page
├── public/                  # Static assets
├── index.html              # HTML template
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── tsconfig.json           # TypeScript configuration
└── .gitignore             # Git ignore rules
```

## 🌐 APIs Used

### trace.moe
- **Purpose**: Anime scene identification
- **Endpoint**: `https://api.trace.moe/search`
- **Limits**: Free tier has quota limits per IP
- **Docs**: https://soruly.github.io/trace.moe-api/

### AniList
- **Purpose**: Anime metadata (titles, covers, genres, streaming links)
- **Endpoint**: `https://graphql.anilist.co`
- **Limits**: ~90 requests/minute
- **Docs**: https://anilist.github.io/ApiV2-GraphQL-Docs/

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

This project is open source and available under the MIT License.

## 🙏 Credits

- **trace.moe**: Anime scene search engine by soruly
- **AniList**: Anime tracking and metadata platform
- **Design Inspiration**: Brutalist web design, Kinetic Orange aesthetic

## ⚠️ Disclaimer

Tracenime is not affiliated with trace.moe or AniList. This tool uses their public APIs to provide anime identification services.

## 🐛 Known Limitations

- **Adult content**: trace.moe does not filter adult titles; results may include NSFW content
- **Fan art**: trace.moe only matches real anime scenes, not fan art or illustrations
- **Quota limits**: Free tier has usage limits; consider getting an API key for heavy use
- **Browser storage**: Clearing browser data will delete all local data (export first!)

## 📞 Support

For issues or questions:
- Check the [trace.moe documentation](https://soruly.github.io/trace.moe-api/)
- Visit [AniList](https://anilist.co) for anime metadata
- Review the in-app About page for more information

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
