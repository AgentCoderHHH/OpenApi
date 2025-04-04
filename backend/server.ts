import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const port = 3001;

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

app.post('/execute', async (req, res) => {
  const { agentId, input } = req.body;
  
  try {
    // Start timing
    const startTime = process.hrtime();

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI agent that can process and respond to various types of inputs. Provide detailed, accurate, and helpful responses."
        },
        {
          role: "user",
          content: input
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    // Calculate duration
    const duration = process.hrtime(startTime)[1] / 1000000;

    // Prepare response
    const response = {
      success: true,
      output: completion.choices[0].message.content,
      metrics: {
        duration: duration,
        resourceUsage: {
          cpu: Math.random() * 100, // Simulated metrics
          memory: Math.random() * 100,
          network: Math.random() * 100
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      metrics: {
        duration: 0,
        resourceUsage: {
          cpu: 0,
          memory: 0,
          network: 0
        }
      }
    });
  }
});

app.listen(port, () => {
  console.log(`Backend server running at http://localhost:${port}`);
}); 