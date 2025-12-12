// Below we will use the Express Router to define a series of API endpoints.
// Express will listen for API requests and respond accordingly
import express from 'express'
const router = express.Router()

// Set this to match the model name in your Prisma schema
const model = 'menu'

// Prisma lets NodeJS communicate with MongoDB
// Let's import and initialize the Prisma client
// See also: https://www.prisma.io/docs
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// Connect to the database
prisma.$connect().then(() => {
    console.log('Prisma connected to MongoDB')
}).catch(err => {
    console.error('Failed to connect to MongoDB:', err)
})

// ----- CREATE (POST) -----
// Create a new record for the configured model
// This is the 'C' of CRUD
router.post('/data', async (req, res) => {
    try {
        // Remove the id field from request body if it exists
        // MongoDB will auto-generate an ID for new records
        const { id, ...createData } = req.body

        const created = await prisma[model].create({
            data: createData
        })
        res.status(201).send(created)
    } catch (err) {
        console.error('POST /data error:', err)
        res.status(500).send({ error: 'Failed to create record', details: err.message || err })
    }
})


// ----- READ (GET) list ----- 
router.get('/data', async (req, res) => {
    try {
        // fetch all records from the database, newest first
        const result = await prisma[model].findMany({
            orderBy: {
                id: 'desc'  // Show newest items first (ObjectId contains timestamp)
            }
        })
        res.send(result)
    } catch (err) {
        console.error('GET /data error:', err)
        res.status(500).send({ error: 'Failed to fetch records', details: err.message || err })
    }
})



// ----- findMany() with search ------- 
// Accepts optional search parameter to filter by ITEM field
// See also: https://www.prisma.io/docs/orm/reference/prisma-client-reference#examples-7
router.get('/search', async (req, res) => {
    try {
        // get search terms from query string, default to empty string
        const searchTerms = req.query.terms || ''
        // fetch the records from the database
        const result = await prisma[model].findMany({
            where: {
                ITEM: {
                    contains: searchTerms,
                    mode: 'insensitive'  // case-insensitive search
                }
            },
            orderBy: { ITEM: 'asc' },
            take: 10
        })
        res.send(result)
    } catch (err) {
        console.error('GET /search error:', err)
        res.status(500).send({ error: 'Search failed', details: err.message || err })
    }
})


// ----- UPDATE (PUT) -----
// Listen for PUT requests
// respond by updating a particular record in the database
// This is the 'U' of CRUD
// After updating the database we send the updated record back to the frontend.
router.put('/data/:id', async (req, res) => {
    try {
        // Remove the id from the request body if it exists
        // The id should not be in the data payload for updates
        const { id, ...updateData } = req.body

        // Prisma update returns the updated version by default
        const updated = await prisma[model].update({
            where: { id: req.params.id },
            data: updateData
        })
        res.send(updated)
    } catch (err) {
        console.error('PUT /data/:id error:', err)
        res.status(500).send({ error: 'Failed to update record', details: err.message || err })
    }
})

// ----- DELETE -----
// Listen for DELETE requests
// respond by deleting a particular record in the database
// This is the 'D' of CRUD
router.delete('/data/:id', async (req, res) => {
    try {
        const result = await prisma[model].delete({
            where: { id: req.params.id }
        })
        res.send(result)
    } catch (err) {
        console.error('DELETE /data/:id error:', err)
        res.status(500).send({ error: 'Failed to delete record', details: err.message || err })
    }
})

// ----- SAVED MEALS ROUTES -----

// Get all saved meals for logged-in user
router.get('/saved-meals', async (req, res) => {
    try {
        if (!req.oidc?.isAuthenticated()) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        
        const userId = req.oidc.user.sub;
        
        const meals = await prisma.savedLogin.findMany({
            where: { userId: userId },
            orderBy: { updatedAt: 'desc' }
        });
        
        res.json({ success: true, meals });
    } catch (err) {
        console.error('GET /saved-meals error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch meals', details: err.message });
    }
});

