# 🔮 Labirinto - Frutas e Runas

Jogo de labirinto estilo arcade com visual neon, frutas colecionáveis e runas mágicas.  
Pegue todas as 🍎 frutas para liberar a saída 🟩 e avançar de nível.

---

## 🎮 Como Jogar
- Abra `index.html` no navegador
- Mova-se com **Setas** ou **W / A / S / D**
- No celular, use os botões na tela

---

## ✨ Mecânicas
- 🍎 **Frutas obrigatórias** para vencer
- 🔮 **Teleporte:** move o jogador para um local seguro
- 🧱 **Caos:** cria ou destrói paredes
- 🌀 **Inversão:** controles invertidos por 5 segundos
- ♾️ **Níveis infinitos** com dificuldade crescente

---

## 🧩 Geração Procedural do Labirinto

O labirinto é gerado automaticamente a cada partida usando um algoritmo de **Backtracking**.  

O processo começa com uma grade completamente fechada, formada apenas por paredes.  
A partir de um ponto inicial, o algoritmo “escava” caminhos de forma aleatória, avançando sempre que encontra uma célula ainda não visitada.

Quando não há mais para onde seguir, ele retorna pelo próprio caminho até encontrar uma nova direção possível, repetindo o processo até que todo o mapa esteja conectado.  
O resultado é um labirinto que **sempre tem solução**.

Para evitar caminhos únicos e previsíveis, algumas paredes extras são removidas ao final da geração, criando **loops** e múltiplas rotas possíveis.


---

## 🛠️ Tecnologias
HTML5 Canvas · CSS3 · JavaScript

---

## 👨‍💻 Sobre
Projeto de estudo em algoritmos e desenvolvimento de jogos web.

---

## OBSERVAÇÂO
As imagens da fruta e das runas foram criadas pelo GEMINI.
