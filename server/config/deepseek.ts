import axios from 'axios';

async function main(prompt: string, context?: string): Promise<string> {
    try {
        const messages = [];
        
        // Add system context if provided
        if (context) {
            messages.push({ role: "system", content: context });
        }
        
        messages.push({ role: "user", content: prompt });

        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "google/gemini-2.0-flash-001",
                max_tokens: 2048,
                messages: messages
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000",
                    "X-Title": "Hotel Management System"
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error: any) {
        console.error("Error calling OpenRouter:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.error?.message || error.message || "Failed to generate content from DeepSeek";
        throw new Error(errorMessage);
    }
}

export default main;
