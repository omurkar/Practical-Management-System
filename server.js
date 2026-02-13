import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type', 'x-folder-path'] }));
app.use(express.json());

// 1. Upload Logic
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const teacherPath = req.headers['x-folder-path'];
      if (!teacherPath) return cb(new Error('Missing x-folder-path header'));
      
      let cleanPath = decodeURIComponent(teacherPath).replace(/["']/g, "").trim();
      await fs.ensureDir(cleanPath);
      console.log(`📂 Saving to: ${cleanPath}`);
      cb(null, cleanPath);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, safeName);
  }
});

const upload = multer({ storage: storage });

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file received' });
  console.log(`✅ Uploaded: ${req.file.filename}`);
  res.json({ message: 'Success', path: req.file.path, filename: req.file.filename });
});

// 2. NEW PREVIEW ENDPOINT (Crucial for Teacher Preview)
app.get('/api/preview', (req, res) => {
  const filePath = req.query.path; // Get absolute path from query param

  if (!filePath) {
    return res.status(400).send("No file path provided.");
  }

  // Security: Basic check to ensure file exists before trying to send it
  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File not found on server.");
  }

  // Serve the file
  res.sendFile(path.resolve(filePath));
});

// Error Handler
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);
  res.status(500).json({ error: err.message });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});