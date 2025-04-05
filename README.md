# Agent OpenAI Project

This project uses OpenAI's GPT models for various documentation and technical analysis tasks.

## Setup

1. Clone the repository
```bash
git clone <repository-url>
cd AgentOpenApi
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
- Copy `.env.example` to `.env`
```bash
cp .env.example .env
```
- Edit `.env` and add your OpenAI API key and other configuration

4. Start the development server
```bash
npm run dev
```

## Environment Variables

The following environment variables are required:

- `OPENAI_API_KEY`: Your OpenAI API key
- `PORT`: Server port (default: 3001)

## Security Notes

- Never commit the `.env` file
- Always use `.env.example` for documenting required environment variables
- Keep your API keys secure and rotate them regularly

## Features

- **Documentation Generation**: Create comprehensive documentation using AI
- **OpenAI Integration**: Leverages GPT-4 for content generation
- **TypeScript Support**: Full type safety and modern JavaScript features

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key

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
