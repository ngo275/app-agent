import { TemplateManager } from '@/lib/llm/utils/template-manager';

export interface OptimizationSystemTemplateData {
  locale: string;
  appStore: boolean;
  forTitle: boolean;
  forSubtitle: boolean;
  forDescription: boolean;
  targetContents: string; // e.g., "title", "title, subtitle", "title, description"
}

export interface OptimizationUserTemplateData {
  title: string;
  subtitle?: string;
  currentDescription?: string;
  descriptionOutline?: string;
  asoKeywords: string;
  targetContents: string; // e.g., "title", "title, subtitle", "title, description"
}

export interface OptimizationUserTemplateDataToGenerateDescription {
  locale: string;
  asoKeywords: string;
  shortDescription: string;
  currentDescription: string;
  maxDescriptionLength: number;
  appName: string;
}

const systemPromptTemplate = `
You are a seasoned app marketer specializing App Store Optimization (ASO) in {{locale}}.
You hold PhD in psychology and linguistics at Stanford University and 
excel at crafting messages that resonate with {{locale}} speakers.

[TASK]
- Generate ASO-optimized {{targetContents}} for an app based on the provided information.
- Prioritize high keyword density while maintaining readability and a natural tone. 
- The target audience is {{locale}} speakers, so ensure the language and phrasing feel localized and engaging. 
- Use the pre-defined ASO keywords effectively to improve rankings for those terms.

[RULES FOR ASO OUTPUT]
{{#if appStore}}
{{#if forTitle}}
- Title (Max 30 characters):
  - Keep the primary app name in the title.
  - Include the most competitive and high-ranking keywords.
  - Make it concise, yet descriptive enough to reflect the app's primary purpose.
{{else}}
- No need to include the title in the output.
{{/if}}
{{#if forSubtitle}}
- Subtitle (Max 30 characters):
  - Use this space to reinforce secondary but essential keywords.
  - Highlight unique features or benefits of the app.
{{else}}
- No need to include the subtitle in the output.
{{/if}}
{{#if forDescription}}
Description (Max 4000 characters):
  - Use all target keywords naturally and as frequently as possible without keyword stuffing.
  - Incorporate keywords in the opening sentences (important for ASO ranking).
  - Highlight the app's features and benefits while weaving in keywords organically.
  - Close with a call-to-action encouraging downloads.
{{else}}
- No need to include the description in the output.
{{/if}}
{{else}}
{{#if forTitle}}
- Include the title in the output.
{{else}}
- No need to include the title in the output.
{{/if}}
{{#if forSubtitle}}
- Include the subtitle in the output.
{{else}}
- No need to include the subtitle in the output.
{{/if}}
{{#if forDescription}}
- Include the description in the output.
{{else}}
- No need to include the description in the output.
{{/if}}
{{/if}}

Keyword Guidelines:
- Use as many provided target keywords as possible in all sections ({{targetContents}}).
- Maintain a natural flow; avoid awkward phrasing to fit in keywords.
- Prioritize high-ranking and relevant keywords at the start of the {{targetContents}}.
- Repeat keywords where appropriate but vary their usage to cover multiple variations.

Localization:
- Localize the language and tone to suit {{locale}} users.
- Emphasize practical, real-world benefits of the app.

General Rules:
- Do not use emojis.
- Do not make up facts or include unverified information.
- Write in plain text, without formatting like bold, italic, or brackets.
- Use as much character space as possible within the limits for each field.
`;

const userPromptTemplate = `
Here's the app information
- Current Title: {{title}}
{{#if subtitle}}- Current Subtitle: {{subtitle}}{{/if}}
{{#if currentDescription}}- Current Description (use as an outline for your reference): {{currentDescription}}{{/if}}
{{#if descriptionOutline}}- Description Outline: {{descriptionOutline}}{{/if}}

Target Keywords:
{{asoKeywords}}

[OUTPUT REQUIREMENTS]
Include: {{targetContents}}
Ensure high keyword density by integrating as many target keywords as possible while maintaining a natural, engaging tone.
`;

const userPromptTemplateToGenerateDescription = `
Generate ASO friendly app description for my app ({{appName}}) in {{locale}}.

[App Information]
App name: {{appName}}
Target keywords: {{asoKeywords}}
App short description: {{shortDescription}}
Current description: 
---
{{currentDescription}}
---

[OUTPUT REQUIREMENTS]
- Use all target keywords naturally and as frequently as possible without keyword stuffing.
- Start with a question that hooks users.
- Incorporate keywords in the opening sentences (important for ASO ranking).
- Highlight the app's features and benefits while weaving in keywords organically.
- Close with a call-to-action encouraging downloads.
- Do not make up facts or include unverified information.
- Do not use markdown. Just use plain text.
- Do not use emojis.
 
The max description length is {{maxDescriptionLength}} characters, so consume this space as much as possible within this limit.
`;

const userPromptTemplateToGenerateDescriptionForJa = `
ASOに強いアプリの概要を作成してください。

[アプリの情報]
アプリ名：{{appName}}
アプリの簡単な説明：{{shortDescription}}
現在の概要：
---
{{currentDescription}}
---

[ターゲットのキーワード]
{{asoKeywords}}

[タスク]
- ターゲットのキーワードをすべて自然な形で散りばめてください。
- 特に最初の段落ではキーとなるキーワードを使ってください。
- 共感を誘うような質問から入り、アプリの特長を説明してください。
- {{maxDescriptionLength}}文字が限界ですが、キーワードを繰り返し利用するために長めの概要を作成してください。
- 機能等で、与えられていない情報を勝手に追加しないでください。
- マークダウンは使用しないでください。
- emojiも使用しないでください。
`;

export const systemPrompt = new TemplateManager<OptimizationSystemTemplateData>(
  systemPromptTemplate
);
export const userPrompt = new TemplateManager<OptimizationUserTemplateData>(
  userPromptTemplate
);

export const userPromptToGenerateDescription =
  new TemplateManager<OptimizationUserTemplateDataToGenerateDescription>(
    userPromptTemplateToGenerateDescription
  );

export const userPromptToGenerateDescriptionForJa =
  new TemplateManager<OptimizationUserTemplateDataToGenerateDescription>(
    userPromptTemplateToGenerateDescriptionForJa
  );
