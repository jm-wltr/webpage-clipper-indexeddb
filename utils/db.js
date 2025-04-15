/**
 * IndexedDB utility for the Webpage Clipper extension
 * Handles database creation, connection, and CRUD operations
 */

const DB_NAME = 'WebpageClipperDB';
const DB_VERSION = 2;
const STORE_NAME = 'clippedPages';

// Database connection
let db = null;

// Initialize the database
async function initDB() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);

  // Handle database upgrade (called when DB is created or version changes)
  request.onupgradeneeded = (event) => {
    const db = event.target.result;
    const oldVersion = event.oldVersion;

    if (oldVersion < 1) {
      // Initial schema creation
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      store.createIndex('url', 'url', { unique: false });
      store.createIndex('timestamp', 'timestamp', { unique: false });
      console.log('Database schema created');
    }

    if (oldVersion < 2) {
      // No structural changes needed; just logging upgrade
      console.log('Migrated to schema version 2: added wordCount, readingTime, and favicon support');
    }
  };

  try {
    db = await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        resolve(request.result);
      };
      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// Add a new clipped page to the database
async function addClippedPage(pageData) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  // Ensure all fields are included, even if missing or undefined
  const data = {
    title: pageData.title || 'Untitled',
    url: pageData.url || '',
    content: pageData.content || '',
    timestamp: pageData.timestamp || new Date().toISOString(),
    favicon: pageData.favicon || '',
    wordCount: Number.isFinite(pageData.wordCount) ? pageData.wordCount : 0,
    readingTime: Number.isFinite(pageData.readingTime) ? pageData.readingTime : 1
  };

  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(data);
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
    console.log('Page clipped successfully');
    return result;
  } catch (error) {
    console.error('Failed to clip page:', error);
    throw error;
  }
}

// Get all clipped pages from the database
async function getAllClippedPages() {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    const result = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = (event) => reject(event.target.error);
    });
    return result;
  } catch (error) {
    console.error('Failed to get clipped pages:', error);
    throw error;
  }
}

// Delete a specific clipped page by ID
async function deleteClippedPage(id) {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
    console.log(`Page with ID ${id} deleted successfully`);
  } catch (error) {
    console.error('Failed to delete page:', error);
    throw error;
  }
}

// Clear all clipped pages from the database
async function clearAllClippedPages() {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = (event) => reject(event.target.error);
    });
    console.log('All pages cleared successfully');
  } catch (error) {
    console.error('Failed to clear pages:', error);
    throw error;
  }
}

// Export the database API globally
window.WebpageClipperDB = {
  init: initDB,
  addPage: addClippedPage,
  getAllPages: getAllClippedPages,
  deletePage: deleteClippedPage,
  clearAllPages: clearAllClippedPages
};
