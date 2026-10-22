# Unitize — site temporário estático

## Atualização: SEO em doze idiomas

Preparado para https://unitize.io/ com português na raiz e onze páginas de idiomas: en/, zh/, ja/, de/, it/, es/, fr/, nl/, ar/, he/ e ru/. Publique essas subpastas também. Cada HTML já contém sua tradução e metadados próprios. sitemap.xml, robots.txt e CNAME foram acrescentados; criar o arquivo CNAME não configura o DNS nem publica o site.

Para manutenção, consulte docs/seo-multilingue-site-temporario.md na pasta principal unitize. Os HTMLs são gerados a partir de tools/seo-temporario/template.html pelo build.py do mesmo diretório; edições diretas nos HTMLs gerados serão substituídas na próxima geração.

Esta pasta é uma versão separada de apresentação. Não substitui a landing com cadastro nem o painel da Unitize.

## Conteúdo para publicar

- index.html
- style.css
- script.js
- logo.png
- locales/ com os doze arquivos JSON
- .nojekyll

Mantenha a estrutura: index.html deve ficar na raiz da pasta publicada. Os caminhos de CSS, JavaScript, logo e idiomas são relativos, adequados também a subdiretórios. Não suba a pasta unitize inteira, o banco SQLite, backups, ambiente virtual ou chaves.

## O que funciona sem Python

Menu e navegação móvel, visual, cursor, estrelas com conexões e seleção de doze idiomas. As CDNs originais de ícones e jQuery foram preservadas; ícones e fontes externos exigem internet. A tradução usa arquivos JSON locais da publicação, não uma API de tradução.

O cadastro foi substituído por um aviso de abertura futura. Esta página não recebe e-mails, não envia requisições para /waitlist e não cria contas. A geolocalização de IP não foi incluída. A escolha de idioma pode ficar salva no navegador.

## Visualizar antes de subir

No PowerShell, execute:

```powershell
py -m http.server 8080 --bind 127.0.0.1 --directory "C:\Users\filip\OneDrive\Desktop\unitize\meu site temporario"
```

Abra http://127.0.0.1:8080/ . Encerrar com Ctrl+C. O servidor apenas entrega os arquivos; não processa inscrições. Abrir index.html diretamente pode impedir a leitura dos JSONs por restrições do navegador.

## Publicação

Esta entrega prepara arquivos e não publica ou cria repositório. Se usar GitHub Pages, publique somente este conteúdo como fonte do site, conforme a configuração do repositório. A compatibilidade técnica com hospedagem estática não elimina as regras de uso comercial do provedor. Antes da publicação comercial definitiva, escolha uma hospedagem cujos termos atendam à Unitize.

As traduções são iniciais e precisam de revisão nativa. Nenhum teste foi adicionado ou executado na criação desta cópia.


## Ícone da aba
Inclua favicon.png junto dos arquivos publicados. As doze páginas e o gerador já apontam para essa imagem. A logo do cabeçalho permanece em logo.png.
