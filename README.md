# GTA VI ZERO HOUR — site pronto para publicar

Contador global do GTA VI para **19 de novembro de 2026**, com **donate acima da contagem**, mapa mundial com territórios em rosa conforme cada janela de lançamento, lista de 71 cidades em ordem cronológica, vídeos oficiais, página Netflix Tudum, playlists com orientação sobre licenças e SEO em português/inglês.

**Entregas:** `dist/` contém **144 páginas HTML geradas** e todos os arquivos necessários para hospedar o site. Não requer backend, banco, Python, React nem qualquer dependência. A versão foi desenvolvida em JavaScript moderno, CSS e Node.js apenas para gerar novamente as páginas de SEO.

## PUBLICAR EM 2 MINUTOS

**Vercel**: envie este projeto para GitHub → Import Project → Framework Preset: `Other` → Build Command: vazio (ou `npm run build`) → Output Directory: `dist`. Alternativamente, use qualquer hospedagem estática que publique o conteúdo de `dist/` na raiz do domínio.

**Netlify**: Publish directory: `dist` — build command: `npm run build` ou vazio. **Cloudflare Pages**: Build output directory: `dist`.

A imagem de fundo (`public/hero.webp`) é uma versão comprimida **da imagem enviada pelo usuário**. A obra e as marcas GTA são de seus titulares; verifique os direitos de uso em publicação comercial.

## SEO — IMPORTANTÍSSIMO QUANDO TIVER DOMÍNIO

Edite `site.config.json` e coloque seu domínio real (exemplo `"siteUrl": "https://seu-dominio.com"`) e execute:

```bash
npm run build
```

Ou diretamente:

```bash
node scripts/build.mjs --site-url=https://seu-dominio.com
```

Isso gera `dist/sitemap.xml`, `<link rel="canonical">`, hreflang PT/EN e URLs Open Graph absolutas. Publique novamente `dist/` e envie `https://seu-dominio.com/sitemap.xml` ao Google Search Console. **Sem informar o domínio**, o site funciona normalmente, mas canonicals absolutos e sitemap ficam desativados para evitar links incorretos.

SEO incluso: títulos e meta descrições por cidade, HTML já gerado no build (sem exigir JS para os conteúdos locais), dados estruturados `VideoGame`, `WebSite`, `WebPage`, `FAQPage` e `BreadcrumbList`, `robots.txt`, `llms.txt`, páginas bilíngues e navegação consistente. *Não existe garantia de ranqueamento no Google ou de aparecer em respostas de IA.*

## EDITAR / TESTAR LOCALMENTE

Requisitos para **regerar** o site: Node.js 20+ (sem `npm install`).

```bash
npm run build
npm run dev
```

Abra `http://localhost:4173`. Para publicar, basta `dist/`, mesmo sem Node na hospedagem.

Arquivos:

- `src/site.css`: design completo e responsivo, fundo GTA, donate em cima, cards e painel.
- `src/app.js`: contador ao vivo, pesquisa, mapa SVG com coordenadas e países rosa, seleção de cidades, trailers embutidos ao clicar.
- `src/data/regions.json`: 71 cidades, UTC ISO 8601, fusos IANA, coordenadas e região da loja.
- `src/data/world.json`: geometrias mundiais simplificadas a partir de Natural Earth (domínio público).
- `scripts/build.mjs`: gerador 144 páginas e SEO (somente Node.js).
- `scripts/preview.mjs`: servidor local de teste, sem dependências.
- `public/hero.webp`: imagem de fundo enviada no chat.
- `dist/`: site final, publicável na raiz do domínio.

## DOAÇÕES

Os dois links estão em um banner **acima da contagem**, tanto na versão PT quanto EN:

- **Pix (Brasil, via LivePix):** https://livepix.gg/vitorcalltv
- **PayPal / apoio internacional (via Streamlabs):** https://streamlabs.com/vitorcalltv/tip

O site se apresenta como um projeto de **Victor Batista (victor99dev)**, desenvolvedor brasileiro. Os links abrem as plataformas; pagamentos não são processados pelo próprio site.

## MÚSICA E VÍDEOS

O site traz links para a seleção de playlists em https://ncs.io/playlists e Biblioteca de Áudio do YouTube https://www.youtube.com/audiolibrary. Não reproduz nem redistribui músicas. Antes de usar alguma faixa em lives, confira a licença e os créditos obrigatórios para o conteúdo e tipo de transmissão.

Vídeos oficiais da Rockstar com reprodução via embed do YouTube: Trailer 1, Trailer 2 e "An Extended Look" (que estreou primeiro na Netflix). Conteúdo Netflix Tudum e Launch Trailer vinculados às páginas oficiais em vez de republicados. Embeds dependem da disponibilidade externa, política e configuração do YouTube.

## SOBRE OS HORÁRIOS E O MAPA

A Rockstar confirmou **19/11/2026, meia-noite no horário local de cada região** para PS5 e Xbox Series X|S. Este site usa **instantes UTC absolutos por região da loja** no JSON. Exemplos:

- Auckland / Nova Zelândia — 2026-11-18 11:00 UTC = 19/11 00:00 NZDT.
- Sydney / Austrália — 2026-11-18 13:00 UTC = 19/11 00:00 AEDT.
- Brasília / Brasil — 2026-11-19 03:00 UTC = 19/11 00:00 BRT.
- Manaus (mesma referência regional BR) — 2026-11-18 23:00 hora local.
- Nova York — 2026-11-19 05:00 UTC = 19/11 00:00 EST.

A posição dos pontos é calculada da latitude e longitude por projeção equiretangular sobre o mesmo SVG da geografia, evitando desalinhamento de CSS. Um **país** fica inteiro rosa quando a janela da região de loja associada passa. Não significa que o site consultou a conta do jogador, o servidor Rockstar, ou confirmou acesso ao jogo; regiões não cobertas não ficam rosa.

Referências:

- https://www.rockstargames.com/VI
- https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s
- https://ncs.io/usage-policy
- https://support.google.com/youtube/answer/3376882

**Aviso legal:** site independente de fã. Sem afiliação à Rockstar Games, Take-Two, Netflix, PayPal ou LivePix. GTA e marcas pertencem aos respectivos titulares. Não use a arte fornecida sem possuir os direitos adequados.
