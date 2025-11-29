# Vibe - AI-Powered Issue Tracking

A modern, lightweight issue tracking application built for the Litmers Vibe Coding Contest 2025.

![Next.js](https://img.shields.io/badge/Next.js-16.0.5-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-7.0-2D3748)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC)

---

## ✨ Features

### Authentication

- Email/password sign up and sign in
- Google OAuth integration
- Password reset via email
- Secure session management with Better Auth

### Team Management

- Create and manage teams
- Invite members via email
- Role-based access (Owner, Admin, Member)
- Team activity logging

### Project Management

- Create projects within teams
- Custom status workflows
- WIP limits for Kanban columns
- Project-level labels
- Archive/restore projects

### Issue Tracking

- Create, edit, and delete issues
- Drag-and-drop Kanban board
- Priority levels (Low, Medium, High, Urgent)
- Due date tracking with notifications
- Subtasks support
- Comments with mentions
- Issue labels

### AI Features

- AI-powered issue summarization
- Smart suggestions for issue resolution
- Auto-classification of issues
- Duplicate issue detection

### Dashboard & Analytics

- Personal dashboard with task overview
- Project dashboards with charts
- Status distribution pie chart
- Completion progress ring
- Recent activity feed

### Notifications

- In-app notification center
- Email notifications for:
  - Issue assignments
  - Due date reminders
  - Team invitations
  - Comments on your issues

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database (we use Neon)
- Google OAuth credentials (optional)
- SMTP server for emails (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd vibe
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://..."

   # Better Auth
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"

   # Google OAuth (optional)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Email (optional)
   SMTP_HOST="smtp.example.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@example.com"
   SMTP_PASS="your-password"
   EMAIL_FROM="noreply@yourapp.com"
   ```

4. **Set up the database**

   ```bash
   npm run db:migrate
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage Guide

### Getting Started

1. **Sign Up** - Create an account with your email or use Google OAuth
2. **Create a Team** - Teams are the top-level organization unit
3. **Invite Members** - Add teammates via email invitation
4. **Create a Project** - Projects belong to teams and contain issues
5. **Add Issues** - Track work with issues, assign them, set priorities

### Navigating the App

| Route                        | Description                          |
| ---------------------------- | ------------------------------------ |
| `/dashboard`                 | Personal overview with your tasks    |
| `/teams`                     | List and manage your teams           |
| `/teams/[id]`                | Team details, members, and stats     |
| `/projects`                  | All projects across your teams       |
| `/projects/[id]`             | Project dashboard, issues, and board |
| `/projects/[id]/issues/[id]` | Issue detail view                    |
| `/notifications`             | Your notification center             |
| `/profile`                   | Account settings                     |

### Issue Workflow

1. **Backlog** → New issues start here
2. **To Do** → Ready to be worked on
3. **In Progress** → Currently being worked on
4. **In Review** → Awaiting review
5. **Done** → Completed
6. **Cancelled** → No longer needed

### AI Features

- Click the **✨ AI Summary** button on any issue to generate a concise summary
- Use **🤖 Suggest** to get AI-powered recommendations
- The system automatically detects potential duplicate issues

---

## 🛠 Tech Stack

| Category    | Technology              |
| ----------- | ----------------------- |
| Framework   | Next.js 16 (App Router) |
| Language    | TypeScript              |
| Database    | PostgreSQL + Prisma ORM |
| Auth        | Better Auth             |
| Styling     | Tailwind CSS 4          |
| Charts      | Recharts                |
| Drag & Drop | @hello-pangea/dnd       |
| Icons       | Lucide React            |
| Animations  | Motion                  |

---

## 📁 Project Structure

```
vibe/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── src/
│   ├── app/
│   │   ├── (auth)/        # Auth pages (signin, signup, etc.)
│   │   ├── (root)/        # Main app pages
│   │   └── api/           # API routes
│   ├── components/
│   │   ├── auth/          # Auth forms
│   │   ├── charts/        # Dashboard charts
│   │   ├── issue/         # Issue components
│   │   ├── layout/        # Header, Sidebar, etc.
│   │   ├── profile/       # Profile settings
│   │   ├── project/       # Project components
│   │   ├── team/          # Team components
│   │   └── ui/            # Reusable UI components
│   ├── lib/
│   │   ├── actions/       # Server actions
│   │   ├── auth.ts        # Auth configuration
│   │   └── prisma.ts      # Prisma client
│   └── generated/         # Generated Prisma types
└── public/                # Static assets
```

---

## 🧪 Available Scripts

```bash
# Development
npm run dev          # Start dev server with Turbopack

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Prisma Studio

# Linting
npm run lint         # Run ESLint
```

---

## 🌐 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables
4. Deploy!

### Environment Variables for Production

Make sure to set:

- `DATABASE_URL` - Your production database URL
- `BETTER_AUTH_SECRET` - A strong secret key
- `BETTER_AUTH_URL` - Your production URL
- Google OAuth and SMTP credentials as needed

---

## 👤 Author

**Hung Nguyen**  
📧 [nmhp1903@gmail.com](mailto:nmhp1903@gmail.com)

---

## 📝 License

This project was created for the Litmers Vibe Coding Contest 2025.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database by [Neon](https://neon.tech/)
- Auth by [Better Auth](https://better-auth.com/)
- Icons by [Lucide](https://lucide.dev/)
