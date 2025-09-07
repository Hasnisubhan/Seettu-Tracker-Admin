const API_BASE = "https://seettu-api.vercel.app";

// --- Switch tabs ---
document.getElementById("loginTab").addEventListener("click", () => {
  document.getElementById("loginForm").classList.add("active");
  document.getElementById("createForm").classList.remove("active");
  document.getElementById("loginTab").classList.add("active");
  document.getElementById("createTab").classList.remove("active");
});

document.getElementById("createTab").addEventListener("click", () => {
  document.getElementById("createForm").classList.add("active");
  document.getElementById("loginForm").classList.remove("active");
  document.getElementById("createTab").classList.add("active");
  document.getElementById("loginTab").classList.remove("active");
});

// --- LOGIN ACCOUNT ---
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const loginId = document.getElementById("loginId").value.trim();
  const loginPass = document.getElementById("loginPass").value;

  try {
    const res = await fetch(`${API_BASE}/api/get?adminId=${loginId}`);
    const data = await res.json();

    if (data.error) {
      alert("❌ Account not found.");
      return;
    }

    if (data.password !== loginPass) {
      alert("❌ Wrong password.");
      return;
    }

    localStorage.setItem("adminId", loginId);
    localStorage.setItem("adminPass", loginPass);
    if (data.phone) localStorage.setItem("phone", data.phone);
    if (data.plan) localStorage.setItem("plan", JSON.stringify(data.plan));
    if (data.members) localStorage.setItem("members", JSON.stringify(data.members));
    if (data.payments) localStorage.setItem("payments", JSON.stringify(data.payments));

    window.location.href = "setup.html";
  } catch (err) {
    console.error(err);
    alert("❌ Login failed. Try again.");
  }
});

// --- CREATE ACCOUNT ---
document.getElementById("createForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = document.getElementById("createPhone").value.trim();
  const name = document.getElementById("createName").value.trim();
  const pass = document.getElementById("createPass").value;
  const confirm = document.getElementById("confirmPass").value;

  if (pass !== confirm) {
    alert("❌ Passwords do not match.");
    return;
  }

  const adminId = name.replace(/\s+/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);

  const newData = {
    phone,
    password: pass,
    plan: {},
    members: [],
    payments: {}
  };

  try {
    await fetch(`${API_BASE}/api/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminId, data: newData })
    });

    localStorage.setItem("adminId", adminId);
    localStorage.setItem("adminPass", pass);
    localStorage.setItem("phone", phone);

    alert(`✅ Account created! Your ID is: ${adminId}`);
    window.location.href = "setup.html";
  } catch (err) {
    console.error(err);
    alert("❌ Failed to create account.");
  }
});
