require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function askAI(question) {
    const prompt = `You are SauceAI, a friendly and witty AI assistant inside a chat app called SauceChat. 
Keep your replies concise (2-4 sentences max) and conversational. No markdown formatting.
User asks: ${question}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function summarizeChat(messages) {
    if (!messages || messages.length === 0) {
        return "No messages to summarize yet!";
    }
    const transcript = messages
        .map(m => `${m.sender}: ${m.text}`)
        .join("\n");
    const prompt = `You are SauceAI. Summarize the following chat conversation in 3-5 bullet points. 
Be concise and capture the key topics/decisions. No markdown headers, just bullet points starting with •.
Chat:
${transcript}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
}

module.exports = { askAI, summarizeChat };
