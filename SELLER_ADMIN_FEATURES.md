# Seller / Admin Operations - Feature Status

**Status:** ✅ Implemented  
**Date:** September 17, 2026

---

## Completed

| # | Feature | Where |
|---|---------|--------|
| 15 | Bulk inventory UI | `/seller/inventory` — multi-select + bulk stock update |
| 16 | Bulk fulfill + packing slips | `/seller/orders` bulk actions + `/seller/orders/packing-slip` |
| 17 | Rejected product fix/resubmit | Rejection category + reason on seller list; clear on resubmit |
| 18 | Clone listing | Clone button on `/seller/products` |
| 19 | Analytics date range + trends | `/seller/analytics` presets + daily trend chart |
| 20 | KYC pending queue filters | `/admin/sellers?kyc=PENDING` (+ status filters) |
| 21 | SLA nudge / escalate | `/admin/orders/sla` actions |
| 22 | Jewellery QA checklist | Admin product review page (required before approve) |

---

## Notes

- Schema fields added: `Product.rejectionCategory`, `resubmissionCount`, `qualityChecklist`, `qualityCheckedAt/By`; `Order.slaEscalatedAt`, `slaNudgedAt`, `slaAdminNote`
- Approve blocks until critical QA items are saved
- Bulk ship still one-by-one (needs tracking); bulk confirm/pack supported
- Run `npx prisma db push` on production after deploy
