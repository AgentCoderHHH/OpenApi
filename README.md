# Agent Orchestration System

A system for orchestrating AI agents to perform complex tasks, with a focus on documentation generation.

## Features

- **Documentation Generation**: Create comprehensive documentation using AI
- **OpenAI Integration**: Leverages GPT-4 for content generation
- **TypeScript Support**: Full type safety and modern JavaScript features

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/agent-orchestration-system.git
cd agent-orchestration-system
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
OPENAI_API_KEY=your-openai-api-key
PORT=3001
NODE_ENV=development
```

## Usage

### Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
  ├── agents/
  │   ├── internet-documentation/
  │   │   ├── InternetDocumentationAgent.ts
  │   └── ...
  ├── types.ts
  └── index.ts
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for their powerful language models
