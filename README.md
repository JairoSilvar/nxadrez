# XADREZ PRO 3D v7

Base: v6 fornecida pelo usuário, confrontada com a v3. Publique o conteúdo deste ZIP na raiz do site, com index.html na raiz. Abra por HTTP/HTTPS, não por file://.

## Peças reais
Padrão (model.glb original), Premium (A Beautiful Game), Tournament (Staunton-Pieces), Medieval, Spiral, Crystal, Cyber e Clássico leve. Cada opção tem geometrias próprias para as seis peças. Os modelos carregam sob demanda e só substituem o conjunto atual após carregamento completo, preservando a posição. O procedural antigo foi removido. Falhas mantêm o conjunto anterior; na primeira abertura, um aviso permite tentar novamente pelo menu.

Orientação-base dos cavalos: padrão/Tournament/Medieval/Cyber = 0; Premium/Clássico leve = π; Spiral/Crystal = −π/2. Pretas acrescentam π. A câmera não altera a orientação física, que é restaurada após os movimentos. Crystal é uma escultura abstrata, sem rosto literal de cavalo; mantém o eixo frontal definido para o conjunto.

## Tabuleiros
Cinco opções: Neon original, Wood (Chess.glb), Premium (A Beautiful Game), Minimal (SM_ChessBoard.fbx) e Voxel (BoardGames-vox). Os quatro importados usam geometrias dos arquivos enviados. Wood e Voxel preservam suas casas; Premium e Minimal recebem a grade jogável sobre a base importada.

Os nomes antigos que representavam apenas acabamentos da mesma base não são apresentados como modelos distintos. Os temas de ambiente permanecem. wood_chess_board.zip contém apenas um arquivo Blender e não foi convertido: Wood usa o Chess.glb enviado. chess_source.zip não acrescentou uma opção nesta versão. Os arquivos originais do usuário permanecem intactos.

## Câmera e celular
A câmera inicia enquadrada e travada. Destravar câmera libera gestos; Enquadrar / Travar recalcula a projeção dos limites do tabuleiro conforme a área útil e bloqueia os controles. Redimensionar ou recolher/abrir o menu recalcula o espaço. No celular, VOCÊ/ADVERSÁRIO e título ficam no topo e controles ficam fora do canvas. Cinematográficas de repouso continuam disponíveis com a câmera destravada.

## Recursos
Preservados IA em três níveis, partida local, Sala Paris/PeerJS, temas, assistência de toque, Toasty, sons, animações de lance/captura, promoção, roque, en passant e desfazer. Bibliotecas incluídas localmente. Salas dependem de internet e da sinalização PeerJS.

## Cache
Service worker v7. Somente núcleo e model.glb entram no pré-cache; outros conjuntos/tabuleiros entram quando usados. Caches antigos do Xadrez são removidos na ativação. Preferências v7 usam chaves próprias para não interpretar um acabamento v6 como geometria real.

## Validação
Consulte VALIDACAO.md. Testes no Chromium embutido do Codex. Eventos P2P verificados com conexão controlada; não foi realizada uma partida pela internet entre dois dispositivos. Celular validado por viewports simulados, sem aparelho físico.
