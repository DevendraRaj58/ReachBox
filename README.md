# ReachBox

ReachBox is a full stack email scheduling and delivery platform built for reliable background email processing.

It allows a user to sign in with Google, compose and schedule emails, upload recipient lists, configure sending delay and hourly limits, monitor BullMQ jobs, search emails through Elasticsearch, connect Slack notifications and view scheduled and sent emails from a web dashboard.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- Tailwind CSS
- Lucide React

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma
- PostgreSQL
- Redis
- BullMQ
- Elasticsearch
- Nodemailer

### Integrations
- Google OAuth
- Slack OAuth
- Ethereal Email
- Bull Board

### Infrastructure
- Docker Compose

## Project Structure

```text
ReachBox/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   └── src/
│       ├── config/
│       ├── db/
│       ├── middleware/
│       ├── queues/
│       ├── routes/
│       ├── scripts/
│       ├── services/
│       ├── app.ts
│       └── server.ts
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── hooks/
│       ├── lib/
│       ├── pages/
│       ├── types/
│       ├── App.tsx
│       └── main.tsx
├── docker-compose.yml
├── .gitignore
└── README.md
```

# Getting Started

## Prerequisites

Install:

- Node.js and npm
- Docker Desktop
- Git

The application needs PostgreSQL, Redis and Elasticsearch. Docker Compose starts all three services locally.

## 1. Start PostgreSQL, Redis and Elasticsearch

From the project root:

```bash
docker compose up -d
```

Check their status:

```bash
docker compose ps
```

Default local ports:

```text
PostgreSQL     5432
Redis          6379
Elasticsearch  9200
```

## 2. Configure the backend

Open a terminal in `backend/`.

Install dependencies:

```bash
npm install
```

Create:

```text
backend/.env
```

Use `backend/.env.example` as the template.

Generate Prisma client:

```bash
npx prisma generate
```

Apply database migrations:

```bash
npx prisma migrate dev
```

Start the Express API:

```bash
npm run dev
```

The API runs at:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/health
```

## 3. Start the BullMQ worker

Open a second terminal in `backend/`:

```bash
npm run worker
```

The worker connects to Redis and processes delayed email jobs.

For local development, keep the API and worker running separately:

```text
Terminal 1    backend    npm run dev
Terminal 2    backend    npm run worker
```

## 4. Run the frontend

Open a third terminal in `frontend/`:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

# Environment Configuration

The environment template is stored in:

```text
backend/.env.example
```

Create the real configuration in:

```text
backend/.env
```

Important variables:

```env
NODE_ENV=development
PORT=4000
FRONTEND_URL=http://localhost:5173

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public

REDIS_URL=redis://localhost:6379

ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_INDEX=emails

JWT_SECRET=
COOKIE_SECRET=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

ETHEREAL_SENDERS_JSON=

WORKER_CONCURRENCY=5
MIN_DELAY_MS=2000
MAX_EMAILS_PER_HOUR_PER_SENDER=200
MAX_RETRIES=2

BULL_BOARD_USER=admin
BULL_BOARD_PASSWORD=

SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:4000/api/slack/callback
```

The real `.env` file is intentionally excluded from version control.

# Ethereal Email Setup

ReachBox uses Ethereal Email as the SMTP provider for development and testing.

Ethereal provides test SMTP accounts and browser based message previews, so the project can demonstrate sending without sending test emails to real external inboxes.

## Create an Ethereal test account

From `backend/`:

```bash
npx tsx src/scripts/create-ethereal-account.ts
```

The script creates a test account and provides SMTP credentials.

Add the credentials to `ETHEREAL_SENDERS_JSON`.

The project supports multiple senders. The configuration contains a sender id, display name, address and SMTP credentials.

Example structure:

```env
ETHEREAL_SENDERS_JSON=[{"id":"sender-1","name":"Sender One","address":"sender1@example.test","user":"YOUR_ETHEREAL_USER","pass":"YOUR_ETHEREAL_PASSWORD"},{"id":"sender-2","name":"Sender Two","address":"sender2@example.test","user":"YOUR_ETHEREAL_USER","pass":"YOUR_ETHEREAL_PASSWORD"}]
```

After a successful send, the worker logs an Ethereal preview URL that can be opened in a browser to inspect the generated email.

# Google OAuth Setup

Google OAuth is used for login.

Configure a Google OAuth client with this redirect URI:

```text
http://localhost:4000/api/auth/google/callback
```

Set:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
```

Authentication flow:

