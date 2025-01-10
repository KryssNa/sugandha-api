// src/controllers/perfumeController.ts
import dotenv from "dotenv";
import { Request, Response } from "express";
import OpenAI from "openai";

dotenv.config();

// Type definitions
interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface PerfumePreferences {
    scentFamily?: string;
    occasion?: string;
    personality?: string;
    budget?: string;
    gender?: string;
    age?: string;
    climate?: string;
    previousFavorites?: string[];
}

// Initialize OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const getSystemPrompt = (preferences: Partial<PerfumePreferences>): string => {
return `As a refined fragrance curator specializing in luxury perfumery, I offer bespoke recommendations blending contemporary elegance with cultural sensibilities.
  CONVERSATION RULES:
  - Maintain refined, clear, short and culturally-nuanced dialogue
  - Offer personalized recommendations based on user preferences
  - Try to understand user's personality, style, and preferences
  - Try to avoid generic or cliched responses
  - Avoid overly technical or complex language
  - Avoid long, convoluted sentences
  - Conclude with sophisticated choice options
  - when making final recommendation, give according to rules
  - End each response with a "NEXT_CHOICES" section
  
  RESPONSE STRUCTURE:
  1. Main Response:
  [Your engaging response text]
  
  2. Always end with:
  NEXT_CHOICES:
  • Option 1: [Brief description]
  • Option 2: [Brief description]
  • Option 3: [Brief description]
  [Add more options if needed]
  
  EXAMPLE RESPONSE:
  "Let's curate your signature fragrance that reflects both elegance and personality.
  
  NEXT_CHOICES:
    • Wedding : A refined blend for your special day
    • Business & Corporate Meeting : A sophisticated choice for professional settings
    • Casual Outing : A relaxed yet elegant option for everyday wear"
    • Family Gathering : A warm and inviting scent for social events"
    • Party Night : A vibrant and energetic fragrance for celebrations"
    • Formal Occasions: Reserved for milestone celebrations where sophistication matters most.

  
  WHEN MAKING FINAL RECOMMENDATION:
  🌟 [Perfume Name] by [House]
  
  📝 Key Notes:
  [Brief notes description]
  
  💫 Perfect For You Because:
  [One compelling sentence]
  
  NEXT_CHOICES:
  • View Similar Fragrances
  • Start New Consultation
  • Learn More About Notes
  
  Current Preferences:
  ${Object.entries(preferences)
            .filter(([_, value]) => value)
            .map(([key, value]) => `• ${key}: ${value}`)
            .join("\n")}`;
};

// Premium API controller with enhanced error handling
export const getPerfumeRecommendation = async (req: Request, res: Response) => {
    try {
        const { messages, preferences = {} } = req.body;

        // Enhanced validation
        if (!messages?.length) {
            return res.status(400).json({
                success: false,
                error: "Invalid request: Conversation history required",
                timestamp: new Date().toISOString(),
            });
        }

        // Prepare conversation with enhanced prompt
        const systemPrompt = getSystemPrompt(preferences);
        const enrichedMessages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            ...messages.map((msg: ChatMessage) => ({
                role: msg.role,
                content: msg.content,
            })),
        ];

        // Enhanced OpenAI API call with premium settings
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: enrichedMessages,
            temperature: 0.8, // Slightly more creative for unique recommendations
            max_tokens: 1000, // Longer responses for detailed recommendations
            presence_penalty: 0.4, // Encourage variety in responses
            frequency_penalty: 0.4, // Reduce repetition
            top_p: 0.9, // Focus on more likely completions
        });

        const response = completion.choices[0]?.message;
        if (!response) {
            throw new Error("Failed to generate recommendation");
        }

        // Process and enhance the response
        const enhancedResponse = {
            ...response,
            content: response.content ? response.content.replace(/\n/g, "\n") : "", // Preserve formatting
        };

        // Log successful premium consultation
        console.log(
            `[${new Date().toISOString()}] Premium consultation completed for IP: ${req.ip
            }`
        );

        return res.status(200).json({
            success: true,
            response: enhancedResponse,
            usage: completion.usage,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        console.error("[Premium Service Error]:", error);

        // Enhanced error handling for premium service
        const statusCode = error.status || 500;
        const errorMessage = error.message || "An unexpected error occurred";

        return res.status(statusCode).json({
            success: false,
            error: errorMessage,
            timestamp: new Date().toISOString(),
        });
    }
};

export default {
    getPerfumeRecommendation,
};
