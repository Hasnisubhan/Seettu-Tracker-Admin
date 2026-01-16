const tabContent = document.getElementById('tabContent');
const plan = JSON.parse(localStorage.getItem('plan'));
const members = JSON.parse(localStorage.getItem('members')) || [];
let payments = JSON.parse(localStorage.getItem('payments')) || {};
let currentRound = 0;

if (!plan || members.length === 0) {
  window.location.href = "setup.html";
} else {
  currentRound = getRoundForToday();
  showRound(currentRound);
}

const adminId = localStorage.getItem("adminId");
if (!adminId) {
  window.location.href = "auth.html";
} else {
  document.getElementById("navbarAdminId").textContent = adminId;
}

function calculateRoundDate(startDate, round, plan) {
  const date = new Date(startDate);
  if (plan.frequency === "Daily") {
    date.setDate(date.getDate() + round);
  } else if (plan.frequency === "Weekly") {
    date.setDate(date.getDate() + (7 * round));
  } else if (plan.frequency === "Monthly") {
    date.setMonth(date.getMonth() + round);
  } else if (plan.frequency === "Custom" && plan.customDays) {
    date.setDate(date.getDate() + (plan.customDays * round));
  }
  return date;
}

function getRoundForToday() {
  const startDate = new Date(plan.startDate);
  const today = new Date();

  for (let round = 0; round < plan.peopleCount; round++) {
    const roundDate = calculateRoundDate(startDate, round, plan);
    if (today < roundDate) {
      return Math.max(0, round - 1);
    }
    if (
      today.getFullYear() === roundDate.getFullYear() &&
      today.getMonth() === roundDate.getMonth() &&
      today.getDate() === roundDate.getDate()
    ) {
      return round;
    }
  }
  return plan.peopleCount - 1;
}

function showRound(round) {
  const startDate = new Date(plan.startDate);
  const roundDate = calculateRoundDate(startDate, round, plan);
  const dateStr = roundDate.toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric"
  });

  document.getElementById("currentDate").textContent = dateStr;
  const member = members[round];
  if (!member) {
    tabContent.innerHTML = "<p>No member for this round.</p>";
    return;
  }

  const paidMembers = payments[round] || [];
  const paidCount = paidMembers.length;
  const total = members.length;
  const paidAmount = paidCount * plan.contribution;
  const remainingAmount = plan.totalAmount - paidAmount;
  const progressPercent = Math.round((paidCount / total) * 100);

  tabContent.innerHTML = `
    <div class="receiver-card">
      <div class="round-badge">${round + 1}</div>
      <h3>${member.name} ${paidCount === total ? '<i class="fa-solid fa-circle-check completed-icon"></i>' : ''}</h3>
      <p>Remaining: ${remainingAmount.toLocaleString()} / ${plan.totalAmount.toLocaleString()}</p>
      <p>Paid: ${paidCount}/${total}</p>
      <div class="progress-bar"><span style="width:${progressPercent}%"></span></div>
    </div>
    <div class="paylist-container"><div id="payList" class="paylister"></div></div>
  `;

  const payList = document.getElementById('payList');
  members.forEach((m) => {
    const paid = paidMembers.includes(m.number);
    const isReceiver = m.number === member.number;
    const payerRow = document.createElement('div');
    payerRow.className = `payer-row ${paid ? "paid" : "unpaid"}`;
    payerRow.innerHTML = `
      <span>${isReceiver ? '<i class="fa-solid fa-user-check"></i> ' : ''}${m.name}</span>
      <span>${plan.contribution.toLocaleString()}/=</span>
      <i class="${paid ? 'fa-solid fa-square-check' : 'fa-regular fa-square'} checkbox-icon"
         data-round="${round}" data-number="${m.number}"></i>`;
    
    payerRow.addEventListener("click", () => {
      if (!payments[round]) payments[round] = [];
      const isPaid = payments[round].includes(m.number);
      if (!confirm(isPaid ? `❌ Mark ${m.name} as UNPAID?` : `✅ Mark ${m.name} as PAID?`)) return;
      
      if (isPaid) {
        payments[round] = payments[round].filter(n => n !== m.number);
      } else {
        payments[round].push(m.number);
      }
      localStorage.setItem("payments", JSON.stringify(payments));
      showRound(round);
    });
    payList.appendChild(payerRow);
  });
}

const prevBtn = document.getElementById("prevRound");
const nextBtn = document.getElementById("nextRound");

function updateNavButtons() {
  prevBtn.disabled = currentRound === 0;
  nextBtn.disabled = currentRound === plan.peopleCount - 1;
}

prevBtn.addEventListener("click", () => {
  if (currentRound > 0) { currentRound--; showRound(currentRound); updateNavButtons(); }
});

nextBtn.addEventListener("click", () => {
  if (currentRound < plan.peopleCount - 1) { currentRound++; showRound(currentRound); updateNavButtons(); }
});

if (plan) {
  document.getElementById("planFrequency").textContent = plan.frequency;
  document.getElementById("planPeople").textContent = plan.peopleCount;
  document.getElementById("planAmount").textContent = plan.totalAmount.toLocaleString() + "/=";
}
updateNavButtons();
