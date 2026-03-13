const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const uploadsPath = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath);
}

// Function to initialize the database
async function getDb() {
  return open({
    filename: dbPath,
    driver: sqlite3.Database
  });
}

async function initializeDatabase() {
  const db = await getDb();
  
  // Create tables
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
      payment_month TEXT,
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

  try {
    await db.exec(`ALTER TABLE Payments ADD COLUMN payment_month TEXT;`);
  } catch (e) {
    // Column already exists
  }

  console.log('Tables created or verified.');

  // Seed the apartments
  const aptCount = await db.get('SELECT COUNT(*) as count FROM Apartments');
  
  if (aptCount.count === 0) {
    console.log('Seeding apartments...');
    // Towers 1 to 9 (4 levels)
    // Towers 10 to 11 (5 levels)
    // 4 per level (A, B, C, D)
    const letters = ['A', 'B', 'C', 'D'];
    const generateApartments = (towerNum, levels) => {
      for (let level = 1; level <= levels; level++) {
        for (let l of letters) {
          const id = `T${towerNum}-${level}${l}`;
          db.run(
            'INSERT INTO Apartments (id, tower, level, letter) VALUES (?, ?, ?, ?)',
            [id, towerNum, level, l]
          );
        }
      }
    };

    for (let t = 1; t <= 9; t++) generateApartments(t, 4);
    for (let t = 10; t <= 11; t++) generateApartments(t, 5);

    console.log('Apartments seeded.');
  } else {
    console.log('Apartments already seeded.');
  }
}

module.exports = { getDb, initializeDatabase };
