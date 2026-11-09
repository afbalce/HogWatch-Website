document.addEventListener('DOMContentLoaded', function() {
  const toggleBtn = document.getElementById('togglePassword');
  const passInput = document.getElementById('passwordField');
  
  const loginTab = document.getElementById('loginTab');
  const signupTab = document.getElementById('signupTab');
  
  // Eye Icon click event
  toggleBtn.addEventListener('click', function () {
    if (passInput.type === 'password') {
      passInput.type = 'text'; 
      toggleBtn.classList.remove('fa-eye');
      toggleBtn.classList.add('fa-eye-slash');
    } else {
      passInput.type = 'password'; 
      toggleBtn.classList.remove('fa-eye-slash');
      toggleBtn.classList.add('fa-eye');
    }
  });
  
  // When Sign Up tab is clicked on the Login page, redirect to the Sign up file
  signupTab.addEventListener('click', function() {
    window.location.href = 'signupUI.html';
  });
  // Prevent default form submit for prototype
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    window.location.href = 'dashboard.html';
  });
});