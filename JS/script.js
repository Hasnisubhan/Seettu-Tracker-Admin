document.addEventListener("DOMContentLoaded", () => {
  const planForm = document.getElementById("planForm");
  const registrationForm = document.getElementById("registrationForm");
  const membersTable = document.querySelector("#membersTable tbody");
  const message = document.getElementById("message");
  
  // Note: frequencySelect is kept for the dropdown, but customDaysInput logic is removed
  const frequencySelect = document.getElementById("frequency");

  // --- Check login ---
  const adminIdEl = document.getElementById("navbarAdminId");
  const copyBtn = document.getElementById("copyAdminId");

  if (copyBtn) {
    copyBtn.addEventListener("click", () => {
      const id = adminIdEl.textContent.trim();
      if (id && id !== "-") {
        navigator.clipboard.writeText(id).then(() => {
          alert(`✅ Copied: ${id}`);
        }).catch(err => {
          console.error("Failed to copy", err);
        });
      }
    });
  }

  const adminId = localStorage.getItem("adminId");
  if (!adminId) {
    window.location.href = "auth.html";
    return;
  } else {
    if (adminIdEl) {
      adminIdEl.textContent = adminId;
    }
  }

  // --- Export/Import Logic ---
  document.getElementById("exportData")?.addEventListener("click", () => {
    const plan = JSON.parse(localStorage.getItem("plan")) || {};
    const members = JSON.parse(localStorage.getItem("members")) || [];
    const payments = JSON.parse(localStorage.getItem("payments")) || {};
    const data = { plan, members, payments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "seetu-data.json";
    link.click();
  });

  document.getElementById("importData")?.addEventListener("click", () => {
    document.getElementById("importFile").click();
  });

  document.getElementById("importFile")?.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.plan && data.members && data.payments !== undefined) {
          localStorage.setItem("plan", JSON.stringify(data.plan));
          localStorage.setItem("members", JSON.stringify(data.members));
          localStorage.setItem("payments", JSON.stringify(data.payments));
          alert("✅ Data imported successfully!");
          location.reload();
        } else {
          alert("❌ Invalid file format.");
        }
      } catch {
        alert("❌ Error reading file.");
      }
    };
    reader.readAsText(file);
  });

  // --- Load saved plan ---
  const savedPlan = JSON.parse(localStorage.getItem("plan"));
  if (savedPlan && Object.keys(savedPlan).length > 0) {
    if (document.getElementById("startDate")) document.getElementById("startDate").value = savedPlan.startDate || "";
    if (document.getElementById("peopleCount")) document.getElementById("peopleCount").value = savedPlan.peopleCount || "";
    if (document.getElementById("totalAmount")) document.getElementById("totalAmount").value = savedPlan.totalAmount || "";
    if (document.getElementById("frequency")) document.getElementById("frequency").value = savedPlan.frequency || "";
    
    document.getElementById("step1").classList.remove("active");
    document.getElementById("step2").classList.add("active");
    updateNumberDropdown();
    displayMembers();
  }

  // --- Handle Plan Form (Step 1) ---
  planForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const peopleCount = parseInt(document.getElementById("peopleCount").value);
    const totalAmount = parseFloat(document.getElementById("totalAmount").value);
    const frequency = document.getElementById("frequency").value;
    const startDate = document.getElementById("startDate").value;

    if (!peopleCount || !totalAmount || !frequency || !startDate) {
      alert("Please fill in all required fields.");
      return;
    }

    const contribution = totalAmount / peopleCount;
    const plan = { peopleCount, totalAmount, frequency, contribution, startDate };

    const oldPlan = JSON.parse(localStorage.getItem("plan"));
    if (!oldPlan || Object.keys(oldPlan).length === 0) {
      localStorage.setItem("members", JSON.stringify([]));
    }

    localStorage.setItem("plan", JSON.stringify(plan));
    updateNumberDropdown();
    document.getElementById("step1").classList.remove("active");
    document.getElementById("step2").classList.add("active", "slide-in-right");
  });

  // --- Member Registration ---
  registrationForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const number = document.getElementById("number").value;
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim() || "-";

    let members = JSON.parse(localStorage.getItem("members")) || [];
    if (members.some((m) => m.number === number)) {
      message.textContent = "This number is already taken.";
      return;
    }
    members.push({ number, name, phone });
    localStorage.setItem("members", JSON.stringify(members));
    
    // Smooth update instead of full reload for better UX
    registrationForm.reset();
    displayMembers();
    updateNumberDropdown();
  });

  function displayMembers() {
    let members = JSON.parse(localStorage.getItem("members")) || [];
    if (!membersTable) return;
    
    membersTable.innerHTML = "";
    members.forEach((m, idx) => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${m.number}</td><td>${m.name}</td><td>${m.phone}</td>
        <td><button class="delete-btn" data-index="${idx}"><i class="fa-solid fa-trash"></i></button></td>`;
      membersTable.appendChild(row);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        let members = JSON.parse(localStorage.getItem("members")) || [];
        members.splice(btn.dataset.index, 1);
        localStorage.setItem("members", JSON.stringify(members));
        displayMembers();
        updateNumberDropdown();
      });
    });
  }

  function updateNumberDropdown() {
    const plan = JSON.parse(localStorage.getItem("plan"));
    if (!plan) return;
    let members = JSON.parse(localStorage.getItem("members")) || [];
    const numberSelect = document.getElementById("number");
    if (!numberSelect) return;

    numberSelect.innerHTML = "";
    for (let i = 1; i <= plan.peopleCount; i++) {
      if (!members.some((m) => parseInt(m.number) === i)) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        numberSelect.appendChild(opt);
      }
    }
  }

  document.getElementById("backBtn")?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("step2").classList.remove("active", "slide-in-right");
    document.getElementById("step1").classList.add("active", "slide-in-left");
  });

  document.getElementById("goToPayments")?.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  document.getElementById("resetPaymentsa")?.addEventListener("click", (e) => {
    e.preventDefault();
    if (confirm("Are you sure you want to logout? This will clear your session.")) {
      localStorage.clear();
      window.location.href = "auth.html";
    }
  });

  displayMembers();
});
