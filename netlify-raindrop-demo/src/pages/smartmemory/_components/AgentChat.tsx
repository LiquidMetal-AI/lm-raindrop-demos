import { useState, useEffect } from 'react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface Timings {
    startSession?: number;
    getMemory?: number;
    modelCall?: number;
    putMemory?: number;
    total?: number;
}

export default function AgentChat() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [memoryCount, setMemoryCount] = useState(0);
    const [timings, setTimings] = useState<Timings | null>(null);
    const [initializingSession, setInitializingSession] = useState(true);

    // Create session on component mount
    useEffect(() => {
        const initializeSession = async () => {
            try {
                const response = await fetch('/api/create-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Failed to create session:', errorData);
                    return;
                }

                const data = await response.json();
                setSessionId(data.sessionId);
                console.log('Session created:', data.sessionId, 'in', data.timings.startSession, 'ms');
            } catch (error) {
                console.error('Error creating session:', error);
            } finally {
                setInitializingSession(false);
            }
        };

        initializeSession();
    }, []);

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading || !sessionId) return;

        const userMessage = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    sessionId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to send message');
            }

            const data = await response.json();
            setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
            setSessionId(data.sessionId);
            setMemoryCount(data.memoryCount);
            setTimings(data.timings);
        } catch (error) {
            console.error('Error:', error);
            setMessages((prev) => [
                ...prev,
                {
                    role: 'assistant',
                    content: 'Sorry, I encountered an error processing your message.',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Initializing session loader */}
            {initializingSession && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-center gap-3">
                        <div className="animate-spin">
                            <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-blue-900 font-medium">Initializing session...</p>
                            <p className="text-xs text-blue-700">Creating a new SmartMemory session</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Info banner */}
            <div className="mb-6 p-4 bg-cyan-50 border border-primary/30 rounded-md">
                <div className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-primary mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                        <h3 className="text-sm font-semibold text-primary mb-1">How it works</h3>
                        <p className="text-sm text-gray-700">
                            This agent uses <strong>Claude Sonnet 4.5</strong> via Netlify AI Gateway and stores conversation context in <strong>SmartMemory</strong>.
                            Try asking about previous messages to see how it remembers!
                        </p>
                        {sessionId && (
                            <div className="mt-2 text-xs text-gray-600">
                                <span className="font-medium">Session ID:</span> {sessionId.substring(0, 16)}...
                                <span className="ml-3 font-medium">Memories:</span> {memoryCount}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Performance Timings */}
            {timings && (
                <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {timings.getMemory !== undefined && (
                            <div>
                                <div className="text-xs text-gray-500 font-medium">Get Memory</div>
                                <div className="text-sm font-semibold text-gray-900">{timings.getMemory}ms</div>
                            </div>
                        )}
                        {timings.modelCall !== undefined && (
                            <div>
                                <div className="text-xs text-gray-500 font-medium">Model Call</div>
                                <div className="text-sm font-semibold text-primary">{timings.modelCall}ms</div>
                            </div>
                        )}
                        {timings.putMemory !== undefined && (
                            <div>
                                <div className="text-xs text-gray-500 font-medium">Put Memory</div>
                                <div className="text-sm font-semibold text-gray-900">{timings.putMemory}ms</div>
                            </div>
                        )}
                        {timings.startSession !== undefined && (
                            <div>
                                <div className="text-xs text-gray-500 font-medium">Start Session</div>
                                <div className="text-sm font-semibold text-gray-900">{timings.startSession}ms</div>
                            </div>
                        )}
                        {timings.total !== undefined && (
                            <div>
                                <div className="text-xs text-gray-500 font-medium">Total</div>
                                <div className="text-sm font-bold text-primary">{timings.total}ms</div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Chat container */}
            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                {/* Messages */}
                <div className="h-[500px] overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 && (
                        <div className="text-center text-gray-500 mt-20">
                            <p className="mb-4">Start a conversation with the agent</p>
                            <div className="text-sm space-y-2">
                                <p className="text-gray-400">Try asking:</p>
                                <p>"What's your favorite color?"</p>
                                <p>"Tell me a joke"</p>
                                <p>"What did I just ask you?"</p>
                            </div>
                        </div>
                    )}

                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                    AI
                                </div>
                            )}
                            <div
                                className={`max-w-[70%] px-4 py-3 rounded-lg ${
                                    msg.role === 'user'
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-900'
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                            {msg.role === 'user' && (
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-300 text-gray-700 rounded-full flex items-center justify-center text-sm font-semibold">
                                    U
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                AI
                            </div>
                            <div className="bg-gray-100 px-4 py-3 rounded-lg">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <form onSubmit={sendMessage} className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={initializingSession ? "Initializing session..." : "Type your message..."}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                            disabled={loading || initializingSession}
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim() || initializingSession}
                            className="px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary/90 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                            Send
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
