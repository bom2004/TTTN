import axios from 'axios';

async function main(prompt: string): Promise<string> {
    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "deepseek/deepseek-chat",
                messages: [
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json"
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
