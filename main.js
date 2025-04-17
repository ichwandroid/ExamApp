const { app, BrowserWindow, session } = require('electron');
const path = require('path');

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    kiosk: true, // Mode kiosk
    fullscreen: true, // Fullscreen
    autoHideMenuBar: true, // Sembunyikan menu bar
    resizable: false, // Tidak bisa resize
    frame: false, // Hapus frame window
    alwaysOnTop: true, // Selalu di atas
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  win.loadFile('index.html');

  // Blok shortcut keluar & lainnya
  win.webContents.on('before-input-event', (event, input) => {
    const forbiddenCombos = [
      ['Alt', 'Tab'],
      ['Alt', 'F4'],
      ['F11'],
      ['Ctrl', 'W'],
      ['Ctrl', 'Tab'],
      ['Ctrl', 'Shift', 'Tab'],
      ['Ctrl', 'C'],
      ['Ctrl', 'V'],
      ['Ctrl', 'X'],
      ['Meta', 'Q']
    ];

    const keysPressed = [];
    if (input.control) keysPressed.push('Ctrl');
    if (input.alt) keysPressed.push('Alt');
    if (input.meta) keysPressed.push('Meta');
    if (input.shift) keysPressed.push('Shift');
    if (input.key && !['Control', 'Alt', 'Meta', 'Shift'].includes(input.key))
      keysPressed.push(input.key);

    for (let combo of forbiddenCombos) {
      if (combo.every(k => keysPressed.includes(k))) {
        event.preventDefault();
        return;
      }
    }

    // Alt+Q untuk keluar
    if (input.alt && input.key.toLowerCase() === 'q') {
      app.quit();
    }

    // F5 untuk refresh
    if (input.key === 'F5') {
      event.preventDefault(); // Mencegah perilaku default
      win.reload(); // Refresh jendela
    }
  });
}

app.whenReady().then(async () => {
  // Bersihkan cache, cookies, dan data penyimpanan lokal saat aplikasi dimulai
  const ses = session.defaultSession;
  try {
    await ses.clearCache();
    await ses.clearStorageData();
    console.log('Cache dan data penyimpanan berhasil dihapus saat aplikasi dimulai.');
  } catch (err) {
    console.error('Gagal menghapus cache atau data penyimpanan:', err);
  }

  createWindow();

  // Tambah perlindungan ekstra: Alt+Tab tidak bisa dicegah sepenuhnya, tapi kita bisa force focus
  setInterval(() => {
    if (win) win.focus();
  }, 1000);
});

// Bersihkan cache sebelum aplikasi keluar
app.on('before-quit', async () => {
  const ses = session.defaultSession;
  try {
    await ses.clearCache();
    await ses.clearStorageData();
    console.log('Cache dan data penyimpanan berhasil dihapus sebelum aplikasi keluar.');
  } catch (err) {
    console.error('Gagal menghapus cache atau data penyimpanan:', err);
  }
});

app.on('window-all-closed', () => {
  app.quit();
});