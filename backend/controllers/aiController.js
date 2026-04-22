const { GoogleGenerativeAI } = require("@google/generative-ai");

console.log("ENV CHECK:", process.env.GEMINI_API_KEY ? "FOUND" : "MISSING");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

exports.enhanceContent = async (req, res) => {
  try {
    const { title, excerpt, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `
You are a professional news editor.

Rewrite the following article:
- Improve readability
- Make it engaging and human-like
- Improve SEO
- Keep facts intact
- Add headings and structure

Return ONLY JSON:
{
  "title": "",
  "excerpt": "",
  "content": ""
}

Title: ${title}
Excerpt: ${excerpt}
Content: ${content}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    console.log("RAW AI RESPONSE:", text);

    let cleanText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanText);

    res.json(parsed);

  } catch (error) {
    console.error("Gemini AI error:", error);

    res.status(500).json({
      message: "AI enhancement failed",
      error: error.message,
    });
  }
};