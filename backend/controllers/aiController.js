const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.enhanceContent = async (req, res) => {
  try {
    console.log("🔥 AI ROUTE HIT");

    const key = process.env.GEMINI_API_KEY;

    console.log("🔑 KEY CHECK:", key ? "FOUND ✅" : "MISSING ❌");

    if (!key) {
      return res.status(500).json({
        message: "GEMINI API KEY MISSING",
      });
    }

    const { title, excerpt, content } = req.body;

    console.log("📩 REQUEST DATA:", {
      titleLength: title?.length,
      contentLength: content?.length,
    });

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const genAI = new GoogleGenerativeAI(key);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash", // ✅ safer than gemini-pro
    });

    const prompt = `
You are a professional news editor.

Rewrite the following article to:
- Improve readability
- Make it engaging and human-like
- Improve SEO
- Keep facts intact
- Add proper structure (headings, paragraphs)

Return ONLY JSON in this format:
{
  "title": "",
  "excerpt": "",
  "content": ""
}

Title:
${title}

Excerpt:
${excerpt}

Content:
${content.slice(0, 5000)}
`;

    console.log("🧠 Sending request to Gemini...");

    const result = await model.generateContent(prompt);

    const response = await result.response;
    const text = response.text();

    console.log("🤖 RAW AI RESPONSE:", text);

    // 🧠 Clean + parse JSON safely
    let parsed;

    try {
      const clean = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsed = JSON.parse(clean);
    } catch (err) {
      console.error("❌ JSON PARSE FAILED");

      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: text,
      });
    }

    console.log("✅ AI PARSED SUCCESS");

    res.json(parsed);

  } catch (error) {
    console.error("💥 GEMINI ERROR:", error);

    res.status(500).json({
      message: "AI enhancement failed",
      error: error.message,
    });
  }
};