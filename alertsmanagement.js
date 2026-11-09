document.addEventListener("DOMContentLoaded", () => {
  
  // --- Toast Notification System ---
  const customAlert = document.getElementById('customAlert');
  const alertMessage = document.getElementById('alertMessage');
  const alertIcon = document.getElementById('alertIcon');
  let alertTimeout;

  function showToast(message, type = 'info', duration = 4000) {
    customAlert.className = 'custom-alert';
    alertMessage.textContent = message;
    customAlert.classList.add(type);
    
    if (type === 'success') alertIcon.className = 'fa-solid fa-circle-check';
    else if (type === 'error') alertIcon.className = 'fa-solid fa-circle-exclamation';
    else alertIcon.className = 'fa-solid fa-bell';

    customAlert.classList.add('show-alert');

    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      customAlert.classList.remove('show-alert');
    }, duration);
  }

  // --- ACKNOWLEDGE LOGIC ---
  document.querySelectorAll('.ack-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const statusBadge = row.querySelector('td:nth-child(6) .badge');
      const alertTitle = row.querySelector('.alert-msg-title').textContent;

      statusBadge.className = 'badge badge-warn'; 
      statusBadge.textContent = 'Acknowledged';
      btn.disabled = true;
      btn.title = 'Alert acknowledged';
      btn.setAttribute('aria-label', btn.title);

      showToast(`Acknowledged. Reminder set for ${alertTitle}.`, 'success');

      // Set Timer (Demo: 8 seconds)
      setTimeout(() => {
        if(statusBadge.textContent === 'Acknowledged') {
          showToast(`REMINDER: ${alertTitle} is still unresolved!`, 'error', 8000);
          statusBadge.className = 'badge badge-crit'; 
          statusBadge.textContent = 'Escalated';
        }
      }, 8000); 
    });
  });

  // --- RESOLVE MODAL LOGIC ---
  const modal = document.getElementById("actionModal");
  const closeModalX = document.getElementById("closeModalX");
  const cancelModalBtn = document.getElementById("cancelModalBtn");
  const confirmModalBtn = document.getElementById("confirmModalBtn");
  const modalAlertName = document.getElementById("modalAlertName");
  const actionSelect = document.getElementById("actionSelect");
  const actionNotes = document.getElementById("actionNotes");

  let currentRowBeingResolved = null; 

  document.querySelectorAll(".resolve-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      currentRowBeingResolved = this.closest("tr");
      const alertTitle = currentRowBeingResolved.querySelector(".alert-msg-title").textContent;
      
      modalAlertName.textContent = alertTitle;
      actionSelect.value = "";
      actionNotes.value = "";
      document.querySelectorAll('.resolve-check').forEach(chk => chk.checked = false);

      modal.classList.remove("hidden");
    });
  });

  const closeModal = () => {
    modal.classList.add("hidden");
    currentRowBeingResolved = null;
  };
  closeModalX.addEventListener("click", closeModal);
  cancelModalBtn.addEventListener("click", closeModal);

  confirmModalBtn.addEventListener("click", () => {
    const checkboxes = document.querySelectorAll('.resolve-check');
    const allChecked = Array.from(checkboxes).every(chk => chk.checked);

    if (!allChecked) {
      showToast("Please complete the pre-resolution checklist.", "error");
      return;
    }
    if (!actionSelect.value) {
      showToast("Please select the action taken.", "error");
      return;
    }

    const row = currentRowBeingResolved;
    const statusBadge = row.querySelector('td:nth-child(6) .badge');
    const alertTitle = modalAlertName.textContent;
    
    statusBadge.className = 'badge badge-open'; 
    statusBadge.textContent = 'Resolved';
    
    row.querySelectorAll('button').forEach(b => {
      b.disabled = true;
    });

    const resolvedKpi = document.querySelector(".kpi-card:last-child .kpi-value");
    if (resolvedKpi) {
      resolvedKpi.textContent = parseInt(resolvedKpi.textContent) + 1;
    }

    closeModal();
    showToast(`Alert resolved. System monitoring for stability.`, 'success');

    // Post-Resolve Simulation (Demo: 5 seconds)
    setTimeout(() => {
      if(alertTitle.includes('Pen 4')) {
        showToast(`CRITICAL: ${alertTitle} is STILL reading critical levels. Alert re-triggered!`, 'error', 8000);
        statusBadge.className = 'badge badge-crit';
        statusBadge.textContent = 'Critical (Re-triggered)';
        
        row.querySelectorAll('button').forEach(b => {
          b.disabled = false;
          if (b.classList.contains('ack-btn')) {
            b.title = 'Acknowledge alert';
            b.setAttribute('aria-label', b.title);
          }
        });

        if (resolvedKpi) resolvedKpi.textContent = parseInt(resolvedKpi.textContent) - 1;
      } else {
        row.style.transition = "opacity 0.5s ease";
        row.style.opacity = "0";
        setTimeout(() => row.remove(), 500);
      }
    }, 5000); 
  });

  // --- Acknowledge All ---
  const ackAllBtn = document.getElementById("ackAllBtn");
  if (ackAllBtn) {
    ackAllBtn.addEventListener("click", () => {
      document.querySelectorAll(".ack-btn:not(:disabled)").forEach(btn => btn.click());
      ackAllBtn.textContent = "All Acknowledged";
      ackAllBtn.disabled = true;
    });
  }
});
