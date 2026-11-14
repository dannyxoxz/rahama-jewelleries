import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, 'data', 'products.json');
const SETTINGS_FILE = path.join(__dirname, 'data', 'settings.json');
const ENQUIRIES_FILE = path.join(__dirname, 'data', 'enquiries.json');
const TRASH_FILE = path.join(__dirname, 'data', 'trash.json');
const ORDERS_FILE = path.join(__dirname, 'data', 'orders.json');
const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || '';
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || '';
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'rahama_essentials';
const cloudinaryConfigured = Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
if (cloudinaryConfigured) cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });

let mongoClient;
let mongoCollection;
if (MONGODB_URI) {
  mongoClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await mongoClient.connect();
  mongoCollection = mongoClient.db(MONGODB_DB_NAME).collection('app_data');
  console.log('Connected to MongoDB.');
} else if (process.env.VERCEL) {
  throw new Error('MONGODB_URI is required in Vercel production environment variables.');
}
if (process.env.VERCEL && !cloudinaryConfigured) {
  throw new Error('Cloudinary is required in Vercel. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.');
}


if (JWT_SECRET.length < 32 || ADMIN_EMAIL.length < 5 || ADMIN_PASSWORD.length < 12 || ADMIN_PASSWORD.includes('CHANGE_THIS')) {
  console.error('\nConfiguration incomplete. Copy .env.example to .env and set JWT_SECRET, ADMIN_EMAIL and a unique ADMIN_PASSWORD (at least 12 characters).\n');
  process.exit(1);
}

const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: CLIENT_URL.split(',').map((s) => s.trim()), methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-7', legacyHeaders: false, message: { success: false, message: 'Too many login attempts. Please wait and try again.' } }));

function dataKey(file) { return path.basename(file, '.json'); }
async function readJson(file, fallback) {
  const key = dataKey(file);
  if (mongoCollection) {
    const stored = await mongoCollection.findOne({ _id: key });
    if (stored) return stored.value;
    let initial = fallback;
    try { initial = JSON.parse(await fs.readFile(file, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await mongoCollection.updateOne({ _id: key }, { $setOnInsert: { value: initial, updatedAt: new Date() } }, { upsert: true });
    return initial;
  }
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') { await fs.mkdir(path.dirname(file), { recursive: true }); await fs.writeFile(file, JSON.stringify(fallback, null, 2)); return fallback; }
    throw error;
  }
}
async function writeJson(file, value) {
  if (mongoCollection) {
    await mongoCollection.updateOne({ _id: dataKey(file) }, { $set: { value, updatedAt: new Date() } }, { upsert: true });
    return;
  }
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value, null, 2), 'utf8');
  await fs.rename(temp, file);
}
async function readProducts() { return readJson(DATA_FILE, []); }
async function writeProducts(products) { return writeJson(DATA_FILE, products); }
const defaultSettings = { storeName: 'Rahama Essentials', tagline: 'Style in every detail', whatsapp: process.env.WHATSAPP_NUMBER || '2347054301807', announcement: 'A little detail makes a lasting impression', contactEmail: '', instagram: '', heroTitle: 'Details that define you.', heroText: 'Thoughtful finishing touches, statement pieces and everyday favourites.', slideshowIds: [] };
function cleanProduct(input, existing = {}) {
  const name = String(input.name ?? existing.name ?? '').trim().slice(0, 100);
  const category = String(input.category ?? existing.category ?? '').trim().slice(0, 60);
  const description = String(input.description ?? existing.description ?? '').trim().slice(0, 600);
  const image = String(input.image ?? existing.image ?? '').trim().slice(0, 1000);
  const price = String(input.price ?? existing.price ?? '').trim().slice(0, 40);
  const featured = input.featured === undefined ? Boolean(existing.featured) : Boolean(input.featured);
  const available = input.available === undefined ? (existing.available !== false) : Boolean(input.available);
  if (!name || !category || !description || !image) throw new Error('Name, category, description and image URL are required.');
  if (image.startsWith('/images/') || image.startsWith('/uploads/')) {
    if (image.includes('..') || image.includes('\\')) throw new Error('Invalid local image path.');
  } else {
    let parsed;
    try { parsed = new URL(image); } catch { throw new Error('Image must be a valid HTTPS URL or a /images/ path.'); }
    if (parsed.protocol !== 'https:') throw new Error('Image URL must use HTTPS.');
  }
  const rawStock = input.stock === undefined ? existing.stock : input.stock;
  const stock = rawStock === '' || rawStock === null || rawStock === undefined ? null : Math.max(0, Number(rawStock) || 0);
  const lowStockAt = Math.max(0, Number(input.lowStockAt ?? existing.lowStockAt ?? 3) || 0);
  const salePrice = String(input.salePrice ?? existing.salePrice ?? '').trim().slice(0, 40);
  const draft = input.draft === undefined ? Boolean(existing.draft) : Boolean(input.draft);
  const tags = Array.isArray(input.tags) ? input.tags.map(x => String(x).trim()).filter(Boolean).slice(0, 12) : (existing.tags || []);
  return { ...existing, name, category, description, image, price, salePrice, stock, lowStockAt, draft, tags, featured, available, ...(input.imageHash ? { imageHash: String(input.imageHash) } : {}) };
}
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ success: false, message: 'Please sign in as an administrator.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.role !== 'admin' || payload.email !== ADMIN_EMAIL) throw new Error('Invalid role');
    req.admin = payload;
    next();
  } catch { return res.status(401).json({ success: false, message: 'Your admin session has expired. Please sign in again.' }); }
}

