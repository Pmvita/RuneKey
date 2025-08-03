# Contributing to RuneKey

Thank you for your interest in contributing to RuneKey! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- Git

### Setup Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/runekey.git
   cd runekey
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run on Device**
   - iOS: Press `i` or scan QR code with Camera
   - Android: Press `a` or scan QR code with Expo Go
   - Web: Press `w`

## 📝 Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### Component Structure
```typescript
// Always use TypeScript interfaces for props
interface ComponentProps {
  title: string;
  onPress?: () => void;
}

// Use functional components with hooks
export const Component: React.FC<ComponentProps> = ({ title, onPress }) => {
  // Component logic here
  return (
    // JSX here
  );
};
```

### File Organization
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   └── feature/        # Feature-specific components
├── screens/            # Main app screens
├── hooks/              # Custom React hooks
├── services/           # External service integrations
├── stores/             # Zustand state stores
├── types/              # TypeScript type definitions
├── constants/          # App constants
└── utils/              # Utility functions
```

### State Management
- Use Zustand for global state
- Keep local state in components when possible
- Use custom hooks for complex state logic

### API Integration
- All API calls should go through service classes
- Handle errors gracefully
- Add loading states
- Implement retry logic where appropriate

## 🧪 Testing

### Running Tests
```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Run tests (when implemented)
npm test
```

### Testing Guidelines
- Write unit tests for utility functions
- Test custom hooks with React Testing Library
- Add integration tests for critical flows
- Test error handling paths

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce the bug
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, device, app version
6. **Screenshots**: If applicable

### Bug Report Template
```markdown
**Description**
A clear description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Tap on '...'
3. See error

**Expected Behavior**
A clear description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment**
- OS: [iOS/Android/Web]
- Device: [iPhone 12, Samsung Galaxy S21, etc.]
- App Version: [1.0.0]
```

## ✨ Feature Requests

When suggesting features:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: Your suggested approach
3. **Alternatives**: Other solutions you've considered
4. **Priority**: How important is this feature?

## 🔄 Pull Request Process

### Before Submitting
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test your changes thoroughly
5. Run linting: `npm run lint`
6. Run type checking: `npm run type-check`
7. Commit with clear messages
8. Push to your fork
9. Create a Pull Request

### Pull Request Guidelines
- **Title**: Clear, descriptive title
- **Description**: Explain what and why
- **Testing**: Describe how you tested the changes
- **Screenshots**: Include before/after screenshots for UI changes
- **Breaking Changes**: Note any breaking changes

### Pull Request Template
```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
Describe how you tested your changes.

## Screenshots
Include screenshots for UI changes.

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Code is commented where necessary
- [ ] Tests added/updated
- [ ] Documentation updated
```

## 📋 Commit Guidelines

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples
```bash
feat(wallet): add multi-chain support
fix(swap): handle slippage calculation error
docs(readme): update installation instructions
style(components): fix linting issues
```

## 🏗️ Architecture Guidelines

### Adding New Networks
1. Update `src/constants/networks.ts`
2. Add to `SupportedNetwork` type
3. Implement in blockchain services
4. Add to swap service
5. Update UI components
6. Add tests

### Adding New Features
1. Create feature branch
2. Add types in `src/types/`
3. Create service layer if needed
4. Add state management (Zustand store)
5. Create custom hooks
6. Build UI components
7. Add to navigation
8. Test thoroughly

### Security Considerations
- Never log private keys or sensitive data
- Validate all user inputs
- Use secure storage for sensitive data
- Implement proper error boundaries
- Follow security best practices

## 🎨 Design Guidelines

### Colors
- Primary: #3B82F6 (Blue)
- Secondary: #6B7280 (Gray)
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)

### Typography
- Use system fonts when possible
- Maintain consistent text scales
- Ensure good contrast ratios
- Support both light and dark themes

### Components
- Follow existing component patterns
- Use TailwindCSS classes
- Support dark mode
- Include loading and error states
- Make components reusable

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [TailwindCSS Documentation](https://tailwindcss.com/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 🤝 Community

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and best practices
- Follow the code of conduct
- Give constructive feedback

## ❓ Getting Help

If you need help:

1. Check existing issues and documentation
2. Ask in GitHub Discussions
3. Join our Discord community (coming soon)
4. Create a new issue with the question label

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- Special thanks in major releases

Thank you for contributing to RuneKey! 🔑