window.addEventListener('DOMContentLoaded', () => {
  // Mencegah copy-paste
  document.addEventListener('copy', (e) => e.preventDefault());
  document.addEventListener('cut', (e) => e.preventDefault());
  document.addEventListener('paste', (e) => e.preventDefault());

  // Deteksi status koneksi internet
  function updateOnlineStatus() {
    if (!navigator.onLine) {
      alert('Aplikasi sedang offline. Periksa koneksi internet Anda.');
    }
  }

  // Tambahkan event listener untuk perubahan status koneksi
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Periksa status koneksi saat aplikasi dimulai
  updateOnlineStatus();
});