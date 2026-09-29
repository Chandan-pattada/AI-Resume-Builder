import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = 'gemini-3.5-flash-lite';
const FALLBACK_MODEL = 'gemini-3.7-flash';

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const generateWithModel = async (model, prompt) => {
  console.log(`Calling Gemini: ${model}`);

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text;
};

const generateContent = async (prompt) => {
  // Try primary model 3 times
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `Gemini ${MODEL_NAME} attempt ${attempt}/3`
      );

      return await generateWithModel(MODEL_NAME, prompt);
    } catch (error) {
      console.error(
        `${MODEL_NAME} attempt ${attempt} failed:`,
        error.message
      );

      const is503 =
        error.status === 503 ||
        error.message?.includes('503') ||
        error.message?.includes('UNAVAILABLE');

      if (!is503) {
        throw new Error(`Gemini API failed: ${error.message}`);
      }

      if (attempt < 3) {
        const delay = 2000 * Math.pow(2, attempt - 1);

        console.log(
          `Waiting ${delay / 1000}s before retry...`
        );

        await sleep(delay);
      }
    }
  }

  // Primary model still unavailable
  console.log(
    `${MODEL_NAME} unavailable. Trying ${FALLBACK_MODEL}...`
  );

  try {
    return await generateWithModel(
      FALLBACK_MODEL,
      prompt
    );
  } catch (error) {
    console.error(
      `Fallback model failed:`,
      error.message
    );

    throw new Error(
      `Gemini API failed on both models: ${error.message}`
    );
  }
};

export {
  ai,
  MODEL_NAME,
  generateContent,
};