# VIDYORA - Database Setup Guide

## Problem: Database Not Running

You're seeing "Something went wrong" because PostgreSQL database is not installed or running.

---

## ✅ Solution: Install PostgreSQL

### Option 1: Homebrew (Mac - Recommended)

```bash
# Install PostgreSQL
brew install postgresql@16

# Start the service
brew services start postgresql@16

# Create database
createdb vidyora

# Update password (use the same password from .env)
psql postgres -c "ALTER USER $(whoami) WITH PASSWORD 'password';"
```

### Option 2: Docker (All Platforms)

```bash
# Install Docker Desktop first from: https://www.docker.com/products/docker-desktop

# Then run:
cd /Users/meondev/Desktop/VIDYORA
docker-compose up -d

# Check if running:
docker ps
```

### Option 3: Postgres.app (Mac - GUI)

1. Download from: https://postgresapp.com/
2. Install and run Postgres.app
3. Click "Initialize" to create a new server
4. Server will run on port 5432 automatically

---

## 🔧 After Installing PostgreSQL

### 1. Run Database Migrations

```bash
cd /Users/meondev/Desktop/VIDYORA

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database with sample data
npm run db:seed
```

### 2. Restart Dev Server

The dev server is already running, just refresh your browser:

```
http://localhost:3000
```

---

## 🧪 Test Database Connection

```bash
cd /Users/meondev/Desktop/VIDYORA

# Test connection
npx prisma db push
```

If successful, you'll see:
```
✅ Database synchronized with Prisma schema
```

---

## 🔍 Current Status

- ✅ Next.js server: Running on http://localhost:3000
- ❌ PostgreSQL database: NOT running (needs installation)
- ✅ Code: Ready and working

---

## 📝 Database Configuration

Your `.env` file should have:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/vidyora?schema=public"
```

This matches the Docker setup and standard Homebrew installation.

---

## 🆘 Still Having Issues?

1. **Check if database is running:**
   ```bash
   lsof -i :5432
   ```

2. **Check database logs:**
   - Homebrew: `tail -f /usr/local/var/log/postgresql@16.log`
   - Docker: `docker logs vidyora-db`

3. **Verify connection:**
   ```bash
   psql -h localhost -U postgres -d vidyora
   # Password: password
   ```

---

Last Updated: Phase 5 - Database Setup Required
