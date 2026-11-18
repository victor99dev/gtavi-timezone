# GTA VI Zero Hour — Global Release Countdown

Site estático independente, bilíngue (PT-BR + EN), com contador em tempo real, mapa mundial e cena própria para live no YouTube/OBS. Sem banco de dados, API, npm, React ou hospedagem de servidor.

**Referência atual (conferida em 18/11/2026):** Rockstar Games confirma 19/11/2026, meia-noite local em todas as regiões, PS5 e Xbox Series X|S. Instantes UTC selecionados seguem a referência dos anúncios e listagens regionais da PlayStation Store. A contagem identifica a **janela de horário programada**, não confirma que o jogo efetivamente desbloqueou para uma conta.

## Publicar agora — caminho mais rápido

1. Descompacte o arquivo ZIP.
2. O diretório `dist/` já contém o site gerado e pode ser publicado **sem compilação**.
3. Na Vercel, faça upload do projeto no GitHub e configure `Framework Preset: Other` e `Output Directory: dist`. Ou publique o conteúdo de `dist/` em Cloudflare Pages, Netlify ou hospedagem estática.
4. Aponte o domínio para a hospedagem, configure HTTPS e teste a página inicial e `/live/`.
5. **Para ativar SEO de produção**, execute `python build.py --site-url https://SEU-DOMINIO.COM` e republique `dist/` com os arquivos `sitemap.xml`, canonicals, hreflang e links absolutos de OG. Substitua pelo seu domínio real, sem usar literalmente o exemplo.
6. Cadastre `https://SEU-DOMINIO.COM/sitemap.xml` no Google Search Console e valide a propriedade. Indexação e rankings não são garantidos.

Se usar GitHub Pages em uma subpasta (`usuario.github.io/repositorio/`), publique as rotas com redirecionamento/SPA adequado ou use domínio na raiz: as páginas foram pensadas para URLs limpas com `index.html` em cada diretório.

## Rodar localmente

```powershell
cd gta6-global-countdown\dist
python -m http.server 8080
```

Abra `http://localhost:8080/`, ou, se preferir, abra `dist/index.html` no navegador. O frontend não chama APIs e pode funcionar offline; as fontes web do Google têm fallback local.

## URL para live no YouTube com OBS

- PT-BR: `https://SEU-DOMINIO.COM/live/`
- Inglês: `https://SEU-DOMINIO.COM/en/live/`
- OBS → **Fontes → + → Navegador** → URL acima → **1920 × 1080** → FPS 30.
- A cena muda automaticamente para a **próxima janela mundial**. Use o OBS para acrescentar webcam, música licenciada, chat e sua marca.
- O projeto não contém gameplay, streaming do jogo ou conteúdo oficial protegido; é um painel de fã. Evite apresentá-lo como transmissão da Rockstar.

## SEO já incluído

- HTML pré-renderizado e texto navegável mesmo sem JavaScript.
- 72 páginas indexáveis: página principal + 35 cidades em português e em inglês (os dois modos OBS são `noindex`).
- Títulos e descrições específicos por cidade, com horário local convertido corretamente.
- Dados estruturados `WebSite`, `WebPage`, `VideoGame`, `FAQPage` e `BreadcrumbList` nas páginas de cidade.
- H1 único, FAQ legível, URLs descritivas, metadados Open Graph, imagem social, `robots.txt`, responsividade, carregamento sem dependências de runtime.
- Canonical, `hreflang`, `og:url` e sitemap XML são gerados **quando você informar o domínio real** no argumento de build.
- Links para Rockstar Support, site oficial e PlayStation Store; aviso independente e declaração das limitações dos horários.

## Manter os horários atualizados

Edite `src/regions.json` e, se necessário, o texto editorial em `build.py`. Cada cidade tem `utc` como instante **ISO 8601 UTC** (`2026-11-19T03:00:00Z`), `tz` IANA (por exemplo `America/Belem`) e `store` (referência regional). **Não** altere o horário UTC simplesmente porque a cidade tem outro fuso. Exemplo: Manaus compartilha a referência da loja BR, mas a conversão da hora local será 23h do dia 18.

Para compilar novamente:

```powershell
python build.py --site-url https://SEU-DOMINIO.COM
```

A aplicação só usa o relógio do navegador, portanto um relógio do dispositivo desajustado pode fazer o contador divergir. Para sincronização com uma fonte horária externa, seria necessário adicionar uma API ou endpoint de tempo.

## Fontes consultadas

- Rockstar (lançamento e plataformas): https://www.rockstargames.com/VI
- Rockstar Support (meia-noite local): https://support.rockstargames.com/articles/29jV3Cv2cCgvwM1XgtMO5o/grand-theft-auto-vi-regional-pre-load-and-release-times-on-playstation-5-and-xbox-series-x-or-s
- PlayStation Store BR: https://store.playstation.com/pt-br/concept/10000730
- PlayStation Store US: https://store.playstation.com/en-us/concept/10000730

Projeto autoral de fãs, sem afiliação à Rockstar Games ou Take-Two. O mapa usa dados Natural Earth (domínio público); não distribui logos ou artes oficiais da Rockstar.
