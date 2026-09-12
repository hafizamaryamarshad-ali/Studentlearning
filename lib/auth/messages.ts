export function getFriendlyAuthError(message?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (normalized.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (normalized.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (normalized.includes("password")) return "Your password does not meet the security requirements.";
  if (normalized.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return "We couldn’t complete that request. Check your connection and try again.";
}

export function safeNextPath(value: string | null | undefined, fallback = "/student") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
