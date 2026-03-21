# You can use most Debian-based base images
FROM node:21-slim

# Install curl
RUN apt-get update && apt-get install -y curl && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY compile_page.sh /compile_page.sh
RUN chmod +x /compile_page.sh

# Install dependencies and customize sandbox
WORKDIR /home/user/nextjs-app

RUN npx --yes create-next-app@16.2.0 . --yes

# 1. Force npm to ignore peer dependency errors (CRITICAL for Next 15/React 19 + Radix UI)
RUN npm config set legacy-peer-deps true

# 2. Initialize using strict defaults (-d) so it never hangs on a hidden prompt
RUN npx shadcn@latest init -d

# 3. Add all components, auto-confirm (--yes), and overwrite conflicts
RUN npx shadcn@latest add --all --yes --overwrite
# Move the Nextjs app to the home directory and remove the nextjs-app directory
RUN mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app
