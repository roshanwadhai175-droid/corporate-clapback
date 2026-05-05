"use client";

import React, { useState } from 'react';
import { Send, Copy, RefreshCw, ShieldAlert, Briefcase, Activity, UserCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function App() {
    const [inputText, setInputText] = useState('');
    const [outputText, setOutputText] = useState('');
    const [tone, setTone] = useState('Direct & Firm');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const tones = [
        { name: 'Ultra-Humble', icon: UserCheck, desc: 'Overly polite & deferential' },
        { name: 'Passive-Aggressive', icon: RefreshCw, desc: 'Polite but deeply cutting' },
        { name: 'Direct & Firm', icon: Briefcase, desc: 'Assertive, no-nonsense' },
        { name: 'Buzzword Heavy', icon: Activity, desc: 'Synergize the paradigms' },
        { name: 'HR Policy Enforcer (RAG)', icon: ShieldAlert, desc: 'Quotes the handbook' }
    ];

    const handleTranslate = async () => {
        if (!inputText.trim()) return;
        setLoading(true);
        setError('');
        setOutputText('');

        try {
            // Use the live URL if available, otherwise fallback to local testing
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
            
            const response = await fetch(backendUrl + '/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: inputText,
                    tone: tone
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to connect to backend');
            }

            const data = await response.json();
            setOutputText(data.translated_text);
        } catch (err) {
            setError(err.message || 'An error occurred. Make sure your Python backend is running.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!outputText) return;
        
        try {
            document.execCommand('copy'); 
            navigator.clipboard.writeText(outputText);
        } catch(e) {
            console.error("Clipboard write failed", e);
        }
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* Header */}
                <header className="text-center space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center justify-center p-4 bg-blue-900/30 rounded-full border border-blue-500/30 mb-4"
                    >
                        <Briefcase className="w-8 h-8 text-blue-400" />
                    </motion.div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
                        Corporate <span className="text-blue-500">Clapback</span>
                    </h1>
                    <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                        Turn your unfiltered, angry, or Hinglish thoughts into highly professional corporate jargon.
                    </p>
                </header>

                {/* Tone Selector */}
                <div className="space-y-4">
                    <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Select Corporate Persona</label>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {tones.map((t) => {
                            const Icon = t.icon;
                            const isActive = tone === t.name;
                            return (
                                <button
                                    key={t.name}
                                    onClick={() => setTone(t.name)}
                                    className={"flex flex-col items-center justify-center p-4 rounded-xl border transition-all duration-200 " + (isActive ? "bg-blue-600/20 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-slate-900 border-slate-800 hover:border-slate-700")}
                                >
                                    <Icon className={"w-6 h-6 mb-2 " + (isActive ? "text-blue-400" : "text-slate-500")} />
                                    <span className={"text-sm font-medium text-center " + (isActive ? "text-blue-100" : "text-slate-400")}>
                                        {t.name}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Main Interaction Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                    
                    {/* Input Panel */}
                    <div className="flex flex-col space-y-3">
                        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Raw Thoughts (Hinglish/Draft)</label>
                        <div className="relative flex-grow">
                            <textarea
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder="Type your unfiltered anger here... e.g. 'Bhai kya faltu deadline diya hai, main nahi kar raha yeh weekend pe!'"
                                className="w-full h-64 p-5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Output Panel */}
                    <div className="flex flex-col space-y-3">
                        <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Corporate Translation</label>
                        <div className={"relative flex-grow rounded-xl border overflow-hidden " + (outputText ? "bg-slate-800 border-blue-500/50" : "bg-slate-900 border-slate-800")}>
                            
                            <AnimatePresence mode="wait">
                                {loading ? (
                                    <motion.div 
                                        key="loading"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm z-10"
                                    >
                                        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
                                        <p className="text-blue-400 font-medium animate-pulse">Corporatizing your thoughts...</p>
                                    </motion.div>
                                ) : error ? (
                                    <motion.div 
                                        key="error"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-red-400"
                                    >
                                        <AlertCircle className="w-10 h-10 mb-2" />
                                        <p>{error}</p>
                                    </motion.div>
                                ) : (
                                    <motion.textarea
                                        key="output"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        readOnly
                                        value={outputText}
                                        placeholder="Your highly professional corporate response will appear here..."
                                        className="w-full h-64 p-5 bg-transparent text-slate-100 focus:outline-none resize-none"
                                    />
                                )}
                            </AnimatePresence>

                            {/* Copy Button */}
                            {outputText && !loading && (
                                <motion.button
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    onClick={copyToClipboard}
                                    className={"absolute bottom-4 right-4 p-2 rounded-lg flex items-center gap-2 transition-colors " + (copied ? "bg-green-500/20 text-green-400" : "bg-slate-700 hover:bg-slate-600 text-slate-300")}
                                >
                                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    <span className="text-xs font-medium">{copied ? 'Copied!' : 'Copy Text'}</span>
                                </motion.button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="flex justify-center pt-6">
                    <button
                        onClick={handleTranslate}
                        disabled={loading || !inputText.trim()}
                        className="group relative px-8 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-full transition-all duration-200 shadow-lg hover:shadow-blue-500/25 flex items-center gap-3 overflow-hidden"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            Corporatize It <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>

            </div>
        </div>
    );
}