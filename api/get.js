export default async function handler(req, res) {
  const { adminId, list } = req.query;
  const gistId = process.env.GIST_ID;

  try {
    const response = await fetch(`https://api.github.com/gists/${gistId}`);
    const gist = await response.json();

    if (list === "all") {
      // return all Admin IDs (filenames without .json)
      const files = Object.keys(gist.files || {});
      const adminFiles = files.filter(f => f.endsWith(".json"));
      const adminIds = adminFiles.map(f => f.replace(".json", ""));
      return res.status(200).json(adminIds);
    }

    if (!adminId) {
      return res.status(400).json({ error: "Missing adminId" });
    }

    const filename = `${adminId}.json`;

    if (!gist.files[filename]) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const data = JSON.parse(gist.files[filename].content);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Fetch failed:", err);
    return res.status(500).json({ error: "Failed to fetch data" });
  }
}
