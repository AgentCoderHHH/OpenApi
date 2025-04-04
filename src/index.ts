import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { healthRouter } from './health';
import { InternetDocumentationAgent } from './agents/internet-documentation/InternetDocumentationAgent';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/health', healthRouter);

// Documentation agent endpoint
app.post('/api/documentation', async (req: express.Request, res: express.Response) => {
  try {
    const { topic, reasoningEffort } = req.body;
    const agent = new InternetDocumentationAgent();
    const result = await agent.execute(topic, reasoningEffort);
    res.json(result);
  } catch (error) {
    console.error('Error generating documentation:', error);
    res.status(500).json({ error: 'Failed to generate documentation' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 