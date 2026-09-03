#!/bin/bash

# VIDYORA Database Migration Helper Script
# This script provides convenient commands for database migrations

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Functions
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_header() {
    echo ""
    echo "========================================="
    echo "$1"
    echo "========================================="
    echo ""
}

# Check if database is accessible
check_database() {
    print_header "Checking Database Connection"
    
    if npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1; then
        print_success "Database connection successful"
        return 0
    else
        print_error "Cannot connect to database"
        echo "Please check:"
        echo "  1. PostgreSQL is running"
        echo "  2. DATABASE_URL in .env is correct"
        echo "  3. Database credentials are valid"
        return 1
    fi
}

# Create new migration
create_migration() {
    if [ -z "$1" ]; then
        print_error "Migration name is required"
        echo "Usage: ./migrate.sh create <migration_name>"
        exit 1
    fi
    
    print_header "Creating Migration: $1"
    npx prisma migrate dev --name "$1"
    print_success "Migration created and applied"
}

# Create migration without applying
create_migration_only() {
    if [ -z "$1" ]; then
        print_error "Migration name is required"
        echo "Usage: ./migrate.sh create-only <migration_name>"
        exit 1
    fi
    
    print_header "Creating Migration (No Apply): $1"
    npx prisma migrate dev --name "$1" --create-only
    print_success "Migration created (not applied yet)"
    echo "Review the migration in prisma/migrations/"
    echo "Run './migrate.sh apply' to apply it"
}

# Apply pending migrations
apply_migrations() {
    print_header "Applying Pending Migrations"
    npx prisma migrate dev
    print_success "All migrations applied"
}

# Deploy migrations (production)
deploy_migrations() {
    print_header "Deploying Migrations"
    print_warning "This will deploy to production/staging"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma migrate deploy
        print_success "Migrations deployed"
    else
        print_warning "Deployment cancelled"
    fi
}

# Check migration status
check_status() {
    print_header "Migration Status"
    npx prisma migrate status
}

# Reset database (development only)
reset_database() {
    print_header "Reset Database"
    print_warning "This will DROP all data and re-run migrations"
    print_warning "This action cannot be undone!"
    read -p "Are you sure? Type 'yes' to continue: " -r
    echo
    if [[ $REPLY == "yes" ]]; then
        npx prisma migrate reset --force
        print_success "Database reset complete"
    else
        print_warning "Reset cancelled"
    fi
}

# Backup database
backup_database() {
    print_header "Database Backup"
    
    BACKUP_DIR="backups"
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/vidyora_backup_$TIMESTAMP.sql"
    
    # Extract database details from DATABASE_URL
    # This is a simple implementation - adjust based on your actual DATABASE_URL format
    echo "Creating backup..."
    
    if command -v pg_dump > /dev/null 2>&1; then
        pg_dump $DATABASE_URL > "$BACKUP_FILE"
        print_success "Backup created: $BACKUP_FILE"
    else
        print_error "pg_dump not found. Please install PostgreSQL client tools"
        exit 1
    fi
}

# Restore database
restore_database() {
    if [ -z "$1" ]; then
        print_error "Backup file is required"
        echo "Usage: ./migrate.sh restore <backup_file>"
        exit 1
    fi
    
    print_header "Restore Database"
    print_warning "This will replace current database with backup"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        psql $DATABASE_URL < "$1"
        print_success "Database restored from: $1"
    else
        print_warning "Restore cancelled"
    fi
}

# Resolve migration
resolve_migration() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        print_error "Migration name and action required"
        echo "Usage: ./migrate.sh resolve <migration_name> <applied|rolled-back>"
        exit 1
    fi
    
    print_header "Resolving Migration: $1"
    npx prisma migrate resolve --$2 "$1"
    print_success "Migration resolved as $2"
}

# Generate Prisma Client
generate_client() {
    print_header "Generating Prisma Client"
    npx prisma generate
    print_success "Prisma Client generated"
}

# Open Prisma Studio
open_studio() {
    print_header "Opening Prisma Studio"
    print_success "Prisma Studio will open in your browser"
    npx prisma studio
}

# Show help
show_help() {
    cat << EOF
VIDYORA Database Migration Helper

Usage: ./scripts/migrate.sh <command> [arguments]

Commands:
  check                           Check database connection
  create <name>                   Create and apply new migration
  create-only <name>              Create migration without applying
  apply                           Apply pending migrations
  deploy                          Deploy migrations (production)
  status                          Check migration status
  reset                           Reset database (⚠ destructive)
  backup                          Create database backup
  restore <file>                  Restore database from backup
  resolve <name> <action>         Resolve migration (applied|rolled-back)
  generate                        Generate Prisma Client
  studio                          Open Prisma Studio
  help                            Show this help message

Examples:
  ./scripts/migrate.sh create add_user_preferences
  ./scripts/migrate.sh create-only update_product_schema
  ./scripts/migrate.sh apply
  ./scripts/migrate.sh status
  ./scripts/migrate.sh backup
  ./scripts/migrate.sh restore backups/vidyora_backup_20260902.sql

For more information, see docs/MIGRATION_GUIDE.md
EOF
}

# Main script
case "$1" in
    check)
        check_database
        ;;
    create)
        create_migration "$2"
        ;;
    create-only)
        create_migration_only "$2"
        ;;
    apply)
        apply_migrations
        ;;
    deploy)
        deploy_migrations
        ;;
    status)
        check_status
        ;;
    reset)
        reset_database
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "$2"
        ;;
    resolve)
        resolve_migration "$2" "$3"
        ;;
    generate)
        generate_client
        ;;
    studio)
        open_studio
        ;;
    help|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Run './scripts/migrate.sh help' for usage"
        exit 1
        ;;
esac
