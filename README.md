# ERP Prismodul

A comprehensive pricing management system built with Next.js, Prisma, and PostgreSQL.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Lucide React icons

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes (backend)
│   │   ├── products/        # Products API
│   │   ├── contracts/       # Contracts API
│   │   ├── campaigns/       # Campaigns API
│   │   ├── customer-price-groups/  # Customer price groups API
│   │   └── pricing-rules/   # Pricing rules API
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # Reusable UI components
│   ├── DataTable.tsx
│   └── PanelLayout.tsx
├── views/                   # View components
│   ├── ProductsView.tsx
│   ├── ContractsView.tsx
│   ├── CustomerPriceGroupsView.tsx
│   ├── CampaignsView.tsx
│   └── ContextualPriceView.tsx
├── services/                # API client services
│   └── api.ts
└── lib/                     # Utilities
    └── prisma.ts            # Prisma client instance
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database running
- Database credentials configured in `.env`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run database migrations:
```bash
npx prisma migrate dev
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## Database Schema

The application manages the following entities:

- **Departments**: Product categorization at the highest level
- **Product Groups**: Sub-categorization within departments
- **Products**: Individual products with pricing and sync status
- **Suppliers**: Supplier information
- **Product Suppliers**: Relationship between products and suppliers with pricing
- **Contracts**: Customer contracts
- **Customer Price Groups**: Price groups for customer segments
- **Campaigns**: Marketing campaigns
- **Pricing Rules**: Context-based pricing rules (percentage, fixed, threshold-based)

## API Endpoints

### Products
- `GET /api/products` - Get all products with related data

### Contracts
- `GET /api/contracts` - Get all contracts
- `PATCH /api/contracts` - Update a contract

### Customer Price Groups
- `GET /api/customer-price-groups` - Get all customer price groups
- `PATCH /api/customer-price-groups` - Update a customer price group

### Campaigns
- `GET /api/campaigns` - Get all campaigns
- `PATCH /api/campaigns` - Update a campaign

### Pricing Rules
- `GET /api/pricing-rules?context_type=...&context_id=...` - Get pricing rules by context
- `POST /api/pricing-rules` - Create a new pricing rule
- `PATCH /api/pricing-rules` - Update a pricing rule

## Features

- Product catalog management
- Contract management
- Customer price group management
- Campaign management
- Contextual pricing with discount rules
- Real-time data updates
- Responsive design with TailwindCSS

## Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

Private - All Rights Reserved
