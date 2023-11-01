const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);


mongoose.connect('mongodb://localhost:27017/chatbot', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const openaiApiKey = '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';
const openaiEndpoint = 'https://api.openai.com/v1/chat/completions';


const Message = require('./models/message');

app.use(express.static(__dirname + '/public'));
app.use(express.json());


// Socket.io configuration
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('userMessage', (data) => {
        const userMessage = new Message({
            sender: 'user',
            content: data.message,
            timestamp: new Date(),
        });
        userMessage.save();


        sendMessageToOpenAI(data.message)
            .then((response) => {
                const botMessage = new Message({
                    sender: 'bot',
                    content: response,
                    timestamp: new Date(),
                });
                botMessage.save();

                io.emit('message', {
                    sender: 'bot',
                    content: response,
                });
            })
            .catch((error) => {
                botMessage = new Message({ "sender": 'bot', "content": "Please upgrade your plan for further use.", "timestamp": new Date() })
                botMessage.save();
                io.emit('message', {
                    sender: 'bot',
                    content: botMessage.content,
                });
                console.error('Error sending message to OpenAI:', error);
            });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});



async function sendMessageToOpenAI(userMessage) {
    try {
        const response = await axios.post(openaiEndpoint, {
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: 'You are a helpful assistant.' },
                { role: 'user', content: userMessage }
            ],
        }, {
            headers: {
                'Authorization': `Bearer ${openaiApiKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.data.choices && response.data.choices.length > 0) {
            const botReply = response.data.choices[0].message.content;
            return botReply;
        } else {
            return 'No response from OpenAI.';
        }
    } catch (error) {
        console.error('Error communicating with OpenAI:', error);
        throw error;
    }
}




app.get('/message-history', async (req, res) => {
    try {
        const messages = await Message.find(); 
        res.json(messages);
    } catch (error) {
        console.error('Error fetching message history:', error);
        res.status(500).json({ error: 'Error fetching message history' });
    }
});




server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
