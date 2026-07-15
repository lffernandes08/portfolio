# Editor do portfólio — como usar

Este projeto agora tem duas partes:

1. **`index.html`** — o site público. Não tem mais texto fixo: ele carrega tudo de `data/content.json` na hora de abrir a página.
2. **`editor/`** + **`server.js`** — um app local (só roda na sua máquina) com formulário amigável para editar `data/content.json`, incluindo busca automática de metadados a partir de links.

## Pré-requisito

Ter o [Node.js](https://nodejs.org) instalado (versão 18 ou mais recente). Para conferir:

```bash
node -v
```

## 1. Instalar as dependências (só na primeira vez)

Na pasta do projeto:

```bash
npm install
```

## 2. Rodar o editor

```bash
npm run editor
```

Isso abre um servidor local. No terminal vai aparecer o link — abra no navegador:

```
http://localhost:3001/editor
```

## 3. Preencher as informações

O editor tem 4 abas:

- **Perfil** — nome, foto, cargo, bio (com negrito/itálico/lista/link), tags, e-mail e redes.
- **Matérias** — cole o link da matéria e clique em **"buscar automaticamente"**: ele tenta preencher veículo, título e foto de capa lendo os metadados da página (tags Open Graph). Nem todo site tem esses dados — quando não encontrar, é só preencher manualmente.
- **Publicações** — mesma lógica, tentando também capturar periódico e ano quando disponíveis.
- **Projetos** — funciona bem com links do GitHub (nome e descrição do repositório).

Clique em **Salvar** no topo sempre que quiser gravar as mudanças em `data/content.json`. O botão **"Pré-visualizar site"** abre o site público numa nova aba, já com o conteúdo atualizado.

## 4. Sobre a foto de perfil e as capas das matérias

Duas opções, disponíveis tanto no campo "Foto" do Perfil quanto no campo de imagem de cada matéria:
- Clique em **"enviar arquivo"** para fazer upload direto do seu computador — o arquivo é salvo automaticamente na pasta `img/` do projeto e o caminho é preenchido sozinho.
- Ou cole a URL de uma imagem já hospedada em algum lugar (link direto de imagem).

Arquivos enviados por upload precisam ir para o Git junto com o resto (`git add .`), já que ficam salvos localmente na pasta `img/`.

## 5. Publicar as mudanças

Depois de salvar no editor, o arquivo `data/content.json` (e as imagens, se adicionou alguma em `img/`) precisam ir para o GitHub:

```bash
git add .
git commit -m "Atualiza conteúdo do portfólio"
git push
```

O GitHub Pages atualiza automaticamente em alguns minutos.

## Observação importante

Para o site público (`index.html`) carregar `data/content.json` corretamente, ele precisa ser aberto por um servidor (local ou no GitHub Pages) — **não funciona abrindo o arquivo direto no navegador (duplo-clique)**, porque os navegadores bloqueiam essa leitura de arquivo local por segurança.

Para pré-visualizar localmente fora do editor, você pode rodar:

```bash
npx serve .
```

e abrir o link que aparecer no terminal.
