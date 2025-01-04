document.addEventListener("DOMContentLoaded", () => {
  // Toggle between sign-in and sign-up mode
  const sign_in_btn = document.querySelector("#sign-in-btn");
  const sign_up_btn = document.querySelector("#sign-up-btn");
  const container = document.querySelector(".container");
  const rememberMeCheckbox = document.getElementById("remember-me");
  const usernameInput = document.querySelector(".sign-in-form input[type='text']");

  // Getting the github sign-up & login buttons
  const github_signIn = document.getElementById("gh-sg-btn");
  const github_login = document.getElementById("gh-lg-btn");

  // Sign up & login mode toggle
  sign_up_btn.addEventListener("click", () => {
    container.classList.add("sign-up-mode");
  });

  sign_in_btn.addEventListener("click", () => {
    container.classList.remove("sign-up-mode");
  });

  // GitHub Authentication Setup
  const GITHUB_CLIENT_ID = "Ov23liz64bw3989HVcKK";
  const BACKEND_URL = "http://localhost:3000";

  // GitHub auth handler
  const handleGitHubAuth = () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    
    if (code) {
      console.log("OAuth code received:", code);
      getGhUser(code);
    }
  };

  // Get GitHub user data
  const getGhUser = (code) => {
    console.log("Starting GitHub user fetch with code:", code);
    
    fetch(`${BACKEND_URL}/api/auth/github?code=${code}`)
      .then(res => {
        console.log("Auth response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(response => {
        console.log("Auth response data:", response);
        if (!response.data || !response.data.access_token) {
          throw new Error('No access token received');
        }
        
        const token = response.data.access_token;
        console.log("Received access token, fetching user data");
        
        return fetch(`${BACKEND_URL}/api/auth/github/getUser`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      })
      .then(res => {
        console.log("User data response status:", res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(response => {
        console.log("User data response:", response);
        if (!response.user) {
          throw new Error('No user data received');
        }
        
        const { name, email } = response.user;
        localStorage.setItem('user-info', JSON.stringify({ name, email }));
        
        // Clean up URL
        const cleanUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, '', cleanUrl);
        
        // Redirect to home page
        window.location.href = "/";
      })
      .catch(error => {
        console.error("Authentication error:", error);
        alert("Failed to authenticate with GitHub. Please try again.");
      });
  };

  // GitHub button click handlers
  const initiateGitHubAuth = () => {
    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.append('client_id', GITHUB_CLIENT_ID);
    authUrl.searchParams.append('scope', 'user');
    window.location.href = authUrl.toString();
  };

  github_signIn.onclick = initiateGitHubAuth;
  github_login.onclick = initiateGitHubAuth;

  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) return false;

    const [localPart, domainPart] = email.split("@");
    if (localPart.length > 64 || domainPart.length > 255) return false;

    const domainParts = domainPart.split(".");
    if (domainParts.some((part) => part.length > 63)) return false;

    if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) return false;

    return true;
  };

  // Username validation function
  const validateUsername = (username) => {
    const usernamePattern = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{3,20}$/;
    return usernamePattern.test(username);
  };

  // Sign-in form submission
  document.querySelector(".sign-in-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.querySelector(".sign-in-form input[type='text']").value;
    const password = document.querySelector(".sign-in-form input[type='password']").value;

    if (username === localStorage.getItem("username") && password === localStorage.getItem("password")) {
      if (rememberMeCheckbox.checked) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }
      alert("Login successful!");
      window.location.href = "/";
    } else {
      alert("Invalid username or password");
    }
  });

  // Sign-up form submission
  document.querySelector(".sign-up-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const username = document.querySelector(".sign-up-form input[type='text']").value;
    const email = document.querySelector(".sign-up-form input[type='email']").value;
    const password = document.querySelector(".sign-up-form input[type='password']").value;
    const gitUsername = document.querySelector(".sign-up-form input[type='text'][placeholder='Git Username']").value;

    if (username === "" || email === "" || password === "" || gitUsername === "") {
      alert("Please fill in all fields");
      return;
    }

    if (!validateUsername(username)) {
      alert("Please enter a valid username (3-20 alphanumeric characters).");
      return;
    }

    if (!isValidEmail(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    localStorage.setItem("username", username);
    localStorage.setItem("gitUsername", gitUsername);
    localStorage.setItem("email", email);
    localStorage.setItem("password", password);
    localStorage.setItem("isLoggedIn", "true");
    
    alert("Signup successful!");
    window.location.href = "/";
  });

  // Password visibility toggle
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    const togglePassword = form.querySelector("#toggle-password");
    const passwordInput = form.querySelector("#password-input");

    togglePassword?.addEventListener("click", () => {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        togglePassword.classList.add("fa-lock-open");
        togglePassword.classList.remove("fa-lock");
      } else {
        passwordInput.type = "password";
        togglePassword.classList.add("fa-lock");
        togglePassword.classList.remove("fa-lock-open");
      }
    });
  });

  // Load remembered username if it exists
  if (localStorage.getItem("rememberedUsername")) {
    usernameInput.value = localStorage.getItem("rememberedUsername");
    rememberMeCheckbox.checked = true;
  }

  // Handle GitHub auth on page load
  if (window.location.search.includes("code")) {
    handleGitHubAuth();
  }
});