# VIDYORA Development Guide
## Complete A-to-Z Implementation Roadmap

**Version:** 1.0  
**Last Updated:** September 2026  
**Status:** Phase 1 Complete

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Development Principles](#development-principles)
4. [Quick Start](#quick-start)
5. [Phase 1: Foundation](#phase-1-foundation-completed) ✓
6. [Phase 2: Database Migrations](#phase-2-database-migrations)
7. [Phase 3: Authentication & RBAC](#phase-3-authentication--rbac)
8. [Phase 4: Customer Storefront](#phase-4-customer-storefront)
9. [Phase 5: Cart & Checkout](#phase-5-cart--checkout)
10. [Phase 6: Order Management](#phase-6-order-management)
11. [Phase 7: Seller Central](#phase-7-seller-central)
12. [Phase 8: Admin Panel](#phase-8-admin-panel)
13. [Phase 9: Reviews & Ratings](#phase-9-reviews--ratings)
14. [Phase 10: Production Optimization](#phase-10-production-optimization)
15. [Reference](#reference)
16. [Deployment](#deployment)
17. [Troubleshooting](#troubleshooting)

---

## Project Overview

**VIDYORA** is a production-grade, multi-vendor e-commerce marketplace built with modern web technologies. The platform supports three distinct user roles:

- **Customers** - Browse, search, purchase products
- **Sellers** - Manage products, inventory, and orders
- **Admins** - Platform oversight, approvals, and analytics

### Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                 │
├─────────────────────────────────────────────────────┤
│  Storefront  │  Seller Central  │  Admin Panel      │
├─────────────────────────────────────────────────────┤
│      Server Actions & API Routes (Backend)           │
├─────────────────────────────────────────────────────┤
│              Prisma ORM & PostgreSQL                 │
└─────────────────────────────────────────────────────┘
```

### Key Features

- Multi-vendor marketplace with commission system
- Product variants (size, color, storage, etc.)
- Category hierarchy with custom attributes
- Return/replacement policies per product
- Order tracking and shipment management
- Review system tied to verified purchases
- Coupon and discount system
- Role-based access control

---

## Technology Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod validation
- **State:** Zustand (where needed)

### Backend
- **Runtime:** Next.js Server Actions + API Routes
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 6
- **Authentication:** Auth.js (NextAuth v5)
- **Password Hashing:** bcryptjs

### External Services
- **Payments:** Razorpay (India) / Stripe (International)
- **Storage:** S3-compatible (images, documents)
- **Email:** SMTP / Resend

### Development Tools
- **Package Manager:** npm
- **Linting:** ESLint
- **Type Checking:** TypeScript compiler
- **Database Tools:** Prisma Studio

---

## Development Principles

### Clean Architecture
- Separation of concerns (UI, business logic, data access)
- Reusable components and utilities
- Service layer abstractions for external dependencies

### Security First
- Server-side validation for all mutations
- Role-based authorization checks
- Input sanitization with Zod schemas
- Secure password hashing
- CSRF protection
- Rate limiting architecture

### Performance
- Server Components by default
- Client Components only for interactivity
- Database query optimization
- Proper indexing strategy
- Image optimization with next/image

### Scalability
- Efficient database schema design
- Pagination for large datasets
- Background job support (future)
- Caching strategy for static data

### Type Safety
- Strict TypeScript configuration
- Prisma-generated types
- Zod schemas for runtime validation
- No `any` types

---

## Quick Start

```bash
# Navigate to project
cd /Users/meondev/Desktop/VIDYORA

# Install dependencies (if not done)
npm install

# Configure environment
cp .env.example .env
# Edit .env with your PostgreSQL credentials

# Setup database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Visit: `http://localhost:3000`

**Seed Credentials:**
- Admin: `admin@vidyora.com` / `Password@123`
- Seller: `seller1@vidyora.com` / `Password@123`
- Customer: `customer1@example.com` / `Password@123`

---

## Phase 1: Foundation (✓ COMPLETED)

### Objectives
Set up the complete project structure, database schema, and foundational architecture for the multi-vendor platform.

### Deliverables Completed
- [x] Next.js 15 project with TypeScript
- [x] Tailwind CSS v4 configuration
- [x] shadcn/ui setup
- [x] Complete Prisma schema (28 models)
- [x] Seed data script with sample products
- [x] Folder structure (app routes, components, lib, actions)
- [x] Auth.js configuration
- [x] Middleware for route protection
- [x] Type definitions
- [x] Utility functions and constants

### Key Files Created
- `prisma/schema.prisma` - Complete database schema
- `prisma/seed.ts` - Seed script with users, products, categories
- `lib/auth.ts` - NextAuth configuration
- `lib/prisma.ts` - Prisma client singleton
- `lib/permissions.ts` - RBAC helper functions
- `middleware.ts` - Route protection
- `app/(storefront)/` - Customer-facing pages
- `app/seller/` - Seller Central pages
- `app/admin/` - Admin panel pages

### Database Models
**Users & Auth:** User, Account, Session, VerificationToken, SellerProfile  
**Catalog:** Category, CategoryAttribute, Product, ProductVariant, ProductImage, ProductPolicy  
**Shopping:** Cart, CartItem, Wishlist, WishlistItem, Address  
**Orders:** Order, OrderItem, Payment, Shipment, OrderStatusHistory  
**Returns:** ReturnRequest  
**Reviews:** Review  
**Coupons:** Coupon, CouponUsage  
**System:** ProcessedWebhook

### Environment Variables Set
```env
DATABASE_URL=postgresql://...
AUTH_SECRET=generated-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## Phase 2: Database Migrations

### Objectives
Establish a robust database migration strategy for development and production environments.

### Key Deliverables
- [ ] Initialize Prisma migrations
- [ ] Create initial migration from schema
- [ ] Document migration workflow
- [ ] Set up migration rollback procedures
- [ ] Create migration testing guidelines

### Implementation Checklist

#### 2.1 Initialize Migrations
```bash
# Create initial migration
npx prisma migrate dev --name init

# Verify migration
npx prisma migrate status
```

#### 2.2 Migration Strategy
- [ ] Use `prisma migrate dev` in development
- [ ] Use `prisma migrate deploy` in production
- [ ] Create migration naming convention (e.g., `YYYYMMDD_description`)
- [ ] Document all schema changes in migration files

#### 2.3 Version Control
- [ ] Commit all migration files to git
- [ ] Include `prisma/migrations/` directory
- [ ] Document breaking changes in CHANGELOG.md

#### 2.4 Rollback Procedures
- [ ] Document manual rollback steps
- [ ] Create database backup strategy
- [ ] Test rollback on staging environment first

### Testing Considerations
- Test migrations on fresh database
- Verify seed script works after migrations
- Check all Prisma queries still function
- Test migration rollback scenarios

### Files to Create
- `prisma/migrations/` - Migration history
- `docs/MIGRATION_GUIDE.md` - Internal documentation

### Dependencies
- Phase 1 complete
- PostgreSQL running and accessible

---

## Phase 3: Authentication & RBAC

### Objectives
Implement complete authentication system with login, registration, email verification, and role-based access control.

### Key Deliverables
- [ ] Login page with credentials authentication
- [ ] Registration page for customers
- [ ] Seller registration with business details
- [ ] Email verification system
- [ ] Password reset flow
- [ ] Session management
- [ ] Protected route wrappers
- [ ] User profile management
- [ ] Role switching UI (for testing)

### Implementation Checklist

#### 3.1 Authentication UI
- [ ] Create `app/(auth)/login/page.tsx`
- [ ] Create `app/(auth)/register/page.tsx`
- [ ] Create `app/(auth)/seller/register/page.tsx`
- [ ] Create `app/(auth)/verify-email/page.tsx`
- [ ] Create `app/(auth)/reset-password/page.tsx`
- [ ] Create `app/(auth)/layout.tsx` (centered auth layout)

#### 3.2 Server Actions
- [ ] `actions/auth/login.ts` - Credentials login
- [ ] `actions/auth/register.ts` - Customer registration
- [ ] `actions/auth/register-seller.ts` - Seller registration
- [ ] `actions/auth/verify-email.ts` - Email verification
- [ ] `actions/auth/reset-password.ts` - Password reset
- [ ] `actions/auth/update-profile.ts` - Profile updates

#### 3.3 Email Service Integration
- [ ] Implement `lib/email/templates.ts` - Email templates
- [ ] Configure SMTP or Resend integration
- [ ] Create verification email template
- [ ] Create password reset email template
- [ ] Create welcome email template

#### 3.4 Protected Routes
- [ ] Update `middleware.ts` with comprehensive route protection
- [ ] Create `lib/auth-helpers.ts` server-side guards
- [ ] Add authorization checks to all server actions
- [ ] Implement seller profile verification check

#### 3.5 UI Components
- [ ] `components/auth/login-form.tsx`
- [ ] `components/auth/register-form.tsx`
- [ ] `components/auth/seller-register-form.tsx`
- [ ] `components/auth/user-menu.tsx` - User dropdown
- [ ] `components/auth/session-provider.tsx` - Client session

### Validation Schemas
```typescript
// lib/validations/auth.ts (already exists)
- loginSchema
- registerSchema
- sellerRegistrationSchema (create)
- passwordResetSchema (create)
```

### Testing Considerations
- Test all registration flows
- Verify email delivery (use mailtrap.io for dev)
- Test role-based route access
- Test password reset end-to-end
- Verify session persistence
- Test logout functionality

### Files to Create/Modify
- `app/(auth)/` - Auth pages
- `actions/auth/` - Auth server actions
- `components/auth/` - Auth components
- `lib/email/templates.ts` - Email templates
- `lib/validations/auth.ts` - Add missing schemas

### Dependencies
- Phase 1 & 2 complete
- Email service configured (SMTP or Resend)

---

## Phase 4: Customer Storefront

### Objectives
Build the complete customer-facing storefront with homepage, product listing, search, filtering, and product detail pages with SEO optimization.

### Key Deliverables
- [ ] Dynamic homepage with featured products
- [ ] Product listing page with filters
- [ ] Category pages
- [ ] Search functionality
- [ ] Product detail page (PDP)
- [ ] Image galleries
- [ ] Variant selection
- [ ] SEO optimization
- [ ] Breadcrumbs
- [ ] Related products

### Implementation Checklist

#### 4.1 Homepage
- [ ] Replace placeholder homepage
- [ ] Create `components/home/hero-banner.tsx`
- [ ] Create `components/home/featured-categories.tsx`
- [ ] Create `components/home/trending-products.tsx`
- [ ] Create `components/home/best-sellers.tsx`
- [ ] Fetch real data from database
- [ ] Add promotional banners support

#### 4.2 Product Listing
- [ ] Implement `app/(storefront)/products/page.tsx` with server components
- [ ] Create `components/products/product-grid.tsx`
- [ ] Create `components/products/product-card.tsx`
- [ ] Create `components/products/filter-sidebar.tsx`
- [ ] Add category filter
- [ ] Add brand filter
- [ ] Add price range filter
- [ ] Add rating filter
- [ ] Implement sorting (price, rating, newest)
- [ ] Add pagination component

#### 4.3 Search
- [ ] Implement search UI in header
- [ ] Create `app/(storefront)/search/page.tsx`
- [ ] Integrate `lib/search/product-search.ts`
- [ ] Add search suggestions/autocomplete
- [ ] Implement search result highlighting
- [ ] Add "no results" state

#### 4.4 Product Detail Page
- [ ] Implement `app/(storefront)/products/[slug]/page.tsx`
- [ ] Create `components/products/product-gallery.tsx`
- [ ] Create `components/products/variant-selector.tsx`
- [ ] Create `components/products/add-to-cart-button.tsx`
- [ ] Create `components/products/product-specifications.tsx`
- [ ] Create `components/products/delivery-checker.tsx`
- [ ] Create `components/products/seller-info.tsx`
- [ ] Display return/replacement policy
- [ ] Add breadcrumb navigation
- [ ] Show related products
- [ ] Add product reviews section (read-only for now)

#### 4.5 SEO Implementation
- [ ] Add `generateMetadata` to product pages
- [ ] Create `lib/seo/structured-data.ts`
- [ ] Add Product schema JSON-LD
- [ ] Add Breadcrumb schema JSON-LD
- [ ] Implement OpenGraph metadata
- [ ] Add Twitter card metadata
- [ ] Create dynamic sitemap for products
- [ ] Optimize images with next/image

#### 4.6 Category Pages
- [ ] Implement `app/(storefront)/categories/[slug]/page.tsx`
- [ ] Show category description
- [ ] Display subcategories if available
- [ ] Filter products by category
- [ ] Add category-specific metadata

### Server Actions
- [ ] `actions/products/get-products.ts`
- [ ] `actions/products/get-product-by-slug.ts`
- [ ] `actions/products/search-products.ts`
- [ ] `actions/products/get-related-products.ts`

### Testing Considerations
- Test all filter combinations
- Verify search accuracy
- Test variant selection updates price/images
- Verify SEO tags in page source
- Test breadcrumb navigation
- Validate structured data with Google Rich Results Test
- Test pagination with large datasets
- Verify responsive design on mobile

### Files to Create
- `components/products/` - Product components
- `components/home/` - Homepage components
- `lib/seo/structured-data.ts` - SEO helpers
- Updated product pages with real data

### Dependencies
- Phase 1-3 complete
- Seed data with products exists

---

## Phase 5: Cart & Checkout

### Objectives
Implement shopping cart, address management, checkout flow, and payment integration.

### Key Deliverables
- [ ] Shopping cart functionality
- [ ] Cart persistence (database + optimistic UI)
- [ ] Address management
- [ ] Multi-step checkout
- [ ] Payment integration (Razorpay)
- [ ] Order creation
- [ ] Order confirmation page
- [ ] Email notifications

### Implementation Checklist

#### 5.1 Shopping Cart
- [ ] Create `app/(storefront)/cart/page.tsx`
- [ ] Create `components/cart/cart-item.tsx`
- [ ] Create `components/cart/cart-summary.tsx`
- [ ] Create `components/cart/empty-cart.tsx`
- [ ] Add quantity update functionality
- [ ] Add remove item functionality
- [ ] Add "save for later" functionality
- [ ] Show cart count in header
- [ ] Implement cart state management

#### 5.2 Cart Server Actions
- [ ] `actions/cart/add-to-cart.ts`
- [ ] `actions/cart/update-cart-item.ts`
- [ ] `actions/cart/remove-from-cart.ts`
- [ ] `actions/cart/clear-cart.ts`
- [ ] `actions/cart/get-cart.ts`
- [ ] Add stock validation
- [ ] Add price validation (server-side)

#### 5.3 Address Management
- [ ] Create `app/(storefront)/account/addresses/page.tsx`
- [ ] Create `components/address/address-form.tsx`
- [ ] Create `components/address/address-card.tsx`
- [ ] Implement add/edit/delete address
- [ ] Set default address functionality
- [ ] Validate PIN code format

#### 5.4 Checkout Flow
- [ ] Create `app/(storefront)/checkout/page.tsx`
- [ ] Step 1: Select/add delivery address
- [ ] Step 2: Order summary with pricing
- [ ] Step 3: Apply coupon code
- [ ] Step 4: Select payment method
- [ ] Create `components/checkout/checkout-stepper.tsx`
- [ ] Create `components/checkout/order-summary.tsx`
- [ ] Create `components/checkout/coupon-form.tsx`

#### 5.5 Payment Integration
- [ ] Complete `lib/payments/razorpay.ts` implementation
- [ ] Create Razorpay order on checkout
- [ ] Create `components/checkout/razorpay-button.tsx`
- [ ] Handle payment success callback
- [ ] Handle payment failure
- [ ] Create webhook endpoint `app/api/webhooks/razorpay/route.ts`
- [ ] Verify webhook signatures
- [ ] Implement idempotency (ProcessedWebhook model)
- [ ] Add COD (Cash on Delivery) option

#### 5.6 Order Creation
- [ ] `actions/orders/create-order.ts`
- [ ] Validate cart items and prices
- [ ] Calculate tax and shipping
- [ ] Reserve inventory (stock - reservedStock)
- [ ] Create order with transaction
- [ ] Create order items with seller information
- [ ] Create payment record
- [ ] Update cart (clear after successful order)
- [ ] Handle multi-vendor order splitting logic

#### 5.7 Order Confirmation
- [ ] Create `app/(storefront)/orders/confirmation/page.tsx`
- [ ] Show order number and details
- [ ] Estimated delivery date
- [ ] Send order confirmation email
- [ ] Link to order tracking

### Validation Schemas
```typescript
// lib/validations/checkout.ts (create)
- addressSchema (already exists in auth.ts, reuse)
- checkoutSchema
- couponSchema
```

### Testing Considerations
- Test cart persistence across sessions
- Verify stock validation (prevent overselling)
- Test concurrent cart updates
- Verify payment webhook handling
- Test payment failure scenarios
- Test coupon application and validation
- Verify multi-vendor order item splitting
- Test order confirmation email delivery
- Verify inventory reservation on checkout

### Files to Create
- `app/(storefront)/cart/page.tsx`
- `app/(storefront)/checkout/page.tsx`
- `app/(storefront)/orders/confirmation/page.tsx`
- `components/cart/` - Cart components
- `components/checkout/` - Checkout components
- `actions/cart/` - Cart actions
- `actions/orders/create-order.ts`
- `lib/payments/razorpay.ts` - Complete implementation
- `app/api/webhooks/razorpay/route.ts`

### Dependencies
- Phase 1-4 complete
- Razorpay account and API keys
- Email service configured

---

## Phase 6: Order Management

### Objectives
Implement complete order tracking, shipment updates, order history, and return/replacement request system.

### Key Deliverables
- [ ] Customer order history
- [ ] Order detail and tracking page
- [ ] Order status timeline
- [ ] Return/replacement request forms
- [ ] Order invoice generation
- [ ] Order status updates
- [ ] Shipment tracking integration

### Implementation Checklist

#### 6.1 Order History
- [ ] Complete `app/(storefront)/orders/page.tsx`
- [ ] Create `components/orders/order-card.tsx`
- [ ] Show all customer orders with filters
- [ ] Filter by status (delivered, in-transit, etc.)
- [ ] Search orders by order number
- [ ] Pagination for order history

#### 6.2 Order Detail Page
- [ ] Complete `app/(storefront)/orders/[id]/page.tsx`
- [ ] Create `components/orders/order-timeline.tsx`
- [ ] Create `components/orders/order-items-list.tsx`
- [ ] Create `components/orders/shipping-address-display.tsx`
- [ ] Show payment status
- [ ] Show delivery address
- [ ] Display order items with seller info
- [ ] Show expected delivery date

#### 6.3 Order Status Timeline
- [ ] Visual timeline component
- [ ] Show all status checkpoints
- [ ] Highlight current status
- [ ] Show timestamps for each status
- [ ] Map OrderStatus enum to display labels

#### 6.4 Return/Replacement System
- [ ] Create `app/(storefront)/orders/[id]/return/page.tsx`
- [ ] Create `components/orders/return-request-form.tsx`
- [ ] Validate return eligibility (policy + delivery date)
- [ ] Upload images for return reason
- [ ] Select return type (return/replacement)
- [ ] Create `actions/orders/request-return.ts`
- [ ] Calculate eligible return window
- [ ] Send return request notification to seller/admin

#### 6.5 Invoice
- [ ] Create `app/api/orders/[id]/invoice/route.ts`
- [ ] Generate PDF invoice (use pdf-lib or puppeteer)
- [ ] Include GST/tax details
- [ ] Download invoice button

#### 6.6 Shipment Tracking
- [ ] Display tracking number if available
- [ ] Show courier name
- [ ] Add tracking link (if courier supports)
- [ ] Show estimated delivery date

### Server Actions
- [ ] `actions/orders/get-orders.ts`
- [ ] `actions/orders/get-order-by-id.ts`
- [ ] `actions/orders/request-return.ts`
- [ ] `actions/orders/cancel-order.ts` (if eligible)
- [ ] `actions/orders/download-invoice.ts`

### Testing Considerations
- Test return eligibility calculation
- Verify return window based on policy
- Test order timeline rendering
- Verify multi-seller order display
- Test order search and filters
- Validate invoice generation
- Test return request notifications

### Files to Create
- `app/(storefront)/orders/[id]/page.tsx` - Complete implementation
- `app/(storefront)/orders/[id]/return/page.tsx`
- `components/orders/` - Order components
- `actions/orders/` - Order actions
- `lib/pdf/invoice-generator.ts` - Invoice logic

### Dependencies
- Phase 1-5 complete
- Order data exists from Phase 5

---

## Phase 7: Seller Central

### Objectives
Build complete seller dashboard with product management, multi-step product registration, inventory control, and order fulfillment.

### Key Deliverables
- [ ] Seller dashboard with analytics
- [ ] Multi-step product registration form
- [ ] Product listing management
- [ ] Inventory management
- [ ] Seller order management
- [ ] Return request handling
- [ ] Seller profile management
- [ ] Image upload functionality

### Implementation Checklist

#### 7.1 Seller Dashboard
- [ ] Complete `app/seller/page.tsx`
- [ ] Create `components/seller/dashboard-stats.tsx`
- [ ] Show total sales, orders, products
- [ ] Show pending orders count
- [ ] Show low stock alerts
- [ ] Sales chart (daily/weekly/monthly)
- [ ] Recent orders list
- [ ] Fetch seller-specific analytics

#### 7.2 Product Management
- [ ] Complete `app/seller/products/page.tsx`
- [ ] Create `components/seller/product-table.tsx`
- [ ] List all seller products
- [ ] Show approval status
- [ ] Add edit/delete actions
- [ ] Filter by status (draft, pending, approved)
- [ ] Search products by name/SKU

#### 7.3 Multi-Step Product Registration
- [ ] Complete `app/seller/products/new/page.tsx`
- [ ] Create multi-step form component
- [ ] Step 1: Basic information (name, brand, category)
- [ ] Step 2: Category-specific attributes (dynamic based on category)
- [ ] Step 3: Images upload (multiple images, drag-drop)
- [ ] Step 4: Variants (dynamic rows for size/color/storage)
- [ ] Step 5: Pricing and inventory (per variant)
- [ ] Step 6: Return/replacement/warranty policy
- [ ] Step 7: Preview and submit
- [ ] Create `components/seller/product-form/` components
- [ ] Implement image upload with `lib/storage/` service

#### 7.4 Product Edit
- [ ] Complete `app/seller/products/[id]/page.tsx`
- [ ] Load existing product data
- [ ] Reuse multi-step form
- [ ] Handle image updates
- [ ] Show approval status and admin notes

#### 7.5 Inventory Management
- [ ] Create `app/seller/inventory/page.tsx`
- [ ] Create `components/seller/inventory-table.tsx`
- [ ] Show stock levels per variant
- [ ] Show reserved stock
- [ ] Update stock quantities
- [ ] Low stock alerts
- [ ] Bulk stock update functionality

#### 7.6 Seller Order Management
- [ ] Complete `app/seller/orders/page.tsx`
- [ ] Create `components/seller/seller-order-table.tsx`
- [ ] Show only seller's order items
- [ ] Filter by status
- [ ] Update order status (packed, shipped)
- [ ] Add tracking number for shipment
- [ ] Create `actions/seller/update-order-status.ts`

#### 7.7 Return Requests
- [ ] Create `app/seller/returns/page.tsx`
- [ ] List return requests for seller's products
- [ ] Approve/reject return requests
- [ ] Add seller notes
- [ ] Update return status

#### 7.8 Image Upload Service
- [ ] Complete `lib/storage/index.ts` S3 integration
- [ ] Configure S3-compatible storage (AWS S3, Cloudflare R2, etc.)
- [ ] Implement upload with progress
- [ ] Image optimization (resize, compress)
- [ ] Validate file types and size
- [ ] Generate thumbnails

### Server Actions
- [ ] `actions/seller/create-product.ts`
- [ ] `actions/seller/update-product.ts`
- [ ] `actions/seller/delete-product.ts`
- [ ] `actions/seller/update-inventory.ts`
- [ ] `actions/seller/update-order-status.ts`
- [ ] `actions/seller/handle-return-request.ts`
- [ ] `actions/seller/upload-image.ts`

### Validation Schemas
```typescript
// lib/validations/product.ts (create)
- productBasicInfoSchema
- productVariantSchema
- productPolicySchema
- inventoryUpdateSchema
```

### Testing Considerations
- Test multi-step form navigation
- Test form persistence between steps
- Verify image upload and storage
- Test variant creation (multiple combinations)
- Verify seller can only access own products/orders
- Test inventory stock calculations
- Verify order status progression
- Test return request approval flow

### Files to Create
- `app/seller/products/new/page.tsx` - Complete multi-step form
- `app/seller/products/[id]/page.tsx` - Edit functionality
- `app/seller/inventory/page.tsx`
- `app/seller/returns/page.tsx`
- `components/seller/` - Seller components
- `actions/seller/` - Seller actions
- `lib/storage/index.ts` - Complete S3 implementation
- `lib/validations/product.ts`

### Dependencies
- Phase 1-6 complete
- S3-compatible storage configured
- Seller accounts from seed data

---

## Phase 8: Admin Panel

### Objectives
Build comprehensive admin panel for platform management including seller approval, product moderation, category management, and analytics.

### Key Deliverables
- [ ] Admin dashboard with platform metrics
- [ ] Seller management and approval
- [ ] Product approval workflow
- [ ] Category CRUD operations
- [ ] Coupon management
- [ ] User management
- [ ] Review moderation
- [ ] Platform analytics

### Implementation Checklist

#### 8.1 Admin Dashboard
- [ ] Complete `app/admin/page.tsx`
- [ ] Create `components/admin/admin-stats.tsx`
- [ ] Show GMV (Gross Merchandise Value)
- [ ] Total revenue, orders, customers, sellers
- [ ] Pending approvals (sellers, products)
- [ ] Platform growth charts
- [ ] Recent activity feed

#### 8.2 Seller Management
- [ ] Complete `app/admin/sellers/page.tsx`
- [ ] Create `app/admin/sellers/[id]/page.tsx`
- [ ] Create `components/admin/seller-table.tsx`
- [ ] List all sellers with status
- [ ] View seller details and KYC documents
- [ ] Approve/reject seller applications
- [ ] Verify seller KYC
- [ ] Suspend/unsuspend seller accounts
- [ ] Set commission percentage per seller
- [ ] Add admin notes/rejection reasons

#### 8.3 Product Approval
- [ ] Complete `app/admin/products/page.tsx`
- [ ] Create `app/admin/products/[id]/page.tsx`
- [ ] Create `components/admin/product-approval-card.tsx`
- [ ] List pending products
- [ ] Preview product details
- [ ] Approve/reject products
- [ ] Request changes with notes
- [ ] Suspend approved products
- [ ] Bulk approval actions

#### 8.4 Category Management
- [ ] Complete `app/admin/categories/page.tsx`
- [ ] Create `app/admin/categories/new/page.tsx`
- [ ] Create `app/admin/categories/[id]/page.tsx`
- [ ] Create `components/admin/category-tree.tsx`
- [ ] Display hierarchical category tree
- [ ] Create new categories
- [ ] Edit existing categories
- [ ] Set parent category (hierarchy)
- [ ] Add category image
- [ ] Manage category attributes
- [ ] Reorder categories (sortOrder)
- [ ] Activate/deactivate categories

#### 8.5 Category Attributes
- [ ] Create dynamic attribute management
- [ ] Add attributes to categories (RAM, Storage, etc.)
- [ ] Set attribute type (text, number, select, boolean)
- [ ] Mark attributes as required/filterable
- [ ] Define options for select-type attributes

#### 8.6 Coupon Management
- [ ] Create `app/admin/coupons/page.tsx`
- [ ] Create `app/admin/coupons/new/page.tsx`
- [ ] Create `components/admin/coupon-form.tsx`
- [ ] List all coupons
- [ ] Create new coupons
- [ ] Set discount type (percentage/fixed)
- [ ] Set minimum order value
- [ ] Set usage limits (total and per user)
- [ ] Set validity period
- [ ] Activate/deactivate coupons
- [ ] View coupon usage statistics

#### 8.7 User Management
- [ ] Create `app/admin/users/page.tsx`
- [ ] List all users with roles
- [ ] Search users by email/phone
- [ ] View user details
- [ ] Change user roles
- [ ] Suspend/unsuspend users
- [ ] View user order history

#### 8.8 Review Moderation
- [ ] Create `app/admin/reviews/page.tsx`
- [ ] List all reviews with status
- [ ] Filter by status (pending, approved, rejected)
- [ ] Approve/reject reviews
- [ ] Hide inappropriate reviews
- [ ] Add moderator notes

### Server Actions
- [ ] `actions/admin/approve-seller.ts`
- [ ] `actions/admin/reject-seller.ts`
- [ ] `actions/admin/approve-product.ts`
- [ ] `actions/admin/reject-product.ts`
- [ ] `actions/admin/create-category.ts`
- [ ] `actions/admin/update-category.ts`
- [ ] `actions/admin/delete-category.ts`
- [ ] `actions/admin/create-coupon.ts`
- [ ] `actions/admin/update-coupon.ts`
- [ ] `actions/admin/moderate-review.ts`

### Validation Schemas
```typescript
// lib/validations/admin.ts (create)
- categorySchema
- categoryAttributeSchema
- couponSchema
- sellerApprovalSchema
```

### Testing Considerations
- Test seller approval workflow
- Verify product approval notifications
- Test category hierarchy (parent-child)
- Verify category attribute creation
- Test coupon validation logic
- Verify admin-only access
- Test review moderation
- Validate category tree rendering

### Files to Create
- `app/admin/sellers/[id]/page.tsx`
- `app/admin/products/[id]/page.tsx`
- `app/admin/categories/` - Category pages
- `app/admin/coupons/` - Coupon pages
- `app/admin/users/page.tsx`
- `app/admin/reviews/page.tsx`
- `components/admin/` - Admin components
- `actions/admin/` - Admin actions
- `lib/validations/admin.ts`

### Dependencies
- Phase 1-7 complete
- Admin account from seed data

---

## Phase 9: Reviews & Ratings

### Objectives
Implement complete review system with submission, moderation, ratings calculation, and display.

### Key Deliverables
- [ ] Review submission (verified purchases only)
- [ ] Rating display on products
- [ ] Review listing with filtering
- [ ] Helpful votes system
- [ ] Review images
- [ ] Seller responses to reviews
- [ ] Rating statistics
- [ ] Review moderation (from Phase 8)

### Implementation Checklist

#### 9.1 Review Submission
- [ ] Create `app/(storefront)/orders/[id]/review/page.tsx`
- [ ] Create `components/reviews/review-form.tsx`
- [ ] Allow review only after delivery
- [ ] Prevent duplicate reviews (one per order item)
- [ ] Rating input (1-5 stars)
- [ ] Review title and comment
- [ ] Image upload (optional, up to 5 images)
- [ ] Create `actions/reviews/submit-review.ts`
- [ ] Link review to order item (verify purchase)

#### 9.2 Review Display on PDP
- [ ] Add review section to product detail page
- [ ] Create `components/reviews/review-list.tsx`
- [ ] Create `components/reviews/review-card.tsx`
- [ ] Show verified purchase badge
- [ ] Display review images (clickable gallery)
- [ ] Show helpful votes count
- [ ] Sort reviews (most helpful, newest, highest/lowest rating)
- [ ] Paginate reviews

#### 9.3 Rating Statistics
- [ ] Create `components/reviews/rating-summary.tsx`
- [ ] Calculate average rating
- [ ] Show rating distribution (5 stars: X%, 4 stars: Y%, etc.)
- [ ] Total review count
- [ ] Filter reviews by star rating

#### 9.4 Helpful Votes
- [ ] Add "Was this helpful?" buttons
- [ ] Create `actions/reviews/vote-helpful.ts`
- [ ] Track helpful votes per review
- [ ] Prevent duplicate votes (one per user)
- [ ] Show helpful vote count

#### 9.5 Seller Responses
- [ ] Allow sellers to respond to reviews
- [ ] Create `components/reviews/seller-response-form.tsx`
- [ ] Create `actions/reviews/add-seller-response.ts`
- [ ] Display seller response under review
- [ ] Limit to one response per review

#### 9.6 Review Moderation
- [ ] Reviews start as "PENDING" status
- [ ] Admin approval required (implemented in Phase 8)
- [ ] Auto-approve after X days (optional)
- [ ] Flag inappropriate reviews
- [ ] Create `actions/reviews/flag-review.ts`

### Server Actions
- [ ] `actions/reviews/submit-review.ts`
- [ ] `actions/reviews/get-product-reviews.ts`
- [ ] `actions/reviews/vote-helpful.ts`
- [ ] `actions/reviews/add-seller-response.ts`
- [ ] `actions/reviews/flag-review.ts`

### Database Additions
- [ ] Add `helpfulVotes` column to Review model
- [ ] Add `sellerResponse` column to Review model
- [ ] Create `ReviewVote` model (optional, for tracking voters)

### Validation Schemas
```typescript
// lib/validations/review.ts (create)
- reviewSubmissionSchema
- sellerResponseSchema
```

### Testing Considerations
- Verify only delivered orders can be reviewed
- Test duplicate review prevention
- Verify verified purchase badge
- Test rating calculation accuracy
- Test helpful vote functionality
- Verify seller response permissions
- Test review image upload
- Validate review moderation workflow

### Files to Create
- `app/(storefront)/orders/[id]/review/page.tsx`
- `components/reviews/` - Review components
- `actions/reviews/` - Review actions
- `lib/validations/review.ts`

### Dependencies
- Phase 1-8 complete
- Delivered orders exist for testing

---

## Phase 10: Production Optimization

### Objectives
Optimize the platform for production deployment with SEO enhancements, performance tuning, security hardening, and monitoring setup.

### Key Deliverables
- [ ] SEO optimization
- [ ] Performance improvements
- [ ] Security hardening
- [ ] Error monitoring
- [ ] Analytics integration
- [ ] Database optimization
- [ ] CDN setup
- [ ] Production deployment guide

### Implementation Checklist

#### 10.1 SEO Enhancements
- [ ] Complete sitemap generation (all products, categories)
- [ ] Add canonical URLs to all pages
- [ ] Implement breadcrumb JSON-LD on all pages
- [ ] Add FAQ schema where applicable
- [ ] Create `app/sitemap-products.xml/route.ts` for product sitemap
- [ ] Create `app/sitemap-categories.xml/route.ts`
- [ ] Optimize meta descriptions for all pages
- [ ] Add alt text to all images
- [ ] Implement Open Graph images
- [ ] Create `robots.txt` with proper directives
- [ ] Submit sitemaps to Google Search Console

#### 10.2 Performance Optimization
- [ ] Audit with Lighthouse
- [ ] Optimize images (WebP format, lazy loading)
- [ ] Implement font optimization
- [ ] Add database query caching (Redis)
- [ ] Optimize Prisma queries (reduce N+1 queries)
- [ ] Implement static generation where possible
- [ ] Add ISR (Incremental Static Regeneration) for products
- [ ] Optimize bundle size (analyze with `@next/bundle-analyzer`)
- [ ] Implement code splitting
- [ ] Add loading skeletons for better perceived performance

#### 10.3 Database Optimization
- [ ] Audit database queries with Prisma query logs
- [ ] Add missing indexes based on query patterns
- [ ] Optimize slow queries
- [ ] Implement connection pooling (PgBouncer)
- [ ] Set up database backups
- [ ] Create read replicas for heavy read operations

#### 10.4 Security Hardening
- [ ] Implement rate limiting (`@upstash/ratelimit`)
- [ ] Add CSRF protection
- [ ] Implement CSP (Content Security Policy) headers
- [ ] Enable HTTPS only
- [ ] Secure cookies (httpOnly, secure, sameSite)
- [ ] Add input sanitization for all forms
- [ ] Implement file upload validation (MIME type, size)
- [ ] Add SQL injection protection (already handled by Prisma)
- [ ] Enable security headers (X-Frame-Options, X-Content-Type-Options)
- [ ] Set up WAF (Web Application Firewall) if using Cloudflare/AWS

#### 10.5 Error Monitoring
- [ ] Integrate Sentry for error tracking
- [ ] Set up error boundaries for React components
- [ ] Log server errors to monitoring service
- [ ] Create custom error pages (500, 404)
- [ ] Implement graceful degradation
- [ ] Add health check endpoint `/api/health`

#### 10.6 Analytics
- [ ] Integrate Google Analytics 4
- [ ] Track key events (product view, add to cart, purchase)
- [ ] Set up conversion tracking
- [ ] Implement GTM (Google Tag Manager)
- [ ] Add Facebook Pixel (if needed)
- [ ] Track seller performance metrics

#### 10.7 Caching Strategy
- [ ] Set up Redis for session storage
- [ ] Cache category hierarchy
- [ ] Cache popular products
- [ ] Implement HTTP caching headers
- [ ] Set up CDN (Cloudflare, AWS CloudFront)
- [ ] Cache static assets on CDN

#### 10.8 Production Deployment
- [ ] Set up production database
- [ ] Configure environment variables for production
- [ ] Set up CI/CD pipeline (GitHub Actions, Vercel, etc.)
- [ ] Create production build and test
- [ ] Set up domain and SSL certificate
- [ ] Configure email service for production
- [ ] Set up payment gateway for production mode
- [ ] Configure S3 for production
- [ ] Set up monitoring and alerts
- [ ] Create deployment rollback plan

#### 10.9 Documentation
- [ ] Create API documentation
- [ ] Document environment variables
- [ ] Create deployment guide
- [ ] Document database backup/restore procedures
- [ ] Create troubleshooting guide
- [ ] Document scaling strategies

### Performance Metrics Targets
- Lighthouse Score: > 90
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.5s
- Cumulative Layout Shift (CLS): < 0.1

### Security Checklist
- [ ] All secrets in environment variables
- [ ] No sensitive data in client-side code
- [ ] HTTPS enforced
- [ ] Rate limiting implemented
- [ ] Input validation on all forms
- [ ] SQL injection protection (Prisma)
- [ ] XSS protection
- [ ] CSRF protection
- [ ] Secure session management
- [ ] File upload validation

### Testing Considerations
- Load testing with k6 or Artillery
- Security testing with OWASP ZAP
- Performance testing with Lighthouse
- Cross-browser testing
- Mobile responsiveness testing
- Accessibility testing (WCAG 2.1)

### Files to Create
- `lib/cache/redis.ts` - Redis setup
- `lib/monitoring/sentry.ts` - Sentry integration
- `lib/analytics/ga.ts` - Google Analytics
- `app/api/health/route.ts` - Health check
- `app/sitemap-products.xml/route.ts`
- `app/sitemap-categories.xml/route.ts`
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/SCALING.md` - Scaling strategies

### Dependencies
- Phase 1-9 complete
- Production infrastructure (database, storage, email)
- Monitoring accounts (Sentry, etc.)

---

## Reference

### Database Schema

Complete schema: [`prisma/schema.prisma`](prisma/schema.prisma)

**Key Models:**
- User, SellerProfile, Account, Session
- Category, CategoryAttribute
- Product, ProductVariant, ProductImage, ProductPolicy
- Cart, CartItem, Wishlist, WishlistItem
- Order, OrderItem, Payment, Shipment
- ReturnRequest, Review, Coupon

### API Endpoints

#### Auth
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/session` - Get session

#### Webhooks
- `POST /api/webhooks/razorpay` - Razorpay payment webhook

#### Public
- `GET /api/health` - Health check (Phase 10)

### Environment Variables

**Required:**
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
AUTH_SECRET=your-secret-key-min-32-chars
NEXTAUTH_URL=https://vidyora.com
```

**Payment:**
```env
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx
```

**Storage:**
```env
STORAGE_ENDPOINT=https://s3.amazonaws.com
STORAGE_ACCESS_KEY=xxx
STORAGE_SECRET_KEY=xxx
STORAGE_BUCKET=vidyora-uploads
STORAGE_REGION=ap-south-1
STORAGE_PUBLIC_URL=https://cdn.vidyora.com
```

**Email:**
```env
EMAIL_SERVER=smtp://user:pass@smtp.resend.com:587
EMAIL_FROM=VIDYORA <noreply@vidyora.com>
```

**App:**
```env
NEXT_PUBLIC_APP_URL=https://vidyora.com
NEXT_PUBLIC_APP_NAME=VIDYORA
```

### Project Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Code Quality
npm run typecheck        # TypeScript check
npm run lint             # Run ESLint
npm run lint:fix         # Fix linting issues

# Testing (Phase 10)
npm run test             # Run tests
npm run test:e2e         # Run E2E tests
```

### Folder Structure

```
VIDYORA/
├── app/
│   ├── (auth)/          # Auth pages (login, register)
│   ├── (storefront)/    # Customer pages
│   ├── seller/          # Seller Central
│   ├── admin/           # Admin Panel
│   ├── api/             # API routes
│   └── layout.tsx       # Root layout
├── actions/             # Server Actions
│   ├── auth/
│   ├── products/
│   ├── cart/
│   ├── orders/
│   ├── reviews/
│   ├── seller/
│   └── admin/
├── components/          # React components
│   ├── ui/              # shadcn components
│   ├── auth/
│   ├── products/
│   ├── cart/
│   ├── orders/
│   ├── reviews/
│   ├── seller/
│   └── admin/
├── lib/                 # Utilities
│   ├── auth.ts
│   ├── prisma.ts
│   ├── utils.ts
│   ├── constants.ts
│   ├── permissions.ts
│   ├── payments/
│   ├── storage/
│   ├── email/
│   ├── search/
│   └── validations/
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── types/               # TypeScript types
│   ├── product.ts
│   ├── order.ts
│   ├── user.ts
│   └── common.ts
├── middleware.ts        # Route protection
├── .env.example
├── .env
├── README.md
└── DEVELOPMENT_GUIDE.md (this file)
```

---

## Deployment

### Pre-Deployment Checklist

#### Code
- [ ] All tests passing
- [ ] TypeScript builds without errors
- [ ] No ESLint errors
- [ ] Environment variables configured
- [ ] Database migrations up to date

#### Security
- [ ] All secrets in environment variables
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled

#### Performance
- [ ] Lighthouse score > 90
- [ ] Images optimized
- [ ] Database indexes verified
- [ ] Caching configured
- [ ] CDN set up

#### Monitoring
- [ ] Error tracking (Sentry) configured
- [ ] Analytics (GA) integrated
- [ ] Health check endpoint working
- [ ] Logging configured

### Deployment Steps

#### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# https://vercel.com/your-project/settings/environment-variables
```

#### Option 2: VPS/Cloud Server

```bash
# On server
git clone <repository>
cd VIDYORA
npm install
npm run build

# Set up PM2 for process management
npm install -g pm2
pm2 start npm --name "vidyora" -- start
pm2 save
pm2 startup

# Set up Nginx reverse proxy
# Configure SSL with Let's Encrypt
```

#### Option 3: Docker

```dockerfile
# Dockerfile (create in root)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
CMD ["npm", "start"]
```

### Post-Deployment

- [ ] Run smoke tests on production
- [ ] Verify database connectivity
- [ ] Test payment integration
- [ ] Verify email delivery
- [ ] Check error tracking
- [ ] Monitor performance
- [ ] Set up backups

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Problem:** Cannot connect to database

**Solution:**
1. Check `DATABASE_URL` format
2. Verify database is running
3. Check network connectivity
4. Verify credentials
5. Check SSL requirements (add `?sslmode=require` if needed)

#### Auth Errors

**Problem:** Session not persisting

**Solution:**
1. Check `AUTH_SECRET` is set
2. Verify `NEXTAUTH_URL` matches domain
3. Check cookie settings (httpOnly, secure, sameSite)
4. Clear browser cookies and try again

#### Build Errors

**Problem:** TypeScript errors during build

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

#### Image Upload Failures

**Problem:** Images not uploading

**Solution:**
1. Check storage credentials
2. Verify bucket permissions (public read)
3. Check file size limits
4. Verify MIME type validation
5. Check CORS configuration on bucket

#### Payment Webhook Issues

**Problem:** Webhooks not being received

**Solution:**
1. Verify webhook URL in Razorpay dashboard
2. Check webhook signature verification
3. Ensure endpoint is publicly accessible (use ngrok for local testing)
4. Check webhook logs in Razorpay dashboard

#### Slow Queries

**Problem:** Pages loading slowly

**Solution:**
1. Check Prisma query logs
2. Add missing database indexes
3. Optimize N+1 queries
4. Implement caching
5. Use database query analysis tools

### Debug Mode

Enable debug logging:

```env
# In .env
DEBUG=prisma:query
NODE_ENV=development
```

### Getting Help

1. Check this guide first
2. Review Next.js documentation
3. Check Prisma documentation
4. Search GitHub issues
5. Ask in project Slack/Discord (if available)

---

## Development Best Practices

### Code Style

1. **TypeScript Strict Mode**
   - No `any` types
   - Proper type definitions
   - Use Prisma-generated types

2. **Component Structure**
   - Server Components by default
   - Client Components only when needed
   - Small, focused components

3. **Server Actions**
   - Always validate input with Zod
   - Check authorization
   - Return typed results
   - Handle errors gracefully

4. **Database Queries**
   - Use transactions for related operations
   - Add proper indexes
   - Avoid N+1 queries
   - Use `select` to limit fields

5. **Security**
   - Never trust client data
   - Validate on server
   - Check permissions
   - Sanitize inputs

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/phase-3-auth

# Commit with descriptive messages
git commit -m "feat: add login page with validation"

# Push and create PR
git push origin feature/phase-3-auth
```

### Testing Strategy

1. **Manual Testing**
   - Test each feature as you build
   - Test edge cases
   - Test different user roles

2. **Automated Testing** (Phase 10)
   - Unit tests for utilities
   - Integration tests for Server Actions
   - E2E tests for critical flows

---

## Conclusion

This guide provides a comprehensive roadmap for building VIDYORA from foundation to production. Follow phases sequentially, test thoroughly, and maintain code quality throughout.

**Current Status:** Phase 1 Complete ✓

**Next Steps:** Begin Phase 2 (Database Migrations) or Phase 3 (Authentication & RBAC)

For questions or updates to this guide, contact the development team or create an issue in the project repository.

---

**Happy Coding! 🚀**
