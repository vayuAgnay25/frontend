import { useState, useEffect, useRef } from 'react'
import heroImg from './assets/user.svg'
import searchIcon from './assets/search.svg'
import addIcon from './assets/add.svg'
import mediaIcon from './assets/media.svg'
import logo from './assets/logo.svg'
import toggleIcon from './assets/toggle.svg'
import './App.css'
import { supabase } from './supabase'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

const tools = [
    { name: "Search", icon: searchIcon },
    { name: "New Chat", icon: addIcon },
    { name: "Media", icon: mediaIcon }
];

function App() {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef(null);

    const chatId = "default-chat"; // later you can make dynamic

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // ✅ Load messages from Supabase
    useEffect(() => {
        const loadMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('chat_id', chatId)
                .order('created_at', { ascending: true });

            if (data && data.length > 0) {
                const formatted = data.map(msg => ({
                    role: msg.role,
                    text: msg.content
                }));
                setMessages(formatted);
            } else {
                setMessages([
                    { role: "assistant", text: "Hello! I am your AI assistant. How can I help you today?" }
                ]);
            }
        };

        loadMessages();
    }, []);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userMessage = { role: "user", text: input };
        const newMessages = [...messages, userMessage];

        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            // ✅ Save user message
            await supabase.from('messages').insert([
                {
                    role: "user",
                    content: input,
                    chat_id: chatId
                }
            ]);

            const apiMessages = newMessages.map(m => ({
                role: m.role,
                content: m.text
            }));

            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-4.1-mini",
                    messages: apiMessages,
                    temperature: 0.7,
                    stream: true
                })
            });

            if (!response.body) throw new Error("No response body");

            const reader = response.body.getReader();
            const decoder = new TextDecoder("utf-8");

            let done = false;
            let fullText = "";

            // ✅ Add empty assistant message
            setMessages(prev => [...prev, { role: "assistant", text: "" }]);

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(line => line.trim() !== "");

                for (let line of lines) {
                    if (line === "data: [DONE]") {
                        done = true;
                        break;
                    }

                    if (line.startsWith("data: ")) {
                        const json = line.replace("data: ", "");

                        try {
                            const parsed = JSON.parse(json);
                            const content = parsed.choices?.[0]?.delta?.content;

                            if (content) {
                                fullText += content;

                                setMessages(prev => {
                                    const updated = [...prev];
                                    updated[updated.length - 1].text = fullText;
                                    return updated;
                                });
                            }
                        } catch (err) {
                            console.error("Stream parse error:", err);
                        }
                    }
                }
            }

            // ✅ Save AI response AFTER streaming ends
            await supabase.from('messages').insert([
                {
                    role: "assistant",
                    content: fullText,
                    chat_id: chatId
                }
            ]);

        } catch (error) {
            console.error("Error:", error);
            setMessages(prev => [
                ...prev,
                { role: "assistant", text: "Sorry, something went wrong." }
            ]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Clear chat
    const handleNewChat = async () => {
        await supabase
            .from('messages')
            .delete()
            .eq('chat_id', chatId);

        setMessages([
            { role: "assistant", text: "New chat started. How can I help?" }
        ]);
    };

    return (
        <div className="App">
            <nav>
                <div className="title">
                    <img src={logo} alt="logo" />
                    <button><img src={toggleIcon} alt="toggle" /></button>
                </div>

                <div className="toolbox">
                    <ul>
                        {tools.map((tool, idx) => (
                            <li key={idx} onClick={() => tool.name === "New Chat" && handleNewChat()}>
                                <a href="#">
                                    <img src={tool.icon} alt={tool.name} />
                                    <p>{tool.name}</p>
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="history">
                    <p className="history-label">Recent</p>
                </div>

                <button className="account">
                    <img src={heroImg} alt="User" />
                    <p>My Account</p>
                </button>
            </nav>

            <main className="chat-container">
                <div className="messages-list">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message-row ${msg.role}`}>
                            <div className="message-content">
                                <div className="avatar">
                                    <img src={msg.role === "user" ? heroImg : logo} alt="avatar" />
                                </div>
                                <div className="text-bubble">{msg.text}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                <div className="input-section">
                    <div className="input-wrapper">
                        <textarea
                            rows="1"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())
                            }
                            placeholder="Message AI..."
                        />
                        <button className="send-btn" onClick={handleSend} disabled={!input.trim()}>
                            ↑
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;