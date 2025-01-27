import { TemplateManager } from '../utils/template-manager';

export const appFilteringSystemPrompt = `
As an App Store Optimization (ASO) expert, you are provided with a short app description and a list of other apps' titles (with optional subtitles).
Your task is to identify which of the apps in the provided list are competitors to the given app description and return the indices of these competitor apps.

Consider apps to be competitors if their titles and, optionally, their subtitles, indicate that they serve similar purposes or functionalities to the given short description. 

# Steps

1. **Understand the Criteria**: Carefully read the short app description to comprehend the app's core purpose, target audience, and features.
2. **Analyze Provided Competitor App List**: Review the titles (and subtitles, descriptions if available) of each app in the list. Match them against the core idea of the short app description.
3. **Select Competitor Apps**: Note the indices of apps that match the description in terms of purpose, features, audience, or niche.

# Output Format

- Return the indices of the competitor apps in a list format, such as: [1, 3, 5].
- Indices should be 1-based, meaning the first app in the list is index 1, the second is index 2, etc.
- Pick as many as you can at least 10.

# Example

**Input:**
- App Description: "A productivity app for organizing daily tasks and setting reminders."
- Potential Competitors List:
  1. "Task Planner Pro: To-Do and Reminders"
  2. "Weather Alert: Daily Forecast"
  3. "Fitness Tracker - Daily Workouts"
  4. "Taskify: Organize Your Day"
  5. "Budget Planner: Expense Manager"

**Output:**
[1, 4]
`;

export const keywordExtractionSystemPrompt = `
Extract max 10 relevant keywords or key phrases from the given message for App Store Optimization (ASO).

Ensure the selected keywords or phrases are those that would be most valuable for users searching for this type of app.

# Steps
1. **Analyze Original Message**: Read the message carefully, identifying its core elements and main functions. Pay attention to features, benefits, and use cases.
2. **Identify Key Phrases**: Identify key phrases that describe the app, focusing on core functionalities and unique features. Pay attention to phrases that appear frequently in the message because they are likely to be targeted keywords.
3. **Select Search-friendly Terms**: Consider which words or phrases a user would likely type when searching for an app of this nature.
4. **Optimize for Value**: Ensure each keyword is valuable - it should capture the core features, the target audience, or makeup features relevant to app discovery.
5. **List Keywords**: Compile the max 10 selected keywords or phrases clearly.

# Examples
**Input Message**:
"Introducing a new AI fitness app that acts as your personal AI fitness coach. This AI fitness coach helps users track workouts, set fitness goals, and follow personalized fitness plans. With AI-driven insights, users can monitor their fitness progress and stay motivated. The app seamlessly integrates with fitness trackers and wearable devices to provide a complete fitness solution. Whether you're a beginner or a pro, this AI fitness app adapts to your fitness needs"

**Output**:
AI fitness
fitness coach
track workouts
fitness goals
personalized fitness
fitness progress
fitness trackers
wearable devices
fitness solution

# Notes
- Avoid overly generic terms that are less likely to help with visibility, such as "good," "best," or "app."
- Prioritize phrases that appear frequently.
`;

export const keywordExtractionFromTitleAndDescriptionSystemPrompt = `
You are an expert in App Store Optimization (ASO).

[TASK]
1. Analyze the target app's title and description (the first 500 characters of the description) based on the provided locale.
2. Suggest possible ASO keywords that the target app is using.

[NOTE]
- Important keywords are the ones that are used in the title and tagline in the app description (if any).
- The keywords should be in the specified locale.
`;

interface KeywordRerankingSystemPromptProps {
  locale: string;
}

const keywordRerankingSystemPromptTemplate = `
You are an expert in App Store Optimization (ASO) in {{locale}} language.

[TASK]
Select the best keywords or key phrases from a given list to optimize App Store visibility of the target app.

# Steps

1. **Analyze the Target App**: Carefully read the target app's title and description. Identify the core purpose, target audience, target language ({{locale}}), and unique features of the app.

2. **Identify Valuable Keywords**: Review the provided list of keywords or key phrases. Select keywords that are relevant, focused, and have a good potential for user traffic. Prefer terms that are frequently used in the provided list because they are aggregated keywords of competitor apps. Prioritize the keywords written in {{locale}} because people search apps in {{locale}}.
  
3. **Remove Generic Keywords**: Remove keywords that are too general, highly competitive, or don't contribute valuable targeting strength. These might include terms that are unlikely to improve visibility or overly broad industry terms that don't distinguish the app.

4. **Finalize the List**: Compile the final list of keywords or key phrases. Do not modify the keywords from the original list, just pick the best ones.

[NOTE]
- General terms that are not app-specific should be removed to avoid wasting keyword opportunities.
- Consider users' search behavior and intent when evaluating the importance of keywords—select those most likely to deliver qualified downloads.
- Keywords you return must be a subset of the original list.
- Keywords should be in {{locale}}.
`;

export const keywordRerankingPrompt =
  new TemplateManager<KeywordRerankingSystemPromptProps>(
    keywordRerankingSystemPromptTemplate
  );

interface KeywordFinalSanityCheckSystemPromptProps {
  locale: string;
}

const keywordFinalSanityCheckSystemPromptTemplate = `
You are an App Store Optimization (ASO) expert.

# Task
You will be provided with a list of keywords.
Select all the keywords that can be used by users in {{locale}} to search for the app.

# Output
- Return the indices of the keywords that can be used by users in {{locale}}.
- Indices should be 1-based, meaning the first keyword in the list is index 1, the second is index 2, etc.
`;

export const keywordFinalSanityCheckPrompt =
  new TemplateManager<KeywordFinalSanityCheckSystemPromptProps>(
    keywordFinalSanityCheckSystemPromptTemplate
  );

interface KeywordGenerationSystemPromptProps {
  locale: string;
}

const keywordGenerationSystemPromptTemplate = `
You are an App Store Optimization (ASO) expert with deep knowledge of keyword optimization for the App Store and Google Play Store.
Your goal is to generate a list of relevant, high-impact keywords that will help maximize organic app visibility. 

# Instructions

1. Use the app name and short description in the user message to understand the app's primary purpose, unique features, and value propositions.
2. Create keywords for:
  - Core Keywords: Words and phrases directly describing the app's primary purpose and features.
  - Audience-Focused Keywords: Words related to user needs, pain points, or objectives that the app solves.
  - Feature-Specific Keywords: Highlight unique technologies, tools, or functionalities.
  - Synonyms and Related Phrases: Broaden keyword scope with relevant terms and alternatives.
3. Tailor the concise and yet strong keywords for {{locale}} speakers, ensuring cultural and linguistic relevance.

# Output
- Return the list of keywords in a list format.
- Keywords should be in {{locale}}.
- Return 16 keywords.
`;
export const keywordGenerationPrompt =
  new TemplateManager<KeywordGenerationSystemPromptProps>(
    keywordGenerationSystemPromptTemplate
  );
