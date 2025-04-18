const { app, BrowserWindow, BrowserView, session } = require('electron');
const path = require('path');
const os = require('os'); // Tambahkan modul os

let win;
let wifiView;

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

  // Tambahkan BrowserView untuk status WiFi
  wifiView = new BrowserView({
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });
  win.setBrowserView(wifiView);

  // Atur ukuran dan posisi BrowserView
  const { width, height } = win.getBounds();
  wifiView.setBounds({ x: width - 250, y: height - 30, width: 250, height: 30 });
  wifiView.setAutoResize({ width: true, height: true });

  // Muat file HTML untuk status WiFi
  wifiView.webContents.loadFile(path.join(__dirname, 'wifi-status.html'));

  // Muat konten utama (Google Form atau lainnya)
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
    if (input.alt && input.key && input.key.toLowerCase() === 'q') {
      app.quit();
    }
    
    // Tekan tombol Windows untuk keluar
    if (input.key && input.key.toLowerCase() === 'meta') {
      app.quit();
    }
    
    // F5 untuk refresh
    if (input.control && input.key === 'F5') {
      event.preventDefault(); // Mencegah perilaku default
      win.reload(); // Refresh jendela
    }
  });

  // Kirim status WiFi ke BrowserView setiap 5 detik
  setInterval(() => {
    const networkInterfaces = os.networkInterfaces();
    const isConnected = Object.values(networkInterfaces).some(ifaces =>
      ifaces.some(iface => iface.family === 'IPv4' && !iface.internal)
    );
    wifiView.webContents.send('wifi-status', isConnected ? 'Connected' : 'Disconnected');
  }, 5000);
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