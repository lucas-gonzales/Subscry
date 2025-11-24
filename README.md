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
| **expo-sqlite** | Banco de dados local (persistência) |
| **date-fns** | Cálculos de datas e recorrências |
| **React Navigation** | Navegação entre telas |
| **AsyncStorage** | Configurações leves |
# 💰 SubscriptionManager (Subscry) — MVP

Resumo rápido
-------------
SubscriptionManager (apelidado de _Subscry_ no repositório) é um MVP construído com Expo + TypeScript para gerenciar assinaturas recorrentes localmente. O foco foi entregar uma experiência que funcione no Expo (Android, iOS e Web) com UX simples: dashboard, lista de assinaturas, formulário de criação/edição, divisão por participantes e destaque de vencimentos.

Principais objetivos alcançados
-------------------------------
- App funcional em Expo (web + mobile)
- Persistência local (file-backed DB shim para compatibilidade web; compatível com SQLite no nativo)
- Presets com ícones de marca via `iconMap` (evita `require()` dinâmico)
- Picker de data (calendário modal) integrado ao formulário
- Substituição do campo `currency` por `participants` (divisão por pessoa)
- Dashboard com totais normalizados e agregação por participante
- Destaque visual de vencimentos próximos e animações leves (`LayoutAnimation`)

Como rodar (rápido)
-------------------
Instale dependências e rode o bundler do Expo:

```powershell
npm install
npx expo start -c
```

Abra com Expo Go (Android/iOS) ou no navegador usando a opção Web.

Arquitetura e decisões principais
--------------------------------
- UI: React Native com Expo (managed workflow). Navegação com React Navigation.
- Tipagem: TypeScript em todo o projeto.
- Persistência:
  - Para compatibilidade web, o projeto usa um DB shim baseado em arquivo (`src/db/index.ts`) que persiste um JSON no disco (`expo-file-system`).
  - Em runtime nativo o projeto preserva dependências SQLite (`expo-sqlite`) e a DAO (`src/db/subscriptionsDao.ts`) mantém uma API consistente sobre ambos os mecanismos.
- Imagens: `src/data/iconMap.ts` contém `require()`s estáticos para evitar falhas no Metro bundler (web).
- Localização/formatos: Intl (helper `src/utils/format.ts`) para formatação pt-BR.

Principais arquivos e responsabilidades
--------------------------------------
- `App.tsx` — ponto de entrada da aplicação.
- `AppNavigator.tsx` — configuração de rotas e stacks.
- `src/screens/Dashboard.tsx` — visão geral, totais e chips por participante.
- `src/screens/SubscriptionsList.tsx` — lista com busca, filtros e indicações de urgência.
- `src/screens/SubscriptionForm.tsx` — criação/edição de assinaturas; UI de participantes (adicionar/remover/toggle `isMe`).
- `src/db/index.ts` — shim de persistência (file-backed JSON) e adaptador para web/native.
- `src/db/subscriptionsDao.ts` — CRUD e helpers para subscriptions (persiste `participants` JSON, funções utilitárias como `removeIconNotesFromAll()`).
- `src/data/iconMap.ts` — mapeamento de IDs de ícones para assets estáticos em `assets/icons/`.
- `src/types/subscription.ts` — o modelo `Subscription` e tipos relacionados; `participants` agora inclui `isMe?: boolean`.
- `src/utils/dateUtils.ts` — funções de data como `daysUntil`.
- `src/utils/format.ts` — `formatCurrencyBR` e helpers de apresentação.

Dependências principais (extraído de `package.json`)
---------------------------------------------------
- `expo` (~54.0)
- `react`, `react-native`, `react-dom`
- `@expo/vector-icons`
- `react-native-calendars`
- `@react-navigation/native`, `@react-navigation/stack`
- `react-native-gesture-handler`, `react-native-screens`, `react-native-safe-area-context`
- `@react-native-picker/picker`
- `expo-file-system`, `expo-sqlite`, `expo-sharing`, `expo-document-picker` (uso diverso em features)
- `date-fns` (manuseio de datas)

Dependências de desenvolvimento
--------------------------------
- `typescript`, `jest`, `ts-jest`, `@testing-library/react-native`, `@testing-library/jest-native`.

Funcionalidades implementadas (detalhado)
----------------------------------------
- CRUD completo de assinaturas (criar/editar/excluir/visualizar)
- Dashboard com total mensal normalizado e destaque do próximo vencimento
- Lista com busca, filtros e indicação de urgência (<=7 dias laranja, <=2 dias vermelho)
- Formulário com participantes: adicionar/remover, marcar `isMe`, calcular valor por pessoa
- Calendar picker modal integrado
- Static iconMap para presets e fallback para ícones vetoriais
- File-backed DB shim para compatibilidade Expo Web
- Ajustes de SafeArea e posicionamento de FAB para Android

Decisões e observações técnicas importantes
-----------------------------------------
- O projeto evita `require()` dinâmico para imagens (causa erros no Metro web). Use sempre `src/data/iconMap.ts`.
- Valores são armazenados em centavos para evitar problemas com floats.
- `participants` é um array de objetos `{ name: string; isMe?: boolean }` e é persistido como JSON.

Como empacotar / distribuir
---------------------------
- Para compartilhar o código-fonte, eu gerei um `.zip` raiz: `SubscriptionManager.zip` (local na raiz).
- Para builds nativos use `expo build` (ou EAS) conforme documentação Expo.

Testes e validação
------------------
- Há testes unitários básicos (`__tests__/dateUtils.test.ts`) cobrindo cálculo de datas.
- Execute:

```powershell
npm test
```

Boas práticas ao contribuir
---------------------------
- Abra uma issue antes de grandes mudanças.
- Mantenha PRs pequenos e com mensagens claras.
- Adicione testes quando modificar regras de recorrência ou o DAO.

Próximos passos recomendados (alto impacto)
-----------------------------------------
1. Implementar botão "Compartilhar cobrança" na tela de detalhe/Dashboard (gera mensagem com valores por participante e abre o Share sheet).
2. Adicionar preferência global `Você` em `Settings` para marcar automaticamente o participante nas novas assinaturas.
3. Adicionar opção admin para rodar `removeIconNotesFromAll()` e limpar notas antigas.
4. (Opcional) Integrar `expo-notifications` para lembretes locais.

Contato / Auxílio
-----------------
Se quiser que eu implemente alguma das tarefas acima (ex.: botão de compartilhamento), responda "faça" e eu inicio a implementação.

---
_Este README foi atualizado automaticamente para refletir o estado atual do projeto e ajudar a orientar apresentações e contribuições._
