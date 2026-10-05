/**
 * TreeTrack Google Apps Script backend.
 * Orders and Reviews are stored in Google Sheets.
 * Campaign Tree #1 state is stored in one lightweight Campaign Tree sheet,
 * so one admin update is visible to every adopter without per-user data.
 */

const SPREADSHEET_ID = '1vVAYRO4wKt_J1tRe02CVbpDHM_V5YaAHxK14cWXsrkI';
const SHEET_NAME = 'Orders';
const REVIEW_SHEET_NAME = 'Reviews';
const TREE_SHEET_NAME = 'Campaign Tree';

const ORDER_HEADERS = [
  'Order ID','Created At','Updated At','Status Key','Status','Customer Name','Email','WhatsApp','City','Address','Notes','Products JSON','Total','Adoption JSON','Review ID'
];
const REVIEW_HEADERS = [
  'Review ID','Order ID','User ID','Customer Name','Rating','Review','Image','Product Names JSON','Created At','Updated At','Admin Response','Admin Response At'
];
const TREE_HEADERS = ['Campaign','Phase','Title','Description','Update Date','Updated At','Image URL','Image File ID'];

const DEFAULT_TREE = {
  campaign: 'Campaign Tree #1',
  phase: 'waiting',
  title: 'Waiting to be planted',
  description: 'Your tree is registered to the campaign and waiting for the end-of-month planting day.',
  updateDate: '',
  updatedAt: ''
};

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getOrCreateSheet_(name, headers) {
  const spreadsheet = getSpreadsheet_();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  } else if (sheet.getLastColumn() < headers.length) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function ordersSheet_() { return getOrCreateSheet_(SHEET_NAME, ORDER_HEADERS); }
function reviewsSheet_() { return getOrCreateSheet_(REVIEW_SHEET_NAME, REVIEW_HEADERS); }
function treeSheet_() { return getOrCreateSheet_(TREE_SHEET_NAME, TREE_HEADERS); }

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'ping';
    if (action === 'tree' || action === 'getCampaignTree') return json_({ ok: true, tree: getTree_() });
    if (action === 'getReviews') return json_({ ok: true, reviews: getReviews_() });
    if (action === 'getOrders') return json_({ ok: true, orders: getOrders_() });
    if (action === 'get') {
      const id = e.parameter.id || '';
      const order = getOrders_().find(item => item.id === id) || null;
      return json_({ ok: true, order });
    }
    return json_({ ok: true, message: 'TreeTrack API is running.', tree: getTree_() });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = payload.action || '';
    const order = payload.order || {};

    if (action === 'create_order' || action === 'update_order') {
      if (!order.id) return json_({ ok: false, error: 'Missing order id.' });
      upsertOrder_(order);
      return json_({ ok: true, orderId: order.id });
    }
    if (action === 'delete_order') {
      deleteOrder_(order.id);
      return json_({ ok: true, orderId: order.id });
    }
    if (action === 'save_review') {
      if (!order.id) return json_({ ok: false, error: 'Missing review id.' });
      upsertReview_(order);
      return json_({ ok: true, reviewId: order.id });
    }
    if (action === 'delete_review') {
      deleteReview_(order);
      return json_({ ok: true, reviewId: order.id || '' });
    }
    if (action === 'update_tree' || action === 'update_campaign_tree' || action === 'save_campaign_tree') {
      const tree = saveTree_(payload.tree || {});
      return json_({ ok: true, tree, photoRemoved: Boolean((payload.tree || {}).removeImage) && !(tree.imageUrl || '') });
    }

    return json_({ ok: false, error: 'Unknown action.' });
  } catch (error) {
    return json_({ ok: false, error: String(error) });
  }
}

