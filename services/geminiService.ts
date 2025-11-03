
import { GoogleGenAI, Type } from "@google/genai";
import { Sentiment, Topic } from "../types";

const validSentiments = Object.values(Sentiment);
const validTopics = Object.values(Topic);

export async function suggestLabels(content: string): Promise<{ sentiment: Sentiment; topic: Topic }> {
  // It's a best practice to initialize the client right before the call,
  // especially in environments where API keys might be managed dynamically.
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

  // Validate the parsed data against our enums
  if (!validSentiments.includes(parsed.sentiment)) {
    throw new Error(`Invalid sentiment received from API: ${parsed.sentiment}`);
  }
  if (!validTopics.includes(parsed.topic)) {
    throw new Error(`Invalid topic received from API: ${parsed.topic}`);
  }

  return parsed as { sentiment: Sentiment; topic: Topic };
}
