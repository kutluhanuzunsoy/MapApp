let currentMessageTimeout = null;

export function showTemporaryMessage(message) {
  if (currentMessageTimeout) {
    clearTimeout(currentMessageTimeout);
    const existingMessage = document.querySelector('.temporary-message');
    if (existingMessage) {
      document.body.removeChild(existingMessage);
    }
  }

  const messageElement = document.createElement("div");
  messageElement.className = "temporary-message";
  messageElement.textContent = message;
  document.body.appendChild(messageElement);

  currentMessageTimeout = setTimeout(() => {
    document.body.removeChild(messageElement);
    currentMessageTimeout = null;
  }, 2000);
}