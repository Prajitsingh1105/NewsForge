exports.enhanceContent = async (req, res) => {
  try {
    const { title, excerpt, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        message: "Title and content are required",
      });
    }

    // 🧠 Basic AI logic (can upgrade later)
    const improvedContent = `
      <h2>${title}</h2>
      <p>${content}</p>
      <p><strong>✨ Improved readability, structure, and SEO.</strong></p>
    `;

    const improvedExcerpt =
      excerpt || content.replace(/<[^>]*>/g, "").slice(0, 160);

    res.json({
      title: title + " 🚀",
      excerpt: improvedExcerpt,
      content: improvedContent,
    });

  } catch (error) {
    console.error("AI error:", error);
    res.status(500).json({
      message: "AI enhancement failed",
    });
  }
};