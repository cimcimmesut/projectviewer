// ================================================
// VIEWER PAGE — JavaScript (Supabase)
// ================================================

let supabaseClient = null;

// ── INIT ──────────────────────────────────────
async function initViewer() {
  // Apply company branding
  document.getElementById('loadingOrb').textContent = APP_CONFIG.companyEmoji;
  document.getElementById('viewerBrandBadge').textContent = APP_CONFIG.companyEmoji;
  document.getElementById('viewerBrandName').textContent = APP_CONFIG.companyName;
  document.title = APP_CONFIG.companyName + ' — 3D Görüntüleyici';

  // Get project ID from URL
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  if (!projectId) {
    showError();
    return;
  }

  // Init Supabase
  if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL') {
    showError('Supabase yapılandırılmamış.');
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    await loadProject(projectId);
  } catch (err) {
    console.error('Init error:', err);
    showError();
  }
}

// ── LOAD PROJECT ────────────────────────────────
async function loadProject(projectId) {
  setLoadingText('Proje bilgileri alınıyor...');
  setLoadingProgress(15);

  try {
    const { data: project, error } = await supabaseClient
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error || !project) {
      showError();
      return;
    }

    // Update loading text
    setLoadingText(`"${project.project_name}" yükleniyor...`);
    setLoadingProgress(40);

    // Setup model viewer
    const modelViewer = document.getElementById('modelViewer');
    modelViewer.src = project.model_url;

    // Fill in project info
    document.getElementById('viewerProjectName').textContent = project.project_name;
    document.getElementById('clientNameText').textContent = project.client_name;

    if (project.description) {
      document.getElementById('viewerDesc').textContent = project.description;
    }

    // model-viewer events
    modelViewer.addEventListener('progress', (e) => {
      const pct = Math.round(e.detail.totalProgress * 100);
      const mappedPct = 40 + Math.round(pct * 0.55); // 40–95%
      setLoadingProgress(mappedPct);
      if (pct > 50) setLoadingText(`Model yükleniyor... %${pct}`);
    });

    modelViewer.addEventListener('load', () => {
      setLoadingProgress(100);
      setLoadingText('Hazır!');

      setTimeout(() => {
        // Hide loading
        document.getElementById('viewerLoading').classList.add('hidden');

        // Show viewer
        modelViewer.style.display = 'block';
        document.getElementById('viewerHeader').style.display = 'flex';
        document.getElementById('viewerFooter').style.display = 'block';

        // Check AR support
        if (!modelViewer.canActivateAR) {
          document.getElementById('arButton').style.display = 'none';
        }

        // Increment view count (fire and forget)
        incrementViewCount(projectId);

      }, 500);
    });

    modelViewer.addEventListener('error', () => {
      showError('3D model yüklenirken hata oluştu.');
    });

  } catch (err) {
    console.error('Load project error:', err);
    showError();
  }
}

// ── AR ────────────────────────────────────────
function activateAR() {
  const modelViewer = document.getElementById('modelViewer');
  if (modelViewer.canActivateAR) {
    modelViewer.activateAR();
  } else {
    showToast('Bu cihaz AR özelliğini desteklemiyor.', 'warning');
  }
}

// ── VIEW COUNT ────────────────────────────────
async function incrementViewCount(projectId) {
  try {
    await supabaseClient.rpc('increment_view_count', { project_id: projectId });
  } catch (err) {
    // Silently fail — not critical
    console.warn('View count update failed:', err);
  }
}

// ── HELPERS ──────────────────────────────────
function setLoadingText(text) {
  document.getElementById('loadingTitle').textContent = text;
}

function setLoadingProgress(pct) {
  document.getElementById('loadingBarFill').style.width = pct + '%';
}

function showError(msg) {
  document.getElementById('viewerLoading').classList.add('hidden');
  const errorEl = document.getElementById('viewerError');
  errorEl.classList.add('active');
  if (msg) {
    errorEl.querySelector('p').textContent = msg;
  }
}

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ── START ─────────────────────────────────────
initViewer();
