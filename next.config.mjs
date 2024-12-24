import createMDX from '@next/mdx';
import remarkGfm from 'remark-gfm';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['lh3.googleusercontent.com'],
  },

  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],

  webpack: (config) => {
    // Ref: https://github.com/vercel/next.js/discussions/52593
    config.resolve.alias['handlebars'] = 'handlebars/dist/handlebars.min.js';
    return config;
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    remarkPlugins: [remarkGfm],
  },
});

// Merge MDX config with Next.js config
export default withMDX(withNextIntl(nextConfig));
