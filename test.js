import { GoogleGenAI } from '@google/genai';

// Access your API key as an environment variable
const GEMINI_API_KEY = "AIzaSyCyKYpN8A_30rH3MdSkT9GH5egBGXzZ9LI";

// Create a client with your API key
const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

// For text-only input, use the gemini-pro model
async function run() {
  try {
    // For text-only input, use the gemini-pro model
    const model = ai.models.get("gemini-2.5-flash");

    const prompt = "Write a story about a magic backpack.";

    const result = await model.generateContent({
      contents: [{text: prompt}]
    });
    
    console.log(result);
    console.log("\nResponse object keys:", Object.keys(result));
    
    if (result.response) {
      console.log("\nResponse text:", result.response.text());
    } else {
      console.log("\nFull response:", JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

run(); 