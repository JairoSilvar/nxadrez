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
assets/toasty-sprite.png
assets/toasty.mp3
README.md
```

## Refinos v1.1
- Rastro/sombreamento dos lances nas casas percorridas, com cores diferentes para brancas e pretas e adaptação automática ao tema.
- Temas agora influenciam suavemente tabuleiro, plataforma, iluminação, partículas, fundo e interface.
- Intro cinematográfica automática ao carregar/recarregar e também em Nova Partida.
- Modo idle encerra com teclado, toque, clique ou roda do mouse e retorna rapidamente à câmera oficial de jogo.
- Câmera/layout adaptados para celular vertical e horizontal, priorizando a área útil do tabuleiro.
- Sons adicionais para movimento, captura, roque, promoção, xeque e xeque-mate.

## v1.2 — refinamentos
- Rastro de movimento mais forte, incluindo todas as casas atravessadas por torre, bispo e rainha.
- Retorno do modo idle cancela a animação anterior e restaura rapidamente o enquadramento oficial de jogo.
- Barra de controles mais compacta no celular e botão para recolher/mostrar, priorizando o tabuleiro.
- Mantidos temas globais, intro, sons de movimento, Sala Paris, IA, Toasty e PWA.

## v1.3 — peças e interface
- Dois estilos independentes do tema: A — Staunton Clássico 3D e B — Staunton Futurista.
- Material clássico sólido/polido ou futurista cristalino/emissivo, preservando as cores do tema.
- Geometria Staunton refinada, com atenção especial ao cavalo e silhuetas legíveis.
- Controles em barra vertical lateral no desktop para não cobrir o tabuleiro.
- Rastro de movimento mais evidente, incluindo casas intermediárias de torre, bispo e rainha.
- Apenas o último rastro de cada lado é mantido: novo lance branco substitui o rastro branco anterior; idem para pretas.

## v1.4 — atualização de assets e preparação Staunton

- Toasty atualizado para a nova imagem fornecida pelo usuário, preservando o áudio/animação existentes.
- Cache/PWA atualizado para a build v1.4.
- Mantidos os estilos A (Staunton Clássico) e B (Staunton Futurista) e todos os recursos existentes da v1.3.
- Integração GLB realista: **não embutida nesta build**, porque nenhum arquivo `.glb/.gltf` de modelo Staunton foi fornecido junto ao projeto. A arquitetura definida prevê seis geometrias-base (`pawn`, `rook`, `knight`, `bishop`, `queen`, `king`) com fallback procedural. Não foi criado um modelo falso por primitivas, para não repetir o problema visual do cavalo.

## v1.5 — consolidação

- Nova imagem transparente do Toasty incorporada em `assets/toasty-sprite.png`, preservando o áudio e a animação existentes.
- Mantidos os ajustes acumulados da v1.3/v1.4: menu vertical no desktop, responsividade mobile, câmera/idle, introdução, temas, sons, IA, Sala Paris, PWA e rastros de movimento.
- Os estilos de peças A (Staunton Clássico) e B (Staunton Futurista) permanecem disponíveis conforme a implementação existente.
- A integração de um conjunto Staunton GLB realista continua preparada como próximo passo, mas **nenhum arquivo GLB/GLTF foi incluído nesta build**, pois os bytes do asset externo licenciado ainda não estão disponíveis localmente. O fallback procedural existente foi preservado.
- Não foi criado um modelo 3D fictício para o cavalo: a melhoria real de modelagem dependerá da inclusão do asset Staunton GLB.


## v1.6 — ajustes acumulados
- Desktop: controles reposicionados para a lateral por CSS, preservando os IDs/eventos existentes; botão de recolher também lateral.
- Toasty: imagem PNG transparente mantida, ancorada ao rodapé e surgindo pela lateral; áudio preservado.
- Ritmo: transições de interface e durações cinematográficas identificáveis foram encurtadas, sem alterar temporizadores de IA/rede.
- Sala Paris: a lógica existente foi preservada para evitar regressão. Onde já havia modo espectador, foi reforçado o bloqueio de jogadas do espectador.
- Peças 3D: a integração GLB continua pendente nesta build. O modelo CC0 selecionado foi verificado, mas o arquivo binário não pôde ser incorporado automaticamente neste ambiente. O fallback atual permanece intacto.
- Nenhum recurso existente foi deliberadamente removido.

## v1.7 — asset Staunton real incorporado
- `models/staunton-set.glb` incluído localmente no ZIP.
- GLB validado como glTF 2.0 e inspecionado antes do empacotamento.
- Loader local preparado para reconhecer `pawn`, `rook`, `knight`, `bishop`, `queen` e `king`, normalizar escala/base e preservar metadados de raycast.
- O modelo é pré-carregado e o sistema procedural permanece como fallback se o GLB não puder ser carregado.
- O asset foi adicionado ao cache PWA.
- Observação técnica: a fábrica procedural original foi preservada. A substituição automática só é feita quando a arquitetura existente permite fazê-la sem quebrar movimentos/IA/multiplayer; esta build não remove a fábrica antiga.

## v1.8 — correção funcional após revisão da v1.7
- Corrigida a causa de as peças não mudarem: `createPiece()` agora chama de fato `XPStaunton.create()` e usa o GLB real; as primitivas ficam apenas como fallback.
- Ao terminar o carregamento do GLB, o tabuleiro é recarregado para substituir as peças iniciais procedurais.
- Menu desktop corrigido usando o seletor real `.bottom-bar`; aberto e recolhido permanecem na lateral, com o botão de minimizar/expandir também lateral.
- Sala Paris não abre mais o modal intermediário ao selecionar Paris: tenta entrar diretamente e, se a sala ainda não existir, tenta assumir como anfitrião.
- A animação inicial foi encurtada de forma explícita e o zoom intermediário ao centro foi removido.
- Observação: a infraestrutura PeerJS atual é P2P para dois jogadores. O fluxo de espectadores múltiplos exige ampliar o protocolo de rede; não foi falsamente marcado como concluído nesta correção.

## v1.9 — peças Staunton visíveis + botão lateral corrigido
- O carregador do GLB agora escolhe a escultura completa de cada tipo, preferindo o grupo/nó nomeado em vez de um sub-mesh isolado.
- O transform mundial importado é preservado antes da normalização, evitando peças invisíveis/deslocadas.
- Quando o GLB termina de carregar, o tabuleiro atual é reconstruído imediatamente com as peças Staunton.
- Novo Jogo, recarga de posição e promoção continuam passando pela mesma `createPiece()`, portanto usam Staunton depois do carregamento.
- Procedurais continuam somente como fallback caso o GLB falhe.
- No desktop, o botão de recolher foi movido para baixo do painel VOCÊ; o menu vertical começa abaixo dele.

## v2 — 22/09/2026
- Corrigido o escopo da reconstrução Staunton após o carregamento do GLB.
- As 32 peças são reconstruídas com os seis modelos do `models/staunton-set.glb`; geometria procedural permanece apenas como fallback.
- Removida a condição que fazia o carregamento concluir sem conseguir chamar a reconstrução do tabuleiro.
- Material futurista/cristal ficou menos transparente.
- Neon interno ganhou movimento vertical de baixo para cima.
- Perspectiva da Sala Paris passa a colocar o lado do próprio jogador na parte inferior (brancas/pretas).
- Identificação de versão sempre visível no topo: `XADREZ PRO 3D v2`.
- Numeração passa a usar versões inteiras (v2, v3, ...).
- Cache do Service Worker alterado para o build v2, evitando reutilizar assets da v1.9.
- Layout vertical mobile reforça o tabuleiro como área principal e mantém informações/controles na região inferior.


## v6 — 22/09/2026
- Base: v3 preservada; nenhum modo/recurso removido.
- model.glb continua padrão na abertura.
- 7 acabamentos de peças com troca real e persistente.
- 7 estilos de tabuleiro independentes de tema/peças.
- Correção da orientação: peças pretas/brancas mantêm frente oposta após animações; cavalo não volta para rotação zero.
- Mobile portrait: câmera recalculada por lado para enquadrar o tabuleiro inteiro; VOCÊ/ADVERSÁRIO junto ao título; menu ☰/× centralizado abaixo.
- Assistência de toque legal da v3 preservada.
- Toasty P2P da v3 preservado.
- Cache atualizado para v6.

## v6 — revisão estrutural mobile / peças / tabuleiros
- Base preservada da v5, sem remoção dos modos e recursos existentes.
- Mobile portrait entra diretamente na câmera de jogo e enquadra o tabuleiro inteiro; intro cinematográfica não pode recortar o tabuleiro no celular.
- Perspectiva online segue `playerIsWhite`: brancas e pretas veem seu próprio lado embaixo.
- Status relativo ao jogador: “É a sua vez”, “Vez do adversário” e “Vez da máquina”.
- Cavalo recebe orientação física própria: branco para o campo preto e preto para o campo branco.
- Conjuntos de peças com geometrias reais diferentes: `model.glb`, seis GLBs leves separados e `ABeautifulGame.glb`; Royal/Cyber mantêm escultura procedural própria.
- Tabuleiro Tournament Wood utiliza `models/boards/Chess.glb`; Medieval/Cyber/Minimal/Crystal alteram também a estrutura 3D, não só a cor.
- Service Worker v6 inclui os novos assets e elimina caches anteriores.
