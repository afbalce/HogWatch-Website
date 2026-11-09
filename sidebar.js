document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("sidebar-container");
  if (!container) return;

  container.innerHTML = `<aside class="sidebar-wrapper">
  <div class="sidebar-header">
    <h2 class="brand-text"><a href="sidebar.html" aria-label="HogWatch navigation">HogWatch</a></h2>
    <p class="brand-subtext">Farm Sentinels</p>
  </div>

  <!-- User Profile Moved to Top -->
  <div class="user-profile">
    <div class="user-avatar">
      JD
    </div>
    <div class="user-info">
      <span class="user-name">John Doe</span>
      <span class="user-role">Farm Manager</span>
    </div>
  </div>

  <nav class="sidebar-nav">
    <a href="dashboard.html" class="nav-link" data-page="dashboard">
      <i class="fa-solid fa-border-all"></i> Dashboard
    </a>
    <a href="pen-monitoring.html" class="nav-link" data-page="pen-monitoring">
      <i class="fa-solid fa-bullseye"></i> Pen Monitoring
    </a>
    <a href="pen-management.html" class="nav-link" data-page="pen-management">
      <i class="fa-solid fa-table-cells-large"></i> Pen Management
    </a>
    <a href="alertsmanagement.html" class="nav-link" data-page="alerts">
      <i class="fa-solid fa-triangle-exclamation"></i> Alert Management
    </a>
    <a href="analytics.html" class="nav-link" data-page="analytics">
      <i class="fa-solid fa-chart-simple"></i> Analytics and Reports
    </a>
    <a href="users.html" class="nav-link" data-page="users">
      <i class="fa-solid fa-user-group"></i> Users
    </a>
    <a href="devicemanagement.html" class="nav-link" data-page="devices">
      <i class="fa-solid fa-server"></i> Device Management
    </a>
    <a href="settings.html" class="nav-link" data-page="settings">
      <i class="fa-solid fa-gear"></i> Settings
    </a>
  </nav>

  <div class="sidebar-footer">
    <!-- Edge Gateway Moved to Bottom -->
    <div class="edge-gateway-card">
      <div class="gateway-title">
        <div class="status-indicator">
          <span class="status-dot"></span>
        </div>
        Edge Gateway Online
      </div>
      <div class="gateway-stats">
        <div class="stat-row"><span>Battery</span><strong class="stat-value">45%</strong></div>
        <div class="stat-row"><span>Latency</span><strong class="stat-value">42 ms</strong></div>
        <div class="stat-row"><span>Solar</span><strong class="stat-value text-green">15 W</strong></div>
        <div class="stat-row"><span>Sensors</span><strong class="stat-value">12/12</strong></div>
        <div class="stat-row"><span>Cameras</span><strong class="stat-value">4/4</strong></div>
      </div>
    </div>

    <a class="logout-btn" href="hogwatchwebsite.html">
      <i class="fa-solid fa-arrow-right-from-bracket"></i> Log out
    </a>
  </div>
</aside>`;

  const activePage = document.body.dataset.page || new URLSearchParams(location.search).get("page");
  const main = document.querySelector('.app-layout > .main-content');
  if (main) {
    const navigation = document.createElement('a');
    navigation.className = 'compact-nav';
    navigation.href = 'sidebar.html?page=' + encodeURIComponent(activePage);
    navigation.textContent = 'Navigation';
    main.prepend(navigation);
  }
  for (const link of container.querySelectorAll(".nav-link")) {
    if (link.dataset.page === activePage) {
      link.classList.add("active");
      link.setAttribute("aria-current", "page");
    }
  }
});
