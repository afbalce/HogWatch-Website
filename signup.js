document.addEventListener('DOMContentLoaded', function() {
  
  // 1. Handle Multiple Password Toggles
  const toggleButtons = document.querySelectorAll('.toggle-password');
  
  toggleButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      const targetId = this.getAttribute('data-target');
      const passInput = document.getElementById(targetId);
      
      if (passInput.type === 'password') {
        passInput.type = 'text'; 
        this.classList.remove('fa-eye');
        this.classList.add('fa-eye-slash');
      } else {
        passInput.type = 'password'; 
        this.classList.remove('fa-eye-slash');
        this.classList.add('fa-eye');
      }
    });
  });

  // 2. Tab redirect logic
  const loginTab = document.getElementById('loginTab');
  
  // When Log in tab is clicked on the Sign Up page, redirect to the Login file
  loginTab.addEventListener('click', function() {
    window.location.href = 'loginUI.html';
  });

  // 3. Prevent default form submit for prototype
  document.getElementById('signupForm').addEventListener('submit', function(e) {
    e.preventDefault();
    if (document.getElementById('passwordField1').value !== document.getElementById('passwordField2').value) {
      alert('Passwords do not match.');
      return;
    }
    window.location.href = 'verifyaccount.html?flow=signup';
  });
});