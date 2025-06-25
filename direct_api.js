// Direct API call to Google Gemini API using fetch
import fetch from 'node-fetch';

const GEMINI_API_KEY = "AIzaSyCyKYpN8A_30rH3MdSkT9GH5egBGXzZ9LI";
const MODEL = "gemini-2.5-flash";

async function generateContent(prompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));
    
    if (data.candidates && data.candidates.length > 0 && 
        data.candidates[0].content && data.candidates[0].content.parts && 
        data.candidates[0].content.parts.length > 0) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.log("No valid response content found");
      return null;
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

// Test the API
async function main() {
  console.log("Testing direct API call to Gemini...");
  const result = await generateContent("Write a short poem about the moon.");
  
  if (result) {
    console.log("\nGenerated content:");
    console.log(result);
  }
}

main(); 