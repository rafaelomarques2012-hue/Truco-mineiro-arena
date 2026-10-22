# Truco Mineiro Arena — starter

Projeto inicial React + TypeScript + Tailwind-ready CSS + Socket.IO + PostgreSQL schema.

## Requisitos
- Node.js 20+
- npm

## Rodar interface
```bash
npm install
npm run dev
```
Abra http://localhost:5173.

## Rodar servidor Socket.IO
Em outro terminal:
```bash
npm run server
```
Servidor padrão: http://localhost:3001. `WEB_ORIGIN` e `PORT` podem ser definidos por variáveis de ambiente.

## Testes do motor
```bash
npm test
```

## Estrutura
- `src/game/engine.ts`: hierarquia, manilhas fixas, baralho, distribuição, vazas, pontuação auxiliar e política de bot.
- `src/App.tsx`: interface React demonstrativa com abas e treino local.
- `server/index.ts`: esqueleto Socket.IO com salas, convites e entrega privada da mão.
- `database/schema.sql`: tabelas PostgreSQL iniciais.
- `tests/engine.test.ts`: testes básicos do motor.

## Estado e limitações
Este é um starter funcional, não um serviço de produção completo. A mesa local é demonstrativa: a lógica de negociação, alternância de turnos, resolução integral das três vazas e comportamento completo da mão de 11/ferro ainda precisam ser consolidados num agregado de partida autoritativo no servidor. O Socket.IO valida sala e posse da carta, mas ainda não implementa o ciclo completo de partida. A tela de admin/login e autenticação persistente também precisam ser ligadas a um provedor de identidade e políticas RLS.

A regra de empate do Truco Mineiro varia por região. A implementação explicita uma política-base em `resolveHand`; valide-a com jogadores locais e ajuste-a antes de anunciar “regras oficiais”. O baralho padrão tem 40 cartas (A,2,3,4,5,6,7,J,Q,K por naipe). A variação de 37 cartas deve ser configurada com três IDs explicitamente excluídos; não há uma única remoção de 3 cartas assumida aqui.

## Segurança antes de produção
- Autenticar sockets com sessão/JWT verificado no servidor; não confiar em identidade enviada pelo navegador.
- Fazer validação de turnos, valores de truco, mão de 11 e mão de ferro exclusivamente no servidor.
- Não transmitir cartas ocultas aos demais jogadores.
- Habilitar RLS e escrever políticas por usuário/admin antes de conectar o banco.
- Não armazenar senhas em texto puro; usar Supabase Auth ou outro provedor confiável.
- Mascarar CPF/telefone e aplicar minimização de dados conforme LGPD.
- Não usar este projeto para receber apostas ou movimentar dinheiro real. Custódia, apostas, distribuição de prêmios e pagamentos PIX exigem análise jurídica/regulatória e provedor autorizado; não use chave PIX pessoal em fluxo automático.
