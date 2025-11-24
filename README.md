# 💰 Subscry - Subscription Tracker MVP

> **Controle inteligente de assinaturas recorrentes** 🚀  
> Gerencie suas assinaturas mensais, anuais e personalizadas sem complicação!

<p align="center">
  <img src="https://img.shields.io/badge/Expo-54.0-blue" alt="Expo">
  <img src="https://img.shields.io/badge/TypeScript-5.9-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/SQLite-Local-green" alt="SQLite">
  <img src="https://img.shields.io/badge/Status-MVP-success" alt="Status">
</p>

## 🎯 O que é o Subscry?

**Subscry** é um aplicativo móvel desenvolvido com Expo + TypeScript que permite gerenciar todas as suas assinaturas recorrentes de forma **100% offline**. Não precisa de conta, não precisa de internet — seus dados ficam seguros no seu dispositivo!

### ✨ Funcionalidades Principais

- ✅ **CRUD Completo** - Criar, editar, visualizar e excluir assinaturas
- ✅ **Dashboard Inteligente** - Visão geral com totais mensais/anuais
- ✅ **Próximo Pagamento** - Saiba qual assinatura vence primeiro
- ✅ **Cálculo Automático** - O app calcula o próximo vencimento automaticamente
- ✅ **Múltiplas Frequências** - Mensal, anual, semanal, diária ou customizada
- ✅ **Filtros Avançados** - Busque por nome, filtre por ativo/inativo ou tags
- ✅ **Marcar como Pago** - Um toque e o próximo vencimento é atualizado
- ✅ **100% Offline** - Seus dados nunca saem do seu celular

## 🛠️ Tecnologias

| Tecnologia | Uso |
|------------|-----|
| **Expo** | Framework React Native (managed workflow) |
| **TypeScript** | Tipagem estática e code quality |
## Subscry

Subscry é o nome oficial deste projeto. Use sempre "Subscry" em documentação, apresentações e no app — não utilize outro título.

Visão geral
-----------

Subscry é um aplicativo mobile (Expo + TypeScript) para gerenciar assinaturas recorrentes, dividir custos entre participantes e manter um histórico local das assinaturas. O foco é simplicidade, precisão financeira (centavos inteiros) e compatibilidade entre dispositivos (iOS/Android/Web).

Funcionalidades principais
-------------------------

- Criar/editar/excluir assinaturas com título, valor (em centavos), frequência, data de início, participantes e notas.
- Persistência de participantes em banco JSON (arquivo) para autocomplete e agregação de totais por pessoa.
- Marcar um participante como `Você` (isMe) para destacar e afetar o cálculo de divisão.
- Migração idempotente de participantes embutidos em assinaturas para a tabela de participantes persistidos.
- Cálculo determinístico em centavos para divisão por pessoa (mantém soma exata do total).
- Export/Import JSON para backup e restauração.

Como rodar
----------

1. Instalar dependências:

```bash
npm install
npx expo install
```

2. Configurar variáveis de ambiente (se aplicável):

```bash
cp .env.example .env
# editar .env com suas credenciais (não commitar)
```

3. Iniciar o projeto:

```bash
npx expo start
```

Arquitetura e decisões técnicas
------------------------------

- Modularidade por responsabilidades: `screens`, `components`, `db`, `utils`, `data`.
- Persistência híbrida: shim file-backed JSON (`src/db/index.ts`) para web e adaptadores para armazenamento nativo (SQLite/expo-sqlite) quando aplicável.
- Normalização: nomes de participante são normalizados (trim + lowercase) para matching consistente.
- Valores monetários: sempre em centavos (inteiro) para evitar imprecisão de ponto flutuante.

Estrutura de pastas (descrição)
-----------------------------

`App.tsx`, `index.ts`
- Ponto de entrada; registra `ThemeProvider`, inicializa DB e executa migrações.

`src/screens/`
- `Dashboard.tsx`: Visão geral com totais, próximos vencimentos e resumo por participante.
- `SubscriptionsList.tsx`: Lista de assinaturas, filtros e ações (editar, pagar, excluir).
- `SubscriptionForm.tsx`: Formulário detalhado com autocomplete de participantes, presets e seleção de ícone.
- `Participants.tsx`: Gerenciamento de participantes persistidos (editar, excluir, totais por pessoa).
- `Settings.tsx`: Export/Import, opções e preferências.

`src/db/`
- `index.ts`: Helpers para read/write JSON e abstração de DB.
- `participantsDao.ts`: CRUD de participantes persistidos e funções auxiliares (associar subscriptionId, setParticipantAsMe).
- `subscriptionsDao.ts`: CRUD de assinaturas, cálculo de `next_due`, migrações e agregações por participante.

`src/components/`
- Componentes reutilizáveis (pickers, pequenos controles, Toasts, etc.).

`src/utils/`
- `dateUtils.ts`: cálculo de próximas datas de vencimento e utilitários de data.
- `format.ts`: `formatCurrencyBR` e helpers de apresentação.

`src/data/`
- `presets.ts`: presets de serviços/plans e metadata para ícones.
- `iconMap.ts`: mapeamento estático de assets para evitar `require()` dinâmico.

`assets/`
- Imagens e ícones usados pelo app.

Testes
------

- Testes mínimos com Jest em `__tests__/`. Execute `npm test`.

Boas práticas
------------

- Use branches para features; crie PRs para revisão antes de merge em `main`.
- Rode `npx tsc --noEmit` antes de abrir PRs para garantir tipagem.
- Não comite `.env` com credenciais.

Contribuição e fluxo sugerido
----------------------------

- Branch por feature → Pull Request → revisão → merge em `main`.
- Recomendamos manter PRs pequenos e adicionando testes quando alterar lógica de cálculo.

Licença
-------

Repositório privado. Não compartilhar sem autorização.

Contato
-------

- Para dúvidas sobre o projeto, abra uma issue ou contacte os mantenedores listados no repositório.

---

_README atualizado para formato e conteúdo solicitado (Subscry)._
