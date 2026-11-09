document.addEventListener('DOMContentLoaded', function() {
  
  const otpInputs = document.querySelectorAll('.otp-input');
  
  // Logic to auto-advance to the next input box when typing
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      // Allow only numbers
      input.value = input.value.replace(/[^0-9]/g, '');
      
      // Move to next input if a number is entered
      if (input.value !== '' && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    // Handle backspace to move to the previous input box
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // Handle Form Submission - Redirect to Change Password
  const verifyForm = document.getElementById('verifyForm');
  if (verifyForm) {
    verifyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Gather the 6 digits into a single string
      let code = '';
      otpInputs.forEach(input => code += input.value);
      
      if (code.length === 6) {
        const signup = new URLSearchParams(window.location.search).get('flow') === 'signup';
        window.location.href = signup ? 'loginUI.html' : 'changepassword.html';
      } else {
        alert('Please enter the full 6-digit code.');
      }
    });
  }

  // Handle "Resend Code"
  const resendCodeBtn = document.getElementById('resendCodeBtn');
  if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', function(e) {
      e.preventDefault();
      alert('A new 6-digit code has been sent.');
      
      // Clear inputs and refocus first box
      otpInputs.forEach(input => input.value = '');
      otpInputs[0].focus();
    });
  }

  // Handle redirecting back to the login screen
  const backToLoginBtn = document.getElementById('backToLoginBtn');
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'loginUI.html'; 
    });
  }

});