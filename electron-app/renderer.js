const { ipcRenderer } = require("electron");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

let openaiApiKey = "";

// Path to your keys.json file
const keysPath = path.join(__dirname, "../keys.json");

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

document.getElementById("send-prompt").addEventListener("click", () => {
  const prompt = document.getElementById("prompt-input").value;
  if (prompt && openaiApiKey) {
    sendPromptToOpenAI(prompt);
  } else {
    document.getElementById("response").innerText =
      "API key is missing or prompt is empty.";
  }
});

async function sendPromptToOpenAI(prompt) {
    try {
      // Adjust the request payload according to the Chat Completions API format
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {role: "system", content: "You are a helpful assistant."},
            {role: "user", content: prompt},
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${openaiApiKey}`,
          },
        }
      );
  
      // Update how you access the response since it's slightly different for chat completions
      console.log(response.data); // Log the full response
      document.getElementById("response").innerText =
        response.data.choices[0].message.content;
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      document.getElementById("response").innerText = "Error fetching response.";
    }
  }
