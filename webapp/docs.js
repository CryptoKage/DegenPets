document.addEventListener('DOMContentLoaded', () => {
  const displayEl = document.getElementById('aiMessageDisplay');
  const inputEl   = document.getElementById('aiUserInput');
  const sendBtn   = document.getElementById('aiSendBtn');

  // conversation history for context
  const history = [];

  async function sendQuestion() {
    const question = inputEl.value.trim();
    if (!question) return;

    // append user message
    const userMsg = document.createElement('p');
    userMsg.innerHTML = `<strong>You:</strong> ${question}`;
    displayEl.append(userMsg);
    displayEl.scrollTop = displayEl.scrollHeight;

    inputEl.value = '';
    sendBtn.disabled = true;

    try {
      const response = await fetch('/api/ask-docs-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Server error');
      }

      const { answer } = await response.json();

      // append AI response
      const aiMsg = document.createElement('p');
      aiMsg.innerHTML = `<strong>AI:</strong> ${answer}`;
      displayEl.append(aiMsg);
      displayEl.scrollTop = displayEl.scrollHeight;

      // update history for context
      history.push({ user: question, ai: answer });

    } catch (err) {
      console.error(err);
      const errMsg = document.createElement('p');
      errMsg.innerHTML = `<strong style="color:red">Error:</strong> ${err.message}`;
      displayEl.append(errMsg);
      displayEl.scrollTop = displayEl.scrollHeight;

    } finally {
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  sendBtn.addEventListener('click', sendQuestion);

  // allow Enter to send
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  });
});
