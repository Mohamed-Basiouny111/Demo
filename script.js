// ===============================
// script.js - Gemini Full Version
// نفس كل شيء كما هو + تحويل OpenAI إلى Gemini
// ===============================

// ⚠️ ضع مفتاح Gemini هنا
 const API_KEY = "AIzaSyCTThrJjvl9Gz9CVp7jU0vk_cnFC1BCArs";

// const API_KEY = "AIzaSyBPxFTQjJ4xTbaoWma2bPzVnKzK__ObOxQ";

// موديل Gemini
const MODEL = "gemini-2.5-flash";
// const MODEL = "gemini-2.5-pro";
// رسائل المحادثة
let messages = [
    { role: "system", content: "You are a helpful assistant." }
];

// عناصر الصفحة
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const newChatBtn = document.getElementById('newChatBtn');
const historyList = document.getElementById('historyList');

// سجل المحادثات
let chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
let currentChatId = null;


// ===============================
// إضافة رسالة للشات
// ===============================
function addMessage(role, text, timeOverride) {

    const d = document.createElement('div');
    d.className = 'message ' + role;

    const textSpan = document.createElement('span');
    textSpan.textContent = text;
    d.appendChild(textSpan);

    const meta = document.createElement('span');
    meta.className = 'meta';

    const time = timeOverride || new Intl.DateTimeFormat('en', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).format(new Date());

    meta.textContent = time;

    d.appendChild(meta);

    chatBox.appendChild(d);
    chatBox.scrollTop = chatBox.scrollHeight;
}


// ===============================
// حفظ المحادثة
// ===============================
function saveCurrentChatToHistory() {

    if (!messages || messages.length < 2) return;

    const chatId = currentChatId || Date.now().toString();

    const filtered = messages.filter(m =>
        m.role === 'user' || m.role === 'assistant'
    );

    if (filtered.length === 0) return;

    const title =
        filtered[0]?.content?.slice(0, 32) || 'Untitled Chat';

    const entry = {
        id: chatId,
        title,
        messages: filtered,
        time: new Date().toISOString()
    };

    chatHistory = chatHistory.filter(c => c.id !== chatId);
    chatHistory.unshift(entry);

    localStorage.setItem(
        'chatHistory',
        JSON.stringify(chatHistory)
    );

    currentChatId = chatId;

    renderHistoryList();
}


// ===============================
// عرض سجل المحادثات
// ===============================
function renderHistoryList() {

    historyList.innerHTML = '';

    if (chatHistory.length === 0) {

        const li = document.createElement('li');
        li.textContent = 'No previous chats.';
        li.style.color = '#6b7280';
        li.style.justifyContent = 'center';

        historyList.appendChild(li);
        return;
    }

    chatHistory.forEach(chat => {

        const li = document.createElement('li');

        const info = document.createElement('div');
        info.className = 'history-info';

        const title = document.createElement('span');
        title.className = 'history-title';
        title.textContent = chat.title;

        info.appendChild(title);

        const meta = document.createElement('span');
        meta.className = 'history-meta';

        const date = new Date(chat.time);

        meta.textContent =
            `${date.toLocaleDateString()} • ${date.toLocaleTimeString()} • ${chat.messages.length} msg`;

        info.appendChild(meta);

        const delBtn = document.createElement('button');
        delBtn.className = 'history-delete';
        delBtn.innerHTML = '🗑';

        delBtn.onclick = (e) => {
            e.stopPropagation();

            if (confirm('Delete this chat?')) {

                chatHistory =
                    chatHistory.filter(c => c.id !== chat.id);

                localStorage.setItem(
                    'chatHistory',
                    JSON.stringify(chatHistory)
                );

                renderHistoryList();
                showDeleteToast('Chat deleted');
            }
        };

        li.appendChild(info);
        li.appendChild(delBtn);

        li.onclick = () => loadChatFromHistory(chat.id);

        historyList.appendChild(li);
    });
}


// ===============================
// Toast
// ===============================
function showDeleteToast(msg) {

    const toast = document.createElement('div');

    toast.className = 'delete-toast';
    toast.textContent = msg;

    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}


// ===============================
// تحميل محادثة قديمة
// ===============================
function loadChatFromHistory(chatId) {

    const chat = chatHistory.find(c => c.id === chatId);
    if (!chat) return;

    chatBox.innerHTML = '';

    messages = [
        { role: "system", content: "You are a helpful assistant." },
        ...chat.messages
    ];

    chat.messages.forEach(m =>
        addMessage(m.role, m.content)
    );

    currentChatId = chatId;
}


// ===============================
// إرسال رسالة
// ===============================
async function sendMessage() {

    const text = userInput.value.trim();

    if (!text) return;

    userInput.value = '';

    addMessage('user', text);

    messages.push({
        role: 'user',
        content: text
    });

    sendBtn.disabled = true;
    sendBtn.innerText = '...';

    // رسالة البوت
    const botMessageDiv = document.createElement('div');
    botMessageDiv.className = 'message bot';

    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML =
        '<span></span><span></span><span></span>';

    botMessageDiv.appendChild(typingIndicator);

    const responseText = document.createElement('span');
    responseText.style.display = 'none';

    botMessageDiv.appendChild(responseText);

    chatBox.appendChild(botMessageDiv);

    const meta = document.createElement('span');
    meta.className = 'meta';

    meta.textContent =
        new Intl.DateTimeFormat('en', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date());

    botMessageDiv.appendChild(meta);

    try {

        // تحويل الرسائل لصيغة Gemini
        const geminiMessages = messages
            .filter(m => m.role !== "system")
            .map(m => ({
                role: m.role === "assistant"
                    ? "model"
                    : "user",
                parts: [
                    { text: m.content }
                ]
            }));

        const resp = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: geminiMessages,
                      generationConfig: {
                      maxOutputTokens: 300
                  }
                })
            }
        );

        const data = await resp.json();

        const fullResponse =
            data.candidates?.[0]?.content?.parts?.[0]?.text
            || "No response";

        // إزالة مؤشر الكتابة
        const typing =
            botMessageDiv.querySelector('.typing-indicator');

        if (typing) typing.remove();

        responseText.style.display = 'inline';
        responseText.textContent = fullResponse;

        chatBox.scrollTop = chatBox.scrollHeight;

        messages.push({
            role: 'assistant',
            content: fullResponse
        });

        saveCurrentChatToHistory();

    }
    catch (err) {

        responseText.style.display = 'inline';
        responseText.textContent =
            'Error: ' + err.message;
    }

    sendBtn.disabled = false;
    sendBtn.innerText = 'Send';

    chatBox.scrollTop = chatBox.scrollHeight;
}


// ===============================
// Events
// ===============================
sendBtn.onclick = sendMessage;

userInput.addEventListener('keydown', e => {

    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

newChatBtn.onclick = () => {

    saveCurrentChatToHistory();

    chatBox.innerHTML = '';

    messages = [
        { role: "system", content: "You are a helpful assistant." }
    ];

    currentChatId = null;

    addMessage(
        'bot',
        'Started a new conversation.'
    );
};


// ===============================
// تشغيل أولي
// ===============================
renderHistoryList();

addMessage(
    'bot',
    'Hello! Type any message and press Send.'
);