function getTree_() {
  const sheet = treeSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length > 1) {
    const rows = values.slice(1);
    const row = rows.find(item => String(item[0] || '') === 'Campaign Tree #1') || rows[0];
    if (row) {
      return normalizeTree_({
        campaign: row[0], phase: row[1], title: row[2], description: row[3], updateDate: row[4], updatedAt: row[5], imageUrl: row[6], imageFileId: row[7]
      });
    }
  }
  const fallback = normalizeTree_(DEFAULT_TREE);
  sheet.getRange(2, 1, 1, TREE_HEADERS.length).setValues([[
    fallback.campaign, fallback.phase, fallback.title, fallback.description, fallback.updateDate, fallback.updatedAt, fallback.imageUrl || '', fallback.imageFileId || ''
  ]]);
  SpreadsheetApp.flush();
  return fallback;
}

function saveTree_(tree) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const incoming = tree || {};
    const normalized = normalizeTree_(incoming);
    const sheet = treeSheet_();
    const values = sheet.getDataRange().getValues();
    const rows = values.length > 1 ? values.slice(1) : [];
    const existingIndex = rows.findIndex(row => String(row[0] || '') === 'Campaign Tree #1');
    const existing = existingIndex >= 0 ? {
      imageUrl: String(rows[existingIndex][6] || ''),
      imageFileId: String(rows[existingIndex][7] || '')
    } : { imageUrl: '', imageFileId: '' };

    let imageUrl = existing.imageUrl;
    let imageFileId = existing.imageFileId;

    if (incoming.removeImage) {
      trashDriveFile_(imageFileId);
      imageUrl = '';
      imageFileId = '';
    }

    if (incoming.imageData) {
      const uploaded = uploadTreeImage_(incoming.imageData);
      if (!uploaded.ok) throw new Error(uploaded.error || 'The tree photo could not be uploaded.');
      trashDriveFile_(imageFileId);
      imageUrl = uploaded.url;
      imageFileId = uploaded.fileId;
    }

    const row = [normalized.campaign, normalized.phase, normalized.title, normalized.description, normalized.updateDate, normalized.updatedAt, imageUrl, imageFileId];
    if (existingIndex < 0) {
      sheet.appendRow(row);
    } else {
      sheet.getRange(existingIndex + 2, 1, 1, row.length).setValues([row]);
    }
    SpreadsheetApp.flush();
    return getTree_();
  } finally {
    lock.releaseLock();
  }
}

function uploadTreeImage_(dataUrl) {
  const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return { ok: false, error: 'Invalid tree image data.' };
  try {
    const mimeType = match[1] === 'image/jpg' ? 'image/jpeg' : match[1];
    const bytes = Utilities.base64Decode(match[2]);
    const blob = Utilities.newBlob(bytes, mimeType, 'TreeTrack-Campaign-Tree-1.jpg');
    const file = DriveApp.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const id = file.getId();
    return { ok: true, fileId: id, url: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(id) + '&sz=w1600' };
  } catch (error) {
    return { ok: false, error: 'Google Drive upload failed: ' + String(error) };
  }
}

function trashDriveFile_(fileId) {
  if (!fileId) return;
  try {
    DriveApp.getFileById(fileId).setTrashed(true);
  } catch (_) {}
}

function normalizeTree_(tree) {
  const phases = ['waiting','planted','sprout','growing'];
  const phase = phases.indexOf(tree.phase) >= 0 ? tree.phase : DEFAULT_TREE.phase;
  return {
    campaign: 'Campaign Tree #1',
    phase,
    title: String(tree.title || DEFAULT_TREE.title).slice(0, 100),
    description: String(tree.description || DEFAULT_TREE.description).slice(0, 500),
    updateDate: String(tree.updateDate || '').slice(0, 30),
    updatedAt: String(tree.updatedAt || new Date().toISOString()),
    imageUrl: String(tree.imageUrl || '').slice(0, 1000),
    imageFileId: String(tree.imageFileId || '').slice(0, 200)
  };
}

