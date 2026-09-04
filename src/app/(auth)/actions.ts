"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  uzPhoneRegex,
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "@/lib/validations/auth";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// ---------------------------------------------------------------------------
// Register — Supabase Auth supports { phone, password } and { email, password }
// natively, so no synthetic-email workaround is needed for phone accounts.
// SMS delivery requires an SMS provider configured in the Supabase dashboard
// (see README "Supabase sozlash"); until then, phone sign-ups still create
// the auth user and profile — just without an SMS OTP confirmation step.
// ---------------------------------------------------------------------------
export async function registerAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = await clientIp();
  const rl = checkRateLimit(`register:${ip}`, RATE_LIMITS.register);
  if (!rl.success) {
    return { error: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring." };
  }

  const raw = {
    fullName: formData.get("fullName"),
    identifierType: formData.get("identifierType"),
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    agreeToTerms: formData.get("agreeToTerms") === "on",
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { fullName, identifierType, phone, email, password, role } = parsed.data;
  const supabase = await createClient();

  const { data, error } =
    identifierType === "phone"
      ? await supabase.auth.signUp({
          phone: phone!,
          password,
          options: { data: { full_name: fullName, phone, role } },
        })
      : await supabase.auth.signUp({
          email: email!,
          password,
          options: {
            data: { full_name: fullName, role },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
          },
        });

  if (error) {
    return { error: error.message };
  }

  // When phone/email confirmation isn't required, Supabase already returns
  // an active session from signUp() — sign the person straight into the
  // marketplace instead of making them log in again right after.
  if (data.session) {
    redirect("/");
  }

  return { success: true };
}

export async function loginAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ip = await clientIp();
  const identifierRaw = String(formData.get("identifier") ?? "");
  const rl = checkRateLimit(`login:${ip}:${identifierRaw}`, RATE_LIMITS.login);
  if (!rl.success) {
    return { error: "Juda ko'p noto'g'ri urinish. Birozdan so'ng qayta urinib ko'ring." };
  }

  const parsed = loginSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
    rememberMe: formData.get("rememberMe") === "on",
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { identifier, password } = parsed.data;
  const supabase = await createClient();

  // Note on "Meni eslab qolish": Supabase's SSR cookie already persists the
  // session (refresh token) across browser restarts by default. Making the
  // unchecked state expire the session at browser-close would require
  // rewriting the sb-* cookies' Max-Age here, which risks dropping the
  // security attributes (httpOnly/secure/sameSite) @supabase/ssr sets on
  // them. Tracked as a Stage 2 follow-up once we can test against a live
  // Supabase project instead of guessing at cookie internals.
  const { error } = uzPhoneRegex.test(identifier)
    ? await supabase.auth.signInWithPassword({ phone: identifier, password })
    : await supabase.auth.signInWithPassword({ email: identifier, password });

  if (error) {
    return { error: "Login yoki parol noto'g'ri" };
  }

  const next = String(formData.get("next") ?? "");
  // Only ever redirect back to a same-origin relative path — never follow an
  // absolute/external URL from user input (open-redirect protection).
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------------------------------------------------------------------------
// Forgot / reset password
//   email  -> Supabase's standard reset-link email -> /auth/callback -> session
//             established -> resetPasswordAction() sets the new password.
//   phone  -> SMS OTP via signInWithOtp({ phone }) -> user enters the code on
//             /reset-password?phone=... -> verifyPhoneOtpAndResetAction()
//             verifies the OTP (which itself establishes a session) and sets
//             the new password in the same step.
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState & { phone?: string }> {
  const ip = await clientIp();
  const rl = checkRateLimit(`pwreset:${ip}`, RATE_LIMITS.passwordReset);
  if (!rl.success) {
    return { error: "Juda ko'p urinish. Birozdan keyin qayta urinib ko'ring." };
  }

  const parsed = forgotPasswordSchema.safeParse({ identifier: formData.get("identifier") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { identifier } = parsed.data;
  const supabase = await createClient();

  if (uzPhoneRegex.test(identifier)) {
    // Always attempt the send — never reveal whether the phone is registered.
    await supabase.auth.signInWithOtp({ phone: identifier });
    return { success: true, phone: identifier };
  }

  await supabase.auth.resetPasswordForEmail(identifier, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });
  return { success: true };
}

export async function verifyPhoneOtpAndResetAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const phone = String(formData.get("phone") ?? "");
  const token = String(formData.get("token") ?? "");
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  const { error: verifyError } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (verifyError) {
    return { error: "Kod noto'g'ri yoki muddati o'tgan" };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }

  redirect("/login?reset=success");
}

export async function resetPasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: error.message };
  }

  redirect("/login?reset=success");
}

export async function changePasswordAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessiya topilmadi, qayta kiring" };
  }

  const identifier = user.email ?? user.phone;
  if (!identifier) {
    return { error: "Sessiya topilmadi, qayta kiring" };
  }

  const { error: verifyError } = user.email
    ? await supabase.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.currentPassword,
      })
    : await supabase.auth.signInWithPassword({
        phone: user.phone!,
        password: parsed.data.currentPassword,
      });
  if (verifyError) {
    return { fieldErrors: { currentPassword: ["Joriy parol noto'g'ri"] } };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function requestAccountDeletionAction(): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Sessiya topilmadi" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ status: "deletion_requested", deletion_requested_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
