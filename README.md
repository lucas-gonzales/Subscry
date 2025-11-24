# 💰 Subscry - Subscription Tracker MVP
# Subscry

Subscry é um aplicativo (Expo + TypeScript) para gerenciar assinaturas recorrentes e dividir custos entre participantes. Este README foi reduzido para refletir apenas o que a interface entrega hoje.

Resumo rápido

- Plataforma: Expo (React Native) + TypeScript
- Estado: MVP / mobile-first (compatível com Web)
- Frequências expostas na UI: **Mensal** e **Anual**

Funcionalidades importantes

- CRUD de assinaturas (criar, editar, excluir)
- Dashboard com totais e próximo vencimento
- Divisão automática de valores entre participantes (cálculo em centavos, determinístico)
- Persistência de participantes em banco local (autocomplete e agregação de totais)
- Marcar um participante como "Você" (isMe) e persistir essa preferência
- Migrações idempotentes para participantes embutidos nas assinaturas
- Export / Import JSON para backup

Como rodar (desenvolvimento)

```pwsh
npm install
npx expo install
npx expo start
```

Arquitetura & arquivos principais

- `App.tsx`, `index.ts`: inicialização e migrações
- `src/screens/SubscriptionForm.tsx`: formulário (valor em centavos, participantes, frequência mensal/anual, data de início)
- `src/screens/SubscriptionsList.tsx`, `src/screens/Dashboard.tsx`: listas e visão geral
- `src/screens/Participants.tsx`: gerenciamento de participantes persistidos
- `src/db/index.ts`: abstração de leitura/gravação JSON
- `src/db/participantsDao.ts`: CRUD de participantes e associações
- `src/db/subscriptionsDao.ts`: lógica de assinaturas e cálculos de `next_due`
- `src/utils/dateUtils.ts`: utilitários de data e cálculo de vencimentos

Decisões técnicas (breve)

- Valores monetários são armazenados em centavos (inteiros) para garantir soma exata
- Nomes de participantes são normalizados (trim + lowercase) para matching
- Persistência file-backed JSON para compatibilidade Web; adaptadores nativos são usados em runtime nativo

Testes

- Testes com Jest em `__tests__/`. Execute `npm test`.
# 💰 Subscry - Subscription Tracker MVP

Controle inteligente de assinaturas recorrentes

Subscry é um aplicativo móvel desenvolvido com Expo + TypeScript para gerenciar assinaturas e dividir custos entre participantes. O projeto é mobile-first e compatível com Web.

Badges

![Expo](https://img.shields.io/badge/Expo-54.0-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue) ![Status](https://img.shields.io/badge/Status-MVP-success)

O que é o Subscry?

Subscry permite registrar assinaturas, calcular próximos vencimentos e dividir valores entre participantes com precisão de centavos. O app foca em simplicidade e uso offline.

Funcionalidades Principais

- CRUD de assinaturas (criar, editar, visualizar e excluir)
- Dashboard com totais e próximo vencimento
- Cálculo determinístico em centavos para divisão por pessoa
- Persistência de participantes para autocomplete e agregação de totais
- Migração idempotente de participantes embutidos em assinaturas
- Export / Import JSON para backup e restauração

Observação: a interface atual expõe frequências mensais e anuais; outras frequências não são apresentadas diretamente no formulário.

Como rodar

```pwsh
npm install
npx expo install
npx expo start
```

Arquitetura e decisões técnicas

- Modularidade por responsabilidades: `screens`, `components`, `db`, `utils`, `data`.
- Persistência file-backed JSON (`src/db/index.ts`) para compatibilidade Web; adaptadores nativos podem ser usados em runtime nativo.
- Valores monetários são armazenados em centavos (inteiros) para evitar imprecisões.
- Nomes de participantes são normalizados (trim + lowercase) para matching.

Estrutura de pastas (resumo)

- `App.tsx`, `index.ts`: ponto de entrada; inicialização e migrações.
- `src/screens/SubscriptionForm.tsx`: formulário com autocomplete de participantes, presets e seleção de ícone.
- `src/screens/SubscriptionsList.tsx`, `src/screens/Dashboard.tsx`: listas e visão geral.
- `src/screens/Participants.tsx`: gerenciamento de participantes persistidos.
- `src/db/participantsDao.ts`: CRUD de participantes e associações (inclui `setParticipantAsMe`).
- `src/db/subscriptionsDao.ts`: CRUD de assinaturas, cálculo de `next_due` e agregações.
- `src/utils/dateUtils.ts`: utilitários de data e cálculo de próximos vencimentos.

Testes

- Testes com Jest em `__tests__/`. Execute `npm test`.

Contribuição

- Branch por feature → Pull Request → revisão → merge em `main`.
- Rode `npx tsc --noEmit` antes de abrir PRs.

Contato

- Abra uma issue no repositório para reportar bugs ou sugerir melhorias.

---

README restaurado para o layout anterior com remoções solicitadas (menções a múltiplas frequências explícitas e caixas duplicadas removidas).
