import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import { initDb } from './src/server/db.ts';
import { generateToken, authenticateToken, authorizeRole, AuthRequest } from './src/server/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  console.log('Starting server initialization...');
  const app = express();
  const PORT = 3000;
  console.log('Initializing database...');
  const db = await initDb();
  console.log('Database initialized successfully.');

  app.use(cors());
  app.use(express.json());

  // --- API Routes ---

  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, name, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await db.run(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        [email, hashedPassword, name, role || 'USER']
      );
      const user = { id: result.lastID!, email, role: role || 'USER' };
      const token = await generateToken(user);
      res.status(201).json({ token, user: { id: user.id, email, name, role: user.role } });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = await generateToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, eco_score: user.eco_score } });
  });

  // Product Routes
  app.get('/api/products', async (req, res) => {
    const { category, search, sort } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      query += ' AND (name LIKE ? OR description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (sort === 'carbon_low') {
      query += ' ORDER BY carbon_footprint ASC';
    } else if (sort === 'carbon_high') {
      query += ' ORDER BY carbon_footprint DESC';
    } else if (sort === 'price_low') {
      query += ' ORDER BY price ASC';
    } else if (sort === 'price_high') {
      query += ' ORDER BY price DESC';
    }

    const products = await db.all(query, params);
    res.json(products);
  });

  app.get('/api/products/:id', async (req, res) => {
    const product = await db.get('SELECT * FROM products WHERE id = ?', req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  });

  // User Routes (Protected)
  app.get('/api/profile', authenticateToken, async (req: AuthRequest, res) => {
    const user = await db.get('SELECT id, email, name, role, eco_score, created_at FROM users WHERE id = ?', req.user!.id);
    res.json(user);
  });

  app.put('/api/profile', authenticateToken, async (req: AuthRequest, res) => {
    const { name, email, password } = req.body;
    try {
      let query = 'UPDATE users SET name = ?, email = ?';
      const params = [name, email];

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        query += ', password = ?';
        params.push(hashedPassword);
      }

      query += ' WHERE id = ?';
      params.push(req.user!.id);

      await db.run(query, params);
      const updatedUser = await db.get('SELECT id, email, name, role, eco_score FROM users WHERE id = ?', req.user!.id);
      res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error: any) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      res.status(500).json({ message: 'Failed to update profile' });
    }
  });

  app.get('/api/profile/eco-breakdown', authenticateToken, async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    
    // Calculate breakdown
    const stats = await db.get(`
      SELECT 
        COUNT(o.id) as total_orders,
        SUM(o.total_carbon) as total_carbon_emitted,
        SUM(oi.quantity) as total_items,
        SUM(CASE WHEN p.is_eco_certified = 1 THEN oi.quantity ELSE 0 END) as eco_certified_items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.user_id = ?
    `, userId);

    // Dynamic calculation logic
    // 1. 50 points per order
    // 2. 20 points per eco-certified item
    // 3. Bonus for low average carbon (if avg < 5kg per item)
    const orderPoints = (stats.total_orders || 0) * 50;
    const certPoints = (stats.eco_certified_items || 0) * 20;
    const avgCarbon = stats.total_items > 0 ? stats.total_carbon_emitted / stats.total_items : 0;
    const efficiencyBonus = (avgCarbon > 0 && avgCarbon < 5) ? Math.floor((5 - avgCarbon) * 100) : 0;

    const totalScore = orderPoints + certPoints + efficiencyBonus;

    // Sync score to user table
    await db.run('UPDATE users SET eco_score = ? WHERE id = ?', [totalScore, userId]);

    res.json({
      totalScore,
      breakdown: {
        orderPoints,
        certPoints,
        efficiencyBonus,
        details: {
          totalOrders: stats.total_orders || 0,
          ecoCertifiedItems: stats.eco_certified_items || 0,
          averageCarbonPerItem: avgCarbon.toFixed(2)
        }
      }
    });
  });

  // Order Routes (Protected)
  app.post('/api/orders', authenticateToken, async (req: AuthRequest, res) => {
    const { items, total_price, total_carbon } = req.body;
    try {
      const result = await db.run(
        'INSERT INTO orders (user_id, total_price, total_carbon) VALUES (?, ?, ?)',
        [req.user!.id, total_price, total_carbon]
      );
      const orderId = result.lastID!;

      for (const item of items) {
        await db.run(
          'INSERT INTO order_items (order_id, product_id, quantity, price, carbon_footprint) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.id, item.quantity, item.price, item.carbon_footprint]
        );
      }

      // Update user eco-score based on carbon savings (simplified logic)
      // Assume a baseline carbon footprint of 10 CO2e/kg for comparison
      const baselineCarbon = items.reduce((acc: number, item: any) => acc + (10 * item.quantity), 0);
      const savings = baselineCarbon - total_carbon;
      if (savings > 0) {
        await db.run('UPDATE users SET eco_score = eco_score + ? WHERE id = ?', [Math.floor(savings * 10), req.user!.id]);
      }

      res.status(201).json({ orderId, message: 'Order placed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to place order' });
    }
  });

  app.get('/api/orders', authenticateToken, async (req: AuthRequest, res) => {
    const orders = await db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', req.user!.id);
    res.json(orders);
  });

  // Analytics (Admin Only)
  app.get('/api/admin/stats', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
    const totalUsers = await db.get('SELECT COUNT(*) as count FROM users');
    const totalOrders = await db.get('SELECT COUNT(*) as count FROM orders');
    const totalCarbonSaved = await db.get('SELECT SUM(10 * quantity - carbon_footprint * quantity) as savings FROM order_items');
    const salesByCategory = await db.all(`
      SELECT p.category, SUM(oi.price * oi.quantity) as total_sales
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      GROUP BY p.category
    `);
    const carbonByMonth = await db.all(`
      SELECT strftime('%Y-%m', created_at) as month, SUM(total_carbon) as carbon
      FROM orders
      GROUP BY month
      ORDER BY month ASC
    `);

    res.json({
      totalUsers: totalUsers.count,
      totalOrders: totalOrders.count,
      totalCarbonSaved: totalCarbonSaved.savings || 0,
      salesByCategory,
      carbonByMonth
    });
  });

  // --- Vite Setup ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
