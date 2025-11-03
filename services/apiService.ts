import { GoogleGenAI, Type } from "@google/genai";
import md5 from 'md5';
import { Insight, Sentiment, Topic } from '../types';

const STAGED_INSIGHTS_KEY = 'stagedInsights';
const PROCESSED_INSIGHTS_KEY = 'processedInsights';

// --- LocalStorage Helper Functions (simulating a database) ---

const readFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return defaultValue;
  }
};

const writeToStorage = <T,>(key: string, value: T): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
};

// --- Data Management API ---

export async function getStagedInsights(): Promise<Insight[]> {
  return Promise.resolve(readFromStorage<Insight[]>(STAGED_INSIGHTS_KEY, []));
}

export async function getProcessedInsights(): Promise<Insight[]> {
  return Promise.resolve(readFromStorage<Insight[]>(PROCESSED_INSIGHTS_KEY, []));
}

export async function addInsight(insightData: { source_url: string; raw_content: string }): Promise<Insight> {
  const newInsight: Insight = {
    id: md5(insightData.source_url + insightData.raw_content + Date.now()),
    timestamp: new Date().toISOString(),
    ...insightData,
  };
  const currentStaged = await getStagedInsights();
  writeToStorage(STAGED_INSIGHTS_KEY, [newInsight, ...currentStaged]);
  return Promise.resolve(newInsight);
}

export async function processInsight(id: string, sentiment: Sentiment, topic: Topic): Promise<void> {
  const staged = await getStagedInsights();
  const processed = await getProcessedInsights();
  
  const insightToProcess = staged.find(insight => insight.id === id);
  if (insightToProcess) {
    const processedInsight: Insight = { ...insightToProcess, sentiment, topic };
    writeToStorage(PROCESSED_INSIGHTS_KEY, [processedInsight, ...processed]);
    writeToStorage(STAGED_INSIGHTS_KEY, staged.filter(insight => insight.id !== id));
  }
  return Promise.resolve();
}

export async function deleteStagedInsight(id: string): Promise<void> {
  const staged = await getStagedInsights();
  writeToStorage(STAGED_INSIGHTS_KEY, staged.filter(insight => insight.id !== id));
  return Promise.resolve();
}

export async function clearStagedInsights(): Promise<void> {
  writeToStorage(STAGED_INSIGHTS_KEY, []);
  return Promise.resolve();
}

export async function clearProcessedInsights(): Promise<void> {
  writeToStorage(PROCESSED_INSIGHTS_KEY, []);
  return Promise.resolve();
}


// --- AI Service API ---

const validSentiments = Object.values(Sentiment);
const validTopics = Object.values(Topic);

export async function getAiSuggestion(content: string): Promise<{ sentiment: Sentiment; topic: Topic }> {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze the following content and determine its sentiment and topic.
    Content: "${content}"

    Instructions:
    1.  Classify the sentiment as one of: ${validSentiments.join(', ')}.
    2.  Classify the topic as one of: ${validTopics.join(', ')}.
    3.  Provide the output in JSON format according to the specified schema.
    `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          sentiment: {
            type: Type.STRING,
            enum: validSentiments,
            description: 'The sentiment of the content.'
          },
          topic: {
            type: Type.STRING,
            enum: validTopics,
            description: 'The main topic of the content.'
          },
        },
        required: ["sentiment", "topic"],
      },
    },
  });

  const jsonString = response.text.trim();
  const parsed = JSON.parse(jsonString);

  if (!validSentiments.includes(parsed.sentiment)) {
    throw new Error(`Invalid sentiment received from API: ${parsed.sentiment}`);
  }
  if (!validTopics.includes(parsed.topic)) {
    throw new Error(`Invalid topic received from API: ${parsed.topic}`);
  }

  return parsed as { sentiment: Sentiment; topic: Topic };
}
