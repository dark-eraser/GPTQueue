const { ipcRenderer } = require("electron");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

let openaiApiKey = "";

// Path to your keys.json file
const keysPath = path.join(__dirname, "keys.json");
function clearInputField() {
    document.getElementById("prompt-input").value = "";
  }
  
// Function to load API key from keys.json
function loadApiKey() {
  try {
    const data = fs.readFileSync(keysPath);
    const keys = JSON.parse(data);
    openaiApiKey = keys.OPENAI_API_KEY;
  } catch (error) {
    console.error("Error reading the keys.json file:", error);
  }
}

// Call loadApiKey when the script loads
loadApiKey();

function sendPromptHandler() {
    const prompt = document.getElementById("prompt-input").value;
    if (prompt && openaiApiKey) {
      sendPromptToOpenAI(prompt);
      clearInputField(); // Clear the input field after sending the prompt
    } else {
      document.getElementById("response").innerText = "API key is missing or prompt is empty.";
    }
  }
  
  // Enable sending prompt with Enter key
  document.getElementById("prompt-input").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent the default action to stop from submitting a form if applicable
      sendPromptHandler(); // Call the same function as when clicking the send button
    }
  });

async function sendPromptToOpenAI(prompt) {
  const model = document.getElementById("modelSelector").value; // Get the selected model
  const apiKey = ""; // Your OpenAI API Key

  try {
    const response = await axios.post(
      `https://api.openai.com/v1/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    console.log(response.data); // Log the response
    document.getElementById("response").innerText =
      response.data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    document.getElementById("response").innerText = "Error fetching response.";
  }
}
