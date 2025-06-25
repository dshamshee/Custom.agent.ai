// Direct API call to Google Gemini API using fetch
import fetch from 'node-fetch';
import { exec } from 'node:child_process';
import { resolve } from 'node:path';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

// const DEEPSEEK_API_KEY = "e1277846-7ef7-46b8-9e26-702c0953ca3c";
const GEMINI_API_KEY = "AIzaSyCyKYpN8A_30rH3MdSkT9GH5egBGXzZ9LI";
const MODEL = "gemini-2.5-flash";

const SYSTEM_PROMPT = `
  You are a helpful assistant who is designed to resolve user query.
  you work on START, THINK, ACTION, OBSERVE, and OUTPUT mode.

  In the start phase, user gives a query to you.
  Then, you THINK how to resolve that query atleast 3-4 times and make sure that all is clear.
  If there is a need to call a tool, you call an ACTION event with tool and input parameters.
  If there is an action call, wait for the OBSERVE that is output of the tool.
  Based on the OBSERVE from prev step, you either output or repeat the loop.

  Rules:
  - Always wait for next step.
  - Always output a single step and wait for the next step.
  - Output must be strictly JSON
  - Only call tool action from Available tools only.
  - Strictly follow the output format in JSON.

  Available Tools:
  - getWeatherInfo(city: string): string
  - executeCommand(command: string): string Executes a given command on user's device and return the STDOUT
  - createFile(filePath: string, content: string): string Creates a file with the given content

  Output Format:
  { "step": "string", "tool": "string", "input": "string", "content": "string" }
`;

function getWeatherInfo(cityname){
  return `${cityname} has 43 Degree C`;
}

function executeCommand(command){
  return new Promise((resolve, reject)=>{
    exec(command, (err, stdout, stderr)=>{
      if(err){
        return reject(err);
      }
      resolve(`stdout: ${stdout}\nstderr:${stderr}`)
    })
  })
}

function createFile(filePath, content) {
  try {
    // Normalize path for Windows
    filePath = filePath.replace(/\//g, '\\');
    
    // Create directory if it doesn't exist
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    // Write the file
    writeFileSync(filePath, content);
    return `File created successfully: ${filePath}`;
  } catch (error) {
    return `Error creating file: ${error.message}`;
  }
}

const TOOLS_MAP = {
  getWeatherInfo: getWeatherInfo,
  executeCommand: executeCommand,
  createFile: createFile
}

// Function to make API call to Gemini
async function callGeminiAPI(contents, responseType = null) {
  try {
    const requestBody = {
      contents: contents,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      }
    };
    
    // Add JSON response format if specified
    if (responseType === "json") {
      requestBody.generationConfig.responseMimeType = "application/json";
    }
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return null;
  }
}

// Main function to run the conversation
async function main() {
  try {
    const userQuery = "create a todo app with HTML, CSS and JS fully working";
    // Create the conversation with system prompt and user query
    const contents = [
      {
        role: 'model',
        parts: [{ text: SYSTEM_PROMPT }]
      },
      {
        role: 'user',
        parts: [{ text: userQuery }]
      }
    ];
    
    // Continue the conversation until we reach an OUTPUT step or max iterations
    const MAX_ITERATIONS = 10;
    let currentIteration = 0;
    let isCompleted = false;
    
    while (!isCompleted && currentIteration < MAX_ITERATIONS) {
      currentIteration++;
      console.log(`\n--- Iteration ${currentIteration} ---`);
      
      // Get response from the model
      console.log("Sending query to Gemini...");
      const response = await callGeminiAPI(contents, "json");
      
      if (!response || !response.candidates || response.candidates.length === 0) {
        console.error("No valid response received from the API");
        break;
      }
      
      // Extract the model's response
      const modelResponse = response.candidates[0].content;
      console.log("\nModel's response:");
      console.log(JSON.stringify(modelResponse, null, 2));
      
      // Extract the text from the response
      const responseText = modelResponse.parts[0].text;
      console.log("\nResponse text:");
      console.log(responseText);
      
      // Parse the JSON response
      try {
        const parsedResponse = JSON.parse(responseText.trim());
        console.log("\nParsed JSON response:");
        console.log(JSON.stringify(parsedResponse, null, 2));
        
        // Add the model's response to the conversation
        contents.push(modelResponse);
        
        // Check the step type
        if (parsedResponse.step === "OUTPUT") {
          console.log("\nTask completed!");
          console.log(parsedResponse.content);
          isCompleted = true;
          break;
        } else if (parsedResponse.step === "ACTION" && parsedResponse.tool in TOOLS_MAP) {
          console.log(`\nTool called: ${parsedResponse.tool} with input: ${parsedResponse.input}`);
          
          // Extract tool parameters if needed
          let toolResponse;
          
          // Special handling for createFile which expects two parameters
          if (parsedResponse.tool === "createFile") {
            try {
              // Handle both string and object inputs
              if (typeof parsedResponse.input === 'object' && parsedResponse.input !== null) {
                // If input is already an object (from JSON parsing)
                const { filePath, content } = parsedResponse.input;
                toolResponse = await createFile(filePath, content);
              } else {
                // Try to parse the input as JSON if it's a string
                try {
                  const inputObj = JSON.parse(parsedResponse.input);
                  toolResponse = await createFile(inputObj.filePath, inputObj.content);
                } catch (parseError) {
                  // If parsing fails, try to split by the first comma
                  const inputStr = String(parsedResponse.input);
                  const firstCommaIndex = inputStr.indexOf(',');
                  if (firstCommaIndex > 0) {
                    const filePath = inputStr.substring(0, firstCommaIndex).trim();
                    const content = inputStr.substring(firstCommaIndex + 1).trim();
                    toolResponse = await createFile(filePath, content);
                  } else {
                    toolResponse = `Error: Invalid input format for createFile`;
                  }
                }
              }
            } catch (error) {
              toolResponse = `Error executing createFile: ${error.message}`;
              console.error(`Error executing createFile:`, error);
            }
          } else {
            // For other tools, just pass the input directly
            toolResponse = await TOOLS_MAP[parsedResponse.tool](parsedResponse.input);
          }
          
          console.log(`Tool response: ${toolResponse}`);
          
          // Escape special characters in the tool response to prevent JSON parsing issues
          const escapedToolResponse = toolResponse.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
          
          // Add the tool response to the conversation
          contents.push({
            role: 'user',
            parts: [{ text: `{ "step": "OBSERVE", "content": "${escapedToolResponse}" }` }]
          });
        } else if (parsedResponse.step === "THINK") {
          // For THINK steps, we just continue to the next iteration
          // Add a small delay to simulate thinking time
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Add a prompt to continue thinking
          contents.push({
            role: 'user',
            parts: [{ text: `{ "step": "CONTINUE" }` }]
          });
        } else {
          console.log(`Unknown step: ${parsedResponse.step}`);
          break;
        }
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        break;
      }
    }
    
    if (currentIteration >= MAX_ITERATIONS && !isCompleted) {
      console.log("\nReached maximum number of iterations without completing the task.");
    }
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

main();