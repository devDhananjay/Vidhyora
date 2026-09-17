# Seller / Admin Operations - Feature Improvements

**Status:** Pending Implementation  
**Priority:** High  
**Date:** September 17, 2026

---

## 📋 Feature Requests

### 15. ✅ **Bulk Inventory Update UI**
**Status:** API exists, UI missing  
**Current:** Single product edit only  
**Needed:** 
- Bulk select products
- Update stock in bulk
- Update prices in bulk
- CSV import/export for inventory

**Impact:** High - Sellers with many products waste time

---

### 16. ❌ **Bulk Order Fulfillment & Packing Slip**
**Status:** Not implemented  
**Current:** Individual order processing  
**Needed:**
- Multi-select orders
- Bulk mark as shipped
- Print multiple packing slips at once
- Batch AWB number assignment

**Impact:** High - Slows down fulfillment

---

### 17. ⚠️ **Rejected Product Enhancement**
**Status:** Weak implementation  
**Current:** Basic rejection, no clear path forward  
**Needed:**
- Detailed rejection reasons (categorized)
- Fix suggestions from admin
- Resubmit workflow without creating new product
- Rejection history tracking

**Impact:** Medium - Confuses sellers

---

### 18. ❌ **Clone Listing Feature**
**Status:** Not implemented  
**Current:** Manual recreation for similar products  
**Needed:**
- "Clone this product" button
- Copy all details except SKU
- Quick edit for variations (size, metal, color)
- Maintain original as template

**Impact:** High - Saves huge time for variant listings

---

### 19. ⚠️ **Analytics Date Range & Trends**
**Status:** Basic analytics only  
**Current:** Fixed period stats  
**Needed:**
- Custom date range selector
- Trend graphs (sales over time)
- Compare periods (This month vs Last month)
- Export reports as CSV/PDF

**Impact:** High - Better business insights

---

### 20. ❌ **KYC Pending Queue Filter**
**Status:** No dedicated queue  
**Current:** Mixed with all sellers  
**Needed:**
- Filter: KYC Pending
- Filter: KYC Rejected
- Filter: Documents Expiring Soon
- Quick approve/reject from list

**Impact:** Medium - Admin efficiency

---

### 21. ❌ **SLA Page Actions**
**Status:** Read-only dashboard  
**Current:** Just shows delayed orders  
**Needed:**
- "Nudge Seller" button (sends reminder)
- "Escalate" button (flags for intervention)
- Add internal notes
- Auto-remind after X hours

**Impact:** Medium - Better order management

---

### 22. ❌ **Jewellery QA Checklist on Approval**
**Status:** Not implemented  
**Current:** Free-form approval/rejection  
**Needed:**
- Structured checklist for admin:
  - [ ] Clear product images
  - [ ] Accurate weight mentioned
  - [ ] Proper metal purity stated
  - [ ] Certification info valid
  - [ ] Pricing reasonable
  - [ ] Description complete
- Auto-reject if critical items unchecked
- Show checklist results to seller

**Impact:** High - Quality control

---

## 📊 Priority Matrix

| Feature | Impact | Effort | Priority |
|---------|--------|--------|----------|
| Bulk Inventory UI | High | Medium | **P0** |
| Clone Listing | High | Low | **P0** |
| Analytics Date Range | High | Medium | **P1** |
| Bulk Fulfillment | High | High | **P1** |
| QA Checklist | High | Medium | **P1** |
| Rejected Product Flow | Medium | Medium | **P2** |
| KYC Queue Filter | Medium | Low | **P2** |
| SLA Actions | Medium | Medium | **P2** |

---

## 🚀 Implementation Plan

### **Phase 1: Quick Wins (2-3 hours)**
1. Clone Listing Feature
2. KYC Queue Filters
3. Basic date range for analytics

### **Phase 2: Core Features (5-7 hours)**
4. Bulk Inventory UI
5. QA Checklist
6. Rejected Product Enhancement

### **Phase 3: Advanced (8-10 hours)**
7. Bulk Fulfillment
8. SLA Actions & Nudges
9. Trend graphs & reports

---

## 💡 Technical Notes

### Bulk Inventory (Feature #15)
- **API:** Already exists in `/actions/seller/manage-inventory.ts`
- **Needed:** 
  - Multi-select checkbox component
  - Bulk edit modal
  - CSV upload parser

### Clone Listing (Feature #18)
- **Easy win!** Just duplicate product data with new ID
- Copy from `normalizeProductFormValues`
- Change: SKU, slug, set status to DRAFT

### QA Checklist (Feature #22)
- Add `qualityCheckNotes` field to Product model
- Create checklist component
- Store as JSON in database

### Bulk Fulfillment (Feature #16)
- Multi-select orders
- Bulk update order status
- Generate combined PDF for packing slips

---

## 📝 Database Changes Needed

### For QA Checklist:
```prisma
model Product {
  // ... existing fields
  qualityCheckNotes Json?    // Store checklist results
  qualityCheckedBy  String?  // Admin who checked
  qualityCheckedAt  DateTime?
}
```

### For Rejection Enhancement:
```prisma
model Product {
  // ... existing fields
  rejectionCategory String?  // "IMAGE_QUALITY" | "PRICING" | "INFO_INCOMPLETE" etc.
  rejectionNotes    String?  // Detailed feedback
  resubmissionCount Int @default(0)
}
```

---

## 🎯 Which Features to Implement First?

**Recommended Order:**
1. **Clone Listing** (30 min - easy, high impact)
2. **KYC Queue Filters** (45 min - easy, admin efficiency)
3. **Analytics Date Range** (1 hour - user request)
4. **Bulk Inventory UI** (2-3 hours - high impact)
5. **QA Checklist** (2 hours - quality control)

---

**Ready to start! Which feature should I implement first?** 🚀
