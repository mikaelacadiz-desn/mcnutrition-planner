/**
 * AUTH.JS - Auth0 Authentication
 * Handles user authentication using Auth0
 */

import { createAuth0Client } from 'https://cdn.auth0.com/js/auth0-spa-js/2.0/auth0-spa-js.production.esm.js';

let auth0Client = null;

// Initialize Auth0 client
async function initAuth0() {
  try {
    // Use explicit URL for consistency
    const redirectUri = window.location.href.split('?')[0].split('#')[0];
    
    auth0Client = await createAuth0Client({
      domain: 'dev-hi80y5bs71d70ce7.us.auth0.com',
      clientId: 'mwGZi0yj4O9xW8SnSwKdS0cG3fjk9lhN',
      authorizationParams: {
        redirect_uri: redirectUri
      }
    });
    
    console.log('Auth0 initialized with redirect_uri:', redirectUri);

    // Check if user is returning from Auth0
    const query = window.location.search;
    if (query.includes('code=') && query.includes('state=')) {
      await auth0Client.handleRedirectCallback();
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Update UI based on authentication state
    await updateAuthUI();
  } catch (error) {
    console.error('Error initializing Auth0:', error);
  }
}

// Update UI based on authentication state
async function updateAuthUI() {
  const isAuthenticated = await auth0Client.isAuthenticated();
  const loginBtn = document.querySelector('.navbar-login');
  
  if (isAuthenticated) {
    const user = await auth0Client.getUser();
    loginBtn.innerHTML = `
      <span>${user.name || user.email}</span>
      <img src="assets/login.svg" alt="Logout" class="login-icon" />
    `;
    loginBtn.onclick = logout;
  } else {
    loginBtn.innerHTML = `
      <span>Login</span>
      <img src="assets/login.svg" alt="Login" class="login-icon" />
    `;
    loginBtn.onclick = login;
  }
}

// Login function
async function login(e) {
  e.preventDefault();
  try {
    await auth0Client.loginWithRedirect();
  } catch (error) {
    console.error('Error during login:', error);
  }
}

// Logout function
async function logout(e) {
  e.preventDefault();
  try {
    await auth0Client.logout({
      logoutParams: {
        returnTo: window.location.origin
      }
    });
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

// Get current user
export async function getUser() {
  if (!auth0Client) return null;
  const isAuthenticated = await auth0Client.isAuthenticated();
  if (isAuthenticated) {
    return await auth0Client.getUser();
  }
  return null;
}

// Check if user is authenticated
export async function isAuthenticated() {
  if (!auth0Client) return false;
  return await auth0Client.isAuthenticated();
}

// Initialize Auth0 when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth0);
} else {
  initAuth0();
}

export { auth0Client };
