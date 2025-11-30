# Contributing to QuickQueue

We love your input! We want to make contributing to QuickQueue as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

### Pull Requests

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. Issue that pull request!

## Development Setup

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/quickqueue.git
cd quickqueue

# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# Install dependencies
cd frontend && npm install
cd ../backend && pip install -r requirements.txt

# Run tests
npm test
pytest
```

## Code Style

### Backend (Python)

- Follow PEP 8
- Use Black for formatting: `black .`
- Use isort for imports: `isort .`
- Type hints are encouraged
- Docstrings for public functions

### Frontend (JavaScript/React)

- Use ESLint configuration provided
- Use Prettier for formatting
- Follow React best practices
- Use functional components with hooks
- Add PropTypes or TypeScript types

### Commits

- Use conventional commit format:
  - `feat:` new feature
  - `fix:` bug fix
  - `docs:` documentation
  - `style:` formatting
  - `refactor:` code restructuring
  - `test:` adding tests
  - `chore:` maintenance

Example: `feat: add WhatsApp integration for ticket delivery`

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v --cov=.
```

### Frontend Tests

```bash
cd frontend
npm test
npm run test:coverage
```

### Integration Tests

```bash
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## Documentation

- Update README.md for significant changes
- Add JSDoc comments for JavaScript functions
- Add docstrings for Python functions
- Update API documentation in `/docs`

## Reporting Issues

### Bug Reports

Great Bug Reports tend to have:

- A quick summary and/or background
- Steps to reproduce
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

### Feature Requests

We track feature requests as GitHub issues. When filing a feature request:

- Use a clear and descriptive title
- Provide a detailed description of the suggested feature
- Explain why this feature would be useful
- Include mockups or examples if applicable

## Security

If you discover a security vulnerability, please email security@quickqueue.com instead of filing a public issue.

## License

By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.