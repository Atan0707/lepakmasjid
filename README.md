# LepakMasjid.app

A community-maintained, searchable directory of mosques in Malaysia focused on facilities, activities, and events. Optimized for mobile and elderly users.

## Features

- 🕌 **Mosque Directory**: Searchable directory with GPS coordinates and detailed information
- 🔍 **Advanced Search**: Search by name, location, state, and amenities
- 🗺️ **Interactive Map**: Map view with marker clustering using Leaflet.js
- 📱 **Mobile-First**: Responsive design optimized for mobile devices
- ♿ **Accessibility**: Large fonts, high contrast, adjustable font size
- 🌐 **Bilingual**: Bahasa Melayu and English support
- 🌙 **Dark Mode**: Toggle between light and dark themes
- 👥 **Community-Driven**: Users can submit and suggest edits to mosque information
- 🔐 **Admin Panel**: Moderation workflow for submissions and edits

## Tech Stack

- **Frontend**: Vite + React (TypeScript)
- **UI Components**: shadcn-ui + Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Maps**: Leaflet.js + OpenStreetMap
- **Backend**: PocketBase (deployed at pb.muazhazali.me)
- **SSR**: vite-plugin-ssr

## Prerequisites

- Node.js 18+ 
- pnpm 8+ ([Install pnpm](https://pnpm.io/installation))

## Local Development Setup

### 1. Clone the repository

```powershell
git clone <YOUR_GIT_URL>
cd lepakmasjid_v2
```

### 2. Install dependencies

```powershell
pnpm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```env
VITE_POCKETBASE_URL=https://pb.muazhazali.me
VITE_APP_URL=http://localhost:8080
```

The app connects to PocketBase at `pb.muazhazali.me` by default. You can override this with the `VITE_POCKETBASE_URL` environment variable.

### 4. Start the development server

```powershell
pnpm dev
```

The app will be available at `http://localhost:8080`

### 5. Build for production

```powershell
pnpm build
```

### 6. Preview production build

```powershell
pnpm preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn-ui components
│   ├── Auth/          # Authentication components
│   ├── Admin/         # Admin panel components
│   ├── Map/           # Map-related components
│   └── Submission/    # Submission form components
├── lib/               # Utilities and services
│   ├── api/          # API service functions
│   ├── pocketbase.ts # PocketBase client
│   └── utils/        # Helper functions
├── pages/             # Page components
│   ├── Admin/        # Admin panel pages
│   └── ...
├── stores/            # Zustand stores
│   ├── auth.ts       # Authentication state
│   ├── language.ts   # Language state
│   └── fontSize.ts   # Font size state
├── types/             # TypeScript type definitions
└── hooks/             # Custom React hooks
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_POCKETBASE_URL` | PocketBase instance URL | `https://pb.muazhazali.me` |
| `VITE_APP_URL` | Application URL (for OAuth redirects) | `http://localhost:8080` |

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint
- `pnpm test:connection` - Test connection to PocketBase
- `pnpm setup:collections` - Create all required PocketBase collections
- `pnpm test:schema` - Verify PocketBase collections match PRD schema
- `pnpm test:submission` - Test submission workflow end-to-end
- `pnpm seed:data` - Seed database with sample mosque data (10 mosques)

## PocketBase Setup

The application connects to a deployed PocketBase instance at `pb.muazhazali.me`.

### Quick Setup

1. **Test Connection**: Verify you can connect to PocketBase
   ```powershell
   pnpm run test:connection
   ```

2. **Create Collections**: Set up all required collections in PocketBase
   ```powershell
   pnpm run setup:collections
   ```
   This will prompt for your PocketBase admin credentials and create all collections automatically.

3. **Verify Schema**: Check that collections match the PRD schema
   ```powershell
   pnpm run test:schema
   ```

4. **Configure Google OAuth**: Follow the guide in `docs/GOOGLE_OAUTH_SETUP.md`

5. **Test Submission Workflow**: Test the end-to-end submission process
   ```powershell
   pnpm run test:submission
   ```

6. **Seed Sample Data**: Populate the database with sample mosque data
   ```powershell
   pnpm run seed:data
   ```
   This will create 10 sample mosques from different Malaysian states with amenities and descriptions.

For detailed setup instructions, see:
- [Connecting to Remote PocketBase](./docs/CONNECT_REMOTE_POCKETBASE.md) - How to connect your local app to a remote PocketBase instance
- [PocketBase Setup Guide](./docs/POCKETBASE_SETUP.md) - Detailed PocketBase configuration
- [Cloudflare Deployment Guide](./docs/CLOUDFLARE_DEPLOYMENT.md) - Step-by-step guide to deploy to Cloudflare Pages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

AGPL v3 - See LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
