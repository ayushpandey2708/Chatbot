const socket = io();

socket.on('message', (data) => {
    displayMessage(data.sender, data.content);
});

function sendMessage() {
    const message = document.getElementById('message').value;
    if (message) {
        socket.emit('userMessage', { message });
        displayMessage('user', message);
        document.getElementById('message').value = '';
    }
}

function displayMessage(sender, message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');

    if (sender === 'user') {
        messageElement.classList.add('user-message');
    } else if (sender === 'bot') {
        messageElement.classList.add('bot-message');
    }

    messageElement.innerText = message;
    chatMessages.appendChild(messageElement);
}

document.addEventListener('DOMContentLoaded', () => {
    fetch('/message-history')
        .then(response => response.json())
        .then(messages => {
            const messageHistory = document.getElementById('message-history');
            console.log(messageHistory);

            messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.innerText = `${message.sender}: ${message.content}`;
                messageHistory.appendChild(messageElement);
            });
        })
        .catch(error => {
            console.error('Error fetching message history:', error);
        });
});

