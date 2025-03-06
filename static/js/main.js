let messageHistory = [];
let isWaitingForResponse = false;

document.getElementById('send-button').addEventListener('click', sendMessage);
document.getElementById('user-input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

function createMessageElement(content, isUser) {
    const container = document.createElement('div');
    container.className = `message-container ${isUser ? 'user-container' : ''}`;

    // 添加头像
    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = isUser ? '/static/images/user-avatar.png' : '/static/images/ai-avatar.png';
    avatar.alt = isUser ? 'User Avatar' : 'AI Avatar';

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    messageDiv.textContent = content;

    container.appendChild(avatar);
    container.appendChild(messageDiv);
    return container;
}

function createTypingIndicator() {
    const container = document.createElement('div');
    container.className = 'message-container';

    const avatar = document.createElement('img');
    avatar.className = 'avatar';
    avatar.src = '/static/images/ai-avatar.png';
    avatar.alt = 'AI Avatar';

    const indicator = document.createElement('div');
    indicator.className = 'typing-indicator';
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        indicator.appendChild(dot);
    }

    container.appendChild(avatar);
    container.appendChild(indicator);
    return container;
}

async function sendMessage() {
    if (isWaitingForResponse) return;

    const input = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const messagesContainer = document.getElementById('chat-messages');
    const message = input.value.trim();
    const selectedStrategy = document.getElementById('search-strategy').value;
    
    if (!message) return;
    
    // 添加用户消息到界面
    messagesContainer.appendChild(createMessageElement(message, true));
    
    // 添加用户消息到历史记录
    messageHistory.push({"role": "user", "content": message});
    
    // 清空输入框并禁用
    input.value = '';
    input.disabled = true;
    input.classList.add('input-disabled');
    sendButton.disabled = true;
    isWaitingForResponse = true;

    // 添加输入指示器
    const typingIndicator = createTypingIndicator();
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: messageHistory,
                strategy: selectedStrategy
            })
        });
        
        const data = await response.json();
        
        // 移除输入指示器
        typingIndicator.remove();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const aiResponse = data.choices[0].message.content;
        messageHistory.push({"role": "assistant", "content": aiResponse});
        
        // 添加AI回复到界面
        messagesContainer.appendChild(createMessageElement(aiResponse, false));
        
    } catch (error) {
        // 移除输入指示器
        typingIndicator.remove();
        console.error('Error:', error);
        messagesContainer.appendChild(createMessageElement('抱歉，发生了错误，请稍后重试。', false));
    } finally {
        // 重新启用输入
        input.disabled = false;
        input.classList.remove('input-disabled');
        sendButton.disabled = false;
        isWaitingForResponse = false;
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// 监听策略选择变化
document.getElementById('search-strategy').addEventListener('change', function() {
    // 清空消息历史
    messageHistory = [];
    // 清空聊天界面
    document.getElementById('chat-messages').innerHTML = '';
});
