// webapp/docs.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Docs Page Script Initialized");

    const chatDisplay = document.getElementById('aiMessageDisplay');
    const userInput = document.getElementById('aiUserInput');
    const sendBtn = document.getElementById('aiSendBtn');
    const chatForm = document.getElementById('aiChatForm'); // Assuming your input and button are in a form

    let chatHistory = []; // To store conversation context for the API

    // Function to append a message to the chat display
    function appendMessage(text, sender, isLoading = false) {
        if (!chatDisplay) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');

        if (isLoading) {
            messageDiv.classList.add('ai-message-chat', 'loading-indicator'); // Specific class for loading
            messageDiv.innerHTML = `
                <img src="/PetPromos/Crabpromo.png" alt="Thinking Crab" style="width:40px; height:auto; vertical-align:middle; margin-right:10px;">
                <span>DegenBot is processing...</span>
            `;
        } else if (sender === 'user') {
            messageDiv.classList.add('user-message-chat');
            const userPrefix = document.createElement('strong');
            userPrefix.textContent = "You: ";
            messageDiv.appendChild(userPrefix);
            messageDiv.appendChild(document.createTextNode(text)); // Use textNode for user input for security
        } else { // 'ai'
            messageDiv.classList.add('ai-message-chat');
            const aiPrefix = document.createElement('strong');
            aiPrefix.textContent = "AI: ";
            messageDiv.appendChild(aiPrefix);

            // Basic Markdown link conversion: [Title](URL) -> <a href="URL" target="_blank">Title</a>
            // For more complex Markdown, a proper library would be better.
            const linkedText = text.replace(
                /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
                '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
            );
            const textSpan = document.createElement('span');
            textSpan.innerHTML = linkedText; // Use innerHTML to render the <a> tags
            messageDiv.appendChild(textSpan);
        }

        chatDisplay.appendChild(messageDiv);
        // Scroll to the bottom of the chat display
        chatDisplay.scrollTop = chatDisplay.scrollHeight;
        return messageDiv; // Return the div if we need to remove it (for loading indicator)
    }

    // Function to handle sending a message
    async function sendMessage() {
        if (!userInput || !sendBtn || !chatDisplay) return;

        const question = userInput.value.trim();
        if (!question) return;

        appendMessage(question, 'user');
        userInput.value = ''; // Clear input field
        sendBtn.disabled = true;
        userInput.disabled = true;

        const loadingMessageDiv = appendMessage("Thinking...", 'ai', true); // Show loading indicator

        try {
            console.log("Sending to API:", { question, history: chatHistory });
            const response = await fetch('/api/ask-docs-agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: question,
                    history: chatHistory // Send previous turns for context
                }),
            });

            if (loadingMessageDiv) loadingMessageDiv.remove(); // Remove loading indicator

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Server error with non-JSON response." }));
                console.error("API Error Response:", errorData);
                appendMessage(errorData.error || `Error: ${response.status}`, 'ai');
                // Add to history as a failed AI turn
                chatHistory.push({ user: question, ai: errorData.error || `Error: ${response.status}` });
                return;
            }

            const data = await response.json();
            if (data.error) {
                console.error("API returned an error object:", data.error);
                appendMessage(data.error, 'ai');
                chatHistory.push({ user: question, ai: data.error }); // Add to history
            } else if (data.answer) {
                appendMessage(data.answer, 'ai');
                chatHistory.push({ user: question, ai: data.answer }); // Add successful turn to history
            } else {
                appendMessage("Sorry, I received an unexpected response.", 'ai');
                 chatHistory.push({ user: question, ai: "Unexpected response." });
            }

        } catch (error) {
            console.error("Fetch error sending message:", error);
            if (loadingMessageDiv) loadingMessageDiv.remove(); // Ensure loading removed on fetch error
            appendMessage(`Sorry, there was an error connecting to the AI assistant: ${error.message}`, 'ai');
             chatHistory.push({ user: question, ai: `Connection error: ${error.message}` });
        } finally {
            sendBtn.disabled = false;
            userInput.disabled = false;
            userInput.focus(); // Put focus back to input
            // Limit chat history length to prevent overly large payloads
            if (chatHistory.length > 10) { // Keep last 5 Q/A pairs (10 items)
                chatHistory = chatHistory.slice(-10);
            }
        }
    }

    // Event listeners
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    if (chatForm) { // Handle Enter key submission if input is in a form
        chatForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevent default form submission
            sendMessage();
        });
    } else if (userInput) { // Fallback if not in a form, listen for Enter on input
         userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Prevent newline in input
                sendMessage();
            }
        });
    }

    // Initial greeting or focus
    if (userInput) userInput.focus();
    // The initial AI greeting is now part of docs.html static content
    // appendMessage("Hello! I'm the Degen Pets AI Assistant. How can I help you explore the docs?", 'ai');

     // --- Optional: Mobile Menu Toggle Logic (if header structure is consistent) ---
    const menuToggleDocs = document.getElementById('mobile-menu-toggle');
    const navLinksDocs = document.getElementById('nav-links');
    if(menuToggleDocs && navLinksDocs) {
        console.log("DEBUG: Attaching mobile menu listener for docs page.");
        menuToggleDocs.addEventListener('click', () => {
            navLinksDocs.classList.toggle('active');
            menuToggleDocs.classList.toggle('is-active');
        });
        // Close menu when a link is clicked (if it's a page navigation)
        navLinksDocs.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                if (navLinksDocs.classList.contains('active')) {
                     // Only close if it's not just an anchor link on the same page
                     if (!link.getAttribute('href').startsWith('#') || link.getAttribute('href').length > 1) {
                        navLinksDocs.classList.remove('active');
                        menuToggleDocs.classList.remove('is-active');
                     }
                }
            });
       });
    } else {
         if (!menuToggleDocs) console.warn("Mobile menu toggle not found on docs page.");
         if (!navLinksDocs) console.warn("Nav links container not found on docs page.");
    }
    // --- End Mobile Menu ---


}); // End DOMContentLoaded