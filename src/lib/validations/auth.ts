import { z } from "zod";

/** O'zbekiston telefon raqami: +998 XX XXX XX XX (faqat raqamlar saqlanadi). */
export const uzPhoneRegex = /^\+998[0-9]{9}$/;

export const phoneSchema = z
  .string()
  .trim()
  .regex(uzPhoneRegex, "Telefon raqam +998XXXXXXXXX ko'rinishida bo'lishi kerak");

export const passwordSchema = z
  .string()
  .min(8, "Parol kamida 8 belgidan iborat bo'lishi kerak")
  .regex(/[a-z]/, "Parolda kichik harf bo'lishi kerak")
  .regex(/[A-Z]/, "Parolda katta harf bo'lishi kerak")
  .regex(/[0-9]/, "Parolda kamida bitta raqam bo'lishi kerak");

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Ism-familiyani to'liq kiriting").max(100),
    identifierType: z.enum(["phone", "email"]),
    phone: phoneSchema.optional(),
    email: z.string().trim().email("Email manzil noto'g'ri").optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    role: z.enum(["customer", "seller"], {
      message: "Rolni tanlang",
    }),
    agreeToTerms: z.literal(true, {
      message: "Foydalanish shartlarini qabul qilishingiz kerak",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parollar mos kelmadi",
    path: ["confirmPassword"],
  })
  .refine((data) => (data.identifierType === "phone" ? !!data.phone : !!data.email), {
    message: "Telefon yoki email kiritilishi shart",
    path: ["identifierType"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Telefon yoki email kiriting"),
  password: z.string().min(1, "Parolni kiriting"),
  rememberMe: z.boolean().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  identifier: z.string().trim().min(3, "Telefon yoki email kiriting"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Parollar mos kelmadi",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Joriy parolni kiriting"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Parollar mos kelmadi",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
