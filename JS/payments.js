const tabContent = document.getElementById('tabContent');

const plan = JSON.parse(localStorage.getItem('plan'));
const members = JSON.parse(localStorage.getItem('members')) || [];
let payments = JSON.parse(localStorage.getItem('payments')) || {};

let currentRound = 0; // track which round we are on

if (!plan || members.length === 0) {
  // Redirect to setup page if no plan or members exist
  window.location.href = "setup.html";
} else {
  // Auto-detect round based on today's date
  currentRound = getRoundForToday();
  showRound(currentRound);
}

const adminId = localStorage.getItem("adminId");
if (!adminId) {
  window.location.href = "auth.html"; // force login if no account
} else {
  document.getElementById("navbarAdminId").textContent = adminId;
}


function getRoundForToday() {
  const startDate = new Date(plan.startDate);
  const today = new Date();

  for (let round = 0; round < plan.peopleCount; round++) {
    const roundDate = new Date(startDate);

    if (plan.frequency === "Daily") roundDate.setDate(startDate.getDate() + round);
    if (plan.frequency === "Weekly") roundDate.setDate(startDate.getDate() + (7 * round));
    if (plan.frequency === "Monthly") roundDate.setMonth(startDate.getMonth() + round);

    // If today is before next round’s date, stop here
    if (today < roundDate) {
      return Math.max(0, round - 1); // use previous round
    }

    // If today is same as round date, jump to this round
    if (
      today.getFullYear() === roundDate.getFullYear() &&
      today.getMonth() === roundDate.getMonth() &&
      today.getDate() === roundDate.getDate()
    ) {
      return round;
    }
  }

  // If today is after all rounds, return last round
  return plan.peopleCount - 1;
}


// --- Show one round ---
function showRound(round) {
  const startDate = new Date(plan.startDate);

  // Calculate payout date
  const roundDate = new Date(startDate);
  if (plan.frequency === "Daily") roundDate.setDate(startDate.getDate() + round);
  if (plan.frequency === "Weekly") roundDate.setDate(startDate.getDate() + (7 * round));
  if (plan.frequency === "Monthly") roundDate.setMonth(startDate.getMonth() + round);

  const dateStr = roundDate.toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric"
  });

  // Update header date
  document.getElementById("currentDate").textContent = dateStr;

  const member = members[round];
  if (!member) {
    tabContent.innerHTML = "<p>No member for this round.</p>";
    return;
  }

  // Calculate paid status
  const paidMembers = payments[round] || [];
  const paidCount = paidMembers.length;
  const total = members.length;
  const contribution = plan.contribution;
  const paidAmount = paidCount * contribution;
  const remainingAmount = plan.totalAmount - paidAmount;
  const progressPercent = Math.round((paidCount / total) * 100);

  tabContent.innerHTML = `
    <!-- Receiver Card -->
<div class="receiver-card">
  <div class="round-badge">${round + 1}</div>
<h3>
  ${member.name}
  ${paidCount === total ? '<i class="fa-solid fa-circle-check completed-icon"></i>' : ''}
</h3>

  <p>Remaining: ${remainingAmount.toLocaleString()} / ${plan.totalAmount.toLocaleString()}</p>
  <p>Paid: ${paidCount}/${total}</p>
  <div class="progress-bar"><span style="width:${progressPercent}%"></span></div>
</div>


    <!-- Payers List -->
    <div class="paylist-container"><div id="payList" class="paylister"></div></div>
  `;

  const payList = document.getElementById('payList');

members.forEach((m) => {
  const paid = paidMembers.includes(m.number);
  const isReceiver = m.number === member.number; // ✅ check if this member is the receiver

  const payerRow = document.createElement('div');
  payerRow.className = `payer-row ${paid ? "paid" : "unpaid"}`;

  payerRow.innerHTML = `
    <span>
      ${isReceiver ? '<i class="fa-solid fa-user-check"></i> ' : ''}
      ${m.name}
    </span>
    <span>${plan.contribution.toLocaleString()}/=</span>
    <i class="${paid ? 'fa-solid fa-square-check' : 'fa-regular fa-square'} checkbox-icon"
       data-round="${round}" 
       data-number="${m.number}"></i>
  `;

  payList.appendChild(payerRow);
});


// Attach events to payer rows
document.querySelectorAll('.payer-row').forEach(row => {
  const icon = row.querySelector('.checkbox-icon');
  const round = icon.dataset.round;
  const number = icon.dataset.number;

row.addEventListener("click", () => {
  if (!payments[round]) payments[round] = [];

  const isPaid = payments[round].includes(number);
  const member = members.find(m => m.number === number);
  const confirmMsg = isPaid
    ? `❌ Mark ${member.name} as UNPAID?`
    : `✅ Mark ${member.name} as PAID?`;

  if (!confirm(confirmMsg)) {
    return; // cancel action
  }

  if (isPaid) {
    // Uncheck
    payments[round] = payments[round].filter(n => n !== number);
  } else {
    // Check
    payments[round].push(number);
  }

  localStorage.setItem("payments", JSON.stringify(payments));
  showRound(parseInt(round)); // 🔄 refresh
});


});


}

// --- Arrow navigation ---
const prevBtn = document.getElementById("prevRound");
const nextBtn = document.getElementById("nextRound");

function updateNavButtons() {
  prevBtn.disabled = currentRound === 0;
  nextBtn.disabled = currentRound === plan.peopleCount - 1;
}

prevBtn.addEventListener("click", () => {
  if (currentRound > 0) {
    currentRound--;
    showRound(currentRound);
    updateNavButtons();
  }
});

nextBtn.addEventListener("click", () => {
  if (currentRound < plan.peopleCount - 1) {
    currentRound++;
    showRound(currentRound);
    updateNavButtons();
  }
});


// Initial state
updateNavButtons();


// --- Fill header info ---
if (plan) {
  document.getElementById("planFrequency").textContent = plan.frequency;
  document.getElementById("planPeople").textContent = plan.peopleCount;
  document.getElementById("planAmount").textContent = plan.totalAmount.toLocaleString() + "/=";
}

updateNavButtons(); // ✅ ensure buttons are correct after every round shown

