/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: '10mb' }, // resume/JD uploads
    // packages/prompts is read at runtime via fs.readFile (lib/router/composer.ts),
    // not statically imported, so Vercel's serverless bundler won't auto-trace
    // it. Without this, the Prompt Composer works locally but 404s/ENOENTs in
    // production because the .md files never made it into the deployed bundle.
    // Must live under `experimental` on Next 14 (promoted top-level in Next 15) --
    // Vercel logged "Unrecognized key(s): outputFileTracingIncludes" when this
    // sat at the top level, meaning the include silently never applied.
    outputFileTracingIncludes: {
      '/api/chat': ['../../packages/prompts/**/*'],
      '/api/jobs/[id]/generate': ['../../packages/prompts/**/*'],
    },
  },
};

module.exports = nextConfig;
