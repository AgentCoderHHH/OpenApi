import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { InternetDocumentationAgent } from './src/agents/internet-documentation/InternetDocumentationAgent';
import { TechnicalDocumentationAgent } from './src/agents/technical-documentation/TechnicalDocumentationAgent';
import { TechnicalDocumentationElaboratorAgent } from './src/agents/technical-documentation/TechnicalDocumentationElaboratorAgent';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Swagger setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Documentation Generator API',
      version: '1.0.0',
      description: 'API for generating technical documentation',
    },
  },
  apis: ['./server.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize agents
const documentationAgent = new InternetDocumentationAgent();
const technicalAgent = new TechnicalDocumentationAgent();
const elaboratorAgent = new TechnicalDocumentationElaboratorAgent();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is healthy
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/**
 * @swagger
 * /execute:
 *   post:
 *     summary: Generate documentation for a given topic
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
 *         description: Documentation generated successfully
 */
app.post('/execute', async (req, res) => {
  console.log('Received execute request:', req.body);
  const { input } = req.body;

  try {
    // Execute documentation agent
    console.log('Executing documentation agent with input:', input);
    const context = { input, startTime: Date.now() };
    const documentationResult = await documentationAgent.execute(context);
    console.log('Documentation agent execution complete');

    // Execute technical documentation agent
    console.log('Executing technical documentation agent with documentation output');
    const technicalContext = { input: documentationResult.output, startTime: Date.now() };
    const technicalResult = await technicalAgent.execute(technicalContext);
    console.log('Technical documentation agent execution complete');

    // Execute elaborator agent
    console.log('Executing elaborator agent with technical documentation output');
    const elaboratorContext = { input: technicalResult.output, startTime: Date.now() };
    const elaboratorResult = await elaboratorAgent.execute(elaboratorContext);
    console.log('Elaborator agent execution complete');

    res.json({
      success: true,
      documentationOutput: documentationResult.output,
      technicalOutput: technicalResult.output,
      elaboratorOutput: elaboratorResult.output,
      metrics: {
        documentation: documentationResult.metrics,
        technical: technicalResult.metrics,
        elaborator: elaboratorResult.metrics
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate documentation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
  console.log(`Swagger documentation available at http://localhost:${port}/api-docs`);
}); 