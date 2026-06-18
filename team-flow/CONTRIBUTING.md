# Contribuindo

Obrigado pelo interesse em contribuir com o TeamFlow!

## Como contribuir

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Faça suas alterações
4. Execute os testes (`npm test`)
5. Verifique se o TypeScript compila (`npm run typecheck`)
6. Commit (`git commit -m 'feat: adiciona nova feature'`)
7. Push (`git push origin feature/nova-feature`)
8. Abra um Pull Request

## Padrões de commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` nova funcionalidade
- `fix:` correção de bug
- `refactor:` refatoração
- `test:` testes
- `docs:` documentação
- `chore:` manutenção

## Desenvolvimento

```bash
# Setup inicial
npm run setup

# Desenvolvimento
npm run dev

# Testes
npm test

# TypeScript
npm run typecheck
```

## Estrutura

- `backend/` - API NestJS
- `frontend/` - App Next.js
- `docs/` - Documentação
- `scripts/` - Scripts de utilidade

## Código de conduta

Seja respeitoso e construtivo. Todos são bem-vindos.