app.get('/api/health', (_req, res) => res.json({ success: true, service: 'Rahama Essentials API' }));
app.post('/api/auth/login', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (email !== ADMIN_EMAIL || !(await bcrypt.compare(password, adminPasswordHash))) {
    return res.status(401).json({ success: false, message: 'The email or password is incorrect.' });
  }
  const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  return res.json({ success: true, token, admin: { email: ADMIN_EMAIL } });
});
app.get('/api/products', async (_req, res, next) => {
  try {
    const products = await readProducts();
    const visible = products.filter((p) => p.available !== false && p.draft !== true);
    res.json({ success: true, data: visible, categories: [...new Set(visible.map((p) => p.category))].sort() });
  } catch (error) { next(error); }
});
app.get('/api/settings', async (_req, res, next) => { try { res.json({ success: true, data: { ...defaultSettings, ...await readJson(SETTINGS_FILE, defaultSettings) } }); } catch (e) { next(e); } });
app.get('/api/admin/settings', requireAdmin, async (_req, res, next) => { try { res.json({ success: true, data: { ...defaultSettings, ...await readJson(SETTINGS_FILE, defaultSettings) } }); } catch (e) { next(e); } });
app.put('/api/admin/settings', requireAdmin, async (req, res, next) => { try { const current = { ...defaultSettings, ...await readJson(SETTINGS_FILE, defaultSettings) }; const allowed = Object.keys(defaultSettings); for (const key of allowed) if (req.body[key] !== undefined) current[key] = typeof defaultSettings[key] === 'string' ? String(req.body[key]).slice(0, 500) : req.body[key]; current.whatsapp = current.whatsapp.replace(/\D/g, '').slice(0, 15); await writeJson(SETTINGS_FILE, current); res.json({ success: true, data: current, message: 'Store settings saved.' }); } catch (e) { next(e); } });
app.get('/api/admin/orders', requireAdmin, async (_req,res,next) => { try { res.json({success:true,data:await readJson(ORDERS_FILE,[])}); } catch(e){next(e);} });
app.post('/api/admin/orders', requireAdmin, async (req,res,next) => { try { const list=await readJson(ORDERS_FILE,[]); const item={id:crypto.randomUUID(),customer:String(req.body.customer||'').trim().slice(0,100),product:String(req.body.product||'').trim().slice(0,120),amount:Math.max(0,Number(req.body.amount)||0),status:['Pending','Completed','Cancelled'].includes(req.body.status)?req.body.status:'Pending',createdAt:new Date().toISOString()}; if(!item.customer||!item.product)return res.status(400).json({success:false,message:'Customer and product are required.'}); list.unshift(item); await writeJson(ORDERS_FILE,list); res.status(201).json({success:true,data:item,message:'Order recorded.'}); } catch(e){next(e);} });
app.put('/api/admin/orders/:id', requireAdmin, async (req,res,next) => { try { const list=await readJson(ORDERS_FILE,[]); const i=list.findIndex(x=>x.id===req.params.id); if(i<0)return res.status(404).json({success:false,message:'Order not found.'}); if(['Pending','Completed','Cancelled'].includes(req.body.status))list[i].status=req.body.status; if(req.body.amount!==undefined)list[i].amount=Math.max(0,Number(req.body.amount)||0); await writeJson(ORDERS_FILE,list); res.json({success:true,data:list[i]}); } catch(e){next(e);} });
app.get('/api/admin/enquiries', requireAdmin, async (_req, res, next) => { try { res.json({ success: true, data: await readJson(ENQUIRIES_FILE, []) }); } catch (e) { next(e); } });
app.post('/api/admin/enquiries', requireAdmin, async (req, res, next) => { try { const list = await readJson(ENQUIRIES_FILE, []); const item = { id: crypto.randomUUID(), customer: String(req.body.customer || '').trim().slice(0,100), phone: String(req.body.phone || '').trim().slice(0,30), product: String(req.body.product || '').trim().slice(0,120), notes: String(req.body.notes || '').trim().slice(0,1000), status: 'New', createdAt: new Date().toISOString() }; if (!item.customer || !item.product) return res.status(400).json({ success:false, message:'Customer name and product are required.' }); list.unshift(item); await writeJson(ENQUIRIES_FILE, list); res.status(201).json({ success:true, data:item, message:'Enquiry recorded.' }); } catch(e) { next(e); } });
app.put('/api/admin/enquiries/:id', requireAdmin, async (req, res, next) => { try { const list = await readJson(ENQUIRIES_FILE, []); const i = list.findIndex(x => x.id === req.params.id); if(i < 0) return res.status(404).json({success:false,message:'Enquiry not found.'}); list[i] = {...list[i], status: ['New','Contacted','Resolved'].includes(req.body.status) ? req.body.status : list[i].status, notes: req.body.notes === undefined ? list[i].notes : String(req.body.notes).slice(0,1000)}; await writeJson(ENQUIRIES_FILE,list); res.json({success:true,data:list[i]}); } catch(e) { next(e); } });
app.delete('/api/admin/enquiries/:id', requireAdmin, async (req,res,next) => { try { const list=await readJson(ENQUIRIES_FILE,[]); const nextList=list.filter(x=>x.id!==req.params.id); if(nextList.length===list.length)return res.status(404).json({success:false,message:'Enquiry not found.'}); await writeJson(ENQUIRIES_FILE,nextList); res.json({success:true,message:'Enquiry removed.'}); } catch(e){next(e);} });
app.get('/api/admin/backup', requireAdmin, async (_req,res,next) => { try { const payload = { exportedAt:new Date().toISOString(), products:await readProducts(), settings:{...defaultSettings,...await readJson(SETTINGS_FILE,defaultSettings)}, enquiries:await readJson(ENQUIRIES_FILE,[]), trash:await readJson(TRASH_FILE,[]), orders:await readJson(ORDERS_FILE,[]) }; res.setHeader('Content-Disposition', `attachment; filename=rahama-backup-${new Date().toISOString().slice(0,10)}.json`); res.json(payload); } catch(e){next(e);} });
app.post('/api/admin/images/signature', requireAdmin, async (req, res, next) => {
  try {
    if (!cloudinaryConfigured) return res.status(503).json({ success: false, message: 'Cloudinary is not configured. Add the three Cloudinary environment variables to the backend service.' });
    const imageHash = String(req.body?.imageHash || '').trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(imageHash)) return res.status(400).json({ success: false, message: 'The image could not be verified. Please select it again.' });
    const products = await readProducts();
    const duplicate = products.find((product) => product.imageHash === imageHash);
    if (duplicate) return res.json({ success: true, duplicate: true, data: { existingName: duplicate.name, image: duplicate.image } });
    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'rahama-essentials/products';
    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, process.env.CLOUDINARY_API_SECRET);
    res.json({ success: true, cloudName: process.env.CLOUDINARY_CLOUD_NAME, apiKey: process.env.CLOUDINARY_API_KEY, timestamp, folder, signature });
  } catch (error) { next(error); }
});
app.get('/api/admin/products', requireAdmin, async (_req, res, next) => {
  try { res.json({ success: true, data: await readProducts() }); } catch (error) { next(error); }
});
app.post('/api/admin/products', requireAdmin, async (req, res, next) => {
  try {
    const products = await readProducts();
    const product = cleanProduct(req.body);
    product.id = `rahama-${crypto.randomUUID()}`;
    products.unshift(product);
    await writeProducts(products);
    res.status(201).json({ success: true, data: product, message: 'Product added.' });
  } catch (error) { if (error.message.includes('required') || error.message.includes('URL')) return res.status(400).json({ success: false, message: error.message }); next(error); }
});
app.put('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const products = await readProducts();
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index < 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    products[index] = cleanProduct(req.body, products[index]);
    await writeProducts(products);
    res.json({ success: true, data: products[index], message: 'Product updated.' });
  } catch (error) { if (error.message.includes('required') || error.message.includes('URL')) return res.status(400).json({ success: false, message: error.message }); next(error); }
});
app.get('/api/admin/trash', requireAdmin, async (_req,res,next) => { try { res.json({success:true,data:await readJson(TRASH_FILE,[])}); } catch(e){next(e);} });
app.post('/api/admin/trash/:id/restore', requireAdmin, async (req,res,next) => { try { const trash=await readJson(TRASH_FILE,[]); const i=trash.findIndex(p=>p.id===req.params.id); if(i<0)return res.status(404).json({success:false,message:'Archived product not found.'}); const item=trash.splice(i,1)[0]; delete item.deletedAt; const products=await readProducts(); products.unshift(item); await writeProducts(products); await writeJson(TRASH_FILE,trash); res.json({success:true,message:`${item.name} restored to products.`}); } catch(e){next(e);} });
app.delete('/api/admin/products/:id', requireAdmin, async (req, res, next) => {
  try {
    const products = await readProducts();
    const item = products.find((p) => p.id === req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Product not found.' });
    const nextProducts = products.filter((p) => p.id !== req.params.id);
    const trash = await readJson(TRASH_FILE,[]); trash.unshift({...item,deletedAt:new Date().toISOString()});
    await writeProducts(nextProducts); await writeJson(TRASH_FILE,trash);
    res.json({ success: true, message: 'Product moved to Recently deleted. You can restore it from the dashboard.' });
  } catch (error) { next(error); }
});
app.use((req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  const message = error?.message?.includes('cloudinary') || error?.message?.includes('Cloudinary') ? `Image upload failed: ${error.message}` : 'Something went wrong on the server.';
  res.status(500).json({ success: false, message });
});

await readProducts();
await readJson(SETTINGS_FILE, defaultSettings);
await readJson(ENQUIRIES_FILE, []);
await readJson(TRASH_FILE, []);
await readJson(ORDERS_FILE, []);
const BACKUP_DIR = path.join(__dirname, 'backups');
async function createDailyBackup() { try { await fs.mkdir(BACKUP_DIR, {recursive:true}); const day = new Date().toISOString().slice(0,10); const target = path.join(BACKUP_DIR, `rahama-${day}.json`); try { await fs.access(target); return; } catch {} const snapshot = {createdAt:new Date().toISOString(),products:await readProducts(),settings:await readJson(SETTINGS_FILE,defaultSettings),enquiries:await readJson(ENQUIRIES_FILE,[]),trash:await readJson(TRASH_FILE,[]),orders:await readJson(ORDERS_FILE,[])}; await fs.writeFile(target,JSON.stringify(snapshot,null,2)); const files=(await fs.readdir(BACKUP_DIR)).filter(x=>x.endsWith('.json')).sort(); for(const old of files.slice(0,Math.max(0,files.length-14))) await fs.unlink(path.join(BACKUP_DIR,old)).catch(()=>{}); } catch(e) { console.error('Automatic backup warning:',e.message); } }
if (!process.env.VERCEL) { await createDailyBackup(); const backupTimer=setInterval(createDailyBackup, 60*60*1000); backupTimer.unref(); }
if (!process.env.VERCEL) app.listen(PORT, () => console.log(`Rahama Essentials API running at http://localhost:${PORT}`));

export default app;
