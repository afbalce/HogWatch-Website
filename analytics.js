document.addEventListener("DOMContentLoaded", () => {
  const segmentBtns = document.querySelectorAll("#timeRangeFilter .segment-btn");
  const activeWindowText = document.getElementById("activeWindowText");
  const startDate = document.getElementById("startDate");
  const endDate = document.getElementById("endDate");
  const penSelect = document.getElementById("penSelect");
  
  // Quick Preset Selection
  segmentBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      segmentBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      activeWindowText.innerText = `Last ${btn.dataset.val}`;
      triggerChartPulse();
    });
  });

  // Custom Date Listeners
  [startDate, endDate].forEach(input => {
    input.addEventListener("change", () => {
      segmentBtns.forEach(b => b.classList.remove("active")); // Remove preset styling
      activeWindowText.innerText = `${startDate.value} to ${endDate.value}`;
      triggerChartPulse();
    });
  });

  // Dropdown Listeners
  if (penSelect) {
    penSelect.addEventListener("change", (e) => {
      triggerChartPulse();
    });
  }

  // Button States
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) {
    exportBtn.addEventListener("click", function() {
      const origHtml = this.innerHTML;
      this.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Exporting...`;
      setTimeout(() => {
        this.innerHTML = `<i class="fa-solid fa-check"></i> Done`;
        this.style.background = "#ECFDF5";
        this.style.color = "#065F46";
        setTimeout(() => {
          this.innerHTML = origHtml;
          this.style.background = "";
          this.style.color = "";
        }, 2000);
      }, 1000);
    });
  }

  // Chart Animation Simulation
  function triggerChartPulse() {
    const svgs = document.querySelectorAll(".svg-chart-wrapper");
    svgs.forEach(svg => {
      svg.style.opacity = "0.3";
      setTimeout(() => {
        svg.style.opacity = "1";
        svg.style.transition = "opacity 0.3s ease";
      }, 300);
    });
  }
});