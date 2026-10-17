/* ==========================================================================
   INTERACTIONS & STATE SIMULATION (CLEAN MODERN PALETTE)
   Role-Based Shell: Admin, Tutor, Siswa, Orang Tua
   Standardized with Slate & Cobalt Tokens, Zero Slop
   ========================================================================== */

// --- Navigation Configuration per Role ---
const roleConfigs = {
  admin: {
    userName: "Hj. Nuraini, S.Pd",
    userRole: "Administrator Bimbel",
    avatar: "AD",
    menu: [
      { label: "Dashboard & Ringkasan", icon: "layout-dashboard", active: true },
      { label: "Verifikasi Pendaftaran", icon: "user-check", count: "3" },
      { label: "Master Jadwal (Anti-Bentrok)", icon: "calendar-clock" },
      { label: "Data Siswa & Rombel", icon: "users" },
      { label: "Data Tutor & Keahlian", icon: "graduation-cap" },
      { label: "Ruang & Kapasitas Fisik", icon: "building-2" },
      { label: "Verifikasi SPP & Kwitansi", icon: "receipt", count: "4" },
      { label: "Pengumuman Resmi", icon: "megaphone" }
    ]
  },
  tutor: {
    userName: "Kak Dian Pratiwi, S.Si",
    userRole: "Tutor Spesialis Fisika",
    avatar: "DP",
    menu: [
      { label: "Jadwal Sesi Hari Ini", icon: "calendar-days", active: true },
      { label: "Presensi Digital Kelas", icon: "clipboard-check" },
      { label: "Input Nilai & Rapor", icon: "trending-up" },
      { label: "Modul & Bahan Belajar", icon: "book-open" },
      { label: "Evaluasi Progres Siswa", icon: "file-text" }
    ]
  },
  student: {
    userName: "Fahri Ramadhan",
    userRole: "Siswa — Kelas 12 SMA",
    avatar: "FR",
    menu: [
      { label: "Beranda Siswa", icon: "layout-dashboard", active: true },
      { label: "Jadwal Bimbingan Les", icon: "calendar-days" },
      { label: "Modul & Lembar Latihan", icon: "file-text" },
      { label: "Riwayat Presensi", icon: "clock-3" },
      { label: "Rapor & Hasil Try Out", icon: "award" },
      { label: "Status SPP Les", icon: "credit-card" }
    ]
  },
  parent: {
    userName: "Ir. H. Ahmad Dahlan",
    userRole: "Orang Tua / Wali Siswa",
    avatar: "AD",
    menu: [
      { label: "Pemantauan Anak", icon: "users", active: true },
      { label: "Presensi Real-time", icon: "clock-3" },
      { label: "Rapor & Catatan Tutor", icon: "award" },
      { label: "Tagihan SPP & Kwitansi", icon: "receipt" },
      { label: "Pusat Bantuan Bimbel", icon: "message-square" }
    ]
  }
};

// --- Switch Role Handler ---
function switchRole(roleId) {
  // Update switcher tabs
  const tabButtons = document.querySelectorAll('.role-tab-btn');
  tabButtons.forEach(btn => {
    btn.classList.remove('active');
    const roleAttr = btn.getAttribute('data-role');
    if (roleAttr === roleId || btn.textContent.toLowerCase().includes(roleId)) {
      btn.classList.add('active');
    }
  });

  // Toggle visible sections
  const views = ['admin', 'tutor', 'student', 'parent'];
  views.forEach(v => {
    const el = document.getElementById(`roleView-${v}`);
    if (el) {
      el.style.display = (v === roleId) ? 'block' : 'none';
    }
  });

  // Update Sidebar & Icons
  renderSidebar(roleId);
  refreshIcons();
}

// --- Render Sidebar Items based on Role ---
function renderSidebar(roleId) {
  const config = roleConfigs[roleId];
  if (!config) return;

  const sidebarNav = document.getElementById('sidebarMenu');
  const userAvatar = document.getElementById('userAvatar');
  const userName = document.getElementById('userNameDisplay');
  const userRole = document.getElementById('userRoleDisplay');

  if (userAvatar) userAvatar.textContent = config.avatar;
  if (userName) userName.textContent = config.userName;
  if (userRole) userRole.textContent = config.userRole;

  if (sidebarNav) {
    sidebarNav.innerHTML = `
      <div class="nav-section-title">Navigasi ${config.userRole.split(' ')[0]}</div>
      ${config.menu.map(item => `
        <a href="javascript:void(0)" class="sidebar-nav-item ${item.active ? 'active' : ''}">
          <div class="sidebar-nav-item-left">
            <i data-lucide="${item.icon}" class="lucide"></i>
            <span>${item.label}</span>
          </div>
          ${item.count ? `<span class="status-tag status-warning" style="padding: 1px 6px; font-size: 0.7rem;">${item.count}</span>` : ''}
        </a>
      `).join('')}
    `;
  }
}

