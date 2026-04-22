exports.enhanceContent = async (req, res) => {
  try {
    const { title, excerpt, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    // 🧠 Clean plain text
    const plainText = content.replace(/<[^>]*>/g, "");

    // 🧠 Split into sentences
    const sentences = plainText.split(". ").filter(Boolean);

    // 🧠 Build structured content
    const intro = sentences.slice(0, 2).join(". ") + ".";
    const body = sentences.slice(2, 6).join(". ") + ".";
    const ending = sentences.slice(6).join(". ") + ".";

    const improvedContent = `
      <h2>${title}</h2>

      <p>${intro}</p>

      <h3>Key Details</h3>
      <p>${body}</p>

      <h3>Conclusion</h3>
      <p>${ending}</p>
    `;

    const improvedExcerpt =
      excerpt ||
      plainText.slice(0, 160) + "...";

    res.json({
      success: true,
      data: {
        title: title,
        excerpt: improvedExcerpt,
        content: improvedContent,
      },
    });

  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({
      message: "AI enhancement failed",
    });
  }
};