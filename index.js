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
// const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const openai = new OpenAI();
// const anthropic = new Anthropic();
// const gemini = new GoogleGenAI();

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

      //   anthropic.messages
      //     .create({
      //       model: "claude-3-5-haiku-latest",
      //       max_tokens: 1024,
      //       messages: [{ role: "user", content: userInput }],
      //     })
      //     .catch((err) => ({ error: err.message })),
    ]);

    console.log("gemini: ", JSON.stringify(geminiResponse));
    const openaiText =
      openaiResponse.choices?.[0]?.message?.content || "Failed to fetch OpenAI";
    // const claudeText =
    //   claudeResponse.content?.[0]?.text || "Failed to fetch Claude";
    const geminiText = geminiResponse.text || "Failed to fetch Gemini";

    console.log(`\n============================================`);
    console.log('Response from OpenAI"...');
    console.log(`============================================`);
    console.log(openaiText);
    // for await (const event of openaiResponse) {
    //   if (event && event.delta) process.stdout.write(events.delta);
    // }

    console.log(`\n============================================`);
    console.log('Response from Gemini"...');
    console.log(`============================================`);
    console.log(geminiText);
    // console.log(`✨ Gemini:\n${geminiText.trim()}\n`);

    // console.log("--- 🔍 Validating and Synthesizing Responses ---");

    // // 3. Construct validation request
    // const validationPrompt = `
    //   User Original Prompt: "${userInput}"

    //   Response 1 (OpenAI): ${openaiText}
    //   Response 2 (Claude): ${claudeText}
    //   Response 3 (Gemini): ${geminiText}

    //   Task: Analyze all three responses. Validate their accuracy, cross-reference their points, and provide a single, masterfully synthesized final response.
    // `;

    // const validationResponse = await openai.chat.completions.create({
    //   model: "gpt-4o",
    //   messages: [{ role: "user", content: validationPrompt }],
    // });

    // const finalValidatedOutput = validationResponse.choices[0].message.content;

    // // 4. Output the final result to terminal
    // console.log("\x1b[32m%s\x1b[0m", "🏆 FINAL VALIDATED OUTPUT:");
    // console.log(finalValidatedOutput);
  } catch (globalError) {
    console.error("An unexpected runtime error occurred:", globalError);
  }
}

runAggregator();
