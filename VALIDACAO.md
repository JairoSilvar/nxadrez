# Validação — Xadrez Pro 3D v8

Base: Xadrez_Pro_3D_v7_20260922.zip, SHA-256 CE0771EE6AC783C3E7322A682994FE74136B12B83FC1B698043B9A1D07FF61D3.

215 verificações automatizadas passaram no navegador Chromium embutido. Lista completa em TESTES.txt.

- Oito conjuntos: carregamento, posição preservada, dimensões limitadas à casa, base apoiada e orientação oposta dos cavalos.
- Todas as 56 combinações de oito conjuntos e sete materiais: geometria e posição preservadas ao trocar acabamento.
- Cinco tabuleiros: carregamento e enquadramento completo. Inspeção adicional dos vértices do Voxel identificou casas de 0,93; escala corrigida por 4/3 para casas de 1,24.
- Viewports 320×568, 390×844, 768×1024, 1280×800 e 844×390, controles abertos e recolhidos: sem rolagem horizontal, tabuleiro inteiro e sete painéis fora da área do canvas.
- Perspectivas branca/preta; travar/destravar câmera; lance e2-e4 por eventos de toque; desfazer; roque; en passant; promoção.
- Resposta da IA nos três níveis.
- Conexão simulada: lance remoto sem eco, rejeição de lance remoto na cor local, Toasty transmitido/recebido sem eco, mensagem de desconexão e retorno à perspectiva branca.
- Inspeção visual de todos os conjuntos, tabuleiros e interface móvel. Botão Fechar fixado no topo dos seletores.
- Validação de sintaxe JavaScript e UTF-8 estrito dos arquivos próprios. Varredura de padrões de mojibake sem ocorrências nos textos da interface.
- Modelos GLB, bibliotecas, áudio, imagem Toasty e licenças preservados byte a byte em relação ao ZIP original.

Limites: testes móveis usam viewports simulados, sem aparelho físico. Transporte Paris testado com conexão controlada, sem partida real pela internet entre dois dispositivos; disponibilidade do PeerJS/NAT não verificada. Não há garantia de ausência absoluta de defeitos.

Sandbox/Treino, replay e rádio não existem na v7 anexada e não foram incluídos nesta revisão. Mantidos histórico de lances e áudio ambiente existentes; não são equivalentes a esses recursos.
