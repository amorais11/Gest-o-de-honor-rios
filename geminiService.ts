
import { GoogleGenAI, Type } from "@google/genai";
import { AuditResult } from "./types";

export const analyzeStatement = async (base64Data: string, mimeType: string): Promise<AuditResult[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: mimeType,
          },
        },
        {
          text: "Extract medical billing data from this Unimed statement. For each procedure, provide: patientName, date (ISO string YYYY-MM-DD), procedureName, tussCode, procedureValue (number), glosaAmount (number), and status ('pago' or 'glosa'). Return as a clean JSON array.",
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            patientName: { type: Type.STRING },
            date: { type: Type.STRING },
            procedureName: { type: Type.STRING },
            tussCode: { type: Type.STRING },
            procedureValue: { type: Type.NUMBER },
            glosaAmount: { type: Type.NUMBER },
            status: { type: Type.STRING },
          },
          required: ["patientName", "date", "procedureValue", "status"],
        },
      },
    },
  });

  try {
    const data = JSON.parse(response.text || "[]");
    return data;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return [];
  }
};
