// ---------- Estado ----------
const state = {
  articles: [],
  papers: [],
  projects: [],
  tagsPt: [],
  tagsEn: []
};

// ---------- Helpers ----------
function $(id){ return document.getElementById(id); }
function val(id){ return ($(id).value || '').trim(); }
function setVal(id, v){ $(id).value = v || ''; }
function htmlOf(id){ return ($(id).innerHTML || '').trim(); }
function setHtml(id, v){ $(id).innerHTML = v || ''; }
function escAttr(s){
  return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function setNested(obj, path, value){
  const parts = path.split('.');
  if(parts.length === 1){ obj[parts[0]] = value; }
  else { obj[parts[0]] = obj[parts[0]] || {}; obj[parts[0]][parts[1]] = value; }
}
// O editor roda em /editor/, mas os caminhos relativos salvos (ex: "img/foto.jpg")
// são relativos à raiz do site. Para pré-visualizar aqui dentro, ajustamos o caminho.
function resolvePreviewSrc(v){
  if (!v) return '';
  if (/^(https?:)?\/\//.test(v) || v.startsWith('data:') || v.startsWith('/')) return v;
  return '../' + v;
}
async function uploadFile(file, statusEl){
  const formData = new FormData();
  formData.append('file', file);
  if (statusEl) { statusEl.textContent = 'enviando...'; statusEl.className = statusEl.className.replace(/\bok\b|\berr\b/g, ''); }
  const res = await fetch('/api/upload', { method: 'POST', body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Falha no upload.');
  return data.path;
}

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.querySelector(`.panel[data-panel="${tab.dataset.tab}"]`).classList.add('active');
  });
});

// ---------- Rich text ----------
document.querySelectorAll('.rte').forEach(rte => {
  const toolbar = rte.querySelector('.rte-toolbar');
  const editable = rte.querySelector('.rte-content');
  toolbar.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      editable.focus();
      const cmd = btn.dataset.cmd;
      if (cmd === 'createLink') {
        const url = prompt('URL do link:');
        if (url) document.execCommand('createLink', false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
    });
  });
});

// ---------- Chips (tags) ----------
function renderChips(containerId, list){
  const container = $(containerId);
  const chipsEl = container.querySelector('.chips');
  chipsEl.innerHTML = list.map((tag, i) => `
    <span class="chip">${escAttr(tag)}<button type="button" data-remove-chip="${i}">×</button></span>
  `).join('');
}
function setupChipInput(containerId, listRef){
  const container = $(containerId);
  const input = container.querySelector('input[type="text"]');
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = input.value.trim();
      if (v) { listRef.push(v); renderChips(containerId, listRef); input.value = ''; }
    }
  });
  container.addEventListener('click', (e) => {
    const idx = e.target.dataset.removeChip;
    if (idx !== undefined) { listRef.splice(Number(idx), 1); renderChips(containerId, listRef); }
  });
}
setupChipInput('chipsPt', state.tagsPt);
setupChipInput('chipsEn', state.tagsEn);

// ---------- Foto: preview e upload ----------
$('fPhoto').addEventListener('input', () => {
  $('fPhotoPreview').src = resolvePreviewSrc(val('fPhoto'));
});
$('fPhotoFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const statusEl = $('fPhotoUploadStatus');
  try {
    const relPath = await uploadFile(file, statusEl);
    setVal('fPhoto', relPath);
    $('fPhotoPreview').src = resolvePreviewSrc(relPath);
    statusEl.textContent = 'enviado ✓'; statusEl.className = 'hint';
  } catch (err) {
    statusEl.textContent = err.message || 'erro no upload';
    statusEl.className = 'hint err-text';
  }
  e.target.value = '';
});

// ---------- Listas repetíveis: matérias, publicações, projetos ----------

function articleRowHTML(a, idx){
  return `
    <div class="item-card" data-index="${idx}">
      <div class="item-row">
        <input type="text" data-field="url" value="${escAttr(a.url)}" placeholder="https://... (link da matéria)">
        <button type="button" class="btn small" data-action="fetch" data-list="articles">buscar automaticamente</button>
        <button type="button" class="btn small danger" data-action="remove" data-list="articles">remover</button>
      </div>
      <div class="item-row two-col">
        <input type="text" data-field="outlet" value="${escAttr(a.outlet)}" placeholder="Nome do veículo">
        <div class="image-field">
          <input type="text" data-field="image" value="${escAttr(a.image)}" placeholder="URL da foto/capa (opcional)">
          <label class="btn small file-btn">
            enviar arquivo
            <input type="file" accept="image/*" data-field-file="image" hidden>
          </label>
        </div>
      </div>
      <div class="item-row two-col">
        <input type="text" data-field="title.pt" value="${escAttr(a.title && a.title.pt)}" placeholder="Título (PT)">
        <input type="text" data-field="title.en" value="${escAttr(a.title && a.title.en)}" placeholder="Title (EN)">
      </div>
      ${a.image ? `<img class="item-thumb-preview" data-preview src="${escAttr(resolvePreviewSrc(a.image))}" alt="">` : ''}
      <div class="item-status" data-status></div>
    </div>`;
}

