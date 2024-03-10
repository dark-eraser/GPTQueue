import tkinter as tk
from tkinter import scrolledtext, Listbox
import threading
from openai import OpenAI
import queue
import json
# Initialize the OpenAI client with your API key
with open('keys.json') as f:
    client = OpenAI(api_key=json.load(f)["OPENAI_API_KEY"])


class GPTApp:
    def __init__(self, master):
        self.master = master
        self.prompt_queue = queue.Queue()
        self.prompts_responses = []  # List to store (prompt, response) tuples
        self.init_ui()
        self.process_thread = threading.Thread(target=self.process_prompts, daemon=True)
        self.process_thread.start()

    def init_ui(self):
        self.master.title("GPT Prompt Processor")
        self.frame = tk.Frame(self.master)
        
        # Listbox for history of prompts
        self.history_listbox = Listbox(self.master, height=10, width=50, activestyle='dotbox', bg='white', borderwidth=2, font=('Arial', 12))
        self.history_listbox.pack(padx=10, pady=10)
        self.history_listbox.bind('<<ListboxSelect>>', self.on_prompt_select)
        
        # Input for new prompts
        self.prompt_entry = tk.Entry(self.master, width=50)
        self.prompt_entry.pack(padx=10, pady=10)
        
        # Button to add prompts to the queue
        self.add_button = tk.Button(self.master, text="Add Prompt", command=self.add_prompt)
        self.add_button.pack(padx=10, pady=5)
        
        # Display area for the selected prompt's response
        self.response_area = scrolledtext.ScrolledText(self.master, wrap=tk.WORD, width=60, height=10)
        self.response_area.pack(padx=10, pady=10)

    def add_prompt(self):
        prompt = self.prompt_entry.get()
        if prompt:
            self.prompt_queue.put(prompt)
            self.prompt_entry.delete(0, tk.END)

    def process_prompts(self):
        while True:
            if not self.prompt_queue.empty():
                prompt = self.prompt_queue.get()
                response = client.chat.completions.create(messages=[{"role": "user", "content": prompt}], model="gpt-3.5-turbo", max_tokens=150)
                response_text = response.choices[0].message.content
                self.show_response(prompt, response_text)

    def show_response(self, prompt, response):
        self.prompts_responses.append((prompt, response))
        def _update_ui():
            self.history_listbox.insert(tk.END, prompt[:50])  # Add prompt to history list
        self.master.after(0, _update_ui)

    def on_prompt_select(self, event):
        widget = event.widget
        selection = widget.curselection()
        if selection:
            index = selection[0]
            prompt, response = self.prompts_responses[index]
            self.response_area.delete(1.0, tk.END)  # Clear previous response
            self.response_area.insert(tk.END, f"Prompt: {prompt}\n\nResponse: {response}")  # Show selected prompt's response

if __name__ == "__main__":
    root = tk.Tk()
    app = GPTApp(root)
    root.mainloop()