function getOrders_() {
  const sheet = ordersSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(row => {
    try {
      if (row[11]) {
        const items = JSON.parse(row[11]);
        const adoption = row[13] ? JSON.parse(row[13]) : {};
        return {
          id: String(row[0] || ''), createdAt: String(row[1] || ''), updatedAt: String(row[2] || ''),
          statusKey: String(row[3] || 'pending'), status: String(row[4] || ''),
          customer: { name: String(row[5] || ''), email: String(row[6] || ''), phone: String(row[7] || ''), city: String(row[8] || ''), address: String(row[9] || ''), notes: String(row[10] || '') },
          items, total: Number(row[12] || 0), adoption, reviewId: String(row[14] || '')
        };
      }
      return row[14] ? JSON.parse(row[14]) : null;
    } catch (_) { return null; }
  }).filter(Boolean);
}

function getReviews_() {
  const sheet = reviewsSheet_();
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  return values.slice(1).map(row => ({
    id: String(row[0] || ''), orderId: String(row[1] || ''), userId: String(row[2] || ''),
    customerName: String(row[3] || ''), rating: Number(row[4] || 0), text: String(row[5] || ''),
    image: String(row[6] || ''), productNames: parseJsonArray_(row[7]), createdAt: String(row[8] || ''), updatedAt: String(row[9] || ''),
    adminResponse: String(row[10] || ''), adminResponseAt: String(row[11] || '')
  })).filter(review => review.id);
}

function parseJsonArray_(value) {
  try { const parsed = JSON.parse(String(value || '[]')); return Array.isArray(parsed) ? parsed : []; }
  catch (_) { return []; }
}

function upsertOrder_(order) {
  const sheet = ordersSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);
  const index = rows.findIndex(row => String(row[0]) === String(order.id));
  const row = [
    order.id, order.createdAt || '', order.updatedAt || order.createdAt || '', order.statusKey || 'pending', order.status || '',
    order.customer?.name || '', order.customer?.email || '', order.customer?.phone || '', order.customer?.city || '', order.customer?.address || '', order.customer?.notes || '',
    JSON.stringify(order.items || []), Number(order.total || 0), JSON.stringify(order.adoption || {}), order.reviewId || ''
  ];
  if (index < 0) sheet.appendRow(row);
  else sheet.getRange(index + 2, 1, 1, row.length).setValues([row]);
}

function deleteOrder_(orderId) {
  if (!orderId) return;
  const sheet = ordersSheet_();
  const rows = sheet.getDataRange().getValues().slice(1);
  const index = rows.findIndex(row => String(row[0]) === String(orderId));
  if (index >= 0) sheet.deleteRow(index + 2);
}

function upsertReview_(review) {
  const sheet = reviewsSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);
  const index = rows.findIndex(row => String(row[0]) === String(review.id));
  const row = [
    review.id || '', review.orderId || '', review.userId || '', review.customerName || '', Number(review.rating || 0), review.text || '', review.image || '', JSON.stringify(review.productNames || []), review.createdAt || '', review.updatedAt || '', review.adminResponse || '', review.adminResponseAt || ''
  ];
  if (index < 0) sheet.appendRow(row);
  else sheet.getRange(index + 2, 1, 1, row.length).setValues([row]);
}

function deleteReview_(review) {
  const sheet = reviewsSheet_();
  const rows = sheet.getDataRange().getValues().slice(1);
  const index = rows.findIndex(row => (review.id && String(row[0]) === String(review.id)) || (review.orderId && String(row[1]) === String(review.orderId)));
  if (index >= 0) sheet.deleteRow(index + 2);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function testTreeTrack() {
  const sheet = ordersSheet_();
  sheet.appendRow([
    'TEST-' + Date.now(), new Date().toISOString(), new Date().toISOString(), 'pending', 'Test Order', 'TreeTrack Test', 'test@example.com', '08123456789', 'Jakarta', 'Test Address', 'Testing Google Sheets', '[]', 10000, '{}', ''
  ]);
  return 'Test order berhasil dibuat.';
}
