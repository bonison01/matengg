// Maps the account API's "already in use" errors onto sign-up form fields.
import { ApiError } from "@/lib/api/api";
import { authService } from "@/lib/api/service";

/**
 * Turns a "already in use" error into per-field errors. The backend's message
 * can name several fields at once ("Phone or email is already in use.",
 * "Username or email already registered."), so when email is one of them we
 * ask /auth/check-email whether the email is the taken one.
 */
export async function duplicateFieldErrors(a: ApiError, email: string): Promise<Record<string, string>> {
  const detail = typeof a.detail === "string" ? a.detail : "";
  if (!/already|in use|taken|exists|registered|duplicate/i.test(detail)) return {};

  const named = (["username", "email", "phone"] as const).filter((f) =>
    f === "phone" ? /phone|mobile/i.test(detail) : new RegExp(f, "i").test(detail),
  );
  if (!named.length) return {};

  const MSG = {
    username: "That username is already taken — pick another.",
    email: "An account with this email already exists. Log in instead.",
    phone: "This mobile number is already registered to another account.",
  };

  let taken: readonly ("username" | "email" | "phone")[] = named;
  if (named.length > 1 && named.includes("email")) {
    const emailExists = await authService.checkEmail(email).then((r) => r.exists).catch(() => null);
    if (emailExists === true) taken = ["email"];
    else if (emailExists === false) taken = named.filter((f) => f !== "email");
  }
  return Object.fromEntries(taken.map((f) => [f, MSG[f]]));
}
