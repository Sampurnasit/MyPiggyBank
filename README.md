# RoundUp - Gamified Savings App for Gen Z 🐷

RoundUp is an innovative savings app designed for Gen Z in India that turns everyday spending into automatic savings through smart roundups, gamification, and personalized insights.

## Features

### Core Features (Phase 1) ✅
- **Smart Roundups**: Automatically round transactions up to the nearest 10, 100, or 1000
- **Piggy Bank Dashboard**: Visual representation of your savings
- **Manual Expense Logging**: Easy expense tracking with categories
- **Transaction History**: View all your expenses
- **Monthly Analytics**: Track spending patterns and savings

### Gamification (Phase 2) 🎮
- **Level System**: Progress from Seedling to Money Master
- **Badges & Achievements**: Earn badges for milestones
- **Weekly/Monthly Challenges**: Achieve savings goals
- **XP Points**: Gain points for every transaction
- **Spending Personality**: Discover your spending type (Lion, Bee, Fox, etc.)

### Intelligence Features (Phase 3) 🧠
- **Spending Heat Score**: Breakdown of where your money goes
- **Category Analytics**: Detailed spending insights
- **Personalized Roasts**: Fun, witty feedback on your spending habits
- **Risk Profiler**: Identify spending patterns and risks

### SMS Parsing (Phase 4) 📱
- **UPI Transaction Detection**: Auto-parse GPay/PhonePe/Paytm SMS
- **Bank Statement Integration**: Track bank transactions
- **Zero-Config Setup**: Just share SMS access

### Investment Features (Phase 5) 💰
- **Investment Options**: Digital Gold, Index Funds, FDs, SIPs, Bonds
- **SIP Calculator**: Plan monthly investments
- **"What If" Simulator**: See 1/3/5 year projections
- **Investment Cards**: Browse and compare options

## Tech Stack

- **Frontend**: Next.js 16 (React 19.2)
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Email/Password + Google OAuth)
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts
- **Animations**: Framer Motion

## Getting Started

### Prerequisites
- Node.js 18+
- npm/pnpm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo>
   cd roundup
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup Environment Variables**
   All required variables are automatically configured when Supabase is connected to your v0 project.

4. **Setup Database**
   Follow the detailed instructions in [SETUP_GUIDE.md](./SETUP_GUIDE.md)

   Quick summary:
   - Go to Supabase Dashboard > SQL Editor
   - Create a new query
   - Copy all SQL from `scripts/setup_roundup.sql`
   - Execute the script

5. **Run the development server**
   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
roundup/
├── app/
│   ├── auth/                    # Authentication pages
│   │   ├── login/
│   │   ├── signup/
│   │   ├── error/
│   │   └── signup-success/
│   ├── dashboard/               # Protected dashboard pages
│   │   ├── page.tsx            # Main dashboard
│   │   ├── transactions/        # Transaction pages
│   │   └── gamification/        # Gamification pages
│   ├── api/                     # API routes
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/
│   ├── dashboard-nav.tsx        # Navigation
│   ├── piggy-bank.tsx          # Piggy bank visualization
│   └── ui/                      # shadcn components
├── lib/
│   ├── supabase/               # Supabase clients
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── proxy.ts            # Proxy for session
│   ├── db/
│   │   └── queries.ts          # Database operations
│   ├── supabase-types.ts       # TypeScript types
│   └── utils.ts                # Utilities
├── scripts/
│   └── setup_roundup.sql       # Database schema
├── middleware.ts               # Next.js middleware
├── SETUP_GUIDE.md             # Setup instructions
└── README.md                   # This file
```

## Database Schema

### Tables
- `user_profiles`: User account and profile data
- `transactions`: All spending transactions
- `achievements_badges`: User badges and achievements
- `weekly_challenges`: Weekly saving challenges
- `monthly_challenges`: Monthly saving challenges
- `monthly_stats`: Monthly spending statistics
- `investment_options`: Available investment products
- `user_investment_preferences`: User's investment choices

All tables have Row Level Security (RLS) enabled for data privacy.

## Authentication Flow

1. User signs up at `/auth/signup`
2. User verifies email (optional but recommended)
3. User profile is created in database
4. User is redirected to `/dashboard`
5. Protected routes check authentication via middleware

## API Routes

- `POST /api/init-db` - Initialize database (for development)

## Deployment

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Vercel will automatically deploy
```

### Environment Variables

All environment variables are managed through:
- Vercel project settings
- Supabase integration (automatic)

Required env vars (auto-configured):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Development Tips

### Adding a New Feature

1. Create a new route in `app/dashboard/[feature]/`
2. Create components in `components/` as needed
3. Add database queries to `lib/db/queries.ts`
4. Update types in `lib/supabase-types.ts`

### Database Migrations

To update the schema:
1. Create a new SQL file in `scripts/`
2. Execute in Supabase SQL Editor
3. Update types if needed

### Working with Supabase

All database operations use the Supabase client:

```typescript
import { createClient } from '@/lib/supabase/client' // Browser
import { createClient } from '@/lib/supabase/server' // Server
```

### Debugging

Enable debug logs:
```typescript
console.log('[v0] Your debug message here')
```

These will appear in browser console and server logs.

## Features Roadmap

- [x] Phase 1: Core Dashboard & Expenses
- [x] Phase 2: Authentication
- [ ] Phase 3: Gamification System
- [ ] Phase 4: Savings Charts
- [ ] Phase 5: Intelligence Features
- [ ] Phase 6: SMS Parser
- [ ] Phase 7: Investments

## Contributing

This project is built with v0 and uses modern Next.js practices. When adding features:

1. Follow the existing code structure
2. Use shadcn/ui components
3. Implement RLS for new database tables
4. Add TypeScript types
5. Test on mobile devices

## Troubleshooting

### Database Issues
- Check SETUP_GUIDE.md for SQL setup
- Verify Supabase connection in v0 settings
- Check environment variables in Vercel

### Authentication Issues
- Clear browser cookies
- Check Supabase Auth providers
- Verify email confirmation settings

### UI Issues
- Check browser console for errors
- Verify Tailwind CSS is loading
- Clear Next.js cache: `rm -rf .next`

## License

MIT

## Support

For issues or questions:
1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md)
2. Review the code comments
3. Check Supabase documentation

---

**Made with ❤️ for Gen Z savers in India**
