const tabContent = document.getElementById('tabContent');
const plan = JSON.parse(localStorage.getItem('plan'));
const members = JSON.parse(localStorage.getItem('members')) || [];
let payments = JSON.parse(localStorage.getItem('payments')) || {};
let currentRound = 0;

if (!plan || members.length === 0) {
  window.location.href = "setup.html";
} else {
  currentRound = getRoundForToday();
  // Ensure the DOM is fully loaded before showing the round
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => showRound(currentRound));
  } else {
    showRound(currentRound);
  }
}

const adminId = localStorage.getItem("adminId");
if (!adminId) {
  window.location.href = "auth.html";
} else {
  const navIdDisplay = document.getElementById("navbarAdminId");
  if (navIdDisplay) navIdDisplay.textContent = adminId;
}

/**
 * UPDATED: Modular Month Logic
 * Handles Half-Month (15-day split) and Third-Month (10-day split)
 * anchored to the original start date day.
 */
function calculateRoundDate(startDateStr, round, plan) {
  const start = new Date(startDateStr);
  const date = new Date(startDateStr);
  const startDay = start.getDate(); 

  if (plan.frequency === "Daily") {
    date.setDate(date.getDate() + round);
  } 
  else if (plan.frequency === "Weekly") {
    date.setDate(date.getDate() + (7 * round));
  } 
  else if (plan.frequency === "Monthly") {
    date.setMonth(date.getMonth() + round);
  } 
  else if (plan.frequency === "Half-Month") {
    let monthsToAdd = Math.floor(round / 2);
    let isSecondHalf = round % 2 === 1;
    
    date.setMonth(start.getMonth() + monthsToAdd);
    if (isSecondHalf) {
      date.setDate(startDay + 15);
    } else {
      date.setDate(startDay);
    }
  } 
  else if (plan.frequency === "Third-Month") {
    let monthsToAdd = Math.floor(round / 3);
    let position = round % 3; // 0, 1, or 2
    
    date.setMonth(start.getMonth() + monthsToAdd);
    if (position === 0) date.setDate(startDay);
    else if (position === 1) date.setDate(startDay + 10);
    else date.setDate(startDay + 20);
  }
  // Logic for the old "Custom" option (if still in use)
  else if (plan.frequency === "Custom" && plan.customDays) {
    date.setDate(date.getDate() + (plan.customDays * round));
  }
  
  return date;
}

function getRoundForToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < plan.peopleCount; i++) {
    const rd = calculateRoundDate(plan.startDate, i, plan);
    const nextRd = calculateRoundDate(plan.startDate, i + 1, plan);
    
    rd.setHours(0, 0, 0, 0);
    nextRd.setHours(0, 0, 0, 0);

    // If today is within this round's range
    if (today >= rd && today < nextRd) {
      return i;
    }
  }
  return 0; 
}

function showRound(round) {
  const roundDate = calculateRoundDate(plan.startDate, round, plan);
  const dateStr = roundDate.toLocaleDateString("en-US", {
    day: "numeric", month: "short", year: "numeric"
  });

  const dateDisplay = document.getElementById("currentDate");
  if (dateDisplay) dateDisplay.textContent = dateStr;

  const member = members[round];
  if (!member) {
    tabContent.innerHTML = "<p>No member for this round.</p>";
    return;
  }

  const paidMembers = payments[round] || [];
  const paidCount = paidMembers.length;
  const total = members.length;
  const contribution = parseFloat(plan.contribution || (plan.totalAmount / plan.peopleCount));
  const paidAmount = paidCount * contribution;
  const remainingAmount = plan.totalAmount - paidAmount;
  const progressPercent = Math.round((paidCount / total) * 100);

  tabContent.innerHTML = `
    <div class="receiver-card">
      <div class="round-badge">${round + 1}</div>
      <h3>${member.name} ${paidCount === total ? '<i class="fa-solid fa-circle-check completed-icon"></i>' : ''}</h3>
      <p>Remaining: ${remainingAmount.toLocaleString()}/= / ${parseFloat(plan.totalAmount).toLocaleString()}/=</p>
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
      <span>${contribution.toLocaleString()}/=</span>
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
  updateNavButtons();
}

const prevBtn = document.getElementById("prevRound");
const nextBtn = document.getElementById("nextRound");

function updateNavButtons() {
  if (prevBtn) prevBtn.disabled = currentRound === 0;
  if (nextBtn) nextBtn.disabled = currentRound === plan.peopleCount - 1;
}

prevBtn?.addEventListener("click", () => {
  if (currentRound > 0) { 
    currentRound--; 
    showRound(currentRound); 
  }
});

nextBtn?.addEventListener("click", () => {
  if (currentRound < plan.peopleCount - 1) { 
    currentRound++; 
    showRound(currentRound); 
  }
});

// Update Header Summary
if (plan) {
  const freqEl = document.getElementById("planFrequency");
  const peopleEl = document.getElementById("planPeople");
  const amountEl = document.getElementById("planAmount");

  if (freqEl) freqEl.textContent = plan.frequency;
  if (peopleEl) peopleEl.textContent = plan.peopleCount;
  if (amountEl) amountEl.textContent = parseFloat(plan.totalAmount).toLocaleString() + "/=";
}
