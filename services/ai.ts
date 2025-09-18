
import { GoogleGenAI } from "@google/genai";
import { Product, Insight } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export async function* generateDynamicInsights(products: Product[], language: string): AsyncGenerator<Insight> {
  if (!products || products.length === 0) {
    yield { icon: 'add_shopping_cart', title: 'Add Your First Product', description: 'Add products to your catalog to start getting AI insights.' };
    return;
  }

  const simplifiedProducts = products.map(({ name, stock, price }) => ({ name, stock, price }));
  
  let languageName: string;
  switch (language) {
    case 'hi':
      languageName = 'Hindi';
      break;
    case 'ur':
      languageName = 'Urdu';
      break;
    case 'ta':
      languageName = 'Tamil';
      break;
    case 'pa':
      languageName = 'Punjabi';
      break;
    case 'gu':
      languageName = 'Gujarati';
      break;
    case 'kn':
      languageName = 'Kannada';
      break;
    default:
      languageName = 'English';
      break;
  }
  
  const systemInstruction = `You are an expert AI business advisor for a small Kirana (grocery) store owner in India. Your task is to generate five creative, actionable, and concise insights based on their inventory. The store owner is not technical, so make the advice easy to understand.

**RESPONSE FORMAT RULES (MANDATORY):**
*   You MUST provide EXACTLY FIVE insights.
*   Each insight MUST be a single, valid JSON object on its own line. Use newline characters ('\\n') to separate them.
*   DO NOT use markdown (like \`\`\`json), and DO NOT wrap the list in a JSON array \`[]\`.
*   Each JSON object must have three keys: "icon", "title", and "description".
*   The text for "title" and "description" MUST be in the ${languageName} language.

**ICON SELECTION:**
For the "icon" key, you MUST use one of these Material Symbols Outlined names: 'warning', 'lightbulb', 'local_fire_department', 'trending_up', 'inventory', 'sell', 'groups'. Choose the most relevant icon for each insight.

**INSIGHT GUIDELINES:**
Generate a mix of insights. At least one should be a low-stock alert if any product has 10 or fewer items. For the others, be creative. Think about combo deals, seasonal trends (like weather or festivals in India), sales forecasts, and customer engagement tips. Your advice should be practical and highly relevant to a small store in India.`;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents: `Here is the current inventory data: ${JSON.stringify(simplifiedProducts)}. Please generate 5 insights based on this data.`,
      config: {
        systemInstruction
      },
    });

    let buffer = '';
    for await (const chunk of responseStream) {
        buffer += chunk.text;
        let newlineIndex;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
            const line = buffer.substring(0, newlineIndex).trim();
            buffer = buffer.substring(newlineIndex + 1);
            if (line) {
                try {
                    const insight: Insight = JSON.parse(line);
                    yield insight;
                } catch (e) {
                    console.warn("Could not parse insight from stream:", line, e);
                }
            }
        }
    }
    // Process any remaining part of the buffer
    if (buffer.trim()) {
        try {
            const insight: Insight = JSON.parse(buffer.trim());
            yield insight;
        } catch (e) {
            console.warn("Could not parse final insight from stream:", buffer.trim(), e);
        }
    }

  } catch (error) {
    console.error("Error generating AI insights:", error);
    
    const errorString = JSON.stringify(error);
    let title = 'Could Not Fetch Insights';
    let description = 'There was an issue connecting to the AI service. Please try again later.';

    if (errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED')) {
      title = 'AI Quota Exceeded';
      description = 'You have used your daily AI insights quota. Please check your plan to upgrade.';
    }
    
    yield { icon: 'error', title, description };
  }
};