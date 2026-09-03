import { z } from "zod";

export const addressSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .min(10, "Phone must be at least 10 digits")
    .max(15, "Phone must be at most 15 digits"),
  addressLine1: z.string().min(5, "Address must be at least 5 characters"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().default("IN"),
  postalCode: z.string().min(5, "Postal code must be at least 5 characters"),
  landmark: z.string().optional(),
  type: z.enum(["SHIPPING", "BILLING", "BOTH"]).default("SHIPPING"),
  isDefault: z.boolean().default(false),
});

export const selectAddressSchema = z.object({
  addressId: z.string().min(1, "Address ID is required"),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type SelectAddressInput = z.infer<typeof selectAddressSchema>;
