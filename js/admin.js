// ================================================
// ADMIN PANEL — JavaScript (Supabase)
// ================================================

let supabaseClient = null;
let allProjects = [];
let pendingDeleteId = null;

// ── INIT SUPABASE CLIENT ─────────────────────
if (SUPABASE_CONFIG.url && SUPABASE_CONFIG.url !== 'YOUR_SUPABASE_URL') {
  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  } catch (e) {
    console.error('Supabase init error:', e);
  }
}

// ── INIT APP (Giriş Yapıldıktan Sonra) ───────
function initApp() {
  document.getElementById('headerCompanyName').textContent = APP_CONFIG.companyName;
  document.getElementById('headerEmoji').textContent = APP_CONFIG.companyEmoji;

  if (!supabaseClient) {
    document.getElementById('setupBanner').style.display = 'flex';
    document.getElementById('firebaseStatus').textContent = '⚠ Yapılandırılmamış';
    document.getElementById('firebaseStatus').className = 'badge badge-warning';
  } else {
    document.getElementById('firebaseStatus').textContent = '● Supabase Bağlı';
    document.getElementById('firebaseStatus').className = 'badge badge-success';
    loadProjects();
    setupDropZone();
  }
}

// ── AUTH (SUPABASE E-POSTA/ŞİFRE) ────────────
async function checkPassword() {
  if (!supabaseClient) {
     const err = document.getElementById('passwordError');
     err.style.display = 'block';
     err.textContent = 'Supabase ayarları eksik. config.js dosyasını kontrol edin.';
     return;
  }

  const email = document.getElementById('emailInput').value.trim();
  const password = document.getElementById('passwordInput').value;
  const btn = document.getElementById('loginBtn');
  const errorText = document.getElementById('passwordError');

  if (!email || !password) return;

  btn.disabled = true;
  btn.textContent = 'Giriş Yapılıyor...';
  errorText.style.display = 'none';

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  btn.disabled = false;
  btn.textContent = 'Giriş Yap';

  if (error) {
    errorText.style.display = 'block';
    errorText.textContent = 'Giriş başarısız. E-posta veya şifrenizi kontrol edin.';
    document.getElementById('passwordInput').value = '';
    document.getElementById('passwordInput').focus();
  } else {
    document.getElementById('passwordScreen').style.display = 'none';
    document.getElementById('adminLayout').style.display = 'flex';
    initApp();
  }
}

async function logout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  location.reload();
}

document.getElementById('passwordInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') checkPassword();
});
document.getElementById('emailInput')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') document.getElementById('passwordInput').focus();
});

// Otomatik Giriş Kontrolü (Session Check)
document.addEventListener('DOMContentLoaded', async () => {
    // Tasarımın yüklenmesi
    document.getElementById('headerCompanyName').textContent = APP_CONFIG.companyName;
    document.getElementById('headerEmoji').textContent = APP_CONFIG.companyEmoji;

    if (supabaseClient) {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            document.getElementById('passwordScreen').style.display = 'none';
            document.getElementById('adminLayout').style.display = 'flex';
            initApp();
        }
    }
});

// ── DROP ZONE ──────────────────────────────────
let selectedFile = null;

function setupDropZone() {
  const zone = document.getElementById('dropZone');

  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('dragging');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('dragging'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('dragging');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  });
}

function onFileChosen(input) {
  if (input.files[0]) handleFileSelect(input.files[0]);
}

