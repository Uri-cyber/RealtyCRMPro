# RealtyCRM Pro

An AI-powered CRM platform designed specifically for real estate sellers and listing agents to manage properties, leads, pipeline, and communications.

## Features

- **Property Management**: Add, edit, and manage listings with MLS integration
- **Lead Pipeline**: Track buyer leads with AI-powered scoring and Kanban board
- **Showing Calendar**: Schedule and manage property showings
- **Communication Hub**: Email and SMS messaging with templates
- **Analytics Dashboard**: Track conversion rates, lead sources, and performance
- **Team Collaboration**: Assign leads and manage team performance

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Azure SQL Database
- **Storage**: Azure Blob Storage
- **Authentication**: JWT with bcrypt
- **Email**: SendGrid
- **SMS**: Twilio

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Azure SQL Database instance

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd RealtyCRMPro
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Generate Prisma client:
```bash
npm run db:generate
```

5. Push database schema:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/
│   ├── (dashboard)/       # Dashboard pages
│   │   ├── dashboard/
│   │   ├── properties/
│   │   ├── leads/
│   │   ├── calendar/
│   │   ├── messages/
│   │   └── reports/
│   └── api/               # API routes
│       ├── auth/
│       ├── properties/
│       ├── leads/
│       ├── showings/
│       └── analytics/
├── components/
│   ├── ui/               # Reusable UI components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── utils.ts
│   ├── db.ts
│   └── auth.ts
└── prisma/
    └── schema.prisma     # Database schema
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Properties
- `GET /api/properties` - List properties
- `POST /api/properties` - Create property

### Leads
- `GET /api/leads` - List leads
- `POST /api/leads` - Create lead
- `PATCH /api/leads` - Bulk update leads

### Showings
- `GET /api/showings` - List showings
- `POST /api/showings` - Create showing

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics

## Environment Variables

See `.env.example` for all required environment variables.

## Deployment

### Azure App Service

1. Create Azure resources:
```bash
az group create --name realty-crm-rg --location eastus
az appservice plan create --name realty-crm-plan --resource-group realty-crm-rg --sku B2
az webapp create --name realty-crm-app --resource-group realty-crm-rg --plan realty-crm-plan
```

2. Configure environment variables in Azure Portal

3. Deploy via GitHub Actions or Azure DevOps

## License

MIT