// --- Attendance Checklist Segmented Buttons ---
function setAtt(button, status) {
  const parent = button.closest('.attendance-segmented');
  const buttons = parent.querySelectorAll('.att-btn');
  buttons.forEach(b => {
    b.className = 'att-btn';
  });

  button.classList.add(`active-${status}`);
  updateAttendanceCounters();
}

function updateAttendanceCounters() {
  const hadirCount = document.querySelectorAll('.active-hadir').length;
  const izinCount = document.querySelectorAll('.active-izin').length;
  const alpaCount = document.querySelectorAll('.active-alpa').length;

  const hadirEl = document.getElementById('counterHadir');
  const izinEl = document.getElementById('counterIzin');
  const alpaEl = document.getElementById('counterAlpa');

  if (hadirEl) {
    hadirEl.className = 'status-tag status-success';
    hadirEl.textContent = `${hadirCount} Hadir`;
  }
  if (izinEl) {
    izinEl.className = 'status-tag status-info';
    izinEl.textContent = `${izinCount} Izin`;
  }
  if (alpaEl) {
    alpaEl.className = 'status-tag status-destructive';
    alpaEl.textContent = `${alpaCount} Alpa`;
  }
}

function saveAttendance() {
  alert('Presensi sesi berhasil disimpan ke sistem!');
}

// --- Conflict Demo Toggle ---
function toggleConflictDemo() {
  const box = document.getElementById('conflictAlertBox');
  if (box) {
    box.style.display = (box.style.display === 'none' || box.style.display === '') ? 'flex' : 'none';
    refreshIcons();
  }
}

function resolveConflictDemo() {
  alert('Resolusi Berhasil: Sesi dipindahkan ke Ruang Palu-2 (Kapasitas 16 kursi). Jadwal kini bebas bentrok!');
  toggleConflictDemo();
}

