import { z } from "zod";

/** Client + server form schema (no transforms that break RHF). */
export const addressFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter full name (at least 2 characters)")
    .max(80, "Name is too long"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  addressLine1: z
    .string()
    .trim()
    .min(5, "Enter house / building details (at least 5 characters)")
    .max(120, "Address line 1 is too long"),
  addressLine2: z.string().trim().max(120, "Address line 2 is too long"),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(60, "City name is too long"),
  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(60, "State name is too long"),
  country: z.string().trim().min(2, "Country is required"),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter a valid 6-digit PIN code"),
  landmark: z.string().trim().max(120, "Landmark is too long"),
  latitude: z.number().finite().optional().nullable(),
  longitude: z.number().finite().optional().nullable(),
  type: z.enum(["SHIPPING", "BILLING", "BOTH"]),
  label: z.enum(["HOME", "WORK", "OTHER"]),
  isDefault: z.boolean(),
});

export const addressSchema = addressFormSchema.transform((data) => ({
  ...data,
  addressLine2: data.addressLine2 || undefined,
  landmark: data.landmark || undefined,
  country: data.country || "IN",
  latitude: data.latitude ?? undefined,
  longitude: data.longitude ?? undefined,
}));

export const selectAddressSchema = z.object({
  addressId: z.string().min(1, "Address ID is required"),
});

export type AddressFormInput = z.infer<typeof addressFormSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type SelectAddressInput = z.infer<typeof selectAddressSchema>;
