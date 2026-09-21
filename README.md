# Xadrez Pro 3D — Nova versão

Edição 3D com visual neon holográfico, mantendo a identidade da linha Xadrez Pro.

## Como abrir
1. Extraia o ZIP
2. Abra `index.html` no Chrome, Edge ou Firefox  
   (ou publique a pasta na Vercel / qualquer host estático HTTPS)

## O que está incluso
- Tabuleiro e peças **3D** (Three.js)
- Peças legíveis (cavalo, bispo, torre, rainha, rei, peão)
- Material quase sólido + brilho suave (sem neon embaixo da peça)
- **8 temas** de cor (Ciano/Magenta, Matrix, Cyberpunk, Toxic, etc.)
- Seleção clara: peça sobe + destinos (ponto / anel de captura)
- Animações diferentes por tipo de peça
- Painel do jogador da vez **pisca**
- **Toasty** (Rei Desesperado) em xeque, mate, promoção, etc. + botão 🔥 de teste
- Modos: Local · IA Fácil · Médio · Difícil
- Som ambiente + efeitos
- PWA básica (manifest + service worker)
- Layout responsivo (celular e desktop)

## Sobre o projeto v14 (anexos)
O Xadrez Pro v14.0.1 (2D) traz salas P2P, rádio, centro de treino, FEN, Bot-vs-Bot, etc.  
Esses recursos dependem de backend (Vercel + Redis/Upstash) e PeerJS.

Esta edição **3D** prioriza:
- visual e jogabilidade local/IA de alta qualidade
- estrutura pronta para crescer

Multiplayer online completo continua na linha v14 ou pode ser integrado depois.

## Controles
- Clique na peça → clique no destino
- Arraste = girar câmera · Scroll = zoom
- Botões: Nova · Modo · Desfazer · Tema · Som · 🔥 Teste Toasty

## Arquivos
```
index.html
style.css
game.js
manifest.json
sw.js
assets/rei-desesperado.svg
README.md
```
