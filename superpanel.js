(() => {
  'use strict';

  const PANEL_KEY = 'pi-super-panel-v1';
  const MUT_KEY = 'mutDataFullV9';
  const MARKETING_KEY = 'pi_panel_research_v2';
  const PAGE_SIZE = 10;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const icon = (name, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const fmt = value => new Intl.NumberFormat('id-ID').format(Number(value) || 0);
  const decimal = (value, digits = 1) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: digits }).format(Number(value) || 0);
  const uid = prefix => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const clone = value => JSON.parse(JSON.stringify(value));
  const sum = (rows, key) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0);
  const debounce = (fn, wait = 180) => { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); }; };
  const safeJSON = (key, fallback = null) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (_) { return fallback; } };
  const initials = name => String(name || 'User').trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const titleCase = value => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
  const formatDate = (value, withTime = false) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return esc(value);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}) });
  };
  const relativeTime = value => {
    const time = new Date(value).getTime();
    if (!time) return 'Baru saja';
    const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} jam lalu`;
    const days = Math.floor(hours / 24);
    return days < 7 ? `${days} hari lalu` : formatDate(value);
  };
  const download = (content, filename, type = 'text/plain;charset=utf-8') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
  };
  const csv = rows => {
    if (!rows.length) return '';
    const headers = [...new Set(rows.flatMap(row => Object.keys(row)))];
    const quote = value => `"${String(value ?? '').replace(/"/g, '""')}"`;
    return '\ufeff' + [headers.map(quote).join(','), ...rows.map(row => headers.map(key => quote(row[key])).join(','))].join('\r\n');
  };
  const safeUrl = value => {
    try { const url = new URL(value, window.location.href); return ['http:', 'https:', 'file:'].includes(url.protocol) ? url.href : '#'; }
    catch (_) { return '#'; }
  };

  const routeMeta = {
    dashboard: ['Ringkasan', 'COMMAND CENTER'],
    modules: ['Semua Modul', 'ECOSYSTEM'],
    mut: ['Data Uji Tanah', 'OPERASIONAL'],
    kios: ['Direktori Kios', 'OPERASIONAL'],
    users: ['Pengguna & Akses', 'ADMINISTRASI'],
    audit: ['Log Aktivitas', 'ADMINISTRASI'],
    data: ['Data & Pengaturan', 'ADMINISTRASI']
  };

  const seedPanel = () => {
    const now = Date.now();
    const ago = minutes => new Date(now - minutes * 60000).toISOString();
    return {
      version: 1,
      users: [
        { id: 'u01', name: 'Andi Darmawan', email: 'andi.d@pupuk-indonesia.com', role: 'Super Admin', unit: 'PI Holding', status: 'active', lastLogin: ago(18) },
        { id: 'u02', name: 'Sari Wulandari', email: 'sari.w@pupuk-indonesia.com', role: 'Admin Operasional', unit: 'Regional Indonesia Timur', status: 'active', lastLogin: ago(42) },
        { id: 'u03', name: 'Ahmad Subagja', email: 'ahmad.s@pupuk-indonesia.com', role: 'Petugas MUT', unit: 'Tim Agronomis', status: 'active', lastLogin: ago(75) },
        { id: 'u04', name: 'Budi Santoso', email: 'budi.s@pupuk-indonesia.com', role: 'Petugas MUT', unit: 'Tim Agronomis', status: 'active', lastLogin: ago(130) },
        { id: 'u05', name: 'Rina Kurnia', email: 'rina.k@pupuk-indonesia.com', role: 'Analis Data', unit: 'Pemasaran Regional', status: 'active', lastLogin: ago(190) },
        { id: 'u06', name: 'Bagus Hermawan', email: 'bagus.h@pupuk-indonesia.com', role: 'Admin Operasional', unit: 'Distribusi & Logistik', status: 'active', lastLogin: ago(280) },
        { id: 'u07', name: 'Maya Anggraini', email: 'maya.a@pupuk-indonesia.com', role: 'Auditor', unit: 'SPI Regional', status: 'active', lastLogin: ago(1440) },
        { id: 'u08', name: 'Hendra Wijaya', email: 'hendra.w@pupuk-indonesia.com', role: 'Viewer', unit: 'Kios & Jaringan', status: 'suspended', lastLogin: ago(4320) }
      ],
      audit: [
        { id: uid('log'), ts: ago(12), user: 'Sari Wulandari', module: 'Marketing', action: 'Memperbarui realisasi serapan PSO wilayah Sulawesi Tenggara', level: 'info' },
        { id: uid('log'), ts: ago(28), user: 'Ahmad Subagja', module: 'MUT', action: 'Menambahkan hasil uji tanah MUT-076 untuk petani di Karawang', level: 'success' },
        { id: uid('log'), ts: ago(51), user: 'Rina Kurnia', module: 'Kios', action: 'Mengekspor direktori kios wilayah Sulawesi Selatan', level: 'info' },
        { id: uid('log'), ts: ago(83), user: 'Andi Darmawan', module: 'Pengguna', action: 'Memperbarui hak akses role Analis Data', level: 'warning' },
        { id: uid('log'), ts: ago(118), user: 'Budi Santoso', module: 'MUT', action: 'Memvalidasi 12 sampel uji tanah Kecamatan Cikampek', level: 'success' },
        { id: uid('log'), ts: ago(175), user: 'Sistem', module: 'Data', action: 'Sinkronisasi direktori kios selesai; 1.750 entri berhasil dimuat', level: 'success' },
        { id: uid('log'), ts: ago(245), user: 'Maya Anggraini', module: 'Audit', action: 'Mengunduh log aktivitas untuk pemeriksaan berkala', level: 'info' },
        { id: uid('log'), ts: ago(360), user: 'Sistem', module: 'Marketing', action: 'Data harian gudang berhasil disinkronkan dari penyimpanan lokal', level: 'info' }
      ],
      notifications: [
        { id: uid('notif'), title: 'Data kios siap digunakan', text: 'Dataset 1.750 kios dan pelaku usaha berhasil dimuat.', ts: ago(175), read: false, icon: 'pin' },
        { id: uid('notif'), title: 'Verifikasi data diperlukan', text: 'Sebagian data marketing masih berstatus estimasi atau data lama.', ts: ago(240), read: false, icon: 'alert' },
        { id: uid('notif'), title: 'Backup berkala', text: 'Unduh backup JSON untuk mengamankan perubahan lokal Anda.', ts: ago(1440), read: true, icon: 'database' }
      ],
      settings: { theme: 'light', compact: false, autoSync: true, notifications: true }
    };
  };

  const buildMutFallback = () => {
    const districts = ['Karawang Barat', 'Karawang Timur', 'Klari', 'Telukjambe Timur', 'Telukjambe Barat', 'Cikampek', 'Rengasdengklok', 'Pangkalan', 'Purwasari', 'Jatisari', 'Lemahabang', 'Tirtamulya', 'Banyusari', 'Cilebar', 'Tempuran', 'Tirtajaya', 'Batujaya', 'Pakisjaya', 'Cibuaya', 'Pedes', 'Krawang Wetan', 'Ciampel', 'Kutawaluya', 'Jayakerta', 'Majalaya'];
    const farmers = ['Bpk. Sugeng', 'Ibu Karsih', 'Bpk. Supandi', 'Bpk. Dadi Mulyadi', 'Kelompok Tani Jaya', 'Bpk. Endang', 'Bpk. Rasim', 'Ibu Tati', 'Bpk. Ace Suhendar', 'Bpk. Rustam'];
    const villages = ['Sukamakmur', 'Walahar', 'MargaKaya', 'Anggadita', 'Cibalongsari', 'Tanjungpura'];
    const crops = ['Padi Sawah', 'Jagung', 'Singkong', 'Kedelai', 'Bawang Merah', 'Cabai'];
    const officers = ['Ahmad Subagja, S.P. (Agronomis MUT)', 'Budi Santoso, S.P. (Agronomis MUT)', 'Candra Wijaya, S.P. (Agronomis MUT)'];
    const statuses = ['Rendah', 'Sedang', 'Tinggi'];
    const organic = ['Rendah (< 2.0%)', 'Sedang (2.0 - 3.0%)', 'Tinggi (> 3.0%)'];
    const rows = [];
    let counter = 1;
    districts.forEach((district, districtIndex) => {
      for (let index = 1; index <= 3; index += 1) {
        const day = String((counter % 28) + 1).padStart(2, '0');
        rows.push({
          id: `MUT-${String(counter).padStart(3, '0')}`,
          tgl: `2026-09-${day}`,
          petani: farmers[(counter + index) % farmers.length],
          petugas: officers[(counter + districtIndex) % officers.length],
          kontak: `0812${String(10000000 + counter * 7919).slice(0, 8)}`,
          prov: 'Jawa Barat', kab: 'Karawang', kec: district,
          desa: `Desa ${villages[index % villages.length]}`,
          komoditas: crops[(counter + index) % crops.length],
          ph: Number((4.8 + ((counter * 7) % 28) / 10).toFixed(1)),
          corganik: organic[(counter + index) % organic.length],
          n: statuses[(counter * 2) % statuses.length],
          p: statuses[(counter * 3) % statuses.length],
          k: statuses[(counter * 5) % statuses.length],
          lat: (-6.25 - districtIndex * .005).toFixed(4),
          lng: (107.3 + districtIndex * .005).toFixed(4),
          catatan: 'Sampel diambil melalui unit Mobil Uji Tanah (MUT).'
        });
        counter += 1;
      }
    });
    return rows;
  };

  const savedPanel = safeJSON(PANEL_KEY);
  const state = {
    route: 'dashboard',
    panel: savedPanel && Array.isArray(savedPanel.users) ? savedPanel : seedPanel(),
    mut: [],
    kios: [],
    kiosLoaded: false,
    kiosError: '',
    marketing: safeJSON(MARKETING_KEY),
    ui: {
      mut: { q: '', status: '', district: '', page: 1 },
      kios: { q: '', province: '', type: '', page: 1 },
      users: { q: '', tab: 'users' },
      audit: { q: '', module: '' }
    }
  };

  const storedMut = safeJSON(MUT_KEY);
  state.mut = Array.isArray(storedMut) ? storedMut : buildMutFallback();
  if (!Array.isArray(storedMut)) { try { localStorage.setItem(MUT_KEY, JSON.stringify(state.mut)); } catch (_) {} }

  const persistPanel = () => { try { localStorage.setItem(PANEL_KEY, JSON.stringify(state.panel)); } catch (_) { toast('Penyimpanan browser penuh atau tidak tersedia.', 'error'); } };
  const persistMut = () => { try { localStorage.setItem(MUT_KEY, JSON.stringify(state.mut)); } catch (_) { toast('Gagal menyimpan data MUT.', 'error'); } };
  const logAudit = (module, action, level = 'info') => {
    state.panel.audit.unshift({ id: uid('log'), ts: new Date().toISOString(), user: 'Andi Darmawan', module, action, level });
    state.panel.audit = state.panel.audit.slice(0, 500);
    persistPanel();
  };

  const modules = () => [
    { id: 'mut-app', name: 'Pelaporan MUT', desc: 'Input hasil uji tanah, analisis hara, dan rekomendasi pemupukan presisi.', url: 'index.html', icon: 'flask', color: '', status: 'Operasional', stats: [[fmt(state.mut.length), 'Data uji'], [new Set(state.mut.map(row => row.kec)).size, 'Kecamatan']], tag: 'Aplikasi internal' },
    { id: 'marketing-app', name: 'Panel Marketing', desc: 'Monitoring stok, penjualan, MAKMUR, sebaran gudang, dan serapan PSO.', url: 'marketing.html', icon: 'chart', color: 'blue', status: 'Operasional', stats: [[state.marketing ? Object.keys(state.marketing).filter(key => Array.isArray(state.marketing[key])).length : 6, 'Kelompok data'], ['6', 'Periode']], tag: 'Aplikasi internal' },
    { id: 'kios-app', name: 'Peta & Direktori Kios', desc: 'Telusuri sebaran kios, toko tani, distributor, dan pelaku usaha Indonesia Timur.', url: 'peta.html', icon: 'pin', color: 'amber', status: state.kiosError ? 'Perlu perhatian' : 'Operasional', stats: [[state.kiosLoaded ? fmt(state.kios.length) : '1.750', 'Entri'], [new Set(state.kios.map(row => row['Provinsi'])).size || '—', 'Provinsi']], tag: 'Peta interaktif' },
    { id: 'powerbi-app', name: 'Executive Analytics', desc: 'Visualisasi kinerja perusahaan bergaya Power BI dengan 45 grafik analitis.', url: 'powerbi.html', icon: 'grid', color: 'purple', status: 'Operasional', stats: [['45', 'Visualisasi'], ['12', 'Bulan data']], tag: 'Business intelligence' }
  ];
  const internalApps = [
    { name: 'NWBC / SAP', desc: 'ERP & transaksi', url: 'https://hcservices.pupuk-indonesia.com/nwbc', icon: 'database', color: 'blue' },
    { name: 'Digital Office', desc: 'Dokumen & approval', url: 'https://dof.pupuk-indonesia.com/Account/Login', icon: 'layers', color: '' },
    { name: 'SISTRO', desc: 'Transportasi & gudang', url: 'https://sistro.pupuk-indonesia.com/', icon: 'package', color: 'amber' },
    { name: 'PPTS', desc: 'Penerima subsidi', url: 'https://ppts.pupuk-indonesia.com/login', icon: 'users', color: 'purple' }
  ];

  const marketingSummary = () => {
    const rows = Array.isArray(state.marketing?.serapan) ? state.marketing.serapan : [];
    const preferred = rows.find(row => /^NASIONAL 2026/i.test(row.provinsi || '')) || rows.find(row => Number(row.alokasi_ton) > 0 && Number(row.realisasi_ton) >= 0);
    const allocation = Number(preferred?.alokasi_ton) || 9845686;
    const realization = Number(preferred?.realisasi_ton) || 6934553;
    return { label: preferred?.provinsi || 'NASIONAL 2026', allocation, realization, percent: allocation ? Math.min(100, realization / allocation * 100) : 0, source: preferred ? 'Data marketing lokal' : 'Data rujukan proyek' };
  };

  const getMetrics = () => {
    const nutrientRows = state.mut.flatMap(row => [row.n, row.p, row.k]);
    const nutrients = ['Rendah', 'Sedang', 'Tinggi'].map(label => ({ label, value: nutrientRows.filter(value => value === label).length }));
    const provinces = Object.entries(state.kios.reduce((acc, row) => { const key = row['Provinsi'] || 'Tidak diketahui'; acc[key] = (acc[key] || 0) + 1; return acc; }, {})).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
    return {
      districts: new Set(state.mut.map(row => row.kec).filter(Boolean)).size,
      farmers: new Set(state.mut.map(row => row.petani).filter(Boolean)).size,
      avgPh: state.mut.length ? state.mut.reduce((total, row) => total + (Number(row.ph) || 0), 0) / state.mut.length : 0,
      nutrients,
      provinces,
      activeUsers: state.panel.users.filter(user => user.status === 'active').length,
      marketing: marketingSummary()
    };
  };

  const pageHeading = (title, subtitle, actions = '') => `<div class="page-heading"><div><h1>${title}</h1><p>${subtitle}</p></div>${actions ? `<div class="heading-actions">${actions}</div>` : ''}</div>`;
  const button = (label, action, iconName = '', style = '', extra = '') => `<button class="button ${style}" data-action="${action}" ${extra}>${iconName ? icon(iconName) : ''}${label}</button>`;
  const moduleBadge = module => {
    const colors = { MUT: '', Kios: 'amber', Marketing: 'blue', Pengguna: 'purple', Audit: 'neutral', Data: 'neutral', Sistem: 'neutral' };
    return `<span class="badge no-dot ${colors[module] ?? ''}">${esc(module)}</span>`;
  };
  const emptyState = (title, text, iconName = 'search') => `<div class="empty-state"><div class="empty-state-icon">${icon(iconName)}</div><h3>${title}</h3><p>${text}</p></div>`;

  const lineChart = rows => {
    const grouped = rows.reduce((acc, row) => { const key = row.tgl || 'Tanpa tanggal'; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
    let points = Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    if (points.length > 14) points = points.slice(-14);
    if (!points.length) points = [['Belum ada data', 0]];
    const width = 700, height = 235, left = 38, right = 16, top = 18, bottom = 36;
    const max = Math.max(...points.map(point => point[1]), 4);
    const roundedMax = Math.ceil(max / 2) * 2;
    const x = index => left + index * ((width - left - right) / Math.max(1, points.length - 1));
    const y = value => top + (height - top - bottom) * (1 - value / roundedMax);
    const coords = points.map((point, index) => [x(index), y(point[1])]);
    const path = coords.map((point, index) => `${index ? 'L' : 'M'}${point[0].toFixed(1)},${point[1].toFixed(1)}`).join(' ');
    const area = `${path} L${coords.at(-1)[0]},${height - bottom} L${coords[0][0]},${height - bottom} Z`;
    const grid = Array.from({ length: 5 }, (_, index) => {
      const value = roundedMax - index * roundedMax / 4;
      const gy = top + index * (height - top - bottom) / 4;
      return `<line class="grid-line" x1="${left}" y1="${gy}" x2="${width - right}" y2="${gy}"/><text class="axis-label" x="${left - 9}" y="${gy + 3}" text-anchor="end">${decimal(value, 0)}</text>`;
    }).join('');
    const labels = points.map((point, index) => {
      if (points.length > 8 && index % Math.ceil(points.length / 7) !== 0 && index !== points.length - 1) return '';
      const date = new Date(`${point[0]}T00:00:00`);
      const label = Number.isNaN(date.getTime()) ? point[0] : date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `<text class="axis-label" x="${x(index)}" y="${height - 10}" text-anchor="middle">${esc(label)}</text>`;
    }).join('');
    const dots = points.map((point, index) => `<circle class="point" cx="${x(index)}" cy="${y(point[1])}" r="3.5"><title>${esc(point[0])}: ${point[1]} pengujian</title></circle>`).join('');
    return `<svg class="line-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Grafik tren aktivitas uji tanah"><defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c9a70" stop-opacity=".23"/><stop offset="100%" stop-color="#2c9a70" stop-opacity="0"/></linearGradient></defs>${grid}<path class="area" d="${area}"/><path class="line" d="${path}"/>${dots}${labels}</svg>`;
  };

  const donutChart = items => {
    const total = items.reduce((acc, item) => acc + item.value, 0) || 1;
    const colors = ['#d56b5f', '#d9a13b', '#26916a'];
    const radius = 48, circumference = 2 * Math.PI * radius;
    let offset = 0;
    const circles = items.map((item, index) => {
      const length = item.value / total * circumference;
      const circle = `<circle cx="70" cy="70" r="${radius}" stroke="${colors[index]}" stroke-dasharray="${Math.max(0, length - 2)} ${circumference - Math.max(0, length - 2)}" stroke-dashoffset="${-offset}"><title>${item.label}: ${item.value}</title></circle>`;
      offset += length;
      return circle;
    }).join('');
    return `<div class="donut-layout"><div class="donut"><svg viewBox="0 0 140 140"><circle cx="70" cy="70" r="${radius}" stroke="var(--surface-3)"/>${circles}</svg><div class="donut-center"><strong>${fmt(total)}</strong><span>indikator</span></div></div><div class="donut-legend">${items.map((item, index) => `<div class="donut-legend-row"><span><i style="background:${colors[index]}"></i>${item.label}</span><strong>${fmt(item.value)}</strong><small>${decimal(item.value / total * 100)}%</small></div>`).join('')}</div></div>`;
  };

  const activityHTML = items => items.map(item => {
    const color = { MUT: '', Marketing: 'blue', Kios: 'amber', Pengguna: 'purple' }[item.module] || '';
    const iconName = { MUT: 'flask', Marketing: 'chart', Kios: 'pin', Pengguna: 'users', Audit: 'history', Data: 'database' }[item.module] || 'info';
    return `<div class="activity-item"><div class="activity-icon ${color}">${icon(iconName)}</div><div class="activity-content"><p><strong>${esc(item.user)}</strong> · ${esc(item.action)}</p><div class="activity-meta">${moduleBadge(item.module)}<span>${icon('clock')}${relativeTime(item.ts)}</span></div></div></div>`;
  }).join('');

  function renderDashboard() {
    const metrics = getMetrics();
    const pso = metrics.marketing;
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const provinceBars = metrics.provinces.slice(0, 5);
    const maxProvince = Math.max(...provinceBars.map(item => item.value), 1);
    const health = [
      { name: 'Pelaporan MUT', icon: 'flask', color: '', meta: `${fmt(state.mut.length)} record`, latency: 'Lokal' },
      { name: 'Marketing & Distribusi', icon: 'chart', color: 'blue', meta: state.marketing ? 'Data browser' : 'Data bawaan', latency: 'Lokal' },
      { name: 'Direktori Kios', icon: 'pin', color: 'amber', meta: state.kiosLoaded ? `${fmt(state.kios.length)} titik` : 'Memuat dataset', latency: state.kiosError ? 'Cek' : 'JSON' },
      { name: 'Executive Analytics', icon: 'grid', color: 'purple', meta: '45 visualisasi', latency: 'Lokal' }
    ];
    $('#page').innerHTML = `
      <section class="hero">
        <div class="hero-content"><div class="hero-eyebrow"><span></span>${esc(today).toUpperCase()}</div><h2>Selamat datang kembali, Andi.</h2><p>Pantau operasional, kualitas data, dan seluruh modul Pupuk Indonesia dari satu pusat kendali.</p></div>
        <div class="hero-actions"><a class="button" href="peta.html" target="_blank" rel="noopener">${icon('pin')}Buka peta</a>${button('Input uji tanah', 'add-mut', 'plus', 'button-primary')}</div>
      </section>
      <div class="info-banner">${icon('info')}<p><strong>Catatan kualitas data.</strong> Sebagian data riset marketing berstatus estimasi atau belum diverifikasi. Gunakan status sumber pada modul terkait sebelum pengambilan keputusan.</p><a class="banner-action" href="marketing.html" target="_blank" rel="noopener">Periksa data →</a></div>
      <section class="kpi-grid">
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Total Uji Tanah</span><span class="kpi-icon">${icon('flask')}</span></div><div class="kpi-value">${fmt(state.mut.length)}</div><div class="kpi-foot"><span class="trend">${metrics.districts}</span><span>kecamatan tercakup</span></div></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Kios & Mitra Tani</span><span class="kpi-icon amber">${icon('pin')}</span></div><div class="kpi-value">${state.kiosLoaded ? fmt(state.kios.length) : '…'}</div><div class="kpi-foot"><span class="trend">${metrics.provinces.length || '—'}</span><span>provinsi dalam direktori</span></div></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Serapan PSO</span><span class="kpi-icon blue">${icon('package')}</span></div><div class="kpi-value">${decimal(pso.percent)}%</div><div class="kpi-foot"><span>${decimal(pso.realization / 1000000, 2)} jt ton terealisasi</span></div></article>
        <article class="kpi-card"><div class="kpi-top"><span class="kpi-label">Pengguna Aktif</span><span class="kpi-icon purple">${icon('users')}</span></div><div class="kpi-value">${metrics.activeUsers}</div><div class="kpi-foot"><span class="trend">${state.panel.users.length}</span><span>total akun terdaftar</span></div></article>
      </section>
      <section class="dashboard-grid">
        <article class="card"><header class="card-header"><div class="card-title"><h3>Tren Aktivitas Uji Tanah</h3><p>Jumlah pengujian berdasarkan tanggal sampel</p></div><div class="chart-legend"><span><i class="legend-dot"></i>Pengujian</span></div></header><div class="card-body chart-wrap">${lineChart(state.mut)}</div></article>
        <article class="card"><header class="card-header"><div class="card-title"><h3>Realisasi Serapan PSO</h3><p>${esc(pso.label)} · ${esc(pso.source)}</p></div><span class="badge blue">2026</span></header><div class="card-body gauge-layout"><div class="gauge"><svg viewBox="0 0 140 140"><circle class="gauge-track" cx="70" cy="70" r="56"/><circle class="gauge-value" cx="70" cy="70" r="56" stroke-dasharray="${(pso.percent / 100 * 351.86).toFixed(2)} 351.86"/></svg><div class="gauge-copy"><strong>${decimal(pso.percent)}%</strong><span>realisasi alokasi</span></div></div><div class="gauge-meta"><span>Realisasi<br><strong>${fmt(pso.realization)} ton</strong></span><span style="text-align:right">Alokasi<br><strong>${fmt(pso.allocation)} ton</strong></span></div></div></article>
      </section>
      <section class="dashboard-grid equal">
        <article class="card"><header class="card-header"><div class="card-title"><h3>Komposisi Status Hara</h3><p>Agregat indikator N, P, dan K pada seluruh sampel</p></div><a class="card-link" href="#/mut">Lihat data${icon('arrow')}</a></header><div class="card-body">${donutChart(metrics.nutrients)}</div></article>
        <article class="card"><header class="card-header"><div class="card-title"><h3>Sebaran Kios per Provinsi</h3><p>Lima provinsi dengan entri direktori terbanyak</p></div><a class="card-link" href="#/kios">Direktori${icon('arrow')}</a></header><div class="card-body">${state.kiosLoaded ? `<div class="bar-list">${provinceBars.map(item => `<div><div class="bar-row-top"><span>${esc(item.label)}</span><strong>${fmt(item.value)}</strong></div><div class="bar-track"><div class="bar-fill" style="width:${item.value / maxProvince * 100}%"></div></div></div>`).join('')}</div>` : `<div class="page-loading" style="min-height:180px"><span class="loading-spinner"></span><p>Memuat sebaran kios...</p></div>`}</div></article>
      </section>
      <section class="dashboard-grid equal">
        <article class="card"><header class="card-header"><div class="card-title"><h3>Aktivitas Terbaru</h3><p>Jejak aktivitas lintas modul</p></div><a class="card-link" href="#/audit">Semua aktivitas${icon('arrow')}</a></header><div class="card-body"><div class="activity-list">${activityHTML(state.panel.audit.slice(0, 5))}</div></div></article>
        <article class="card"><header class="card-header"><div class="card-title"><h3>Status Modul</h3><p>Ketersediaan aplikasi dan sumber data lokal</p></div><a class="card-link" href="#/modules">Semua modul${icon('arrow')}</a></header><div class="card-body"><div class="module-health">${health.map(item => `<div class="health-row"><div class="health-name"><span class="module-mini-icon ${item.color}">${icon(item.icon)}</span><strong>${item.name}</strong></div><span>${item.meta}</span><span class="badge ${state.kiosError && item.name === 'Direktori Kios' ? 'red' : ''}">${state.kiosError && item.name === 'Direktori Kios' ? 'Perlu cek' : 'Siap'}</span><span class="health-latency">${item.latency}</span></div>`).join('')}</div></div></article>
      </section>`;
  }

  function renderModules() {
    const apps = modules();
    $('#page').innerHTML = `${pageHeading('Ekosistem Aplikasi', 'Akses seluruh aplikasi operasional dan analitis dari satu tempat.', button('Buka direktori', 'go-kios', 'pin'))}
      <div class="module-section-title"><h2>Aplikasi Operasional</h2><span>${apps.length} modul terhubung</span></div>
      <section class="module-grid">${apps.map(app => `<article class="module-card"><div class="module-card-top"><span class="module-icon ${app.color}">${icon(app.icon)}</span><span class="badge ${app.status === 'Operasional' ? '' : 'amber'}">${app.status}</span></div><h3>${app.name}</h3><p>${app.desc}</p><div class="module-stats">${app.stats.map(stat => `<div><strong>${stat[0]}</strong><span>${stat[1]}</span></div>`).join('')}</div><div class="module-card-footer"><small>${app.tag}</small><a class="button button-small" href="${app.url}" target="_blank" rel="noopener">Buka modul${icon('external')}</a></div></article>`).join('')}</section>
      <div class="module-section-title"><h2>Sistem Internal Perusahaan</h2><span>Akses melalui autentikasi masing-masing sistem</span></div>
      <section class="internal-apps">${internalApps.map(app => `<a class="internal-app" href="${app.url}" target="_blank" rel="noopener"><span class="module-mini-icon ${app.color}">${icon(app.icon)}</span><div><strong>${app.name}</strong><span>${app.desc}</span></div>${icon('external')}</a>`).join('')}</section>
      <div class="info-banner" style="margin-top:18px;margin-bottom:0">${icon('shield')}<p><strong>Akses aman.</strong> Sistem eksternal dibuka di tab baru. Super Panel tidak menyimpan maupun meminta kredensial sistem lain.</p></div>`;
  }

  const filteredMut = () => {
    const { q, status, district } = state.ui.mut;
    const query = q.toLowerCase().trim();
    return state.mut.filter(row => {
      const haystack = [row.id, row.petani, row.petugas, row.kec, row.desa, row.komoditas, row.kab].join(' ').toLowerCase();
      return (!query || haystack.includes(query)) && (!status || [row.n, row.p, row.k].includes(status)) && (!district || row.kec === district);
    }).sort((a, b) => String(b.tgl).localeCompare(String(a.tgl)) || String(a.id).localeCompare(String(b.id)));
  };
  const nutrient = (letter, value) => `<span class="nutrient ${value === 'Rendah' ? 'low' : value === 'Sedang' ? 'medium' : ''}" title="${letter}: ${esc(value)}">${letter}</span>`;

  const pagination = (total, current, action) => {
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(current, pages);
    const start = total ? (page - 1) * PAGE_SIZE + 1 : 0;
    const end = Math.min(page * PAGE_SIZE, total);
    const numbers = [];
    const from = Math.max(1, Math.min(page - 2, pages - 4));
    for (let value = from; value <= Math.min(pages, from + 4); value += 1) numbers.push(value);
    return `<div class="pagination"><span>Menampilkan ${start}–${end} dari ${fmt(total)} data</span><div class="pagination-buttons"><button class="page-button" data-action="${action}" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>‹</button>${numbers.map(value => `<button class="page-button ${value === page ? 'active' : ''}" data-action="${action}" data-page="${value}">${value}</button>`).join('')}<button class="page-button" data-action="${action}" data-page="${page + 1}" ${page >= pages ? 'disabled' : ''}>›</button></div></div>`;
  };

  function renderMut() {
    const metrics = getMetrics();
    const rows = filteredMut();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    state.ui.mut.page = Math.min(state.ui.mut.page, pages);
    const pageRows = rows.slice((state.ui.mut.page - 1) * PAGE_SIZE, state.ui.mut.page * PAGE_SIZE);
    const districts = [...new Set(state.mut.map(row => row.kec).filter(Boolean))].sort();
    const lowCount = metrics.nutrients.find(item => item.label === 'Rendah')?.value || 0;
    $('#page').innerHTML = `${pageHeading('Data Uji Tanah', 'Kelola hasil pemeriksaan MUT yang digunakan bersama aplikasi Pelaporan MUT.', `${button('Ekspor CSV', 'export-mut', 'download')}${button('Tambah Data', 'add-mut', 'plus', 'button-primary')}`)}
      <section class="summary-strip"><div class="summary-item"><span>Total sampel</span><strong>${fmt(state.mut.length)}</strong><small>titik uji</small></div><div class="summary-item"><span>Petani / kelompok</span><strong>${fmt(metrics.farmers)}</strong><small>entitas</small></div><div class="summary-item"><span>Rata-rata pH</span><strong>${decimal(metrics.avgPh, 2)}</strong><small>dari ${state.mut.length} sampel</small></div><div class="summary-item"><span>Indikator hara rendah</span><strong>${fmt(lowCount)}</strong><small>N, P, K</small></div></section>
      <section class="card"><div class="toolbar"><div class="search-field">${icon('search')}<input class="input" id="mutSearch" value="${esc(state.ui.mut.q)}" placeholder="Cari ID, petani, desa, atau komoditas..." aria-label="Cari data uji tanah"></div><select class="select" id="mutStatus" aria-label="Filter status hara"><option value="">Semua status hara</option>${['Rendah', 'Sedang', 'Tinggi'].map(value => `<option ${state.ui.mut.status === value ? 'selected' : ''}>${value}</option>`).join('')}</select><select class="select" id="mutDistrict" aria-label="Filter kecamatan"><option value="">Semua kecamatan</option>${districts.map(value => `<option value="${esc(value)}" ${state.ui.mut.district === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select><span class="result-count">${fmt(rows.length)} hasil</span></div>
      <div class="table-wrap">${pageRows.length ? `<table><thead><tr><th>ID / Tanggal</th><th>Petani</th><th>Lokasi</th><th>Komoditas</th><th>pH</th><th>Hara N · P · K</th><th style="text-align:right">Aksi</th></tr></thead><tbody>${pageRows.map(row => `<tr><td><div class="cell-primary"><span class="id-code">${esc(row.id)}</span><span>${formatDate(row.tgl)}</span></div></td><td><div class="cell-primary"><strong>${esc(row.petani)}</strong><span>${esc(String(row.petugas || '').split('(')[0])}</span></div></td><td class="cell-location"><strong>${esc(row.kec)}</strong><span>${esc(row.desa)} · ${esc(row.kab)}</span></td><td>${esc(row.komoditas)}</td><td><strong>${decimal(row.ph, 1)}</strong></td><td><div class="nutrient-group">${nutrient('N', row.n)}${nutrient('P', row.p)}${nutrient('K', row.k)}</div></td><td><div class="table-actions"><button class="icon-button" data-action="view-mut" data-id="${esc(row.id)}" title="Lihat detail">${icon('eye')}</button><button class="icon-button" data-action="edit-mut" data-id="${esc(row.id)}" title="Edit">${icon('edit')}</button><button class="icon-button danger" data-action="delete-mut" data-id="${esc(row.id)}" title="Hapus">${icon('trash')}</button></div></td></tr>`).join('')}</tbody></table>` : emptyState('Data tidak ditemukan', 'Ubah kata kunci atau filter untuk melihat data lainnya.', 'flask')}</div>${pagination(rows.length, state.ui.mut.page, 'mut-page')}</section>`;
  }

  const filteredKios = () => {
    const { q, province, type } = state.ui.kios;
    const query = q.toLowerCase().trim();
    return state.kios.map((row, index) => ({ row, index })).filter(({ row }) => {
      const haystack = [row['Nama Usaha'], row['Alamat'], row['Kecamatan'], row['Kabupaten/Kota'], row['Provinsi'], row['Telepon']].join(' ').toLowerCase();
      return (!query || haystack.includes(query)) && (!province || row['Provinsi'] === province) && (!type || row['Tipe Pelaku'] === type);
    });
  };

  function renderKios() {
    const rows = filteredKios();
    const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    state.ui.kios.page = Math.min(state.ui.kios.page, pages);
    const pageRows = rows.slice((state.ui.kios.page - 1) * PAGE_SIZE, state.ui.kios.page * PAGE_SIZE);
    const provinces = [...new Set(state.kios.map(row => row['Provinsi']).filter(Boolean))].sort();
    const types = [...new Set(state.kios.map(row => row['Tipe Pelaku']).filter(Boolean))].sort();
    const phoneCount = state.kios.filter(row => String(row['Telepon'] || '').trim()).length;
    const ratings = state.kios.map(row => Number(row['Rating Direktori'])).filter(Boolean);
    const averageRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    $('#page').innerHTML = `${pageHeading('Direktori Kios & Mitra', 'Jelajahi 1.750 pelaku usaha pada dataset kios pupuk Indonesia Timur.', `${button('Ekspor hasil', 'export-kios', 'download')}<a class="button button-primary" href="peta.html" target="_blank" rel="noopener">${icon('pin')}Buka Peta</a>`)}
      ${state.kiosError ? `<div class="info-banner">${icon('alert')}<p><strong>Dataset tidak dapat dimuat.</strong> ${esc(state.kiosError)} Jalankan melalui server lokal dan pastikan file JSON tersedia.</p>${button('Coba lagi', 'refresh', 'refresh', 'button-small')}</div>` : ''}
      <section class="summary-strip"><div class="summary-item"><span>Total entri</span><strong>${state.kiosLoaded ? fmt(state.kios.length) : '…'}</strong><small>pelaku usaha</small></div><div class="summary-item"><span>Cakupan provinsi</span><strong>${provinces.length || '—'}</strong><small>provinsi</small></div><div class="summary-item"><span>Kontak tersedia</span><strong>${state.kiosLoaded ? fmt(phoneCount) : '…'}</strong><small>dengan telepon</small></div><div class="summary-item"><span>Rating direktori</span><strong>${averageRating ? decimal(averageRating, 1) : '—'}</strong><small>${ratings.length ? `${ratings.length} penilaian` : 'belum tersedia'}</small></div></section>
      <section class="card"><div class="toolbar"><div class="search-field">${icon('search')}<input class="input" id="kiosSearch" value="${esc(state.ui.kios.q)}" placeholder="Cari nama, alamat, kabupaten, atau telepon..." aria-label="Cari kios"></div><select class="select" id="kiosProvince" aria-label="Filter provinsi"><option value="">Semua provinsi</option>${provinces.map(value => `<option value="${esc(value)}" ${state.ui.kios.province === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select><select class="select" id="kiosType" aria-label="Filter tipe pelaku"><option value="">Semua tipe</option>${types.map(value => `<option value="${esc(value)}" ${state.ui.kios.type === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select><span class="result-count">${state.kiosLoaded ? `${fmt(rows.length)} hasil` : 'Memuat...'}</span></div>
      <div class="table-wrap">${pageRows.length ? `<table><thead><tr><th>Nama Usaha</th><th>Jenis / Tipe</th><th>Lokasi</th><th>Kontak</th><th>Rating</th><th style="text-align:right">Aksi</th></tr></thead><tbody>${pageRows.map(({ row, index }) => { const rating = Number(row['Rating Direktori']); return `<tr><td><div class="cell-primary"><strong>${esc(row['Nama Usaha'])}</strong><span class="id-code">KIOS-${String(row['No'] || index + 1).padStart(4, '0')}</span></div></td><td><div class="cell-primary"><strong>${esc(row['Jenis'] || '—')}</strong><span>${esc(row['Tipe Pelaku'] || '—')}</span></div></td><td class="cell-location"><strong>${esc(row['Kabupaten/Kota'] || row['Kecamatan'] || '—')}</strong><span>${esc(row['Provinsi'] || '—')} · ${esc(row['Wilayah'] || '—')}</span></td><td>${row['Telepon'] ? `<strong>${esc(row['Telepon'])}</strong>` : '<span>—</span>'}</td><td>${rating ? `<span class="rating">${icon('star')}${decimal(rating, 1)}</span>` : '<span>—</span>'}</td><td><div class="table-actions"><button class="icon-button" data-action="view-kios" data-id="${index}" title="Lihat detail">${icon('eye')}</button>${row['Telepon'] ? `<button class="icon-button" data-action="copy-phone" data-id="${index}" title="Salin telepon">${icon('copy')}</button>` : ''}</div></td></tr>`; }).join('')}</tbody></table>` : state.kiosLoaded ? emptyState('Kios tidak ditemukan', 'Coba gunakan kata kunci atau filter wilayah yang berbeda.', 'pin') : `<div class="page-loading" style="min-height:300px"><span class="loading-spinner"></span><p>Memuat dataset kios...</p></div>`}</div>${state.kiosLoaded ? pagination(rows.length, state.ui.kios.page, 'kios-page') : ''}</section>`;
  }

  const roleDefinitions = [
    { name: 'Super Admin', icon: 'shield', color: 'purple', desc: 'Kendali penuh seluruh modul dan konfigurasi.', permissions: ['Kelola pengguna', 'Edit semua data', 'Ekspor & backup', 'Lihat audit'] },
    { name: 'Admin Operasional', icon: 'settings', color: 'blue', desc: 'Administrasi data operasional dan direktori.', permissions: ['Edit MUT', 'Ekspor kios', 'Kelola data', 'Lihat audit'] },
    { name: 'Petugas MUT', icon: 'flask', color: '', desc: 'Input dan pembaruan hasil pemeriksaan tanah.', permissions: ['Tambah MUT', 'Edit MUT', 'Ekspor laporan'] },
    { name: 'Analis Data', icon: 'chart', color: 'blue', desc: 'Akses analisis dan ekspor tanpa administrasi akun.', permissions: ['Lihat semua modul', 'Ekspor data', 'Lihat audit'] },
    { name: 'Auditor', icon: 'history', color: 'amber', desc: 'Akses baca untuk pemeriksaan dan kepatuhan.', permissions: ['Lihat data', 'Lihat audit', 'Ekspor log'] },
    { name: 'Viewer', icon: 'eye', color: '', desc: 'Akses baca pada dashboard dan modul operasional.', permissions: ['Lihat dashboard', 'Lihat MUT', 'Lihat kios'] }
  ];

  function renderUsers() {
    const query = state.ui.users.q.toLowerCase().trim();
    const users = state.panel.users.filter(user => !query || [user.name, user.email, user.role, user.unit].join(' ').toLowerCase().includes(query));
    const active = state.panel.users.filter(user => user.status === 'active').length;
    $('#page').innerHTML = `${pageHeading('Pengguna & Hak Akses', 'Kelola akun, status pengguna, dan tinjau cakupan izin setiap role.', button('Tambah Pengguna', 'add-user', 'plus', 'button-primary'))}
      <section class="summary-strip"><div class="summary-item"><span>Total pengguna</span><strong>${state.panel.users.length}</strong><small>akun</small></div><div class="summary-item"><span>Akun aktif</span><strong>${active}</strong><small>${decimal(active / Math.max(1, state.panel.users.length) * 100)}% dari total</small></div><div class="summary-item"><span>Role tersedia</span><strong>${roleDefinitions.length}</strong><small>profil akses</small></div><div class="summary-item"><span>Perlu ditinjau</span><strong>${state.panel.users.length - active}</strong><small>akun nonaktif</small></div></section>
      <div class="tab-list"><button class="tab-button ${state.ui.users.tab === 'users' ? 'active' : ''}" data-action="user-tab" data-tab="users">Daftar Pengguna</button><button class="tab-button ${state.ui.users.tab === 'roles' ? 'active' : ''}" data-action="user-tab" data-tab="roles">Role & Izin</button></div>
      ${state.ui.users.tab === 'users' ? `<section class="card"><div class="toolbar"><div class="search-field">${icon('search')}<input class="input" id="userSearch" value="${esc(state.ui.users.q)}" placeholder="Cari nama, email, role, atau unit..." aria-label="Cari pengguna"></div><span class="result-count">${users.length} pengguna</span></div><div class="table-wrap">${users.length ? `<table><thead><tr><th>Pengguna</th><th>Role</th><th>Unit Kerja</th><th>Login Terakhir</th><th>Status</th><th style="text-align:right">Aksi</th></tr></thead><tbody>${users.map(user => `<tr><td><div class="user-cell"><span class="avatar">${esc(initials(user.name))}</span><div><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span></div></div></td><td><span class="badge no-dot ${user.role === 'Super Admin' ? 'purple' : user.role === 'Auditor' ? 'amber' : 'neutral'}">${esc(user.role)}</span></td><td>${esc(user.unit)}</td><td><div class="cell-primary"><strong>${relativeTime(user.lastLogin)}</strong><span>${formatDate(user.lastLogin, true)}</span></div></td><td><span class="badge ${user.status === 'active' ? '' : 'red'}">${user.status === 'active' ? 'Aktif' : 'Ditangguhkan'}</span></td><td><div class="table-actions"><button class="icon-button" data-action="edit-user" data-id="${esc(user.id)}" title="Edit pengguna">${icon('edit')}</button><button class="icon-button" data-action="toggle-user" data-id="${esc(user.id)}" title="${user.status === 'active' ? 'Tangguhkan' : 'Aktifkan'}">${icon(user.status === 'active' ? 'x' : 'check')}</button><button class="icon-button danger" data-action="delete-user" data-id="${esc(user.id)}" title="Hapus pengguna">${icon('trash')}</button></div></td></tr>`).join('')}</tbody></table>` : emptyState('Pengguna tidak ditemukan', 'Periksa kembali kata kunci pencarian.', 'users')}</div></section>` : `<section class="role-grid">${roleDefinitions.map(role => { const count = state.panel.users.filter(user => user.role === role.name).length; return `<article class="card role-card"><div class="role-card-head"><span class="module-icon ${role.color}">${icon(role.icon)}</span><div><h3>${role.name}</h3><span>${count} pengguna · ${role.desc}</span></div></div><div class="permission-list">${role.permissions.map(permission => `<span class="permission">${icon('check')}${permission}</span>`).join('')}</div></article>`; }).join('')}</section><div class="info-banner" style="margin-top:16px;margin-bottom:0">${icon('info')}<p>Role di atas adalah profil antarmuka Super Panel. Untuk produksi, hubungkan otorisasi ini ke backend/SSO agar izin ditegakkan di sisi server.</p></div>`}`;
  }

  const filteredAudit = () => {
    const { q, module } = state.ui.audit;
    const query = q.toLowerCase().trim();
    return state.panel.audit.filter(item => (!query || [item.user, item.action, item.module].join(' ').toLowerCase().includes(query)) && (!module || item.module === module));
  };

  function renderAudit() {
    const rows = filteredAudit();
    const modulesList = [...new Set(state.panel.audit.map(item => item.module))].sort();
    $('#page').innerHTML = `${pageHeading('Log Aktivitas', 'Jejak audit aktivitas pengguna dan perubahan data pada Super Panel.', button('Ekspor Log', 'export-audit', 'download'))}
      <div class="info-banner">${icon('shield')}<p><strong>Jejak audit lokal.</strong> Maksimum 500 aktivitas terbaru disimpan di browser. Ekspor log secara berkala untuk kebutuhan arsip dan pemeriksaan.</p></div>
      <section class="card"><div class="toolbar"><div class="search-field">${icon('search')}<input class="input" id="auditSearch" value="${esc(state.ui.audit.q)}" placeholder="Cari pengguna atau aktivitas..." aria-label="Cari log aktivitas"></div><select class="select" id="auditModule"><option value="">Semua modul</option>${modulesList.map(value => `<option ${state.ui.audit.module === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select><span class="result-count">${rows.length} aktivitas</span></div><div class="table-wrap">${rows.length ? `<table><thead><tr><th>Waktu</th><th>Pengguna</th><th>Modul</th><th>Aktivitas</th><th>Level</th></tr></thead><tbody>${rows.map(item => `<tr><td><div class="cell-primary"><strong>${formatDate(item.ts)}</strong><span>${new Date(item.ts).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span></div></td><td><strong>${esc(item.user)}</strong></td><td>${moduleBadge(item.module)}</td><td>${esc(item.action)}</td><td><span class="badge no-dot ${item.level === 'warning' ? 'amber' : item.level === 'error' ? 'red' : item.level === 'success' ? '' : 'neutral'}">${titleCase(item.level)}</span></td></tr>`).join('')}</tbody></table>` : emptyState('Aktivitas tidak ditemukan', 'Belum ada aktivitas yang sesuai dengan filter.', 'history')}</div></section>`;
  }

  function renderData() {
    const storageBytes = new Blob([JSON.stringify(state.panel), JSON.stringify(state.mut)]).size;
    const marketingKeys = state.marketing ? Object.keys(state.marketing).filter(key => Array.isArray(state.marketing[key])) : [];
    $('#page').innerHTML = `${pageHeading('Data & Pengaturan', 'Pantau sumber data, sinkronisasi, preferensi tampilan, dan backup panel.', button('Sinkronkan Sekarang', 'refresh', 'refresh', 'button-primary'))}
      <section class="settings-grid"><div style="display:grid;gap:16px;align-content:start"><article class="card"><header class="card-header"><div class="card-title"><h3>Sumber Data</h3><p>Koneksi Super Panel dengan data aplikasi yang sudah ada</p></div><span class="badge">Lokal</span></header><div class="card-body"><div class="source-list">
        <div class="source-row"><span class="module-mini-icon">${icon('flask')}</span><div><strong>Data Uji Tanah</strong><p>localStorage · ${MUT_KEY}</p></div><div class="source-meta"><strong>${fmt(state.mut.length)} record</strong><span>Berbagi dengan MUT Apps</span></div><span class="badge">Terhubung</span></div>
        <div class="source-row"><span class="module-mini-icon blue">${icon('chart')}</span><div><strong>Marketing & Distribusi</strong><p>localStorage · ${MARKETING_KEY}</p></div><div class="source-meta"><strong>${state.marketing ? `${marketingKeys.length} dataset` : 'Data rujukan'}</strong><span>${state.marketing ? 'Data browser ditemukan' : 'Buka modul untuk inisialisasi'}</span></div><span class="badge ${state.marketing ? '' : 'amber'}">${state.marketing ? 'Terhubung' : 'Opsional'}</span></div>
        <div class="source-row"><span class="module-mini-icon amber">${icon('pin')}</span><div><strong>Direktori Kios</strong><p>kios_pupuk_indonesia_timur.json</p></div><div class="source-meta"><strong>${state.kiosLoaded ? `${fmt(state.kios.length)} record` : 'Memuat'}</strong><span>Dataset statis proyek</span></div><span class="badge ${state.kiosError ? 'red' : ''}">${state.kiosError ? 'Gagal' : state.kiosLoaded ? 'Terhubung' : 'Memuat'}</span></div>
      </div></div></article>
      <article class="card"><header class="card-header"><div class="card-title"><h3>Backup & Restore</h3><p>Amankan pengguna, pengaturan, audit, dan data MUT dalam satu file</p></div></header><div class="card-body"><div class="detail-hero"><span class="module-icon blue">${icon('database')}</span><div><h3>Ukuran data ${decimal(storageBytes / 1024, 1)} KB</h3><p>Format JSON · tidak termasuk dataset kios statis</p></div></div><div class="backup-actions">${button('Unduh Backup', 'export-backup', 'download', 'button-primary')}${button('Pulihkan Backup', 'import-backup', 'upload')}</div></div></article></div>
      <div style="display:grid;gap:16px;align-content:start"><article class="card"><header class="card-header"><div class="card-title"><h3>Preferensi Panel</h3><p>Pengaturan disimpan otomatis</p></div></header><div class="card-body"><div class="settings-list">
        <div class="setting-row"><div><strong>Mode gelap</strong><p>Kurangi cahaya dan sesuaikan kontras tampilan.</p></div><label class="switch"><input type="checkbox" id="settingTheme" ${state.panel.settings.theme === 'dark' ? 'checked' : ''}><span></span></label></div>
        <div class="setting-row"><div><strong>Kepadatan ringkas</strong><p>Tampilkan lebih banyak baris pada tabel.</p></div><label class="switch"><input type="checkbox" id="settingCompact" ${state.panel.settings.compact ? 'checked' : ''}><span></span></label></div>
        <div class="setting-row"><div><strong>Sinkronisasi otomatis</strong><p>Muat ulang sumber saat panel dibuka.</p></div><label class="switch"><input type="checkbox" id="settingAutoSync" ${state.panel.settings.autoSync ? 'checked' : ''}><span></span></label></div>
        <div class="setting-row"><div><strong>Notifikasi panel</strong><p>Tampilkan pemberitahuan kualitas data.</p></div><label class="switch"><input type="checkbox" id="settingNotifications" ${state.panel.settings.notifications ? 'checked' : ''}><span></span></label></div>
      </div></div></article>
      <article class="card danger-zone"><header class="card-header"><div class="card-title"><h3>Reset Data Lokal</h3><p>Tindakan ini tidak dapat dibatalkan</p></div></header><div class="card-body"><p style="margin:0 0 14px;color:var(--muted);font-size:10px">Mengembalikan data MUT, pengguna, log, dan pengaturan ke data awal. Dataset kios dan data marketing tidak dihapus.</p>${button('Reset ke Data Awal', 'reset-data', 'refresh', 'button-danger')}</div></article>
      <article class="card"><div class="card-body"><div class="detail-hero" style="margin:0"><span class="module-mini-icon purple">${icon('shield')}</span><div><h3>Catatan Produksi</h3><p>Versi ini bersifat client-side. Gunakan backend, autentikasi SSO, validasi server, dan database untuk penggunaan multi-pengguna.</p></div></div></div></article>
      </div></section>`;
  }

  const render = () => {
    const hashRoute = window.location.hash.replace(/^#\/?/, '').split('?')[0];
    state.route = routeMeta[hashRoute] ? hashRoute : 'dashboard';
    const [title, eyebrow] = routeMeta[state.route];
    $('#pageTitle').textContent = title;
    $('#pageEyebrow').textContent = eyebrow;
    document.title = `${title} — Super Panel`;
    $$('.main-nav a[data-route]').forEach(link => link.classList.toggle('active', link.dataset.route === state.route));
    $('#mutNavCount').textContent = state.mut.length;
    closePopovers();
    closeSidebar();
    ({ dashboard: renderDashboard, modules: renderModules, mut: renderMut, kios: renderKios, users: renderUsers, audit: renderAudit, data: renderData }[state.route])();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  let lastFocused = null;
  const openModal = ({ title, eyebrow = 'SUPER PANEL', body = '', footer = '', wide = false, search = false }) => {
    lastFocused = document.activeElement;
    $('#modalTitle').textContent = title;
    $('#modalEyebrow').textContent = eyebrow;
    $('#modalBody').innerHTML = body;
    $('#modalFooter').innerHTML = footer;
    $('#modal').classList.toggle('modal-wide', wide);
    $('#modal').classList.toggle('modal-search', search);
    $('#modalBackdrop').hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => ($('#modalBody input, #modalBody select, #modalBody button') || $('#modalClose')).focus(), 30);
  };
  const closeModal = () => {
    $('#modalBackdrop').hidden = true;
    document.body.style.overflow = '';
    $('#modal').classList.remove('modal-wide', 'modal-search');
    if (lastFocused?.isConnected) lastFocused.focus();
  };
  const toast = (message, type = 'success') => {
    const element = document.createElement('div');
    element.className = `toast ${type === 'error' ? 'error' : ''}`;
    element.innerHTML = `<span>${icon(type === 'error' ? 'alert' : 'check')}</span><div>${esc(message)}</div>`;
    $('#toastRegion').appendChild(element);
    setTimeout(() => { element.classList.add('out'); setTimeout(() => element.remove(), 220); }, 3500);
  };

  const detailItem = (label, value, full = false) => `<div class="detail-item ${full ? 'full' : ''}"><span>${label}</span><strong>${value || '—'}</strong></div>`;
  const openMutDetail = id => {
    const row = state.mut.find(item => item.id === id);
    if (!row) return;
    openModal({ title: row.id, eyebrow: 'DETAIL UJI TANAH', body: `<div class="detail-hero"><span class="module-icon">${icon('flask')}</span><div><h3>${esc(row.petani)}</h3><p>${esc(row.komoditas)} · ${esc(row.desa)}, ${esc(row.kec)}</p></div></div><div class="detail-grid">${detailItem('Tanggal pengujian', formatDate(row.tgl))}${detailItem('Petugas', esc(row.petugas))}${detailItem('Lokasi', `${esc(row.kab)}, ${esc(row.prov)}`)}${detailItem('Koordinat', `${esc(row.lat)}, ${esc(row.lng)}`)}${detailItem('pH Tanah', `<strong>${decimal(row.ph, 1)}</strong>`)}${detailItem('C-Organik', esc(row.corganik))}${detailItem('Status N · P · K', `<span class="nutrient-group">${nutrient('N', row.n)}${nutrient('P', row.p)}${nutrient('K', row.k)}</span>`)}${detailItem('Kontak', esc(row.kontak))}${detailItem('Catatan', esc(row.catatan), true)}</div>`, footer: `${button('Tutup', 'close-modal')}${button('Edit Data', 'edit-mut', 'edit', 'button-primary', `data-id="${esc(row.id)}"`)}` });
  };

  const mutForm = (row = {}) => {
    const isEdit = Boolean(row.id);
    const value = (key, fallback = '') => esc(row[key] ?? fallback);
    const options = (items, current) => items.map(item => `<option value="${esc(item)}" ${current === item ? 'selected' : ''}>${esc(item)}</option>`).join('');
    return `<form id="mutForm" data-id="${value('id')}"><div class="form-grid"><div class="form-section-title">IDENTITAS & LOKASI</div>
      <div class="form-group"><label for="f-tgl">Tanggal pengujian <span>*</span></label><input class="input" id="f-tgl" name="tgl" type="date" value="${value('tgl', new Date().toISOString().slice(0, 10))}" required></div>
      <div class="form-group"><label for="f-petani">Nama petani / kelompok <span>*</span></label><input class="input" id="f-petani" name="petani" value="${value('petani')}" placeholder="Contoh: Kelompok Tani Jaya" required></div>
      <div class="form-group"><label for="f-petugas">Petugas MUT</label><input class="input" id="f-petugas" name="petugas" value="${value('petugas', 'Ahmad Subagja, S.P. (Agronomis MUT)')}"></div>
      <div class="form-group"><label for="f-kontak">Kontak</label><input class="input" id="f-kontak" name="kontak" value="${value('kontak')}" placeholder="08xxxxxxxxxx"></div>
      <div class="form-group"><label for="f-kec">Kecamatan <span>*</span></label><input class="input" id="f-kec" name="kec" value="${value('kec')}" required></div>
      <div class="form-group"><label for="f-desa">Desa / Kelurahan <span>*</span></label><input class="input" id="f-desa" name="desa" value="${value('desa')}" required></div>
      <div class="form-group"><label for="f-kab">Kabupaten</label><input class="input" id="f-kab" name="kab" value="${value('kab', 'Karawang')}" required></div>
      <div class="form-group"><label for="f-komoditas">Komoditas</label><select class="select" id="f-komoditas" name="komoditas" style="width:100%">${options(['Padi Sawah', 'Jagung', 'Singkong', 'Kedelai', 'Bawang Merah', 'Cabai', 'Lainnya'], row.komoditas || 'Padi Sawah')}</select></div>
      <input type="hidden" name="prov" value="${value('prov', 'Jawa Barat')}"><input type="hidden" name="lat" value="${value('lat')}"><input type="hidden" name="lng" value="${value('lng')}">
      <div class="form-section-title">HASIL ANALISIS TANAH</div>
      <div class="form-group"><label for="f-ph">pH Tanah <span>*</span></label><input class="input" id="f-ph" name="ph" type="number" min="0" max="14" step="0.1" value="${value('ph', '6.5')}" required></div>
      <div class="form-group"><label for="f-corganik">C-Organik</label><select class="select" id="f-corganik" name="corganik" style="width:100%">${options(['Rendah (< 2.0%)', 'Sedang (2.0 - 3.0%)', 'Tinggi (> 3.0%)'], row.corganik || 'Sedang (2.0 - 3.0%)')}</select></div>
      <div class="form-group"><label for="f-n">Status Nitrogen (N)</label><select class="select" id="f-n" name="n" style="width:100%">${options(['Rendah', 'Sedang', 'Tinggi'], row.n || 'Sedang')}</select></div>
      <div class="form-group"><label for="f-p">Status Fosfor (P)</label><select class="select" id="f-p" name="p" style="width:100%">${options(['Rendah', 'Sedang', 'Tinggi'], row.p || 'Sedang')}</select></div>
      <div class="form-group"><label for="f-k">Status Kalium (K)</label><select class="select" id="f-k" name="k" style="width:100%">${options(['Rendah', 'Sedang', 'Tinggi'], row.k || 'Sedang')}</select></div>
      <div class="form-group full"><label for="f-catatan">Catatan lapangan</label><textarea class="textarea" id="f-catatan" name="catatan" placeholder="Catatan kondisi lahan atau pengambilan sampel...">${value('catatan')}</textarea></div>
      </div></form>`;
  };
  const openMutForm = id => {
    const row = id ? state.mut.find(item => item.id === id) : null;
    if (id && !row) return;
    openModal({ title: row ? `Edit ${row.id}` : 'Tambah Data Uji Tanah', eyebrow: 'PELAPORAN MUT', body: mutForm(row || {}), footer: `${button('Batal', 'close-modal')}<button class="button button-primary" type="submit" form="mutForm">${icon('check')}${row ? 'Simpan Perubahan' : 'Simpan Data'}</button>`, wide: true });
  };

  const openKiosDetail = index => {
    const row = state.kios[Number(index)];
    if (!row) return;
    const mapUrl = row['Link OpenStreetMap'] || (row['Latitude'] && row['Longitude'] ? `https://www.openstreetmap.org/?mlat=${row['Latitude']}&mlon=${row['Longitude']}#map=17/${row['Latitude']}/${row['Longitude']}` : '');
    openModal({ title: row['Nama Usaha'] || 'Detail Kios', eyebrow: 'DIREKTORI PELAKU USAHA', body: `<div class="detail-hero"><span class="module-icon amber">${icon('pin')}</span><div><h3>${esc(row['Jenis'] || 'Pelaku usaha')}</h3><p>${esc(row['Tipe Pelaku'] || '—')} · ${esc(row['Provinsi'] || '—')}</p></div></div><div class="detail-grid">${detailItem('Alamat', esc(row['Alamat']), true)}${detailItem('Kecamatan', esc(row['Kecamatan']))}${detailItem('Kabupaten / Kota', esc(row['Kabupaten/Kota']))}${detailItem('Wilayah', esc(row['Wilayah']))}${detailItem('Telepon', esc(row['Telepon']))}${detailItem('Rating', row['Rating Direktori'] ? `${decimal(row['Rating Direktori'], 1)} (${esc(row['Jml Ulasan'] || 0)} ulasan)` : 'Belum tersedia')}${detailItem('Koordinat', `${esc(row['Latitude'])}, ${esc(row['Longitude'])}`)}${detailItem('Akurasi koordinat', esc(row['Akurasi Koordinat']))}${detailItem('Sumber data', esc(row['Sumber Data']))}${detailItem('Plus Code', esc(row['Plus Code']))}</div>`, footer: `${button('Tutup', 'close-modal')}${mapUrl ? `<a class="button button-primary" href="${esc(safeUrl(mapUrl))}" target="_blank" rel="noopener">${icon('external')}Buka di Peta</a>` : ''}` });
  };

  const openUserForm = id => {
    const user = state.panel.users.find(item => item.id === id);
    if (id && !user) return;
    const value = (key, fallback = '') => esc(user?.[key] ?? fallback);
    openModal({ title: user ? 'Edit Pengguna' : 'Tambah Pengguna', eyebrow: 'ADMINISTRASI AKUN', body: `<form id="userForm" data-id="${value('id')}"><div class="form-grid"><div class="form-group full"><label for="u-name">Nama lengkap <span>*</span></label><input class="input" id="u-name" name="name" value="${value('name')}" required></div><div class="form-group full"><label for="u-email">Alamat email <span>*</span></label><input class="input" id="u-email" name="email" type="email" value="${value('email')}" placeholder="nama@pupuk-indonesia.com" required></div><div class="form-group"><label for="u-role">Role</label><select class="select" id="u-role" name="role" style="width:100%">${roleDefinitions.map(role => `<option ${user?.role === role.name ? 'selected' : ''}>${role.name}</option>`).join('')}</select></div><div class="form-group"><label for="u-status">Status akun</label><select class="select" id="u-status" name="status" style="width:100%"><option value="active" ${user?.status !== 'suspended' ? 'selected' : ''}>Aktif</option><option value="suspended" ${user?.status === 'suspended' ? 'selected' : ''}>Ditangguhkan</option></select></div><div class="form-group full"><label for="u-unit">Unit kerja <span>*</span></label><input class="input" id="u-unit" name="unit" value="${value('unit', 'Regional Indonesia Timur')}" required></div></div></form>`, footer: `${button('Batal', 'close-modal')}<button class="button button-primary" type="submit" form="userForm">${icon('check')}${user ? 'Simpan Perubahan' : 'Tambah Pengguna'}</button>` });
  };

  const confirmAction = ({ title, text, confirmLabel, action, id = '' }) => openModal({ title, eyebrow: 'KONFIRMASI', body: `<div class="confirm-content"><div class="confirm-icon">${icon('alert')}</div><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`, footer: `${button('Batal', 'close-modal')}${button(confirmLabel, action, '', 'button-danger', `data-id="${esc(id)}"`)}` });

  function openSearch() {
    openModal({ title: 'Pencarian Global', eyebrow: 'CTRL + K', search: true, body: `<div class="search-modal-head">${icon('search')}<input id="commandSearch" autocomplete="off" placeholder="Ketik untuk mencari di seluruh panel..." aria-label="Pencarian global"></div><div class="search-results" id="searchResults"></div><div class="search-hint"><span><kbd>↑</kbd> <kbd>↓</kbd> navigasi</span><span><kbd>Enter</kbd> buka</span><span><kbd>Esc</kbd> tutup</span></div>` });
    renderSearchResults('');
  }

  const searchItems = query => {
    const q = query.toLowerCase().trim();
    const routes = [
      { kind: 'route', id: 'dashboard', title: 'Ringkasan', subtitle: 'Halaman · Command center', icon: 'grid' },
      { kind: 'route', id: 'modules', title: 'Semua Modul', subtitle: 'Halaman · Ekosistem aplikasi', icon: 'layers' },
      { kind: 'route', id: 'mut', title: 'Data Uji Tanah', subtitle: 'Halaman · Operasional', icon: 'flask' },
      { kind: 'route', id: 'kios', title: 'Direktori Kios', subtitle: 'Halaman · Operasional', icon: 'pin' },
      { kind: 'route', id: 'users', title: 'Pengguna & Akses', subtitle: 'Halaman · Administrasi', icon: 'users' },
      { kind: 'route', id: 'audit', title: 'Log Aktivitas', subtitle: 'Halaman · Administrasi', icon: 'history' },
      { kind: 'route', id: 'data', title: 'Data & Pengaturan', subtitle: 'Halaman · Administrasi', icon: 'database' }
    ];
    const matches = (title, subtitle = '') => !q || `${title} ${subtitle}`.toLowerCase().includes(q);
    const result = routes.filter(item => matches(item.title, item.subtitle));
    modules().filter(item => matches(item.name, item.desc)).forEach(item => result.push({ kind: 'module', id: item.url, title: item.name, subtitle: `Aplikasi · ${item.tag}`, icon: item.icon }));
    if (q) {
      state.mut.filter(row => matches(row.id, `${row.petani} ${row.kec} ${row.desa} ${row.komoditas}`)).slice(0, 6).forEach(row => result.push({ kind: 'mut', id: row.id, title: `${row.id} · ${row.petani}`, subtitle: `Uji tanah · ${row.kec} · ${row.komoditas}`, icon: 'flask' }));
      state.kios.map((row, index) => ({ row, index })).filter(({ row }) => matches(row['Nama Usaha'], `${row['Alamat']} ${row['Kabupaten/Kota']} ${row['Provinsi']}`)).slice(0, 6).forEach(({ row, index }) => result.push({ kind: 'kios', id: index, title: row['Nama Usaha'], subtitle: `Kios · ${row['Kabupaten/Kota']}, ${row['Provinsi']}`, icon: 'pin' }));
      state.panel.users.filter(user => matches(user.name, `${user.email} ${user.role} ${user.unit}`)).slice(0, 5).forEach(user => result.push({ kind: 'user', id: user.id, title: user.name, subtitle: `Pengguna · ${user.role} · ${user.email}`, icon: 'users' }));
    }
    return result.slice(0, 24);
  };

  function renderSearchResults(query) {
    const items = searchItems(query);
    $('#searchResults').innerHTML = items.length ? `<div class="search-group-label">${query ? `${items.length} HASIL DITEMUKAN` : 'AKSES CEPAT'}</div>${items.map((item, index) => `<button class="search-result ${index === 0 ? 'selected' : ''}" data-action="search-result" data-kind="${item.kind}" data-id="${esc(item.id)}" data-index="${index}"><span class="module-mini-icon">${icon(item.icon)}</span><div><strong>${esc(item.title)}</strong><span>${esc(item.subtitle)}</span></div>${icon('chevron')}</button>`).join('')}` : `<div class="search-empty">${icon('search')}<p>Tidak ada hasil untuk “${esc(query)}”.<br>Coba kata kunci yang lebih singkat.</p></div>`;
  }

  const renderNotifications = () => {
    const notifications = state.panel.notifications || [];
    const unread = notifications.filter(item => !item.read).length;
    $('#notificationDot').hidden = unread === 0 || !state.panel.settings.notifications;
    $('#notificationPopover').innerHTML = `<div class="popover-head"><strong>Notifikasi ${unread ? `<span class="badge no-dot">${unread} baru</span>` : ''}</strong><button class="text-button" data-action="read-all">Tandai dibaca</button></div><div class="notification-list">${notifications.length ? notifications.slice(0, 8).map(item => `<div class="notification-item ${item.read ? '' : 'unread'}"><span class="notification-icon">${icon(item.icon || 'info')}</span><div><strong>${esc(item.title)}</strong><p>${esc(item.text)}</p><time>${relativeTime(item.ts)}</time></div></div>`).join('') : '<div class="empty-state">Tidak ada notifikasi.</div>'}</div>`;
  };

  const applySettings = () => {
    document.documentElement.dataset.theme = state.panel.settings.theme || 'light';
    document.body.classList.toggle('compact', Boolean(state.panel.settings.compact));
    $('#themeToggle use').setAttribute('href', state.panel.settings.theme === 'dark' ? '#i-moon' : '#i-sun');
    renderNotifications();
  };

  const closePopovers = except => {
    $$('.popover').forEach(popover => { if (popover.id !== except) popover.classList.remove('show'); });
    $('#notificationButton').setAttribute('aria-expanded', except === 'notificationPopover' ? 'true' : 'false');
    $('#profileButton').setAttribute('aria-expanded', except === 'profilePopover' ? 'true' : 'false');
  };
  const openSidebar = () => { $('#sidebar').classList.add('open'); $('#sidebarOverlay').classList.add('show'); };
  const closeSidebar = () => { $('#sidebar').classList.remove('open'); $('#sidebarOverlay').classList.remove('show'); };

  async function loadKios(showToast = false) {
    state.kiosError = '';
    try {
      const response = await fetch('kios_pupuk_indonesia_timur.json', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Format dataset bukan array.');
      state.kios = data;
      state.kiosLoaded = true;
      if (['dashboard', 'kios', 'modules', 'data'].includes(state.route)) render();
      if (showToast) toast(`${fmt(data.length)} data kios berhasil disinkronkan.`);
    } catch (error) {
      state.kiosLoaded = true;
      state.kiosError = error.message;
      if (['dashboard', 'kios', 'modules', 'data'].includes(state.route)) render();
      if (showToast) toast('Dataset kios gagal dimuat.', 'error');
    }
  }

  async function syncAll(showToast = true) {
    const freshMut = safeJSON(MUT_KEY);
    if (Array.isArray(freshMut)) state.mut = freshMut;
    state.marketing = safeJSON(MARKETING_KEY);
    $('#sidebarSync').textContent = 'Menyinkronkan data...';
    await loadKios(false);
    $('#sidebarSync').textContent = `Baru saja · ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    render();
    if (showToast) toast('Semua sumber data berhasil disegarkan.');
  }

  const rerenderKeepingFocus = (selector, value) => { render(); const input = $(selector); if (input) { input.focus(); if (typeof input.setSelectionRange === 'function') input.setSelectionRange(value.length, value.length); } };
  const debouncedMutSearch = debounce(value => rerenderKeepingFocus('#mutSearch', value), 180);
  const debouncedKiosSearch = debounce(value => rerenderKeepingFocus('#kiosSearch', value), 180);
  const debouncedUserSearch = debounce(value => rerenderKeepingFocus('#userSearch', value), 180);
  const debouncedAuditSearch = debounce(value => rerenderKeepingFocus('#auditSearch', value), 180);

  document.addEventListener('input', event => {
    const target = event.target;
    if (target.id === 'mutSearch') { state.ui.mut.q = target.value; state.ui.mut.page = 1; debouncedMutSearch(target.value); }
    if (target.id === 'kiosSearch') { state.ui.kios.q = target.value; state.ui.kios.page = 1; debouncedKiosSearch(target.value); }
    if (target.id === 'userSearch') { state.ui.users.q = target.value; debouncedUserSearch(target.value); }
    if (target.id === 'auditSearch') { state.ui.audit.q = target.value; debouncedAuditSearch(target.value); }
    if (target.id === 'commandSearch') renderSearchResults(target.value);
  });

  document.addEventListener('change', event => {
    const target = event.target;
    if (target.id === 'mutStatus') { state.ui.mut.status = target.value; state.ui.mut.page = 1; render(); }
    if (target.id === 'mutDistrict') { state.ui.mut.district = target.value; state.ui.mut.page = 1; render(); }
    if (target.id === 'kiosProvince') { state.ui.kios.province = target.value; state.ui.kios.page = 1; render(); }
    if (target.id === 'kiosType') { state.ui.kios.type = target.value; state.ui.kios.page = 1; render(); }
    if (target.id === 'auditModule') { state.ui.audit.module = target.value; render(); }
    if (target.id === 'settingTheme') { state.panel.settings.theme = target.checked ? 'dark' : 'light'; persistPanel(); applySettings(); }
    if (target.id === 'settingCompact') { state.panel.settings.compact = target.checked; persistPanel(); applySettings(); }
    if (target.id === 'settingAutoSync') { state.panel.settings.autoSync = target.checked; persistPanel(); toast('Preferensi sinkronisasi disimpan.'); }
    if (target.id === 'settingNotifications') { state.panel.settings.notifications = target.checked; persistPanel(); applySettings(); toast('Preferensi notifikasi disimpan.'); }
  });

  document.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.target;
    const data = Object.fromEntries(new FormData(form).entries());
    if (form.id === 'mutForm') {
      const id = form.dataset.id;
      if (!data.petani?.trim() || !data.kec?.trim() || !data.desa?.trim()) return toast('Lengkapi kolom wajib terlebih dahulu.', 'error');
      if (id) {
        const index = state.mut.findIndex(row => row.id === id);
        if (index < 0) return;
        state.mut[index] = { ...state.mut[index], ...data, ph: Number(data.ph) };
        logAudit('MUT', `Memperbarui data uji tanah ${id} untuk ${data.petani}`, 'success');
      } else {
        const nextId = `MUT-${String(Math.max(0, ...state.mut.map(row => Number(String(row.id).match(/\d+/)?.[0]) || 0)) + 1).padStart(3, '0')}`;
        state.mut.unshift({ ...data, id: nextId, ph: Number(data.ph) });
        logAudit('MUT', `Menambahkan hasil uji tanah ${nextId} untuk ${data.petani}`, 'success');
      }
      persistMut(); closeModal(); render(); toast(id ? 'Perubahan data MUT berhasil disimpan.' : 'Data uji tanah baru berhasil ditambahkan.');
    }
    if (form.id === 'userForm') {
      const id = form.dataset.id;
      if (state.panel.users.some(user => user.email.toLowerCase() === data.email.toLowerCase() && user.id !== id)) return toast('Alamat email sudah digunakan pengguna lain.', 'error');
      if (id) {
        const index = state.panel.users.findIndex(user => user.id === id);
        state.panel.users[index] = { ...state.panel.users[index], ...data };
        logAudit('Pengguna', `Memperbarui akun ${data.name} dan role ${data.role}`, 'warning');
      } else {
        state.panel.users.push({ ...data, id: uid('user'), lastLogin: null });
        logAudit('Pengguna', `Menambahkan pengguna ${data.name} dengan role ${data.role}`, 'success');
      }
      persistPanel(); closeModal(); render(); toast(id ? 'Data pengguna berhasil diperbarui.' : 'Pengguna baru berhasil ditambahkan.');
    }
  });

  document.addEventListener('click', async event => {
    const trigger = event.target.closest('[data-action]');
    if (!trigger) return;
    const { action, id } = trigger.dataset;
    if (action === 'close-modal') closeModal();
    if (action === 'go-kios') window.location.hash = '#/kios';
    if (action === 'add-mut') openMutForm();
    if (action === 'view-mut') openMutDetail(id);
    if (action === 'edit-mut') openMutForm(id);
    if (action === 'delete-mut') { const row = state.mut.find(item => item.id === id); if (row) confirmAction({ title: `Hapus ${id}?`, text: `Data uji tanah untuk ${row.petani} akan dihapus permanen dari penyimpanan lokal.`, confirmLabel: 'Hapus Data', action: 'confirm-delete-mut', id }); }
    if (action === 'confirm-delete-mut') { const row = state.mut.find(item => item.id === id); state.mut = state.mut.filter(item => item.id !== id); persistMut(); logAudit('MUT', `Menghapus data uji tanah ${id} (${row?.petani || 'tidak diketahui'})`, 'warning'); closeModal(); render(); toast('Data uji tanah berhasil dihapus.'); }
    if (action === 'mut-page') { state.ui.mut.page = Number(trigger.dataset.page); render(); }
    if (action === 'export-mut') { const rows = filteredMut(); download(csv(rows), `data-uji-tanah-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8'); logAudit('MUT', `Mengekspor ${rows.length} data uji tanah ke CSV`); toast(`${rows.length} data MUT diekspor ke CSV.`); }
    if (action === 'view-kios') openKiosDetail(id);
    if (action === 'copy-phone') { const phone = state.kios[Number(id)]?.['Telepon']; if (phone) { try { await navigator.clipboard.writeText(phone); toast('Nomor telepon berhasil disalin.'); } catch (_) { toast(`Nomor telepon: ${phone}`); } } }
    if (action === 'kios-page') { state.ui.kios.page = Number(trigger.dataset.page); render(); }
    if (action === 'export-kios') { const rows = filteredKios().map(item => item.row); download(csv(rows), `direktori-kios-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8'); logAudit('Kios', `Mengekspor ${rows.length} entri direktori kios`); toast(`${rows.length} entri kios diekspor ke CSV.`); }
    if (action === 'add-user') openUserForm();
    if (action === 'edit-user') openUserForm(id);
    if (action === 'user-tab') { state.ui.users.tab = trigger.dataset.tab; render(); }
    if (action === 'toggle-user') { const user = state.panel.users.find(item => item.id === id); if (user) { if (user.id === 'u01') return toast('Akun Super Admin utama tidak dapat ditangguhkan.', 'error'); user.status = user.status === 'active' ? 'suspended' : 'active'; logAudit('Pengguna', `${user.status === 'active' ? 'Mengaktifkan' : 'Menangguhkan'} akun ${user.name}`, 'warning'); persistPanel(); render(); toast('Status pengguna berhasil diperbarui.'); } }
    if (action === 'delete-user') { const user = state.panel.users.find(item => item.id === id); if (user?.id === 'u01') return toast('Akun Super Admin utama tidak dapat dihapus.', 'error'); if (user) confirmAction({ title: `Hapus ${user.name}?`, text: 'Akses pengguna akan dihapus dari panel. Tindakan ini tidak dapat dibatalkan.', confirmLabel: 'Hapus Pengguna', action: 'confirm-delete-user', id }); }
    if (action === 'confirm-delete-user') { const user = state.panel.users.find(item => item.id === id); state.panel.users = state.panel.users.filter(item => item.id !== id); logAudit('Pengguna', `Menghapus akun ${user?.name || id}`, 'warning'); persistPanel(); closeModal(); render(); toast('Pengguna berhasil dihapus.'); }
    if (action === 'export-audit') { const rows = filteredAudit(); download(csv(rows), `log-aktivitas-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8'); toast(`${rows.length} log aktivitas diekspor.`); }
    if (action === 'export-backup') { download(JSON.stringify({ app: 'PI Super Panel', version: 1, exportedAt: new Date().toISOString(), panel: state.panel, mut: state.mut }, null, 2), `super-panel-backup-${new Date().toISOString().slice(0, 10)}.json`, 'application/json'); logAudit('Data', 'Mengunduh backup penuh Super Panel'); toast('Backup JSON berhasil dibuat.'); }
    if (action === 'import-backup') $('#backupFile').click();
    if (action === 'reset-data') confirmAction({ title: 'Reset seluruh data lokal?', text: 'Data MUT, pengguna, log, dan pengaturan akan kembali ke kondisi awal. Unduh backup terlebih dahulu jika diperlukan.', confirmLabel: 'Ya, Reset Data', action: 'confirm-reset' });
    if (action === 'confirm-reset') { state.panel = seedPanel(); state.mut = buildMutFallback(); state.ui.mut = { q: '', status: '', district: '', page: 1 }; persistPanel(); persistMut(); closeModal(); applySettings(); render(); toast('Data lokal berhasil dikembalikan ke kondisi awal.'); }
    if (action === 'refresh') await syncAll(true);
    if (action === 'read-all') { state.panel.notifications.forEach(item => { item.read = true; }); persistPanel(); renderNotifications(); }
    if (action === 'search-result') {
      const kind = trigger.dataset.kind;
      closeModal();
      if (kind === 'route') window.location.hash = `#/${id}`;
      if (kind === 'module') window.open(id, '_blank', 'noopener');
      if (kind === 'mut') { window.location.hash = '#/mut'; setTimeout(() => openMutDetail(id), 30); }
      if (kind === 'kios') { window.location.hash = '#/kios'; setTimeout(() => openKiosDetail(id), 30); }
      if (kind === 'user') { window.location.hash = '#/users'; setTimeout(() => openUserForm(id), 30); }
    }
  });

  $('#backupFile').addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.panel || !Array.isArray(data.panel.users) || !Array.isArray(data.mut)) throw new Error('Struktur backup tidak valid.');
        state.panel = data.panel;
        state.mut = data.mut;
        state.panel.settings = { ...seedPanel().settings, ...state.panel.settings };
        state.panel.audit ||= [];
        state.panel.notifications ||= [];
        persistPanel(); persistMut(); applySettings(); render();
        logAudit('Data', `Memulihkan backup ${file.name}`, 'warning');
        toast('Backup berhasil dipulihkan.');
      } catch (error) { toast(`Gagal memulihkan backup: ${error.message}`, 'error'); }
      event.target.value = '';
    };
    reader.readAsText(file);
  });

  $('#globalSearch').addEventListener('click', openSearch);
  $('#modalClose').addEventListener('click', closeModal);
  $('#modalBackdrop').addEventListener('click', event => { if (event.target === $('#modalBackdrop')) closeModal(); });
  $('#mobileMenu').addEventListener('click', openSidebar);
  $('#sidebarClose').addEventListener('click', closeSidebar);
  $('#sidebarOverlay').addEventListener('click', closeSidebar);
  $('#footerSync').addEventListener('click', () => syncAll(true));
  $('#themeToggle').addEventListener('click', () => { state.panel.settings.theme = state.panel.settings.theme === 'dark' ? 'light' : 'dark'; persistPanel(); applySettings(); if (state.route === 'data') render(); });
  $('#notificationButton').addEventListener('click', event => { event.stopPropagation(); const popover = $('#notificationPopover'); const show = !popover.classList.contains('show'); closePopovers(show ? 'notificationPopover' : null); popover.classList.toggle('show', show); });
  $('#profileButton').addEventListener('click', event => { event.stopPropagation(); const popover = $('#profilePopover'); const show = !popover.classList.contains('show'); closePopovers(show ? 'profilePopover' : null); popover.classList.toggle('show', show); });
  $('#notificationPopover').addEventListener('click', event => event.stopPropagation());
  $('#profilePopover').addEventListener('click', event => event.stopPropagation());
  document.addEventListener('click', () => closePopovers());
  $('#lockPanel').addEventListener('click', () => { closePopovers(); openModal({ title: 'Panel Dikunci', eyebrow: 'SESI AMAN', body: `<div class="confirm-content"><div class="confirm-icon" style="color:var(--brand);background:var(--brand-soft)">${icon('shield')}</div><h3>Sesi Anda tetap aman</h3><p>Ini adalah simulasi kunci layar pada versi client-side. Untuk produksi, gunakan autentikasi SSO dan sesi server.</p></div>`, footer: button('Buka Kunci', 'close-modal', 'check', 'button-primary') }); });

  document.addEventListener('keydown', event => {
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName);
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if ($('#modalBackdrop').hidden) openSearch(); }
    if (event.key === '/' && !typing && $('#modalBackdrop').hidden) { event.preventDefault(); openSearch(); }
    if (event.key === 'Escape') { if (!$('#modalBackdrop').hidden) closeModal(); closePopovers(); closeSidebar(); }
    if (event.target.id === 'commandSearch' && ['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
      const results = $$('.search-result', $('#searchResults'));
      if (!results.length) return;
      event.preventDefault();
      let index = results.findIndex(item => item.classList.contains('selected'));
      if (event.key === 'Enter') { (results[Math.max(0, index)] || results[0]).click(); return; }
      results[index]?.classList.remove('selected');
      index = event.key === 'ArrowDown' ? (index + 1) % results.length : (index - 1 + results.length) % results.length;
      results[index].classList.add('selected');
      results[index].scrollIntoView({ block: 'nearest' });
    }
  });

  window.addEventListener('hashchange', render);
  window.addEventListener('storage', event => {
    if (event.key === MUT_KEY) { const data = safeJSON(MUT_KEY); if (Array.isArray(data)) { state.mut = data; render(); } }
    if (event.key === MARKETING_KEY) { state.marketing = safeJSON(MARKETING_KEY); render(); }
  });

  if (!savedPanel) persistPanel();
  applySettings();
  render();
  loadKios(false);
})();