```text
ReachBox Login
      |
      v
Google OAuth
      |
      v
Backend callback
      |
      v
Create or update user in PostgreSQL
      |
      v
Authenticated session
      |
      v
Dashboard
```

# Slack Setup

Slack is optional for basic email scheduling, but is used for hourly rate limit notifications.

Configure the Slack redirect URI:

```text
http://localhost:4000/api/slack/callback
```

Set:

```env
SLACK_CLIENT_ID=
SLACK_CLIENT_SECRET=
SLACK_REDIRECT_URI=http://localhost:4000/api/slack/callback
```

The dashboard supports connecting and disconnecting Slack through OAuth.

When an hourly sender limit is reached, the worker can send a Slack notification. If Slack is not connected, email processing continues normally.

# Architecture Overview

The main system flow is:

```text
                         React Frontend
                               |
                               v
                         Express API
                    _________/ | \_________
                   /           |           \
                  v            v            v
            PostgreSQL       Redis      Elasticsearch
                              |
                              v
                           BullMQ
                              |
                              v
                        Email Worker
                              |
                              v
                        Ethereal SMTP
```

### PostgreSQL

PostgreSQL is the persistent source of truth for users, batches, email records, statuses and Slack connections.

### Redis

Redis stores BullMQ jobs and shared rate limiting state.

### BullMQ

BullMQ handles delayed background email jobs.

### Worker

The worker consumes jobs, applies sending constraints, sends the message through SMTP and persists the result.

### Elasticsearch

Elasticsearch stores indexed email documents used by the dashboard search.

# How Scheduling Works

ReachBox uses BullMQ delayed jobs. It does not use cron jobs.

When the user schedules a campaign:

```text
User
 |
 v
React Compose
 |
 v
Express API
 |
 +--> Validate request
 |
 +--> Create ScheduleBatch in PostgreSQL
 |
 +--> Create one Email record per recipient
 |
 +--> Create BullMQ delayed jobs
 |
 v
Redis
 |
 v
BullMQ
 |
 v
Email Worker
 |
 +--> Check rate limit
 |
 +--> Apply effective delay
 |
 +--> Send via Ethereal SMTP
 |
 +--> Update PostgreSQL
 |
 +--> Index email in Elasticsearch
 |
 v
Dashboard
```

Each recipient is represented by its own email record and queue job.

The scheduled time and campaign delay determine when each job becomes available to the worker.

# Delay Between Emails

The application supports a minimum and campaign level delay between individual email sends.

The minimum system delay is configured with:

```env
MIN_DELAY_MS=2000
```

For example:

```text
Email 1
   |
   | delay
   v
Email 2
   |
   | delay
   v
Email 3
```

This is used to control outbound sending pace instead of attempting to send a whole campaign at once.

# Rate Limiting

ReachBox implements a sender based hourly email limit.

The application level maximum is:

```env
MAX_EMAILS_PER_HOUR_PER_SENDER=200
```

The current rate limiting state is stored in Redis.

The worker performs an atomic Redis backed check before sending.

When the limit is available:

```text
Worker
  |
  v
Rate limit check
  |
  v
Allowed
  |
  v
Send email
```

When the sender has reached its limit:

```text
Worker
  |
  v
Rate limit check
  |
  v
Limit reached
  |
  v
Calculate next allowed time
  |
  v
Move job to delayed state
  |
  v
Process later
```

The job is rescheduled rather than dropped.

The implementation is sender based, so separate configured senders maintain separate rate limit state.

Because BullMQ jobs can be processed concurrently and rate limited jobs may be rescheduled, strict global ordering is treated as best effort rather than a hard delivery guarantee.

# Worker Concurrency

Worker concurrency is controlled through:

```env
WORKER_CONCURRENCY=5
```

BullMQ can process multiple independent jobs concurrently:

```text
                 BullMQ
            /       |       \
           v        v        v
        Job 1     Job 2     Job 3
           \        |        /
            \       |       /
              Email Worker
```

Concurrency affects how many jobs can be processed at the same time.

It does not override sender rate limits or the configured send delay.

Actual outbound throughput is therefore constrained by:

- worker concurrency
- sender hourly limit
- email delay
- SMTP processing time

# Handling Large Campaigns

Recipients are stored individually and each recipient receives an individual queue job.

For a campaign containing 1000 recipients:

```text
1000 recipients
      |
      v
1000 email records
      |
      v
1000 BullMQ jobs
```

