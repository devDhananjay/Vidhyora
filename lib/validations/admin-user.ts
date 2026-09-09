import { z } from "zod";

export const adminUpdateUserProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^[6-9]\d{9}$/.test(value),
      "Enter a valid 10-digit mobile number",
    ),
});

export const adminUpdateUserRoleSchema = z.object({
  role: z.enum(["CUSTOMER", "SELLER", "ADMIN", "SUPER_ADMIN"]),
});

export const adminResetUserPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain an uppercase letter")
      .regex(/[a-z]/, "Must contain a lowercase letter")
      .regex(/[0-9]/, "Must contain a number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type AdminUpdateUserProfileInput = z.infer<
  typeof adminUpdateUserProfileSchema
>;
export type AdminUpdateUserRoleInput = z.infer<typeof adminUpdateUserRoleSchema>;
export type AdminResetUserPasswordInput = z.infer<
  typeof adminResetUserPasswordSchema
>;
