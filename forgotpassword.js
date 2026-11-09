document.addEventListener('DOMContentLoaded', function() {
  
  // Handle redirecting back to the login screen
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      // Ensure 'loginUI.html' matches your actual login file name exactly
      window.location.href = 'loginUI.html'; 
    });
  }

  // Prevent default form submit for prototype
  const forgotForm = document.getElementById('forgotPasswordForm');
  
  if (forgotForm) {
    forgotForm.addEventListener('submit', function(e) {
      e.preventDefault();
      window.location.href = 'verifyaccount.html';
    });
  }

});