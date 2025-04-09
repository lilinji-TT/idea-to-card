import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

// Initialize Anthropic client
// Ensure ANTHROPIC_API_KEY is set in your .env.local file
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://aihubmix.com",
});

// Define the expected structure of the response from Claude
interface ClaudeResponse {
  cards: { text: string }[];
}

export async function POST(req: NextRequest) {
  // 1. Input Validation
  let inputText: string;
  try {
    const body = await req.json();
    inputText = body.text;

    if (
      !inputText ||
      typeof inputText !== "string" ||
      inputText.trim().length === 0
    ) {
      return NextResponse.json(
        { message: "输入文本不能为空" },
        { status: 400 }
      );
    }
    // Optional: Add length limit validation
    if (inputText.length > 5000) {
      // Example limit
      return NextResponse.json(
        { message: "输入文本过长，请保持在 5000 字以内" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json({ message: "无效的请求格式" }, { status: 400 });
  }

  // 2. Construct the Prompt for Claude
  const prompt = `
请扮演一个社交媒体内容优化助手。我将给你一段文字，请你：
1.  将文字润色，使其更适合在抖音图文或小红书笔记中发布，风格简洁、吸引人。
2.  将润色后的内容，智能地分割成多个逻辑连贯的小段落，每段适合单独放在一张图片卡片上展示（例如每段建议不超过100字，但请根据内容逻辑自然分段）。
3.  以严格的JSON格式返回结果，**不要包含任何额外的解释、注释或代码块标记 (如 \`\`\`)**，直接输出JSON对象。格式如下：
    {
      "cards": [
        {"text": "第一段润色后的文字..."},
        {"text": "第二段润色后的文字..."},
        // ...更多段落
      ]
    }
 **重要：请确保 JSON 字符串值内部的所有特殊字符（尤其是双引号 " 和反斜杠 \\）都已正确转义（例如，使用 \" 和 \\\\）。最终输出必须是完全合法的 JSON。**

这是用户输入的原始文字：
"""
${inputText}
"""
`;

  // 3. Call Claude API
  try {
    console.log("Sending request to Claude...");
    const msg = await anthropic.messages.create({
      model: "claude-3-7-sonnet-20250219", // Or choose another model like sonnet or opus
      max_tokens: 8000, // Adjust based on expected output length
      temperature: 1, // Adjust creativity (0-1)
      //   system: "You are a helpful assistant that strictly outputs JSON.", // Optional: System prompt
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("Claude Raw Response:", msg);

    // 4. Process Claude's Response
    // Assuming the response text is directly in msg.content[0].text
    if (
      msg.content &&
      msg.content.length > 0 &&
      msg.content[0].type === "text"
    ) {
      const rawJson = msg.content[0].text.trim();

      // Attempt to parse the JSON response from Claude
      try {
        const parsedResponse: ClaudeResponse = JSON.parse(rawJson);
        // Basic validation of the parsed structure
        if (
          parsedResponse &&
          Array.isArray(parsedResponse.cards) &&
          parsedResponse.cards.every((card) => typeof card.text === "string")
        ) {
          console.log("Successfully parsed Claude response.");
          return NextResponse.json(parsedResponse); // Return the structured data
        } else {
          throw new Error("Parsed JSON does not match expected structure.");
        }
      } catch (parseError) {
        console.error("Error parsing Claude's JSON response:", parseError);
        console.error("Raw response that failed parsing:", rawJson);
        return NextResponse.json(
          { message: "无法解析AI模型的响应，请稍后重试或调整输入。" },
          { status: 500 }
        );
      }
    } else {
      console.error("Unexpected response structure from Claude:", msg);
      throw new Error("Claude API 返回了意外的响应格式");
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error calling Claude API:", error);
    let errorMessage = "调用AI服务时发生错误";
    if (error.status === 401) {
      errorMessage = "Anthropic API 密钥无效或缺失";
    } else if (error.status === 429) {
      errorMessage = "AI服务调用频率过高，请稍后再试";
    }
    // Add more specific error handling if needed
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}
