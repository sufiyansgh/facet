import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const outputSchema = z.object({
    feedback: z.string().describe("Feedback for the user"),
    score: z.int().describe("Score out of 10 for their interview"),
});

const RESULT_PROMPT = `
    You are an expert evaluator. Your job is to evaluate the users interview. Give them a score out of 10
    and also let them know any feedback you have about thier interview.

    Please return only a json which looks like this - 
    {
        feedback: string,
        score: number
    }

    DO NOT RETURN ANY OTHER TEXT
    {{USER_TRANSCRIPT}}
`;

export async function calculateResult(
    messages: {
        type: "Assistant" | "User";
        message: string;
        createdAt: Date;
    }[],
) {
    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: RESULT_PROMPT.replace(
            `{{USER_TRANSCRIPT}}`,
            JSON.stringify(messages),
        ),
        config: {
            responseFormat: {
                text: {
                    mimeType: "application/json",
                    schema: zodToJsonSchema(outputSchema),
                },
            },
        },
    });
    console.log(response.text!);
    const result = outputSchema.parse(JSON.parse(response.text!));
    return result;
}
