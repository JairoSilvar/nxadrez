# Xadrez Pro 3D v8 — revisão da v7

Extraia o ZIP e publique seu conteúdo na raiz de um servidor HTTP/HTTPS, como na v7. O index.html fica na raiz. A abertura por file:// não carrega os modelos 3D; use um servidor local ou a hospedagem habitual.

## Alterações
- Área de jogo maior: removida a reserva lateral direita, controles compactos e enquadramento mais vertical no celular. Menu móvel começa recolhido.
- Seletores em uma faixa inferior separada do canvas. Fechar fica acessível no topo; Escape fecha os painéis, exceto a promoção obrigatória.
- Oito conjuntos GLB preservados. model.glb original continua padrão em uma instalação sem preferência anterior. Nenhum conjunto procedural reintroduzido.
- Normalização uniforme por geometria e tipo, em função da casa de 1,24 unidade: largura máxima de 60% a 76% da casa e alturas máximas distintas para peão, torre, cavalo, bispo, rainha e rei. Modelos preservam sua silhueta original, sem esticamento de eixos.
- Voxel: área jogável original de 7,44 unidades corrigida para 9,92 (oito casas). Madeira já possui área jogável correta; Premium e Minimalista recebem a grade comum. Corrigida a orientação clara/escura: a1 escura, h1 clara.
- Cor e material possuem seletor e preferência independentes do conjunto. Sete acabamentos disponíveis. Cores do tema e Cristal nas cores do tema acompanham a seleção de tema visual.
- Textos do catálogo corrigidos na origem; arquivos próprios em UTF-8. Rótulos e mensagens dinâmicas revisados, incluindo xeque, vitória, estados e erros de conexão.
- Corrigido reenvio de lance remoto e rejeição de lances remotos na vez local. Voltar de Paris ao modo local/IA restaura perspectiva branca e encerra a conexão anterior.
- Cache atualizado para v8. Preferências anteriores de geometria/tabuleiro continuam válidas; acabamento tem chave própria.

## Recursos da base e limites
O ZIP v7 recebido contém partida local, IA em três níveis, Sala Paris por PeerJS (entrada direta, anfitrião e visitante), temas, histórico de lances, desfazer, áudio ambiente, sons, Toasty, cinematográficas e modelos selecionáveis. Esses recursos foram mantidos.

Sandbox/Treino, replay e rádio não estão implementados no ZIP v7 recebido. Histórico de lances não é replay; áudio ambiente não é rádio. Esta revisão não afirma preservar funcionalidades ausentes. Para integrá-las, é necessário recuperar a versão que as contém.

Leia VALIDACAO.md para o escopo dos testes e as limitações. Multiplayer real depende de internet e do serviço de sinalização; não foi verificado entre dois aparelhos externos.
