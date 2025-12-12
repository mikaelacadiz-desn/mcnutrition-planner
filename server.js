// import Express library and activate it
import express from "express";
const app = express();

// import path module to help with file paths
import path from 'path';

// Middleware to parse JSON request bodies
app.use(express.json())

// Serve static files from the 'public' folder
app.use(express.static('public'))

// On Vercel, point the root url (/) to index.html explicitly
if (process.env.VERCEL) {
    app.get('/', (req, res) => {
        res.sendFile(path.join(process.cwd(), 'public', 'index.html'))
    })
}

// Import the OpenID Connect Library (maintained by Auth0)
// See also: https://github.com/auth0/express-openid-connect
import auth0 from 'express-openid-connect'
const { auth, requiresAuth } = auth0

// Auth0 Configuration
// Make sure add the following environment variables are set:
// SECRET, BASE_URL, CLIENT_ID, ISSUER_BASE_URL 
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.CLIENT_ID,
    issuerBaseURL: process.env.ISSUER_BASE_URL
}

// Show an error if any environment variables are missing
if (Object.keys(config).some(key => config[key] == null)) {
    console.error('Error: Auth0 environment variable(s) are missing.')
    process.exit(1)
}

// Enable auth in our Express app.
// This will automatically setup /login, /logout, /callback endpoints
app.use(auth(config))

// Import Prisma to save user data
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Middleware to save user to database after login
app.use(async (req, res, next) => {
    if (req.oidc?.isAuthenticated() && req.oidc.user) {
        try {
            const user = req.oidc.user;
            
            // Upsert user: update if exists, create if new
            await prisma.users.upsert({
                where: { auth0Id: user.sub },
                update: {
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    lastLogin: new Date()
                },
                create: {
                    auth0Id: user.sub,
                    email: user.email,
                    name: user.name,
                    picture: user.picture
                }
            });
        } catch (err) {
            console.error('Error saving user to database:', err);
        }
    }
    next();
});

// NOTE: OpenIdConnect attaches user data to all incoming requests
// We can find this data at "req.oidc"

// Publish the user's data and authentication state to the frontend
app.get('/api/user', (req, res) => {
    // If the user is logged in, send their data 
    if (req.oidc?.isAuthenticated()) {
        res.send({
            ...req.oidc.user,
            isAuthenticated: true
        })
    }
    // If the user is not logged in, 
    // Inform the frontend that we have a Guest user.
    else {
        res.send({
            name: "Guest",
            isAuthenticated: false
        })
    }
})

// the private vault page
app.get('/vault', requiresAuth(), (req, res) => {
    res.sendFile(path.join(process.cwd(), 'private', 'vault.html'));
});


app.get('/api/secrets', async (req, res) => {
    try {
        // If the user is logged in, send secret data
        if (req.oidc?.isAuthenticated()) {
            res.send([
                {
                    "name": "Cookie Recipe",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                },
                {
                    "name": "Secret Sauce",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                },
                {
                    "name": "Inside Information",
                    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                }
            ]);
        }
        // If the user is not logged in,
        // return an error message
        else {
            return res.status(401).json({ error: 'Authentication required' });

        }

    } catch {
        res.status(500).json({ error: 'Failed to send data' });
    }
})

// Import API routes for menu data
import apiRoutes from './routes/api.js'
app.use('/api', apiRoutes)

const port = 3001
// Start Express
app.listen(port, () => {
    console.log(`Express is now Live.`)
    console.log(`http://localhost:${port}`)
}); 
