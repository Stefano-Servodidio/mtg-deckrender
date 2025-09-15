# Contributing to MTG Deck to PNG

Thank you for your interest in contributing to this project! This document outlines our development workflow and guidelines.

## Development Workflow

This project follows a Git Flow branching strategy:

### Branch Structure
- `main` - Production-ready code
- `develop` - Integration branch for features (default target for PRs)
- `feature/*` - Feature development branches
- `hotfix/*` - Critical production fixes

### Contributing Process

1. **Create a feature branch** from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards below

3. **Test your changes**:
   ```bash
   npm run lint
   npm run build
   npm run dev  # Test locally
   ```

4. **Create a Pull Request** targeting the `develop` branch

5. **Code Review**: Wait for review and address any feedback

6. **Merge**: Once approved, your PR will be merged into `develop`

### Important: All PRs Must Target `develop`

**All coding contributions must create PRs targeting the `develop` branch.** This ensures:
- Proper integration testing
- Stable main branch
- Controlled releases

Only critical hotfixes should target `main` directly.

## Coding Standards

### Code Style
- Follow the existing code style
- Use TypeScript for type safety
- Run `npm run format` before committing
- Ensure `npm run lint` passes

### Commit Messages
- Use clear, descriptive commit messages
- Follow conventional commit format when possible

### Testing
- Ensure existing functionality is not broken
- Add tests for new features when applicable

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run lint` — Check code quality
- `npm run format` — Format code with Prettier

## Getting Help

If you have questions about contributing, please:
1. Check existing issues and discussions
2. Open a new issue for discussion
3. Follow the established patterns in the codebase

Thank you for contributing! 🚀