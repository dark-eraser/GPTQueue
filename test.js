const { ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");
const DOMPurify = require("dompurify")(window);
const { marked } = require("marked");

document.getElementById("go-back").addEventListener("click", () => {
  ipcRenderer.send("navigate-back");
});

document.getElementById("go-forward").addEventListener("click", () => {
  const statePath = path.join(__dirname, "state.json");
  fs.writeFileSync(statePath, JSON.stringify(currentState), "utf8");
  ipcRenderer.send("navigate-forward");
});
let conversations = [];

// When the new page loads, request the conversation state
ipcRenderer.send("request-conversation-state");

// Listen for the response with the conversation state
ipcRenderer.on("response-conversation-state", (event, state) => {
  console.log("Received conversation state:", state);
  if (state) {
    console.log("Received conversation state:", state);
    conversations = [state];
    renderConversations();
  }
});

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
      saveConversation(index);
      console.log("Sending conversation state:", stateString);
      ipcRenderer.on("request-conversation-state", (event) => {
        global.sharedState.conversationState = stateString;
        event.reply("response-conversation-state", stateString);
      });
      ipcRenderer.send("navigate-to-new-conversation", "test.html");
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

document.getElementById("send-prompt").addEventListener("click", () => {
  const promptInput = document.getElementById("prompt-input");
  const prompt = promptInput.value;
  if (prompt) {
    sendPromptToOpenAI(prompt, state.conversationId);
    promptInput.value = ""; // Clear input field after sending
  }
});

// Define the sendPromptToOpenAI function as you did in the original page
// This should use IPC to send the prompt back to the main process and handle the response
