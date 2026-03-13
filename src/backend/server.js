const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { getDb, initializeDatabase } = require('./database');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files in production
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Initialize DB and start server
(async () => {
  await getDb().then(db => db.close());
  const db = await getDb();
  await db.exec(`
    CREATE TABLE IF NOT EXISTS Apartments (
      id TEXT PRIMARY KEY,
      tower INTEGER,
      level INTEGER,
      letter TEXT
    );

    CREATE TABLE IF NOT EXISTS Payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      apartment_id TEXT,
      resident_name TEXT,
      receipt_image TEXT,
      status TEXT DEFAULT 'PENDING',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(apartment_id) REFERENCES Apartments(id)
    );

    CREATE TABLE IF NOT EXISTS Admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    );
  `);

  console.log('Tables created or verified.');

  const adminCount = await db.get('SELECT COUNT(*) as count FROM Admins');
  if (adminCount.count === 0) {
    console.log('Seeding admin user...');
    // Hardcoded single user for the Residencial administrator
    await db.run('INSERT INTO Admins (username, password) VALUES (?, ?)', ['admin', 'Torres2026']);
  }

  const aptCount = await db.get('SELECT COUNT(*) as count FROM Apartments');
  
  if (aptCount.count === 0) {
    console.log('Seeding apartments...');
    const letters = ['A', 'B', 'C', 'D'];
    const generateApartments = async (towerNum, levels) => {
      for (let level = 1; level <= levels; level++) {
        for (let l of letters) {
          const id = `T${towerNum}-${level}${l}`;
          await db.run(
            'INSERT INTO Apartments (id, tower, level, letter) VALUES (?, ?, ?, ?)',
            [id, towerNum, level, l]
          );
        }
      }
    };

    for (let t = 1; t <= 9; t++) await generateApartments(t, 4);
    for (let t = 10; t <= 11; t++) await generateApartments(t, 5);
    console.log('Apartments seeded.');
  }

  // Routes

  const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === 'Bearer admin-authorized-token') {
      next();
    } else {
      res.status(403).json({ error: 'Acceso denegado. Se requiere autenticación de administrador.' });
    }
  };

  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const db = await getDb();
      const admin = await db.get('SELECT * FROM Admins WHERE username = ? AND password = ?', [username, password]);
      
      if (admin) {
        res.json({ token: 'admin-authorized-token', message: 'Login exitoso' });
      } else {
        res.status(401).json({ error: 'Credenciales inválidas' });
      }
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 1. Get all apartments to populate the frontend selects
  app.get('/api/apartments', async (req, res) => {
    try {
      const db = await getDb();
      const apartments = await db.all('SELECT * FROM Apartments ORDER BY tower, level, letter');
      res.json(apartments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Submit payment (User)
  app.post('/api/payments', upload.single('receipt'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Receipt image is required' });
      }
      
      const { apartment_id, resident_name, payment_month } = req.body;
      const receipt_image = req.file.path; // e.g. "uploads/xxx.jpg"

      const db = await getDb();
      const result = await db.run(
        'INSERT INTO Payments (apartment_id, resident_name, payment_month, receipt_image) VALUES (?, ?, ?, ?)',
        [apartment_id, resident_name, payment_month, receipt_image]
      );

      res.status(201).json({ 
        message: 'Payment report submitted successfully',
        payment_id: result.lastID 
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Admin: list all payments
  app.get('/api/admin/payments', verifyAdmin, async (req, res) => {
    try {
      const db = await getDb();
      const payments = await db.all(`
        SELECT p.*, a.tower, a.level, a.letter 
        FROM Payments p 
        JOIN Apartments a ON p.apartment_id = a.id 
        ORDER BY p.created_at DESC
      `);
      res.json(payments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Admin: update payment status (Approve/Reject)
  app.patch('/api/admin/payments/:id', verifyAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const db = await getDb();
      await db.run('UPDATE Payments SET status = ? WHERE id = ?', [status, id]);
      res.json({ message: `Payment ${id} marked as ${status}` });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. User: Get Payment Status by ID 
  app.get('/api/payments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const db = await getDb();
      const payment = await db.get(`
        SELECT p.id, p.apartment_id, p.resident_name, p.payment_month, p.status, p.created_at, a.tower 
        FROM Payments p JOIN Apartments a ON p.apartment_id = a.id 
        WHERE p.id = ?
      `, [id]);
      
      if (!payment) {
        return res.status(404).json({ error: 'Pago no encontrado. Verifica tu ID.' });
      }

      res.json(payment);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. User: Get Payment Receipt PDF
  app.get('/api/payments/:id/pdf', async (req, res) => {
    try {
      const { id } = req.params;
      const db = await getDb();
      const payment = await db.get('SELECT * FROM Payments WHERE id = ? AND status = "APPROVED"', [id]);
      
      if (!payment) {
        return res.status(404).json({ error: 'Receipt not found or not yet approved' });
      }

      const doc = new PDFDocument({ margin: 50 });
      let filename = `Recibo_${payment.apartment_id}_${id}.pdf`;
      res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
      res.setHeader('Content-type', 'application/pdf');

      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      doc.pipe(res);

      // Add logo or title
      doc.fontSize(22).text('Condominio Torres Petapa', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(14).text('Recibo de Pago - Cuota de Servicios', { align: 'center', color: '#333333' });
      doc.moveDown(2);

      doc.fontSize(12).fillColor('#000000');
      doc.text(`Número de Recibo: #${payment.id}`);
      doc.text(`Fecha de Reporte: ${new Date(payment.created_at).toLocaleString()}`);
      doc.text(`Estado: APROBADO`);
      doc.moveDown();
      
      const boxTop = doc.y;
      doc.rect(50, boxTop, 500, 140).stroke();
      doc.moveDown(1);
      
      doc.text(`   Residente: ${payment.resident_name}`);
      doc.text(`   Torre: ${payment.tower || payment.apartment_id.split('-')[0]}`);
      doc.text(`   Apartamento: ${payment.apartment_id}`);
      doc.text(`   Concepto: Cuota de Servicios Mensual`);
      doc.moveDown(0.5);
      doc.fontSize(14).text(`   Total Pagado: Q. 270.00`, { underline: true });
      doc.fontSize(12);

      doc.moveDown(3);
      doc.text('Información Bancaria de Referencia:', { underline: true });
      doc.moveDown(0.5);
      doc.text('Banco: Banco Industrial (BI)');
      doc.text('Cuenta Monetaria: 1270823435');
      
      doc.moveDown(4);
      doc.fontSize(10).fillColor('gray').text('Este es un recibo generado automáticamente y es comprobante de que la administración ha validado su transferencia.', { align: 'center' });

      doc.end();

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Catch-all for React Router
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
  });

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });

})();
