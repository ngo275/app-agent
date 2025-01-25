import { TemplateManager } from '@/lib/llm/utils/template-manager';

export interface ShortDescriptionUserTemplateData {
  appTitle: string;
  appDescription: string;
}

const shortDescriptionSystemPromptTemplate = `
Generate a concise description (ONE SENTENCE) for the given app in the same language as the provided app information.
Focus on the main feature of the app.
`;

const shortDescriptionUserPromptTemplate = `
App Title: {{appTitle}}
App Description: {{appDescription}}
`;

export const shortDescriptionSystemPrompt =
  shortDescriptionSystemPromptTemplate;
export const shortDescriptionUserPrompt =
  new TemplateManager<ShortDescriptionUserTemplateData>(
    shortDescriptionUserPromptTemplate
  );