function handleFileSelect(file) {
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!['.glb', '.gltf'].includes(ext)) {
    showToast('Sadece .glb veya .gltf dosyaları destekleniyor!', 'error');
    return;
  }
  const maxBytes = APP_CONFIG.maxFileSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    showToast(`Dosya çok büyük! Maksimum ${APP_CONFIG.maxFileSizeMB} MB`, 'error');
    return;
  }

  selectedFile = file;
  const nameEl = document.getElementById('chosenFileName');
  nameEl.textContent = `✅ ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  nameEl.style.display = 'block';
  document.querySelector('.drop-zone-icon').textContent = '📦';
  document.querySelector('.drop-zone-title').textContent = 'Dosya Seçildi';
}

// ── UPLOAD ─────────────────────────────────────
async function uploadProject(e) {
  e.preventDefault();

  if (!selectedFile) { showToast('Lütfen 3D model dosyası seçin!', 'error'); return; }
  if (!supabaseClient) { showToast('Supabase bağlantısı yok! Config dosyasını kontrol edin.', 'error'); return; }

  const clientName = document.getElementById('clientName').value.trim();
  const projectName = document.getElementById('projectName').value.trim();
  const projectDesc = document.getElementById('projectDesc').value.trim();

  if (!clientName || !projectName) { showToast('Müşteri adı ve proje adı zorunludur!', 'error'); return; }

  // Disable form
  const btn = document.getElementById('uploadBtn');
  btn.disabled = true;
  btn.innerHTML = '⏳ Yükleniyor...';

  // Show progress
  const progressEl = document.getElementById('uploadProgress');
  const fillEl = document.getElementById('progressFill');
  const labelEl = document.getElementById('progressLabel');
  const percentEl = document.getElementById('progressPercent');
  progressEl.classList.add('active');

  try {
    // Generate unique project ID
    const projectId = 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

    labelEl.textContent = 'Dosya yükleniyor...';
    fillEl.style.width = '30%';
    percentEl.textContent = '30%';

    // Upload to Supabase Storage
    const filePath = `${projectId}/model.glb`;
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('models')
      .upload(filePath, selectedFile, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    fillEl.style.width = '70%';
    percentEl.textContent = '70%';
    labelEl.textContent = 'Kayıt ediliyor...';

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('models')
      .getPublicUrl(filePath);

    const modelUrl = urlData.publicUrl;

    // Save to Supabase Database
    const { error: dbError } = await supabaseClient
      .from('projects')
      .insert({
        id: projectId,
        client_name: clientName,
        project_name: projectName,
        description: projectDesc,
        model_url: modelUrl,
        file_name: selectedFile.name,
        file_size: selectedFile.size,
        view_count: 0,
        status: 'active'
      });

    if (dbError) throw dbError;

    fillEl.style.width = '100%';
    percentEl.textContent = '100%';
    labelEl.textContent = 'Tamamlandı!';

    // Reset form
    resetUploadForm();
    showToast(`✅ "${projectName}" başarıyla yüklendi!`, 'success');

    // Show link modal
    const viewerUrl = `${APP_CONFIG.viewerBaseUrl}/viewer.html?id=${projectId}`;
    showLinkModal(viewerUrl, clientName, projectName);

    // Reload projects
    loadProjects();

  } catch (err) {
    console.error('Upload error:', err);
    showToast('Yükleme başarısız: ' + (err.message || err.error || 'Bilinmeyen hata'), 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🚀</span> Yükle & Link Oluştur';
    progressEl.classList.remove('active');
    fillEl.style.width = '0%';
  }
}

function resetUploadForm() {
  selectedFile = null;
  document.getElementById('uploadForm').reset();
  document.getElementById('chosenFileName').style.display = 'none';
  document.querySelector('.drop-zone-icon').textContent = '📦';
  document.querySelector('.drop-zone-title').textContent = '3D Model Sürükle & Bırak';
}

// ── LOAD PROJECTS ──────────────────────────────
async function loadProjects() {
  if (!supabaseClient) return;

  try {
    const { data, error } = await supabaseClient
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    allProjects = data || [];
    renderProjects(allProjects);
    updateStats(allProjects);
  } catch (err) {
    console.error('Load error:', err);
    showToast('Projeler yüklenemedi: ' + (err.message || ''), 'error');
    renderProjects([]);
  }
}

function updateStats(projects) {
  const now = new Date();
  const thisMonth = projects.filter(p => {
    if (!p.created_at) return false;
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const totalViews = projects.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const active = projects.filter(p => p.status !== 'deleted').length;

  document.getElementById('statTotal').textContent = projects.length;
  document.getElementById('statViews').textContent = totalViews;
  document.getElementById('statThisMonth').textContent = thisMonth.length;
  document.getElementById('statActive').textContent = active;
}

function renderProjects(projects) {
  const grid = document.getElementById('projectsGrid');
  const empty = document.getElementById('emptyState');

  // Remove all cards but keep empty state
  const cards = grid.querySelectorAll('.project-card');
  cards.forEach(c => c.remove());

  if (projects.length === 0) {
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';

  projects.forEach(project => {
    const viewerUrl = `${APP_CONFIG.viewerBaseUrl}/viewer.html?id=${project.id}`;
    const date = project.created_at
      ? new Date(project.created_at).toLocaleDateString('tr-TR')
      : '-';
    const sizeMB = project.file_size ? (project.file_size / 1024 / 1024).toFixed(1) + ' MB' : '-';

    const card = document.createElement('div');
    card.className = 'project-card';
    card.dataset.projectId = project.id;
    card.innerHTML = `
      <div class="project-thumb">
        <div class="project-thumb-icon">🎠</div>
      </div>
      <div class="project-body">
        <div class="project-name" title="${escHtml(project.project_name)}">${escHtml(project.project_name)}</div>
        <div class="project-client"><span>👤</span>${escHtml(project.client_name)}</div>
        <div class="project-meta">
          <span>📅 ${date}</span>
          <span>💾 ${sizeMB}</span>
          <span>👁 ${project.view_count || 0}</span>
        </div>
        <div class="project-actions">
          <button class="btn btn-primary btn-sm" onclick="showProjectLink('${project.id}','${escHtml(project.client_name)}','${escHtml(project.project_name)}')">🔗 Link Al</button>
          <button class="btn btn-secondary btn-sm" onclick="openViewer('${project.id}')">👁 Önizle</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDelete('${project.id}','${escHtml(project.project_name)}')">🗑</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function filterProjects(query) {
  const q = query.toLowerCase();
  const filtered = allProjects.filter(p =>
    (p.project_name || '').toLowerCase().includes(q) ||
    (p.client_name || '').toLowerCase().includes(q)
  );
  renderProjects(filtered);
}

