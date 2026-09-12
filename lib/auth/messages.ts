export function getFriendlyAuthError(message?: string, code?: string) {
  const normalized = message?.toLowerCase() ?? "";
  if (code === "email_address_not_authorized") {
    return "Confirmation emails are not enabled for this address yet. Please contact the administrator.";
  }
  if (code === "over_email_send_rate_limit") return "Confirmation email limit reached. Please wait before trying again.";
  if (code === "over_request_rate_limit") return "Too many authentication requests. Please wait a few minutes and try again.";
  if (normalized.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (normalized.includes("email not confirmed")) return "Please confirm your email before signing in.";
  if (normalized.includes("already registered") || normalized.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (normalized.includes("password")) return "Your password does not meet the security requirements.";
  if (normalized.includes("email address not authorized")) {
    return "Confirmation emails are not enabled for this address yet. Please contact the administrator.";
  }
  if (normalized.includes("failed to fetch") || normalized.includes("network")) {
    return "The authentication service could not be reached. Check your connection and try again.";
  }
  if (normalized.includes("error sending confirmation email")) {
    return "The confirmation email could not be sent. Please wait and try again, or contact the administrator.";
  }
  if (normalized.includes("rate limit")) return "Too many attempts. Please wait a moment and try again.";
  return "Signup could not be completed. Please wait a moment and try again.";
}

export function safeNextPath(value: string | null | undefined, fallback = "/student") {
  return value?.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
