import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSwagger } from './swagger';
import { InternetDocumentationAgent } from './agents/internet-documentation/InternetDocumentationAgent';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: '*', // Allow all origins for testing
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Setup Swagger documentation
setupSwagger(app);

// Create agent instance
const agent = new InternetDocumentationAgent();

/**
 * @swagger
 * /execute:
 *   post:
 *     summary: Execute an agent with given input
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               input:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful execution
 *       500:
 *         description: Server error
 */
app.post('/execute', async (req, res) => {
  console.log('Received execute request:', req.body);
  
  try {
    const { input } = req.body;
    
    if (!input) {
      console.log('No input provided');
      return res.status(400).json({
        success: false,
        error: 'Input is required',
        output: '',
        metrics: {
          duration: 0,
          researchIterations: 0,
          totalTokens: 0,
          processingTime: 0,
          reasoningEffort: 0,
          model: 'unknown'
        }
      });
    }

    // Start timing
    const startTime = process.hrtime();

    // Execute the documentation agent
    console.log(`Executing agent with input: "${input}"`);
    const result = await agent.execute(input, 0.8); // Using high reasoning effort
    console.log('Agent execution complete');

    // Calculate duration
    const hrend = process.hrtime(startTime);
    const duration = hrend[0] * 1000 + hrend[1] / 1000000;

    // Prepare response
    const response = {
      success: result.success,
      output: result.output || '',
      metrics: {
        duration: duration,
        researchIterations: result.metrics.researchIterations || 0,
        totalTokens: result.metrics.totalTokens || 0,
        processingTime: result.metrics.processingTime || 0,
        reasoningEffort: result.metrics.reasoningEffort || 0,
        model: result.metrics.model || 'unknown'
      }
    };

    console.log('Sending response');
    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      output: '',
      metrics: {
        duration: 0,
        researchIterations: 0,
        totalTokens: 0,
        processingTime: 0,
        reasoningEffort: 0,
        model: 'unknown'
      }
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Simple test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Backend server is running correctly' });
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
}); 