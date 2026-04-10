FROM node:22-slim

# Install minimal dependencies
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy start script
COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Set correct working directory
WORKDIR /home/user

# Limit memory (important for E2B stability)
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Create Next.js app directly in correct folder
RUN npx --yes create-next-app@16.2.0 . --yes

# Fix peer deps
RUN npm config set legacy-peer-deps true

# Init shadcn (lightweight only)
RUN npx shadcn@latest init -d

# ✅ Inject SAFE Next.js config (CRITICAL)
RUN printf '%s\n' \
"import type { NextConfig } from 'next';" \
"" \
"const nextConfig: NextConfig = {" \
"  allowedDevOrigins: ['*.e2b.app', '3000-*.e2b.app']," \
"  experimental: { optimizeCss: false }," \
"  assetPrefix: ''," \
"  reactStrictMode: false," \
"};" \
"" \
"export default nextConfig;" \
> next.config.ts

# ✅ Fix layout to avoid font/hydration issues
RUN printf '%s\n' \
"import './globals.css';" \
"" \
"export const metadata = {" \
"  title: 'Next App'," \
"  description: 'Generated in E2B sandbox'," \
"};" \
"" \
"export default function RootLayout({ children }: { children: React.ReactNode }) {" \
"  return (" \
"    <html lang='en'>" \
"      <body>{children}</body>" \
"    </html>" \
"  );" \
"}" \
> app/layout.tsx

# Dev stability environment
ENV WATCHPACK_POLLING=true
ENV NEXT_DISABLE_ORIGIN_CHECK=1

# Expose port
EXPOSE 3000

# Start script
CMD ["/compile_page.sh"]