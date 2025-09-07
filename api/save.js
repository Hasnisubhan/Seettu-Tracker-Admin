export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { adminId, data } = req.body;
  if (!adminId || !data) {
    return res.status(400).json({ error: "Missing adminId or data" });
  }

  const gistId = process.env.GIST_ID;
  const githubToken = process.env.GITHUB_TOKEN;
  const filename = `${adminId}.json`;

  try {
    // 1. Fetch old gist content
    const gistRes = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `token ${githubToken}` },
    });
    const gist = await gistRes.json();

    let oldContent = {};
    if (gist.files && gist.files[filename]) {
      try {
        oldContent = JSON.parse(gist.files[filename].content);
      } catch {}
    }

    // 2. Merge old + new data
    const mergedData = {
      phone: data.phone || oldContent.phone || "",
      password: data.password || oldContent.password || "",
      plan: data.plan || oldContent.plan || {},
      members: data.members || oldContent.members || [],
      payments: data.payments || oldContent.payments || {},
    };

    // 3. Save back to gist
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        files: {
          [filename]: {
            content: JSON.stringify(mergedData, null, 2),
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("GitHub error:", errorText);
      return res.status(response.status).json({
        success: false,
        error: "GitHub rejected request",
        details: errorText,
      });
    }

    const result = await response.json();
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Save failed:", err);
    return res.status(500).json({ error: "Failed to save data" });
  }
}
