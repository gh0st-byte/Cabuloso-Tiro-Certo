# Cabuloso Timing - Documentação do Projeto

## Visão Geral

**Cabuloso Timing** é um jogo de ritmo e reflexos desenvolvido com a temática do **Cruzeiro Esporte Clube**. O objetivo é testar a precisão do jogador ao realizar "chutes ao gol", onde o sucesso depende de acertar o tempo exato em uma barra de oscilação.

O projeto utiliza uma estética **Neomórfica (Soft UI)**, proporcionando uma interface tátil, moderna e limpa, focada na experiência do usuário e na identidade visual do clube.

---

## Tecnologias Utilizadas

- **React 19**: Biblioteca principal para construção da interface.
- **TypeScript**: Garantia de tipagem e robustez do código.
- **Tailwind CSS 4**: Estilização baseada em utilitários e definição de temas.
- **Motion (Framer Motion)**: Animações fluidas e transições de estado.
- **Lucide React**: Biblioteca de ícones minimalistas.
- **Canvas Confetti**: Efeitos visuais de celebração para acertos perfeitos.
- **Vite**: Build tool rápida para o desenvolvimento frontend.

---

## Mecânicas do Jogo

### 1. Sistema de Timing

O coração do jogo é uma barra horizontal com um marcador que oscila continuamente.

- **Zona Alvo (Azul Claro)**: Área onde o chute é considerado um "Gol".
- **Zona Perfeita (Azul Escuro)**: Centro da zona alvo. Acertar aqui resulta em um "Golaço", pontuação dobrada e efeito de confete.
- **Fora da Zona**: Resulta em um erro ("Na Trave"), reiniciando o progresso de níveis.

### 2. Progressão de Níveis

O jogo possui 8 níveis de dificuldade configurados:

- **Velocidade**: Aumenta progressivamente a cada nível.
- **Largura do Alvo**: Diminui conforme o jogador avança, exigindo maior precisão.

### 3. Pontuação

- **Golaço (Perfect)**: 100 pontos.
- **Gol (Good)**: 50 pontos.
- **Recorde (High Score)**: O jogo armazena a maior pontuação da sessão.

---

## Design e Estética

### Neomorfismo (Soft UI)

O design foi construído seguindo os princípios de "Extruded Light":

- **Elevação**: Uso de sombras duplas (clara e escura) para criar a ilusão de que os elementos saem da superfície.
- **Interatividade**: Botões que parecem "afundar" (inset shadow) quando clicados.
- **Paleta de Cores**:
  - `Background`: `#e8eaf0` (Cinza frio)
  - `Cruzeiro Blue`: `#005BAE`
  - `Cruzeiro White`: `#ffffff`

### Tipografia

- **Plus Jakarta Sans**: Uma fonte geométrica e moderna que complementa o estilo minimalista do projeto.

---

## Estrutura de Arquivos Principal

- `src/App.tsx`: Contém toda a lógica do jogo, estados e componentes da interface.
- `src/index.css`: Define as variáveis de tema do Tailwind 4 e as utilidades personalizadas para o efeito Neomórfico (`neo-raised`, `neo-inset`, `neo-button`).
- `metadata.json`: Metadados do aplicativo (nome, descrição).
- `vite.config.ts`: Configuração do ambiente de build e aliases.

---

## Como Executar

1. Certifique-se de ter o **Node.js** instalado.
2. Instale as dependências:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. O jogo estará disponível em `http://localhost:3000`.

---

## Créditos

&copy;**Cruzeiro Esporte Clube**, unindo paixão pelo futebol e design de interface moderno.
