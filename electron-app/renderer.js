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

document.getElementById("send-prompt").addEventListener("click", () => {
  const prompt = document.getElementById("prompt-input").value;
  if (prompt && openaiApiKey) {
    sendPromptToOpenAI(prompt);
    clearInputField();
  } else {
    document.getElementById("response").innerText =
      "API key is missing or prompt is empty.";
  }
  document.getElementById("prompt-input").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      e.preventDefault(); // Prevent the default action to stop from submitting a form if applicable
      sendPromptHandler(); // Call the same function as when clicking the send button
    }
  });
});

document.getElementById("prompt-input").addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        e.preventDefault(); // Prevent the default action to stop from submitting a form if applicable
        const prompt = document.getElementById("prompt-input").value;
        if (prompt && openaiApiKey) {
            sendPromptToOpenAI(prompt);
            clearInputField();
        }
    }
});


// Assuming you have an empty array to store conversations
let conversations = [];
let currentConversationId = null;

// This function is updated to push each conversation to the array
// and calls the function to render the conversations list
async function sendPromptToOpenAI(prompt) {
  const model = document.getElementById("modelSelector").value;

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

    // Store each conversation in an array
    conversations.push({
      prompt: prompt,
      response: response.data.choices[0].message.content,
    });

    renderConversations(); // Call this function to update the UI
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
  }
}

// This function renders the conversations as clickable list items
function renderConversations() {
    const listContainer = document.getElementById("conversationsList");
    listContainer.innerHTML = ""; // Clear existing items

    conversations.forEach((conversation, index) => {
        const listItem = document.createElement("li");
        listItem.classList.add("list-group-item");
        listItem.textContent = `Conversation ${index + 1}`;
        listItem.setAttribute("style", "cursor: pointer;");
        listItem.onclick = () => showConversationDetails(index); // Show details when clicked
        listContainer.appendChild(listItem);
    });
}

// This function shows the selected conversation's details
function showConversationDetails(index) {
  const detailsContainer = document.getElementById("conversationDetails");
  const conversation = conversations[index];
  detailsContainer.innerHTML = `<p><strong>Prompt:</strong> ${conversation.prompt}</p><p><strong>Response:</strong> ${conversation.response}</p>`;
}