// Save a new meal
router.post('/saved-meals', async (req, res) => {
    try {
        if (!req.oidc?.isAuthenticated()) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        
        const userId = req.oidc.user.sub;
        const { mealName, items, totalNutrition } = req.body;
        
        console.log('Received meal save request:');
        console.log('User ID:', userId);
        console.log('Meal name:', mealName);
        console.log('Items:', JSON.stringify(items, null, 2));
        console.log('Total nutrition:', JSON.stringify(totalNutrition, null, 2));
        
        if (!mealName || !items || !totalNutrition) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        
        const savedMeal = await prisma.savedLogin.create({
            data: {
                userId: userId,
                mealName: mealName,
                items: items,
                totalNutrition: totalNutrition
            }
        });
        
        console.log('Meal saved successfully:', savedMeal.id);
        res.json({ success: true, meal: savedMeal });
    } catch (err) {
        console.error('POST /saved-meals error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ success: false, error: 'Failed to save meal', details: err.message });
    }
});

// Delete a saved meal
router.delete('/saved-meals/:id', async (req, res) => {
    try {
        if (!req.oidc?.isAuthenticated()) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }
        
        const userId = req.oidc.user.sub;
        const mealId = req.params.id;
        
        // Verify the meal belongs to the user
        const meal = await prisma.savedLogin.findUnique({
            where: { id: mealId }
        });
        
        if (!meal) {
            return res.status(404).json({ success: false, error: 'Meal not found' });
        }
        
        if (meal.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        
        await prisma.savedLogin.delete({
            where: { id: mealId }
        });
        
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /saved-meals/:id error:', err);
        res.status(500).json({ success: false, error: 'Failed to delete meal', details: err.message });
    }
});

// ----- ACTIVE PLANNER AUTO-SAVE ROUTES -----

// Get active planner state (logged-in or logged-out)
router.get('/active-planner', async (req, res) => {
    try {
        const isAuthenticated = req.oidc?.isAuthenticated();
        
        if (isAuthenticated) {
            // Get logged-in user's active planner
            const userId = req.oidc.user.sub;
            const planner = await prisma.activePlanner.findUnique({
                where: { userId: userId }
            });
            
            return res.json({ success: true, planner, authenticated: true });
        } else {
            // Get logged-out user's active planner by session ID
            const sessionId = req.query.sessionId;
            
            if (!sessionId) {
                return res.json({ success: true, planner: null, authenticated: false });
            }
            
            const planner = await prisma.savedLogoff.findUnique({
                where: { sessionId: sessionId }
            });
            
            return res.json({ success: true, planner, authenticated: false });
        }
    } catch (err) {
        console.error('GET /active-planner error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch planner', details: err.message });
    }
});

// Auto-save active planner state (upsert - update or create)
router.post('/active-planner', async (req, res) => {
    try {
        const isAuthenticated = req.oidc?.isAuthenticated();
        const { items, mealName, totalNutrition, sessionId } = req.body;
        
        if (!items || !mealName || !totalNutrition) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        
        if (isAuthenticated) {
            // Save to activePlanner for authenticated users
            const userId = req.oidc.user.sub;
            
            const planner = await prisma.activePlanner.upsert({
                where: { userId: userId },
                update: {
                    items: items,
                    mealName: mealName,
                    totalNutrition: totalNutrition
                },
                create: {
                    userId: userId,
                    items: items,
                    mealName: mealName,
                    totalNutrition: totalNutrition
                }
            });
            
            console.log('Auto-saved to savedLogin for user:', userId);
            return res.json({ success: true, planner, authenticated: true });
        } else {
            // Save to savedLogoff for logged-out users
            if (!sessionId) {
                return res.status(400).json({ success: false, error: 'Session ID required for logged-out users' });
            }
            
            // Set expiration to 7 days from now
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);
            
            const planner = await prisma.savedLogoff.upsert({
                where: { sessionId: sessionId },
                update: {
                    items: items,
                    mealName: mealName,
                    totalNutrition: totalNutrition,
                    expiresAt: expiresAt
                },
                create: {
                    sessionId: sessionId,
                    items: items,
                    mealName: mealName,
                    totalNutrition: totalNutrition,
                    expiresAt: expiresAt
                }
            });
            
            console.log('Auto-saved to savedLogoff for session:', sessionId);
            return res.json({ success: true, planner, authenticated: false });
        }
    } catch (err) {
        console.error('POST /active-planner error:', err);
        res.status(500).json({ success: false, error: 'Failed to save planner', details: err.message });
    }
});

// Clear active planner state (when user clicks "Clear All")
router.delete('/active-planner', async (req, res) => {
    try {
        const isAuthenticated = req.oidc?.isAuthenticated();
        
        if (isAuthenticated) {
            const userId = req.oidc.user.sub;
            
            await prisma.activePlanner.deleteMany({
                where: { userId: userId }
            });
            
            return res.json({ success: true, authenticated: true });
        } else {
            const sessionId = req.query.sessionId;
            
            if (!sessionId) {
                return res.status(400).json({ success: false, error: 'Session ID required' });
            }
            
            await prisma.savedLogoff.deleteMany({
                where: { sessionId: sessionId }
            });
            
            return res.json({ success: true, authenticated: false });
        }
    } catch (err) {
        console.error('DELETE /active-planner error:', err);
        res.status(500).json({ success: false, error: 'Failed to clear planner', details: err.message });
    }
});


// export the api routes for use elsewhere in our app 
// (e.g. in index.js )
export default router;

