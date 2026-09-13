export const publishedSiteOrigin = "https://skillspring-student-platform.aiuser716378.chatgpt.site";

export function certificateVerificationUrl(token: string) {
  return `${publishedSiteOrigin}/verify/${encodeURIComponent(token)}`;
}
