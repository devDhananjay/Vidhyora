import { z } from "zod";

const passwordRules = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  phone: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^\+?[1-9]\d{9,14}$/.test(value),
      "Enter a valid phone number",
    )
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: passwordRules,
    confirmPassword: z.string(),
    hasExistingPassword: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.hasExistingPassword) {
      if (!data.currentPassword || data.currentPassword.length < 8) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Current password is required",
          path: ["currentPassword"],
        });
      }
    }
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords do not match",
        path: ["confirmPassword"],
      });
    }
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
