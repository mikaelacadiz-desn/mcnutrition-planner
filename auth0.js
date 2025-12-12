const isLandingPage = document.getElementById('landing') ? true : false
const isVaultPage = document.getElementById('vault') ? true : false

const response = await fetch('/api/user')
const data = await response.json()

const isAuthenticated = data.isAuthenticated
const displayName = data.name || 'Guest'
const displayEmail = data.email || 'Welcome'
const profilePicture = data.picture || 'user.svg'

const authButton = isAuthenticated
    ? '<a class="button" href="/logout">Logout</a>'
    : '<a class="button" href="/login">Login</a>'

const vaultLink = isAuthenticated && isLandingPage
    ? '<a class="button" href="/vault">Enter Vault</a>'
    : ''

profile.innerHTML = `
        <img src="${profilePicture}" onerror="this.onerror=null;this.src='user.svg';">
        <div>
            <h4>${displayName}</h4>
            <h5>${displayEmail}</h5>
        </div>
        ${authButton}
        ${vaultLink}
    `

if (isLandingPage && content) {
    content.innerHTML = isAuthenticated
        ? `<span class="secret-sauce">
                    Your <a href="/vault">secret sauce</a> is ready.
               </span>`
        : `<span class="secret-sauce">
                    Have you tried our <a href="/vault">secret sauce</a>?
               </span>`
}

if (isAuthenticated && isVaultPage) {
    // the vault endpoint only works for logged in users
    // see also, the /api/secrets endpoint in ./server.js
    try {
        const response = await fetch('/api/secrets')
        const data = await response.json()
        const vaultHTML = `<span class="secret-sauce">
            Here you go.
            </span>
            <ul class="items">
                ${data.map(item =>
            `<li>
                    <a class="sauce" target="_blank" href="${item.url}">
                        <span>${item.name}</span>
                    </a>
                </li>`)
                .join('')}
            </ul>`;

        content.innerHTML = DOMPurify.sanitize(vaultHTML)
    }
    catch (e) {
        console.log(e)
    }
}

if (logo) {
    logo.addEventListener('click', () => {
        window.location.href = '/'
    })
}

