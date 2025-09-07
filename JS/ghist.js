document.addEventListener("DOMContentLoaded", () => {
  const adminId = localStorage.getItem("adminId");
  if (!adminId) {
    window.location.href = "auth.html";
    return;
  }

  const navbarDisplay = document.getElementById("navbarAdminId");
  if (navbarDisplay) {
    navbarDisplay.textContent = adminId;
  }

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
      uploadData(adminId, newData);
    });
  }
});

async function uploadData(adminId, newData) {
  try {
    const res = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId, data: newData })
    });

    const result = await res.json();
    if (result.success) {
      alert("✅ Data saved successfully!");
    } else {
      alert("❌ Upload failed.");
    }
  } catch (err) {
    console.error("Upload failed:", err);
    alert("❌ Upload failed.");
  }
}