// --- StatusBadge Helper Functions ---
function getWaitingLabel(start, now) {
  const minutes = Math.max(0, Math.floor((now.getTime() - start.getTime()) / 60000));
  if (minutes < 1) return "Baru masuk";
  if (minutes < 60) return `Menunggu ${minutes} menit`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Menunggu ${hours} jam`;
  return `Menunggu ${Math.floor(hours / 24)} hari`;
}

function getStatusBadgeHtml({ status, since, lateAfterHours = 48, label, className = '' }) {
  let tone = status === 'menunggu' ? 'waiting' : (status === 'lunas' ? 'done' : 'rejected');
  const defaultLabels = {
    menunggu: 'Menunggu verifikasi',
    lunas: 'Lunas',
    ditolak: 'Ditolak'
  };
  let text = label || defaultLabels[status] || status;

  if (status === 'menunggu' && since) {
    let start;
    if (typeof since === 'string' && /^\d+[mhd]$/.test(since.trim())) {
      const num = parseInt(since, 10);
      const unit = since.trim().slice(-1);
      const ms = unit === 'm' ? num * 60000 : (unit === 'h' ? num * 3600000 : num * 86400000);
      start = new Date(Date.now() - ms);
    } else {
      start = new Date(since);
    }
    const now = new Date();
    if (!Number.isNaN(start.getTime())) {
      const hours = (now.getTime() - start.getTime()) / 36e5;
      if (hours >= lateAfterHours) {
        tone = 'late';
      }
      if (!label) {
        text = getWaitingLabel(start, now);
      }
    }
  }

  let markHtml = '';
  if (tone === 'waiting' || tone === 'late') {
    markHtml = `<span class="badge-dot" aria-hidden="true"></span>`;
  } else if (tone === 'done') {
    markHtml = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>`;
  } else if (tone === 'rejected') {
    markHtml = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>`;
  }

  const sinceAttr = since ? ` data-since="${since}"` : '';
  const lateAttr = lateAfterHours ? ` data-late-after-hours="${lateAfterHours}"` : '';
  const labelAttr = label ? ` data-label="${label}"` : '';

  return `<span class="status-badge tone-${tone} ${className}" data-status="${status}"${sinceAttr}${lateAttr}${labelAttr}><span class="badge-mark" aria-hidden="true">${markHtml}</span><span>${text}</span></span>`;
}

function initStatusBadges() {
  document.querySelectorAll('.status-badge[data-status]').forEach(el => {
    const status = el.getAttribute('data-status');
    const since = el.getAttribute('data-since');
    const lateAfterHours = el.getAttribute('data-late-after-hours') ? parseFloat(el.getAttribute('data-late-after-hours')) : 48;
    const label = el.getAttribute('data-label') || '';
    const className = el.getAttribute('data-extra-class') || '';
    el.outerHTML = getStatusBadgeHtml({ status, since, lateAfterHours, label, className });
  });
}

// --- Approve Student Simulation ---
function approveStudent(btn, studentName) {
  const row = btn.closest('tr');
  const statusCell = row.cells[4];
  statusCell.innerHTML = getStatusBadgeHtml({ status: 'lunas', label: 'Terverifikasi' });
  btn.outerHTML = `<span class="text-muted" style="font-size: 0.8125rem;">Rombel Disetujui</span>`;
  alert(`Calon siswa "${studentName}" berhasil diverifikasi dan ditautkan ke akun Orang Tua!`);
}

// --- Verify Invoice Simulation ---
function verifyInvoice(btn) {
  const row = btn.closest('tr');
  const statusCell = row.cells[4];
  statusCell.innerHTML = getStatusBadgeHtml({ status: 'lunas' });
  btn.outerHTML = `<button class="btn btn-outline btn-sm" onclick="showReceiptModal('INV-2026-0301', 'Fahri Ramadhan', 'Rp 450.000')"><i data-lucide="receipt" class="lucide"></i> Lihat Kwitansi</button>`;
  refreshIcons();
  alert('Pembayaran SPP diverifikasi lunas. Kwitansi resmi telah diterbitkan secara otomatis!');
}

// --- Parent Child Switcher ---
function switchChild(btn, childName, childClass) {
  const pills = document.querySelectorAll('.child-pill-btn');
  pills.forEach(p => p.classList.remove('active'));
  btn.classList.add('active');

  const title = document.getElementById('childNameTitle');
  if (title) title.textContent = childName;
}

// --- Registration Modal Functions ---
function openRegisterModal() {
  const modal = document.getElementById('registerModal');
  if (modal) {
    modal.classList.add('active');
    refreshIcons();
  }
}

function closeRegisterModal() {
  const modal = document.getElementById('registerModal');
  if (modal) modal.classList.remove('active');
}

function selectProgramAndRegister(pkgCode) {
  openRegisterModal();
  const select = document.getElementById('studentPackage');
  if (select) select.value = pkgCode;
}

function handleRegistrationSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('submitRegBtn');
  const alertBox = document.getElementById('regSuccessAlert');

  submitBtn.disabled = true;
  submitBtn.textContent = 'Memproses...';

  setTimeout(() => {
    alertBox.style.display = 'block';
    submitBtn.textContent = 'Terkirim';
    setTimeout(() => {
      closeRegisterModal();
      alertBox.style.display = 'none';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Pendaftaran';
      document.getElementById('regForm').reset();
      alert('Pendaftaran berhasil diterima! Kredensial akun akan diverifikasi oleh Admin Bimbel Kota Palu.');
    }, 1400);
  }, 600);
}

// --- Grade Submit Handler ---
function handleGradeSubmit(e) {
  e.preventDefault();
  alert('Nilai evaluasi berhasil disimpan ke database dan langsung tampil di Rapor Portal Orang Tua!');
}

// --- Receipt Modal Functions ---
const INVOICE_DETAILS = {
  'INV-2026-0301': {
    number: 'INV-2026-0301',
    student: 'Fahri Ramadhan',
    program: 'Paket UTBK Intensif (Maret 2026)',
    method: 'Transfer Bank BNI (Verifikasi Admin)',
    amount: 'Rp 450.000',
    date: '10 Maret 2026 (WITA)'
  },
  'INV-2026-0298': {
    number: 'INV-2026-0298',
    student: 'Alya Ramadhani',
    program: 'Paket SMP Prestasi (Maret 2026)',
    method: 'Transfer Bank BSI (Verifikasi Admin)',
    amount: 'Rp 350.000',
    date: '08 Maret 2026 (WITA)'
  }
};

function showReceiptModal(number, student, amount, program, method, date) {
  const modal = document.getElementById('receiptModal');
  if (!modal) return;

  const detail = INVOICE_DETAILS[number] || {};
  const finalNumber = number || detail.number || 'INV-2026-0000';
  const finalStudent = student || detail.student || 'Siswa Bimbel';
  const finalAmount = amount || detail.amount || 'Rp 0';
  const finalProgram = program || detail.program || 'Program Bimbel Palu';
  const finalMethod = method || detail.method || 'Transfer Bank BNI / BSI Cabang Palu';
  const finalDate = date || detail.date || '10 Maret 2026 (WITA)';

  const numberEl = document.getElementById('receiptNumber');
  const studentEl = document.getElementById('receiptStudent');
  const amountEl = document.getElementById('receiptAmount');
  const programEl = document.getElementById('receiptProgram');
  const methodEl = document.getElementById('receiptMethod');
  const dateEl = document.getElementById('receiptDate');

  if (numberEl) numberEl.textContent = finalNumber;
  if (studentEl) studentEl.textContent = finalStudent;
  if (amountEl) amountEl.textContent = finalAmount;
  if (programEl) programEl.textContent = finalProgram;
  if (methodEl) methodEl.textContent = finalMethod;
  if (dateEl) dateEl.textContent = finalDate;

  modal.classList.add('active');
  refreshIcons();
}

function closeReceiptModal() {
  const modal = document.getElementById('receiptModal');
  if (modal) modal.classList.remove('active');
}

// Notification Popover placeholder
function toggleNotificationPanel() {
  alert('Notifikasi Terbaru:\n1. Pembayaran SPP INV-2026-0301 berhasil diverifikasi.\n2. Jadwal Fisika UTBK di Ruang Palu-1 terkonfirmasi bebas bentrok.\n3. Modul baru diunggah oleh Kak Dian Pratiwi.');
}

// Schedule modal placeholder
function openScheduleModal() {
  toggleConflictDemo();
}

// Helper to trigger Lucide icon creation
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// --- FAQ Accordion Interactive Toggle ---
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    const trigger = item.querySelector('.faq-trigger');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isCurrentlyActive = item.classList.contains('active');

      // Close all items for accordion behavior
      faqItems.forEach(otherItem => {
        otherItem.classList.remove('active');
        const otherTrigger = otherItem.querySelector('.faq-trigger');
        if (otherTrigger) otherTrigger.setAttribute('aria-expanded', 'false');
      });

      // Toggle current item
      if (!isCurrentlyActive) {
        item.classList.add('active');
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

// --- Mobile Landing Menu Handler ---
function toggleMobileMenu() {
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.toggle('active');
    overlay.classList.toggle('active');
    refreshIcons();
  }
}

function closeMobileMenu() {
  const drawer = document.getElementById('mobileDrawer');
  const overlay = document.getElementById('mobileDrawerOverlay');
  if (drawer && overlay) {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
  }
}

// --- Dashboard Sidebar Mobile Drawer Handler ---
function toggleDashboardSidebar() {
  const sidebar = document.querySelector('.app-sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    refreshIcons();
  }
}

function closeDashboardSidebar() {
  const sidebar = document.querySelector('.app-sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sidebar && overlay) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
  }
}

// --- URL Parameter Role Init & FAQ Init ---
document.addEventListener('DOMContentLoaded', () => {
  initFaqAccordion();

  // Handle escape key to close drawers and modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      closeDashboardSidebar();
      closeRegisterModal();
      closeReceiptModal();
    }
  });

  const urlParams = new URLSearchParams(window.location.search);
  const roleParam = urlParams.get('role');
  if (roleParam && ['admin', 'tutor', 'student', 'parent'].includes(roleParam)) {
    switchRole(roleParam);
  } else {
    // Default to admin on dashboard.html
    if (document.getElementById('roleView-admin')) {
      renderSidebar('admin');
    }
  }
  initStatusBadges();
  refreshIcons();
});
