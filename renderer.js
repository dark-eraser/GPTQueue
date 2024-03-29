const { ipcRenderer } = require("electron");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const DOMPurify = require("dompurify")(window);
const { marked } = require("marked");


document.getElementById('go-back').addEventListener('click', () => {
    ipcRenderer.send('navigate-back');
});

document.getElementById('go-forward').addEventListener('click', () => {
    ipcRenderer.send('navigate-forward');
});


// Configure marked with highlight.js for code syntax highlighting
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : "plaintext";
    return hljs.highlight(code, { language }).value;
  },
});

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
  document
    .getElementById("prompt-input")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        e.preventDefault(); // Prevent the default action to stop from submitting a form if applicable
        sendPromptHandler(); // Call the same function as when clicking the send button
      }
    });
});

document
  .getElementById("prompt-input")
  .addEventListener("keypress", function (e) {
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

// This function is updated to push each conversation to the array
// and calls the function to render the conversations list
// Enhanced to optionally continue an existing conversation
async function sendPromptToOpenAI(prompt, conversationId = null) {
  const model = document.getElementById("modelSelector").value;
  let messages = [
    {
      role: "system",
      content: "You are a helpful assistant.",
    },
    {
      role: "user",
      content: prompt,
    },
  ];

  // If continuing a conversation, append the new prompt to its messages
  if (conversationId !== null) {
    const conversation = conversations[conversationId];
    messages = [...conversation.messages, ...messages];
  }

  try {
    const response = await axios.post(
      `https://api.openai.com/v1/chat/completions`,
      { model: model, messages: messages },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`,
        },
      }
    );

    const newMessage = {
      role: "user",
      content: prompt,
    };
    const newResponse = {
      role: "assistant",
      content: response.data.choices[0].message.content,
    };

    // Update or create a conversation
    if (conversationId !== null) {
      conversations[conversationId].messages.push(newMessage, newResponse);
    } else {
      conversations.push({
        messages: [newMessage, newResponse],
      });
    }

    renderConversations();
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
    listItem.addEventListener("click", () => showConversationDetails(index));
    listContainer.appendChild(listItem);
  });
}
document.getElementById("test-continue").addEventListener("click", testContinue);

function testContinue() {
    ipcRenderer.send("navigate-to-test", "test.html");
}


function showConversationDetails(index) {

  const existingContainer = document.getElementById(
    `conversationContainer-${index}`
  );
  let container;
  if (!existingContainer) {
    container = document.createElement("div");
    container.id = `conversationContainer-${index}`;
    container.classList.add("conversation-container");
    document
      .getElementById("conversationDetailsContainer")
      .appendChild(container);

    const messagesContainer = document.createElement("div");
    messagesContainer.id = `messagesContainer-${index}`;
    container.appendChild(messagesContainer);

    const continueBtn = document.createElement("button");
    continueBtn.textContent = "Continue Conversation";
    continueBtn.id = `continueBtn-${index}`; // Assign an id if needed
    // Attach an event listener directly to the button
    continueBtn.addEventListener("click", () => {
      const conversationState = {
        conversationId: index,
        messages: conversations[index].messages,
      };
      const stateString = JSON.stringify(conversationState);

      ipcRenderer.send("navigate-to-new-conversation", "new_conversation.html");
      ipcRenderer.on("request-conversationState", (event) => {
        event.reply(
          "response-conversationState",
          global.sharedState.conversationState
        );
      });
    });
    container.appendChild(continueBtn);
  } else {
    container = existingContainer;
    console.log("Reusing existing container");
  }

  const messagesContainer = document.getElementById(
    `messagesContainer-${index}`
  );
  messagesContainer.innerHTML = ""; // Clear previous messages

  const conversation = conversations[index];
  if (conversation) {
    conversation.messages.forEach((msg) => {
      const msgElement = document.createElement("p");
      const roleStrong = document.createElement("strong");
      roleStrong.textContent = `${msg.role}: `;
      msgElement.appendChild(roleStrong);
      // Sanitize and set marked content as HTML directly
      msgElement.innerHTML += DOMPurify.sanitize(marked(msg.content));
      messagesContainer.appendChild(msgElement);
    });
    hljs.highlightAll();
  }
}
