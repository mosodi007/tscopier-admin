interface ResolveLogoOptions {
  supabaseUrl: string;
  appUrl: string;
  variant?: "dark" | "light";
  explicitUrl?: string;
}

const LOGO_URLS = {
  light: "https://sso.tscopier.ai/storage/v1/object/public/email-assets/tscopierlogo.png",
  dark: "https://sso.tscopier.ai/storage/v1/object/public/email-assets/tscopierlogo-dark.png",
};

export function resolveEmailLogoUrl(options: ResolveLogoOptions): string {
  if (options.explicitUrl) return options.explicitUrl;
  return options.variant === "light" ? LOGO_URLS.light : LOGO_URLS.dark;
}
