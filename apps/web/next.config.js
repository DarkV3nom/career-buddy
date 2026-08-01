/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' } // resume/JD uploads
  },
  // packages/prompts is read at runtime via fs.readFile (lib/router/composer.ts),
  // not statically imported, so Vercel's serverless bundler won't auto-trace
  // it. Without this, the Prompt Composer works locally but 404s/ENOENTs in
  // production because the .md files never made it into the deployed bundle.
  outputFileTracingIncludes: {
    '/api/chat': ['../../packages/prompts/**/*'],
  },
};

module.exports = nextConfig;