function paperRowHTML(p, idx){
  return `
    <div class="item-card" data-index="${idx}">
      <div class="item-row">
        <input type="text" data-field="url" value="${escAttr(p.url)}" placeholder="https://... (DOI ou link do artigo)">
        <button type="button" class="btn small" data-action="fetch" data-list="papers">buscar automaticamente</button>
        <button type="button" class="btn small danger" data-action="remove" data-list="papers">remover</button>
      </div>
      <div class="item-row two-col">
        <input type="text" data-field="year" value="${escAttr(p.year)}" placeholder="Ano">
        <input type="text" data-field="journal" value="${escAttr(p.journal)}" placeholder="Periódico · coautores">
      </div>
      <div class="item-row two-col">
        <input type="text" data-field="title.pt" value="${escAttr(p.title && p.title.pt)}" placeholder="Título (PT)">
        <input type="text" data-field="title.en" value="${escAttr(p.title && p.title.en)}" placeholder="Title (EN)">
      </div>
      <div class="item-status" data-status></div>
    </div>`;
}

function projectRowHTML(p, idx){
  return `
    <div class="item-card" data-index="${idx}">
      <div class="item-row">
        <input type="text" data-field="url" value="${escAttr(p.url)}" placeholder="https://... (repositório ou demo, opcional)">
        <button type="button" class="btn small" data-action="fetch" data-list="projects">buscar automaticamente</button>
        <button type="button" class="btn small danger" data-action="remove" data-list="projects">remover</button>
      </div>
      <div class="item-row">
        <input type="text" data-field="name" value="${escAttr(p.name)}" placeholder="Nome do projeto">
      </div>
      <div class="item-row two-col">
        <input type="text" data-field="description.pt" value="${escAttr(p.description && p.description.pt)}" placeholder="Descrição curta (PT)">
        <input type="text" data-field="description.en" value="${escAttr(p.description && p.description.en)}" placeholder="Short description (EN)">
      </div>
      <div class="item-status" data-status></div>
    </div>`;
}

function renderList(listKey, containerId, rowFn){
  $(containerId).innerHTML = state[listKey].map((item, i) => rowFn(item, i)).join('');
}
const renderArticles = () => renderList('articles', 'articlesList', articleRowHTML);
const renderPapers = () => renderList('papers', 'papersList', paperRowHTML);
const renderProjects = () => renderList('projects', 'projectsList', projectRowHTML);

