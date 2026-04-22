const { GoogleGenerativeAI } = require("@google/generative-ai");

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
      model: "gemini-pro",
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
${content}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 🧠 Extract JSON safely
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({
        message: "AI returned invalid format",
        raw: text,
      });
    }

    res.json(parsed);

  } catch (error) {
    console.error("Gemini AI error:", error);
    res.status(500).json({
      message: "AI enhancement failed",
    });
  }
};