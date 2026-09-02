import express from 'express';
import cors from 'cors';
import routes from './routes/urlRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow frontend requests (customize for prod if needed)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Mount URL Shortener Routes
app.use('/', routes);

// Handling 404 & Central Errors
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
