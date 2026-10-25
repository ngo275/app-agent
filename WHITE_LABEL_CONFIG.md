# White Label Configuration Guide

This document explains how to configure the AppAgent application for white labeling.

## Overview

The white label configuration system allows you to customize the application's branding, including:

- App name and tagline
- Domain name
- Email addresses (support, info, marketing)
- Marketing contact name
- Social media handles

## Configuration

All white label settings are configured through environment variables. Copy `.env.sample` to `.env` and customize the following values:

### White Label Environment Variables

```bash
# App branding
NEXT_PUBLIC_APP_NAME=AppAgent
NEXT_PUBLIC_DOMAIN=app-agent.ai
NEXT_PUBLIC_TAGLINE=From ASO to Release, All Streamlined
NEXT_PUBLIC_DESCRIPTION=AppAgent automates ASO while simplifying every step from planning to release. Effortlessly generate multilingual release notes, track growth, and handle updates—all in one place. OSS alternative to AppTweak, App Radar, and Sensor Tower.

# Contact information
NEXT_PUBLIC_SUPPORT_EMAIL=support@app-agent.ai
NEXT_PUBLIC_INFO_EMAIL=info@app-agent.ai
NEXT_PUBLIC_MARKETING_EMAIL=shu@app-agent.ai
NEXT_PUBLIC_MARKETING_NAME=Shu from AppAgent

# Social media
NEXT_PUBLIC_TWITTER_HANDLE=@ngo275
```

## What Gets Customized

The white label configuration affects:

1. **App Metadata**: Page titles, descriptions, Open Graph data
2. **Email Templates**: Sender names and addresses in all email communications
3. **Layout Components**: App name in headers and footers
4. **Legal Documents**: Privacy policy, terms of service references
5. **Localization**: App name and tagline in multiple languages
6. **Authentication**: Cookie domain settings
7. **Stripe Integration**: App name in payment processing

## Localization Support

The localization files (`locales/en.json` and `locales/ja.json`) use template variables like `{{appName}}` and `{{tagline}}` that are automatically replaced with your configured values at runtime.

## Testing Your Configuration

1. Update your `.env` file with your custom values
2. Restart the development server: `yarn dev`
3. Visit `http://localhost:3000` to see your changes
4. Check email templates by triggering email flows
5. Verify legal documents at `/privacy`, `/terms`, etc.

## Production Deployment

When deploying to production, ensure all environment variables are properly set in your hosting environment (Vercel, Netlify, etc.).

## Technical Implementation

The configuration is centralized in `src/lib/config.ts` and exported as `WHITE_LABEL_CONFIG`. This object is imported throughout the application to replace hardcoded values.

A utility function `interpolateWhiteLabelValues()` in `src/lib/white-label-utils.ts` handles template variable replacement in localization strings.
