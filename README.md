# ReachInbox Email Scheduler

48-hour assignment implementation workspace.

## Stack

- Backend: TypeScript + Express
- Queue: BullMQ + Redis
- Database: PostgreSQL + Prisma
- SMTP: Ethereal
- Search: Elasticsearch
- Queue UI: Bull Board
- Auth: Google OAuth 2.0
- Slack: OAuth + incoming webhook notifications
- Frontend: React + Vite + TypeScript + Tailwind

## Repository layout

```text
reachinbox-assignment/
├── backend/
│   ├── prisma/
│   └── src/
│       ├── config/
│       ├── db/
│       ├── middleware/
│       ├── queues/
│       ├── routes/
│       ├── services/
│       ├── types/
│       └── utils/
├── frontend/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       └── types/
└── docker-compose.yml
```

The implementation is intentionally scoped to the assignment requirements. No cron-based scheduler is used.