function setupListContainer(containerId, listKey, renderFn, emptyItem){
  const container = $(containerId);

  container.addEventListener('input', (e) => {
    const fieldEl = e.target.closest('[data-field]');
    if (!fieldEl) return;
    const card = e.target.closest('[data-index]');
    const idx = Number(card.dataset.index);
    setNested(state[listKey][idx], fieldEl.dataset.field, fieldEl.value);
  });

  container.addEventListener('change', async (e) => {
    const fileEl = e.target.closest('[data-field-file]');
    if (!fileEl) return;
    const file = fileEl.files[0];
    if (!file) return;
    const card = e.target.closest('[data-index]');
    const idx = Number(card.dataset.index);
    const statusEl = card.querySelector('[data-status]');
    const field = fileEl.dataset.fieldFile;
    try {
      const relPath = await uploadFile(file, statusEl);
      setNested(state[listKey][idx], field, relPath);
      renderFn();
      const newStatus = container.querySelector(`[data-index="${idx}"] [data-status]`);
      if (newStatus) { newStatus.textContent = 'imagem enviada ✓'; newStatus.className = 'item-status ok'; }
    } catch (err) {
      statusEl.textContent = err.message || 'erro no upload';
      statusEl.className = 'item-status err';
    }
    fileEl.value = '';
  });

  container.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = e.target.closest('[data-index]');
    const idx = Number(card.dataset.index);

    if (btn.dataset.action === 'remove') {
      state[listKey].splice(idx, 1);
      renderFn();
      return;
    }

    if (btn.dataset.action === 'fetch') {
      const urlInput = card.querySelector('[data-field="url"]');
      const url = (urlInput.value || '').trim();
      const statusEl = card.querySelector('[data-status]');
      if (!url) { statusEl.textContent = 'Cole um link primeiro.'; statusEl.className = 'item-status err'; return; }

      btn.disabled = true; btn.textContent = 'buscando...';
      statusEl.textContent = ''; statusEl.className = 'item-status';

      try {
        const res = await fetch(`/api/fetch-metadata?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Falha na busca.');

        const item = state[listKey][idx];
        if (listKey === 'articles') {
          if (data.siteName) item.outlet = data.siteName;
          if (data.title) { item.title = item.title || {}; item.title.pt = data.title; }
          if (data.image) item.image = data.image;
        } else if (listKey === 'papers') {
          if (data.title) { item.title = item.title || {}; item.title.pt = data.title; }
          if (data.journal) item.journal = data.journal;
          if (data.year) item.year = data.year;
        } else if (listKey === 'projects') {
          if (data.title) item.name = item.name || data.title;
          if (data.description) { item.description = item.description || {}; item.description.pt = data.description.slice(0, 220); }
        }
        renderFn();
        // feedback rápido pós-render
        const newCard = container.querySelector(`[data-index="${idx}"] [data-status]`);
        if (newCard) { newCard.textContent = 'Preenchido — revise os campos.'; newCard.className = 'item-status ok'; }
      } catch (err) {
        statusEl.textContent = err.message || 'Não foi possível buscar esse link.';
        statusEl.className = 'item-status err';
        btn.disabled = false; btn.textContent = 'buscar automaticamente';
      }
    }
  });
}

setupListContainer('articlesList', 'articles', renderArticles);
setupListContainer('papersList', 'papers', renderPapers);
setupListContainer('projectsList', 'projects', renderProjects);

$('addArticle').addEventListener('click', () => {
  state.articles.push({ url: '', outlet: '', image: '', title: { pt: '', en: '' } });
  renderArticles();
});
$('addPaper').addEventListener('click', () => {
  state.papers.push({ url: '', year: '', journal: '', title: { pt: '', en: '' } });
  renderPapers();
});
$('addProject').addEventListener('click', () => {
  state.projects.push({ url: '', name: '', description: { pt: '', en: '' } });
  renderProjects();
});

// ---------- Carregar dados ----------
function load(data){
  setVal('fName', data.profile.name);
  setVal('fPhoto', data.profile.photo);
  $('fPhotoPreview').src = resolvePreviewSrc(data.profile.photo || '');
  setVal('fRolesPt', data.profile.roles && data.profile.roles.pt);
  setVal('fRolesEn', data.profile.roles && data.profile.roles.en);
  setHtml('fBioPt', data.profile.bio && data.profile.bio.pt);
  setHtml('fBioEn', data.profile.bio && data.profile.bio.en);
  setVal('fFooterPt', data.profile.footerTagline && data.profile.footerTagline.pt);
  setVal('fFooterEn', data.profile.footerTagline && data.profile.footerTagline.en);
  setVal('fEmail', data.profile.social && data.profile.social.email);
  setVal('fLinkedin', data.profile.social && data.profile.social.linkedin);
  setVal('fGithub', data.profile.social && data.profile.social.github);

  state.tagsPt = (data.profile.tags && data.profile.tags.pt) ? [...data.profile.tags.pt] : [];
  state.tagsEn = (data.profile.tags && data.profile.tags.en) ? [...data.profile.tags.en] : [];
  renderChips('chipsPt', state.tagsPt);
  renderChips('chipsEn', state.tagsEn);

  state.articles = data.articles ? JSON.parse(JSON.stringify(data.articles)) : [];
  state.papers = data.papers ? JSON.parse(JSON.stringify(data.papers)) : [];
  state.projects = data.projects ? JSON.parse(JSON.stringify(data.projects)) : [];
  renderArticles(); renderPapers(); renderProjects();
}

fetch('/api/content')
  .then(r => r.json())
  .then(load)
  .catch(() => {
    $('saveStatus').textContent = 'erro ao carregar dados';
    $('saveStatus').className = 'save-status err';
  });

// ---------- Salvar ----------
function collectData(){
  return {
    profile: {
      name: val('fName'),
      photo: val('fPhoto'),
      roles: { pt: val('fRolesPt'), en: val('fRolesEn') },
      bio: { pt: htmlOf('fBioPt'), en: htmlOf('fBioEn') },
      tags: { pt: [...state.tagsPt], en: [...state.tagsEn] },
      footerTagline: { pt: val('fFooterPt'), en: val('fFooterEn') },
      social: { email: val('fEmail'), linkedin: val('fLinkedin'), github: val('fGithub') }
    },
    articles: state.articles,
    papers: state.papers,
    projects: state.projects
  };
}

$('saveBtn').addEventListener('click', async () => {
  const statusEl = $('saveStatus');
  statusEl.textContent = 'salvando...'; statusEl.className = 'save-status';
  try {
    const res = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectData())
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao salvar.');
    statusEl.textContent = 'salvo ✓'; statusEl.className = 'save-status ok';
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = 'save-status'; }, 2500);
  } catch (err) {
    statusEl.textContent = err.message || 'erro ao salvar';
    statusEl.className = 'save-status err';
  }
});

$('previewBtn').addEventListener('click', () => window.open('/', '_blank'));
