const DB_NAME = 'rahama-share-inbox';
const STORE_NAME = 'photos';
function saveSharedFiles(files) {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => {
      if (!open.result.objectStoreNames.contains(STORE_NAME)) open.result.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
    };
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE_NAME, 'readwrite');
      files.forEach(file => tx.objectStore(STORE_NAME).add({ name: file.name || 'WhatsApp product photo.jpg', type: file.type, blob: file }));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
  });
}
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method === 'POST' && url.pathname === '/share-target') {
    event.respondWith((async () => {
      try {
        const data = await event.request.formData();
        const files = data.getAll('files').filter(file => file && typeof file === 'object' && file.size && (file.type || '').startsWith('image/'));
        if (files.length) await saveSharedFiles(files);
        return Response.redirect(new URL('/admin?shared=1', self.location.origin).toString(), 303);
      } catch (error) {
        return Response.redirect(new URL('/admin?shared-error=1', self.location.origin).toString(), 303);
      }
    })());
  }
});
