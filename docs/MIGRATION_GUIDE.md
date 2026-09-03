# Database Migration Guide

## Overview

This guide covers database migration strategy for VIDYORA using Prisma Migrate.

## Migration Workflow

### Development Environment

```bash
# 1. Make changes to prisma/schema.prisma

# 2. Create a new migration
npx prisma migrate dev --name descriptive_name

# 3. The migration will:
#    - Generate SQL migration file
#    - Apply migration to database
#    - Regenerate Prisma Client
```

### Production Environment

```bash
# Deploy pending migrations (no prompts)
npx prisma migrate deploy

# This is used in CI/CD pipelines
```

## Migration Naming Convention

Use descriptive names with prefixes:

- `init` - Initial schema
- `add_xxx` - Adding new table/column
- `update_xxx` - Modifying existing structure
- `remove_xxx` - Removing table/column
- `fix_xxx` - Fixing data issues

**Examples:**
```bash
npx prisma migrate dev --name add_user_preferences
npx prisma migrate dev --name update_product_pricing
npx prisma migrate dev --name remove_legacy_fields
```

## Migration Commands Reference

### Create Migration

```bash
# Create and apply migration
npx prisma migrate dev --name migration_name

# Create migration without applying (for review)
npx prisma migrate dev --name migration_name --create-only

# After review, apply it
npx prisma migrate dev
```

### Check Migration Status

```bash
# View migration status
npx prisma migrate status

# Shows:
# - Applied migrations
# - Pending migrations
# - Database schema drift
```

### Reset Database

```bash
# ⚠️ WARNING: Drops database and re-runs all migrations
npx prisma migrate reset

# This also runs seed script automatically
```

### Deploy to Production

```bash
# Apply pending migrations
npx prisma migrate deploy

# Used in production/staging environments
```

## Rollback Strategy

Prisma Migrate doesn't have built-in rollback. Follow this process:

### Option 1: Manual Rollback

1. **Identify the migration to rollback:**
   ```bash
   npx prisma migrate status
   ```

2. **Create a new "rollback" migration:**
   - Manually write SQL to reverse changes
   - Save in a new migration file

3. **Apply rollback migration:**
   ```bash
   npx prisma migrate dev --name rollback_feature_name
   ```

### Option 2: Database Restore

1. **Restore from backup:**
   ```bash
   # Restore PostgreSQL backup
   pg_restore -U postgres -d vidyora backup_file.dump
   ```

2. **Update migration history:**
   ```bash
   # Mark migrations as rolled back
   npx prisma migrate resolve --rolled-back migration_name
   ```

## Handling Schema Drift

Schema drift occurs when database schema differs from migrations.

```bash
# Detect drift
npx prisma migrate status

# If drift detected:
# Option 1: Create migration from current schema
npx prisma db pull
npx prisma migrate dev --name fix_schema_drift

# Option 2: Reset and re-apply (development only)
npx prisma migrate reset
```

## Migration Best Practices

### 1. Review Before Applying

```bash
# Create migration without applying
npx prisma migrate dev --name my_changes --create-only

# Review generated SQL in prisma/migrations/
cat prisma/migrations/YYYYMMDDHHMMSS_my_changes/migration.sql

# Apply after review
npx prisma migrate dev
```

### 2. Test on Staging First

```bash
# On staging environment
npx prisma migrate deploy

# Test thoroughly before production
```

### 3. Backup Before Major Changes

```bash
# PostgreSQL backup
pg_dump -U postgres -d vidyora > backup_$(date +%Y%m%d_%H%M%S).sql

# Then proceed with migration
npx prisma migrate deploy
```

### 4. Handle Data Migrations Carefully

For migrations that require data transformation:

```sql
-- migration.sql
BEGIN;

-- Add new column with default
ALTER TABLE "Product" ADD COLUMN "slug_new" TEXT;

-- Populate new column from existing data
UPDATE "Product" SET "slug_new" = LOWER(REPLACE("name", ' ', '-'));

-- Make it required
ALTER TABLE "Product" ALTER COLUMN "slug_new" SET NOT NULL;

-- Drop old column and rename
ALTER TABLE "Product" DROP COLUMN "slug";
ALTER TABLE "Product" RENAME COLUMN "slug_new" TO "slug";

COMMIT;
```

## Common Migration Scenarios

### Adding a New Table

```prisma
// schema.prisma
model Newsletter {
  id        String   @id @default(cuid())
  email     String   @unique
  createdAt DateTime @default(now())
}
```

```bash
npx prisma migrate dev --name add_newsletter_table
```

### Adding a Column

```prisma
// Add field to existing model
model User {
  // ... existing fields
  phoneVerified DateTime?
}
```

```bash
npx prisma migrate dev --name add_user_phone_verified
```

### Making Optional Field Required

```prisma
// Before: phone String?
// After:  phone String

model User {
  phone String  // Now required
}
```

```bash
# First, ensure all existing rows have data
# Create migration
npx prisma migrate dev --name make_user_phone_required --create-only

# Edit migration to handle existing NULL values
# Then apply
npx prisma migrate dev
```

### Renaming a Column

```prisma
// Prisma doesn't detect renames automatically
// Manual migration required

// schema.prisma - update the field name
model Product {
  displayName String  // renamed from 'name'
}
```

```bash
# Create migration
npx prisma migrate dev --name rename_product_name --create-only

# Edit migration file to use RENAME instead of DROP + ADD
# Replace:
# ALTER TABLE "Product" DROP COLUMN "name";
# ALTER TABLE "Product" ADD COLUMN "displayName" TEXT NOT NULL;

# With:
# ALTER TABLE "Product" RENAME COLUMN "name" TO "displayName";

# Apply migration
npx prisma migrate dev
```

## Production Deployment Checklist

- [ ] Test migrations on staging environment
- [ ] Backup production database
- [ ] Review all migration SQL files
- [ ] Plan downtime window (if needed)
- [ ] Have rollback plan ready
- [ ] Monitor application after deployment
- [ ] Verify data integrity

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
      
      - name: Deploy application
        run: npm run deploy
```

## Troubleshooting

### Error: Migration failed to apply

**Solution:**
1. Check database connectivity
2. Review migration SQL for syntax errors
3. Check for conflicts with existing data
4. Resolve manually and mark as applied:
   ```bash
   npx prisma migrate resolve --applied migration_name
   ```

### Error: Database is out of sync

**Solution:**
```bash
# Reset development database
npx prisma migrate reset

# Or create migration from current state
npx prisma db pull
npx prisma migrate dev --name sync_database
```

### Error: Cannot connect to database

**Solution:**
1. Verify DATABASE_URL in .env
2. Check database server is running
3. Verify network connectivity
4. Check credentials and permissions

## Additional Resources

- [Prisma Migrate Documentation](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Prisma Migrate in Production](https://www.prisma.io/docs/guides/deployment/deploy-database-changes-with-prisma-migrate)
- [Migration Troubleshooting](https://www.prisma.io/docs/guides/database/developing-with-prisma-migrate/troubleshooting-development)

## Migration History

All migrations are stored in `prisma/migrations/` directory. Each migration includes:
- `migration.sql` - The SQL that was executed
- Timestamp - When the migration was created

**Never manually edit applied migrations.** Always create new migrations for changes.
