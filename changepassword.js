document.addEventListener('DOMContentLoaded', function() {
  
  // 1. Password Visibility Logic
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

  // 2. Form Submission & Validation - Redirect to Login
  const changePasswordForm = document.getElementById('changePasswordForm');
  const newPassword = document.getElementById('newPassword');
  const confirmPassword = document.getElementById('confirmPassword');
  
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (newPassword.value !== confirmPassword.value) {
        alert("Passwords do not match. Please try again.");
        return;
      }
      
      if (newPassword.value.length < 8) {
        alert("Password must be at least 8 characters long.");
        return;
      }

      alert("Password successfully reset! Please log in with your new password.");
      
      // Redirect to login page after successful reset
      window.location.href = 'loginUI.html'; 
    });
  }

  // 3. Back to login redirect
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'loginUI.html'; 
    });
  }

});