document.addEventListener("DOMContentLoaded", () => {
  const adminId = localStorage.getItem("adminId");

  // If not logged in, redirect
  if (!adminId) {
    window.location.href = "auth.html";
    return;
  }

  // Show Admin ID in navbar
  const navbarDisplay = document.getElementById("navbarAdminId");
  if (navbarDisplay) {
    navbarDisplay.textContent = adminId;
  }

  // Upload button
  const uploadBtn = document.getElementById("uploadBtn");
  if (uploadBtn) {
    uploadBtn.addEventListener("click", () => {
      const plan = JSON.parse(localStorage.getItem("plan")) || {};
      const members = JSON.parse(localStorage.getItem("members")) || [];
      const payments = JSON.parse(localStorage.getItem("payments")) || {};

      if (!plan || members.length === 0) {
        alert("⚠️ Please complete setup before uploading.");
        return;
      }

      const newData = { plan, members, payments };
      uploadDataToGist(adminId, newData);
    });
  }
});

// --- Upload to Gist (per Admin JSON file) ---
async function uploadDataToGist(adminId, newData) {
  const gistId = "1bec72536e04b329e842a128a2d6fc23"; // your gist ID
  const githubToken = "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"; // replace securely
  const filename = `${adminId}.json`;

  try {
    // 1️⃣ Fetch existing file so we don't lose password
    const res = await fetch(`https://api.github.com/gists/${gistId}`);
    const gist = await res.json();

    let oldContent = {};
    if (gist.files[filename]) {
      try {
        oldContent = JSON.parse(gist.files[filename].content);
      } catch {}
    }

    // 2️⃣ Keep the password if it already exists
    const mergedData = {
      phone: oldContent.phone || localStorage.getItem("phone") || "",
      password: oldContent.password || localStorage.getItem("adminPass") || "",
      ...newData
    };

    // 3️⃣ Upload merged data
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: {
          [filename]: { content: JSON.stringify(mergedData, null, 2) }
        }
      })
    });

    alert("✅ Data saved successfully!");
  } catch (err) {
    console.error("Upload failed:", err);
    alert("❌ Upload failed.");
  }
}

