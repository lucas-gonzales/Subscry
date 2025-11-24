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
# Subscry

Subscry é um app (Expo + TypeScript) para gerenciar assinaturas recorrentes e dividir custos entre participantes. Este README foi ajustado para refletir fielmente o que a interface atual entrega.

Resumo

- Plataforma: Expo (React Native) + TypeScript
- Estado: MVP / mobile-first (compatível com Web)
- Frequências expostas na UI: **Mensal** e **Anual**

Funcionalidades principais

- CRUD de assinaturas (criar, editar, excluir)
- Dashboard com totais e próximo vencimento
- Divisão automática de valores entre participantes (cálculo em centavos, determinístico)
- Persistência de participantes em banco local (autocomplete e agregação de totais)
- Marcar um participante como "Você" (isMe) a partir do formulário; essa preferência é persistida no banco local
- Migrações idempotentes para participantes embutidos nas assinaturas
- Export / Import JSON para backup

Como rodar (desenvolvimento)

```pwsh
npm install
npx expo install
npx expo start
```

Arquitetura e arquivos principais

- `App.tsx`, `index.ts`: inicialização e migrações
- `src/screens/SubscriptionForm.tsx`: formulário (valor em centavos, participantes, frequência mensal/anual, data de início)
- `src/screens/SubscriptionsList.tsx`, `src/screens/Dashboard.tsx`: listas e visão geral
- `src/screens/Participants.tsx`: gerenciamento de participantes persistidos
- `src/db/index.ts`: abstração de leitura/gravação JSON (expo-file-system)
- `src/db/participantsDao.ts`: CRUD de participantes e associações (inclui `setParticipantAsMe`)
- `src/db/subscriptionsDao.ts`: lógica de assinaturas e cálculos de `next_due`
- `src/utils/dateUtils.ts`: utilitários de data e cálculo de vencimentos

Decisões técnicas (resumo)

- Valores monetários são armazenados em centavos (inteiros) para evitar imprecisões
- Nomes de participantes são normalizados (trim + lowercase) para matching
- Persistência file-backed JSON para compatibilidade Web; adaptadores nativos são usados em runtime nativo

Testes

- Testes com Jest em `__tests__/`. Execute `npm test`.

Contribuição

- Branch por feature → Pull Request → revisão → merge em `main`.
- Rode `npx tsc --noEmit` antes de abrir PRs.

Validação rápida (como testar `isMe` localmente)

1. Abra o app (`npx expo start`) e vá para criar uma assinatura (`SubscriptionForm`).
2. Adicione participante(s), toque no chip do participante para marcar como “Você” e salve.
3. Abra a tela `Participants` — o participante marcado deve aparecer com `isMe` ativo.
4. Em runtime, o arquivo de persistência fica em `expo-file-system` (documentDirectory). O DAO que persiste é `src/db/participantsDao.ts`.

Se quiser, eu crio um pequeno teste automatizado ou uma rota debug para listar `participants` durante desenvolvimento.