// ── LINK MODAL ──────────────────────────────────
function showLinkModal(url, clientName, projectName) {
  document.getElementById('generatedLink').value = url;
  document.getElementById('linkModalSubtitle').textContent = `${projectName} — ${clientName}`;
  document.getElementById('openLinkBtn').href = url;

  const waText = encodeURIComponent(
    `Merhaba ${clientName}! 🎠\n\nÖzel tasarımınızı 3D olarak inceleyebilirsiniz:\n${url}\n\n— ${APP_CONFIG.companyName}`
  );
  document.getElementById('whatsappBtn').onclick = () => {
    window.open(`https://wa.me/?text=${waText}`, '_blank');
  };

  openModal('linkModal');
}

function showProjectLink(projectId, clientName, projectName) {
  const url = `${APP_CONFIG.viewerBaseUrl}/viewer.html?id=${projectId}`;
  showLinkModal(url, clientName, projectName);
}

function openViewer(projectId) {
  const url = `${APP_CONFIG.viewerBaseUrl}/viewer.html?id=${projectId}`;
  window.open(url, '_blank');
}

function copyLink() {
  const val = document.getElementById('generatedLink').value;
  navigator.clipboard.writeText(val).then(() => {
    showToast('Link kopyalandı! 📋', 'success');
  });
}

// ── DELETE ──────────────────────────────────────
function confirmDelete(projectId, projectName) {
  pendingDeleteId = projectId;
  document.getElementById('deleteModalSubtitle').textContent = `"${projectName}" silinecek`;
  document.getElementById('confirmDeleteBtn').onclick = () => deleteProject(projectId);
  openModal('deleteModal');
}

async function deleteProject(projectId) {
  closeModal('deleteModal');
  showToast('Siliniyor...', 'info');

  try {
    // Delete from Storage
    try {
      await supabaseClient.storage.from('models').remove([`${projectId}/model.glb`]);
    } catch (storageErr) {
      console.warn('Storage delete warning:', storageErr);
    }

    // Delete from Database
    const { error } = await supabaseClient
      .from('projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;

    showToast('✅ Proje silindi.', 'success');
    loadProjects();
  } catch (err) {
    console.error('Delete error:', err);
    showToast('Silme işlemi başarısız: ' + (err.message || ''), 'error');
  }
}

// ── MODAL HELPERS ──────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('active');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Close modals on backdrop click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.classList.remove('active');
  });
});

// ── TOAST ──────────────────────────────────────
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── UTILS ──────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
