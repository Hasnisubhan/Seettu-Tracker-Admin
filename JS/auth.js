const gistId = "38bc71bdc998169563fd4b7e47e159b8"; // your gist ID
const githubToken = "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"; // replace securely

// --- Helpers ---
function saveAccount(id, password) {
  let accounts = JSON.parse(localStorage.getItem("accounts")) || [];
  if (!accounts.some(acc => acc.id === id)) {
    accounts.push({ id, password });
    localStorage.setItem("accounts", JSON.stringify(accounts));
  }
}

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
    // 1️⃣ Fetch Gist data
    const res = await fetch(`https://api.github.com/gists/${gistId}`);
    const gist = await res.json();

    // 2️⃣ Check if file for this ID exists
    const filename = `${loginId}.json`;
    if (!gist.files[filename]) {
      alert("❌ Account not found.");
      return;
    }

    // 3️⃣ Parse file
    const data = JSON.parse(gist.files[filename].content || "{}");

    // 4️⃣ Validate password
    if (data.password !== loginPass) {
      alert("❌ Wrong password.");
      return;
    }

    // 5️⃣ Save to localStorage
    localStorage.setItem("adminId", loginId);
    localStorage.setItem("adminPass", loginPass);
    if (data.phone) localStorage.setItem("phone", data.phone);
    if (data.plan) localStorage.setItem("plan", JSON.stringify(data.plan));
    if (data.members) localStorage.setItem("members", JSON.stringify(data.members));
    if (data.payments) localStorage.setItem("payments", JSON.stringify(data.payments));

    // 6️⃣ Redirect
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

  // Generate unique Admin ID (Name + random 4 digits)
  const adminId = name.replace(/\s+/g, "-") + "-" + Math.floor(1000 + Math.random() * 9000);

  // Build initial data
  const newData = {
    phone,
    password: pass,
    plan: {},
    members: [],
    payments: {}
  };

  const filename = `${adminId}.json`;

  try {
    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: "PATCH",
      headers: {
        "Authorization": `token ${githubToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: {
          [filename]: { content: JSON.stringify(newData, null, 2) }
        }
      })
    });

    // Save in localStorage
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

