import "dotenv/config";

import { OpenAI } from "openai";
import { Anthropic } from "@anthropic-ai/sdk";
import { GoogleGenAI } from "@google/genai";

// Extract the text argument provided after "node index.js"
const userInput = process.argv.slice(2).join(" ");

if (!userInput) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "❌ Error: Please provide an input prompt.",
  );
  console.log('Usage: node index.js "Your prompt goes here inside quotes"');
  process.exit(1);
}

// Initialize secure instances
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const openai = new OpenAI();
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function runAggregator() {
  console.log(`Sending prompt to all 3 AI models: "${userInput}"...`);

  try {
    // 1. Fetch from all models concurrently
    const [openaiResponse, geminiResponse, claudeResponse] = await Promise.all([
      openai.chat.completions
        .create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: userInput }],
          //   stream: true,
        })
        .catch((err) => ({ error: err.message })),

      gemini.models
        .generateContent({
          model: "gemini-3.1-flash-lite",
          contents: userInput,
        })
        .catch((err) => ({ error: err.message })),

      anthropic.messages
        .create({
          model: "claude-opus-4-6",
          max_tokens: 1024,
          messages: [{ role: "user", content: userInput }],
        })
        .catch((err) => ({ error: err.message })),
    ]);

    const openaiText =
      openaiResponse.choices?.[0]?.message?.content || "Failed to fetch OpenAI";
    const claudeText =
      claudeResponse.content?.[0]?.text || "Failed to fetch Claude";
    const geminiText = geminiResponse.text || "Failed to fetch Gemini";

    console.log(`\n============================================`);
    console.log('1. Response from OpenAI"...');
    console.log(`============================================`);
    console.log(openaiText);
    // for await (const event of openaiResponse) {
    //   if (event && event.delta) process.stdout.write(events.delta);
    // }

    console.log(`\n============================================`);
    console.log('2. Response from Gemini"...');
    console.log(`============================================`);
    console.log(geminiText);
    // console.log(`✨ Gemini:\n${geminiText.trim()}\n`);

    console.log(`\n============================================`);
    console.log('3. Response from Claude"...');
    console.log(`============================================`);
    console.log(claudeText);
    // console.log(`✨ Gemini:\n${geminiText.trim()}\n`);

    console.log(
      "\n================ Validating and Synthesizing Responses ==================",
    );
    const validationPrompt = `
      User Original Prompt: "${userInput}"

      Response 1 (OpenAI): ${openaiText}
      Response 2 (Claude): ${claudeText}
      Response 3 (Gemini): ${geminiText}

      Task: Analyze all three responses. Validate their accuracy, cross-reference their points, 
      and provide a single, masterfully synthesized final response. And In the response give the name of 
      of the AI(OpenAI, Claude, Gemini) which has accurate/closest answer.
    `;

    const validationResponse = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 1024,
      messages: [{ role: "user", content: validationPrompt }],
    });
    const finalValidatedOutput =
      validationResponse.content?.[0]?.text ||
      "Failed to validate the responses";

    console.log(`\n============================================`);
    console.log("🏆 FINAL VALIDATED OUTPUT FROM CLAUDE:");
    console.log(`============================================`);
    console.log(finalValidatedOutput);
  } catch (globalError) {
    console.error("An unexpected runtime error occurred:", globalError);
  }
}

runAggregator();