The queue absorbs this workload while concurrency, delay and sender rate limits control processing.

If a sender reaches its hourly limit, remaining jobs are delayed instead of discarded.

The assignment does not require delivering thousands of messages through Ethereal during the demonstration, so the load behavior is demonstrated through queueing and rate limit handling rather than large scale external SMTP delivery.

# Persistence and Restart Handling

Future schedules are persisted in PostgreSQL, while BullMQ delayed jobs are stored in Redis.

The API process does not need to keep future schedules only in memory.

When the backend starts, the queue reconciliation service checks emails that are still in the `SCHEDULED` state. For each scheduled email, it checks whether the corresponding BullMQ job already exists using its deterministic job ID.

If the BullMQ job is missing, the reconciliation service recreates the delayed job using the original scheduled time. If the job already exists, it is left unchanged to avoid creating duplicate jobs.

Restart flow:

```text
Schedule future email
        |
        v
Persist in PostgreSQL
        |
        v
Create BullMQ delayed job
        |
        v
Backend restarts
        |
        v
Queue reconciliation
        |
        v
Check whether BullMQ job exists
        |
        +---- Exists ----> Leave job unchanged
        |
        +---- Missing ---> Recreate delayed job
                                |
                                v
                         Worker processes email
                                |
                                v
                           Email sent

# Idempotency

Each email uses a deterministic BullMQ job id based on the batch and recipient position.

The database also stores the job id.

Before sending, the worker checks the persisted email status.

If an email is already marked as `SENT`, it is skipped instead of being sent again.

This reduces duplicate processing during normal retries or queue recovery.

There is still a small failure window between SMTP acceptance and recording the final `SENT` state in PostgreSQL, so the system does not claim mathematically guaranteed exactly once external delivery.

# Email States

Email state is persisted in PostgreSQL:

```text
SCHEDULED
PROCESSING
SENT
FAILED
```

Typical lifecycle:

```text
SCHEDULED
    |
    v
PROCESSING
    |
    +----> SENT
    |
    +----> FAILED
```

# Elasticsearch Search

Email documents are indexed in Elasticsearch so they can be searched from the dashboard.

Searchable information includes:

- recipient
- subject
- body
- sender address
- status
- scheduled time
- sent time

Search flow:

```text
Frontend
   |
   v
Express Search API
   |
   v
Elasticsearch
   |
   v
Matching Email Records
   |
   v
Frontend
```

The backend applies the user id filter so results are scoped to the relevant account.

# Bull Board

Bull Board provides live visibility into the BullMQ queue.

Open:

```text
http://localhost:4000/admin/queues
```

It can be used to inspect:

- waiting jobs
- delayed jobs
- active jobs
- completed jobs
- failed jobs

This is useful for demonstrating that scheduled email work is held by the queue until it is ready for processing.

# Frontend Features

## Login

- Google OAuth login
- Authenticated user session
- Logout

## Dashboard

- Scheduled Emails
- Sent Emails
- Search
- Filtering
- Refresh
- Email details

## Compose

- Sender selection
- Multiple recipients
- Manual recipient entry
- CSV lead upload
- Text file lead upload
- Recipient count detection
- Subject
- Email body
- Delay between emails
- Hourly sending limit
- Send
- Send Later

## Email Management

- Scheduled email list
- Sent email list
- Status display
- Scheduled time
- Sent time
- Email details

## Integrations

- Slack connect
- Slack disconnect
- Bull Board queue monitoring

# Backend Features

- BullMQ based email scheduler
- Redis backed job queue
- PostgreSQL persistence
- Prisma database access
- Dedicated email worker
- Configurable concurrency
- Configurable minimum send delay
- Redis backed sender rate limiting
- Rate limit rescheduling
- Queue reconciliation on startup
- Deterministic job ids
- Email status tracking
- Elasticsearch indexing
- Elasticsearch search
- Ethereal SMTP delivery
- Multiple sender configuration
- Google OAuth
- Slack OAuth
- Slack hourly limit notifications
- Bull Board monitoring

# Requirement Mapping

## Backend

| Requirement | Implementation |
|---|---|
| Scheduler | BullMQ delayed jobs |
| No cron jobs | Scheduling is handled by BullMQ |
| Persistence | PostgreSQL with Prisma |
| Redis | Redis used for queue and rate limit state |
| BullMQ worker | Dedicated email worker |
| Concurrency | Configurable `WORKER_CONCURRENCY` |
| Minimum send delay | Configurable `MIN_DELAY_MS` and campaign delay |
| Hourly email rate limit | Redis backed sender level limit |
| Limit exceeded | Jobs are delayed and rescheduled |
| Order preservation | Scheduled spacing and FIFO behavior are used where possible; rescheduling makes strict global ordering best effort |
| Idempotency | Deterministic job ids and persisted email state |
| Restart recovery | Queue reconciliation |
| Multiple senders | Sender configuration |
| Search | Elasticsearch |
| Email delivery | Nodemailer and Ethereal |
| Queue monitoring | Bull Board |
| Slack alert | Slack OAuth and incoming webhook |

## Frontend

| Requirement | Implementation |
|---|---|
| Login | Google OAuth |
| Dashboard | React dashboard |
| Scheduled Emails | Scheduled email view |
| Sent Emails | Sent email view |
| Compose | Compose email screen |
| Subject | Subject input |
| Body | Email body editor |
| Lead upload | CSV and text file upload |
| Recipient count | Email detection from uploaded content |
| Start time | Send Later scheduling |
| Delay | Delay between emails |
| Hourly limit | Sender hourly limit |
| Loading state | Loading UI |
| Empty state | Empty email state |
| Search | Elasticsearch backed search |
| Filters | Status filters |
| Email details | Email details view |
| Slack | Connect and disconnect UI |

# Main End to End Workflow

```text
Google Login
      |
      v
