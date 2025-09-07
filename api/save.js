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
    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        Authorization: `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: {
          [filename]: { content: JSON.stringify(data, null, 2) }
        }
      })
    });

    const result = await response.json();
    res.status(200).json({ success: true, result });
  } catch (err) {
    console.error("Save failed:", err);
    res.status(500).json({ error: "Failed to save data" });
  }
}
