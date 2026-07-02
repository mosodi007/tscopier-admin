interface ResolveLogoOptions {
  supabaseUrl: string;
  appUrl: string;
  variant?: "dark" | "light";
  explicitUrl?: string;
}

export function resolveEmailLogoUrl(options: ResolveLogoOptions): string {
  if (options.explicitUrl) return options.explicitUrl;

  const filename = options.variant === "light"
    ? "tscopier-light.png"
    : "tscopier-dark.png";

  return `${options.appUrl}/${filename}`;
}
