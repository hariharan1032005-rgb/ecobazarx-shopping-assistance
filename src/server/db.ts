import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import bcrypt from 'bcryptjs';

export async function initDb() {
  console.log('Opening SQLite database...');
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
  console.log('Database opened. Creating tables...');

  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'USER',
      eco_score INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      carbon_footprint REAL NOT NULL, -- CO2e/kg
      is_eco_certified BOOLEAN DEFAULT 0,
      eco_rating REAL DEFAULT 0,
      category TEXT,
      image_url TEXT,
      seller_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (seller_id) REFERENCES users(id)
    )
  `);

  // Orders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_price REAL NOT NULL,
      total_carbon REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Order Items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      carbon_footprint REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  // Seed Admin if not exists
  const admin = await db.get('SELECT * FROM users WHERE role = ?', 'ADMIN');
  if (!admin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.run(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      ['admin@ecobazaar.com', hashedPassword, 'Admin User', 'ADMIN']
    );
  }

  // Seed some products if empty
  const productCount = await db.get('SELECT COUNT(*) as count FROM products');
  if (productCount.count === 0) {
    const products = [
      { name: 'Organic Cotton T-Shirt', description: '100% organic cotton, sustainably made.', price: 25.0, carbon: 2.5, certified: 1, rating: 4.8, category: 'Apparel' },
      { name: 'Bamboo Toothbrush', description: 'Biodegradable bamboo handle.', price: 5.0, carbon: 0.1, certified: 1, rating: 4.9, category: 'Personal Care' },
      { name: 'Recycled Plastic Water Bottle', description: 'Made from 100% recycled ocean plastic.', price: 15.0, carbon: 0.8, certified: 1, rating: 4.5, category: 'Home' },
      { name: 'Standard Cotton T-Shirt', description: 'Regular cotton t-shirt.', price: 15.0, carbon: 7.0, certified: 0, rating: 3.2, category: 'Apparel' },
      { name: 'Electric Kettle', description: 'Energy efficient kettle.', price: 45.0, carbon: 12.0, certified: 0, rating: 4.0, category: 'Appliances' }
    ];

    for (const p of products) {
      await db.run(
        'INSERT INTO products (name, description, price, carbon_footprint, is_eco_certified, eco_rating, category) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [p.name, p.description, p.price, p.carbon, p.certified, p.rating, p.category]
      );
    }
  }

  return db;
}
