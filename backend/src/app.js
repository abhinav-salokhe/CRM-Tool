import express from 'express';
import cors from 'cors';
import prisma from './lib/prisma.js';
import csvRoutes from './routers/csv.routes.js';
import aiRoutes from './routers/import.routes.js';
import userRoutes from './routers/user.routes.js';
import authMiddleware from './middlewares/auth.middleware.js';

function errorHandler(err, req, res, next) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
}

function createApp() {
    const app = express();

    app.use(
        cors({
            origin: [
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "https://crm-tool-ten-jet.vercel.app"
            ],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"],
            credentials: true,
        })
    );
    
    app.use(express.json({ limit: '10mb' }));

    // Health check endpoint
    app.get('/api/v1/health', async (req, res) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.status(200).json({ status: 'healthy', database: 'connected' });
        } catch (error) {
            console.error('Health check failed:', error);
            res.status(500).json({ status: 'unhealthy', error: error.message });
        }
    });

    app.use('/api/v1/user', userRoutes)
    app.use('/api/v1', authMiddleware, csvRoutes);
    app.use('/api/v1/import', authMiddleware,aiRoutes);




    // 404 handler
    app.use((_req, res) => {
        res.status(404).json({ error: 'not found' });
    });

    // Error handler
    app.use(errorHandler);

    return app;
}

export { createApp };