Dashboard
      |
      v
Compose Email
      |
      v
Add Recipients
      |
      v
Set Subject and Body
      |
      v
Set Start Time
      |
      v
Set Delay and Hourly Limit
      |
      v
Schedule
      |
      v
PostgreSQL + BullMQ
      |
      v
Scheduled Tab
      |
      v
Worker
      |
      v
Rate Limit Check
      |
      v
Ethereal SMTP
      |
      v
Update PostgreSQL
      |
      v
Elasticsearch Index
      |
      v
Sent Tab
      |
      v
Search
```

# Restart Scenario

To demonstrate restart persistence:

1. Schedule an email for a future time.
2. Confirm it appears in Scheduled.
3. Stop the backend with `Ctrl + C`.
4. Start the backend again with `npm run dev`.
5. Observe the startup and reconciliation logs.
6. Keep the worker running.
7. Wait until the scheduled time.
8. Confirm the worker processes the email.
9. Confirm the email appears in Sent.

# Delay and Rate Limit Demo

For a quick test, configure:

```text
Delay: 5 seconds
Hourly limit: 2
```

Schedule several recipients.

The first jobs can be processed normally.

Once the sender limit is reached, the worker reschedules additional jobs instead of dropping them.

The worker log shows the rescheduling event.

# Validation

Backend type check:

```bash
cd backend
npx tsc --noEmit
```

Frontend production build:

```bash
cd frontend
npm run build
```

# Assumptions and Trade-offs

### Ethereal Email

Ethereal is used instead of a production SMTP provider because this is a development and evaluation environment. It provides a safe way to demonstrate SMTP delivery through preview URLs.

### PostgreSQL as the source of truth

PostgreSQL stores durable email and user state. Redis and BullMQ handle background scheduling and processing.

### Sender based rate limiting

The hourly limit is implemented per sender rather than as one global application limit. This allows different configured senders to operate independently.

### Concurrency and rate limiting are separate

Worker concurrency controls simultaneous processing. Sender rate limiting controls outbound sending volume. Increasing concurrency does not bypass the sender limit.

### Restart recovery

Queue reconciliation handles the database to queue creation gap when the application starts.

### Large batches

Large recipient lists create individual email records and queue jobs. The queue buffers the workload while concurrency, delay and rate limits control processing. The project does not attempt to send thousands of test messages through Ethereal.

### Ordering

The scheduler spaces recipient jobs according to the requested delay and BullMQ provides queue ordering under normal processing. Once jobs are rescheduled because of rate limiting or processed concurrently, strict global ordering is best effort.

### Delivery semantics

Deterministic job ids and persisted email status reduce duplicate processing. There is still a small failure window between SMTP acceptance and database confirmation, so the system does not claim exactly once external delivery.

### Local development

PostgreSQL, Redis and Elasticsearch are run locally through Docker Compose. A production deployment would require additional monitoring, secret management, logging, alerting, infrastructure scaling and security hardening.


```

# Quick Start

```bash
# Start infrastructure
docker compose up -d

# Terminal 1
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Terminal 2
cd backend
npm run worker

# Terminal 3
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```
