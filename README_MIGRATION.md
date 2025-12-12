# Cloud Database Migration Guide

This guide explains how to migrate the CES Repair Management System from the local SQLite database to a cloud database (e.g., Google Cloud SQL with PostgreSQL).

## 1. Prerequisites

- Google Cloud Platform Account
- Google Cloud SQL Instance (PostgreSQL recommended) created
- `gcloud` CLI installed (optional, for connection proxy)

## 2. Export Data (Done)

The local data has been exported to a SQL dump file in the root directory:
`dump_YYYY-MM-DDTHH-mm-ss.sql`

This file contains `INSERT` statements for all your current data.

## 3. Configure Application for Cloud SQL

### A. Update Prisma Schema
Open `prisma/schema.prisma` and change the datasource provider to `postgresql`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### B. Update Environment Variables
Update your `.env` file (or set environment variables in your cloud provider) with the connection string:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME?schema=public"
```

*Note: For Google Cloud SQL, you might need to use the Cloud SQL Auth Proxy.*

## 4. Deploy Schema

Run the following command to create the tables in your new cloud database:

```bash
npx prisma migrate dev --name init_cloud
```

## 5. Import Data

Since the schema is now created, you can import the data using the dump file.
However, because the dump file was generated from SQLite, you might need to adjust it slightly for PostgreSQL (e.g., boolean values `0`/`1` to `false`/`true`, though Prisma usually handles dates as strings in ISO format which PG accepts).

You can execute the SQL file using a database tool (like DBeaver, pgAdmin) or command line:

```bash
psql -h HOST -U USER -d DATABASE_NAME -f dump_YYYY-MM-DDTHH-mm-ss.sql
```

## 6. Verify

Start the application and verify that you can see your customers and projects.

```bash
npm run dev
```
