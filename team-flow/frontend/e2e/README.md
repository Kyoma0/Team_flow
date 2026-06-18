# Testes E2E

Testes end-to-end com Playwright.

## Pré-requisitos

- Backend rodando em `http://localhost:3001`
- Frontend rodando em `http://localhost:3000`
- Seed aplicado (`npm run prisma:seed` no backend)

## Executar

```bash
cd frontend
npx playwright test
```

Com UI:
```bash
npx playwright test --ui
```

Ver relatório:
```bash
npx playwright show-report
```
