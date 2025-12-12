/**
 * NAVBAR-AUTH.JS - Navigation bar authentication handler
 * Checks user authentication status and updates login/logout button
 */

document.addEventListener('DOMContentLoaded', async function() {
  try {
    // Fetch user authentication status from server
    const response = await fetch('/api/user');
    const data = await response.json();
    
    const authButton = document.getElementById('auth-button');
    const authText = document.getElementById('auth-text');
    const logoutButton = document.getElementById('logout-button');
    const profileIcon = document.getElementById('profile-icon');
    
    if (data.isAuthenticated) {
      // User is logged in - show user name and logout button
      authText.textContent = data.name || 'User';
      authButton.href = '#';
      authButton.style.pointerEvents = 'none'; // Make it non-clickable
      logoutButton.style.display = 'flex'; // Show logout button
    } else {
      // User is not logged in - show login button
      authText.textContent = 'Login';
      authButton.href = '/login';
      authButton.style.pointerEvents = 'auto';
      logoutButton.style.display = 'none';
    }
  } catch (error) {
    console.error('Error checking authentication status:', error);
  }
});
