// Servidor local do editor de portfólio.
// Uso: npm install && npm run editor
// Depois abra http://localhost:3001/editor no navegador.

const express = require('express');
const cheerio = require('cheerio');
const multer = require('multer');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_PATH = path.join(__dirname, 'data', 'content.json');
const IMG_DIR = path.join(__dirname, 'img');

app.use(express.json({ limit: '2mb' }));

// Serve o site público (raiz) e o editor
app.use('/', express.static(path.join(__dirname)));
app.use('/editor', express.static(path.join(__dirname, 'editor')));

// ---------- Upload de imagens (foto de perfil, capas de matérias) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, IMG_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || '.jpg').toLowerCase();
    const base = path.basename(file.originalname, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'imagem';
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Envie um arquivo de imagem (jpg, png, webp...).'));
  }
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo recebido.' });
  // caminho relativo à raiz do projeto (funciona tanto no site publicado quanto localmente)
  res.json({ path: `img/${req.file.filename}` });
});

// ---------- Busca automática de metadados de um link ----------
app.get('/api/fetch-metadata', async (req, res) => {
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: 'Informe uma URL válida (começando com http:// ou https://).' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PortfolioMetadataBot/1.0)'
      }
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.status(502).json({ error: `O link respondeu com status ${response.status}.` });
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) {
      return res.status(415).json({ error: 'O link não retornou uma página HTML.' });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const meta = (name) =>
      $(`meta[property="${name}"]`).attr('content') ||
      $(`meta[name="${name}"]`).attr('content') ||
      '';

    const title = meta('og:title') || $('title').first().text() || '';
    const description = meta('og:description') || meta('description') || '';
    const siteName = meta('og:site_name') || new URL(url).hostname.replace(/^www\./, '');
    let image = meta('og:image') || meta('twitter:image') || '';

    if (image) {
      try {
        image = new URL(image, url).toString();
      } catch (_) { /* mantém como veio, se não conseguir resolver */ }
    }

    // Campos úteis especificamente para artigos científicos (tags citation_*, comuns em periódicos)
    const journal = meta('citation_journal_title') || '';
    const pubDate = meta('citation_publication_date') || meta('citation_date') || meta('article:published_time') || '';
    const year = (pubDate.match(/\d{4}/) || [])[0] || '';

    res.json({
      title: title.trim(),
      description: description.trim(),
      siteName: siteName.trim(),
      image,
      journal: journal.trim(),
      year
    });
  } catch (err) {
    const message = err.name === 'AbortError'
      ? 'O link demorou demais para responder (timeout).'
      : 'Não foi possível buscar informações desse link. Você pode preencher manualmente.';
    res.status(500).json({ error: message });
  }
});

// ---------- Carregar dados atuais ----------
app.get('/api/content', async (req, res) => {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    res.json(JSON.parse(raw));
  } catch (err) {
    res.status(500).json({ error: 'Não foi possível ler data/content.json.' });
  }
});

// ---------- Salvar dados ----------
app.post('/api/save', async (req, res) => {
  try {
    const data = req.body;
    if (!data || !data.profile) {
      return res.status(400).json({ error: 'Dados inválidos.' });
    }
    await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Não foi possível salvar data/content.json.' });
  }
});

app.listen(PORT, () => {
  console.log(`\nEditor rodando! Abra no navegador:\n  http://localhost:${PORT}/editor\n`);
  console.log(`Site público (pré-visualização):\n  http://localhost:${PORT}\n`);
});

// tratamento de erros (ex: upload grande demais, tipo de arquivo inválido)
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || 'Ocorreu um erro.' });
});
