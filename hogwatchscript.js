document.addEventListener('DOMContentLoaded', function() {
  
  // --- Modern Toast Notification Logic ---
  const customAlert = document.getElementById('customAlert');
  const alertMessage = document.getElementById('alertMessage');
  const alertIcon = document.getElementById('alertIcon');
  let alertTimeout;

  function showToast(message, type = 'info') {
    // Reset classes
    customAlert.className = 'custom-alert';
    
    // Set text and type (success, error, info)
    alertMessage.textContent = message;
    customAlert.classList.add(type);
    
    // Set icon based on type
    if (type === 'success') alertIcon.className = 'fa-solid fa-circle-check';
    else if (type === 'error') alertIcon.className = 'fa-solid fa-circle-exclamation';
    else alertIcon.className = 'fa-solid fa-circle-info';

    // Show alert
    customAlert.classList.add('show-alert');

    // Hide alert after 3 seconds
    clearTimeout(alertTimeout);
    alertTimeout = setTimeout(() => {
      customAlert.classList.remove('show-alert');
    }, 3000);
  }

  // --- Password Visibility Logic ---
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

  // --- Define all Views ---
  const loginView = document.getElementById('login-view');
  const signupView = document.getElementById('signup-view');
  const forgotView = document.getElementById('forgot-password-view');
  const verifyView = document.getElementById('verify-account-view');
  const changePasswordView = document.getElementById('change-password-view');

  // Master switch function
  function switchView(targetView) {
    document.querySelectorAll('.form-view').forEach(view => {
      view.classList.remove('active-view');
    });
    targetView.classList.add('active-view');
  }

  // --- Click Listeners for Link Navigation ---
  document.querySelectorAll('.switch-to-signup').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); switchView(signupView); });
  });

  document.querySelectorAll('.switch-to-login').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); switchView(loginView); });
  });

  document.querySelectorAll('.switch-to-forgot').forEach(btn => {
    btn.addEventListener('click', (e) => { e.preventDefault(); switchView(forgotView); });
  });

  // --- Form Submission Logic (The Flow) ---
  
  // Signup -> Verify
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      switchView(verifyView);
    });
  }

  // Forgot Password -> Verify
  const forgotForm = document.getElementById('forgotPasswordForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      switchView(verifyView);
    });
  }

  // Verify -> Change Password
  const verifyForm = document.getElementById('verifyForm');
  const otpInputs = document.querySelectorAll('.otp-input');
  if (verifyForm) {
    verifyForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let code = '';
      otpInputs.forEach(input => code += input.value);
      
      if (code.length === 6) {
        switchView(changePasswordView);
      } else {
        showToast('Please enter the full 6-digit code.', 'error');
      }
    });
  }

  // Change Password -> Login
  const changePasswordForm = document.getElementById('changePasswordForm');
  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPass = document.getElementById('newPassword').value;
      const confPass = document.getElementById('confirmPassword').value;
      
      if (newPass !== confPass) {
        showToast("Passwords do not match. Please try again.", "error");
        return;
      }
      if (newPass.length < 8) {
        showToast("Password must be at least 8 characters long.", "error");
        return;
      }
      
      showToast("Password successfully reset! Please log in.", "success");
      
      // Add a slight delay before switching so the user can read the success message
      setTimeout(() => {
        switchView(loginView);
        changePasswordForm.reset();
      }, 1500);
    });
  }

  // --- OTP Auto-Advance Logic ---
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      input.value = input.value.replace(/[^0-9]/g, '');
      if (input.value !== '' && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && input.value === '' && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // Handle "Resend Code" on Verify Screen
  const resendCodeBtn = document.getElementById('resendCodeBtn');
  if (resendCodeBtn) {
    resendCodeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('A new 6-digit code has been sent.', 'info');
      otpInputs.forEach(input => input.value = '');
      otpInputs[0].focus();
    });
  }

});