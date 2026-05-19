/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const PORT = 3000;
const dbFile = 'database.db';
const db = new Database(dbFile);

// Initialize Database Schema
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL,
      content TEXT NOT NULL,
      image_path TEXT,
      date TEXT DEFAULT CURRENT_TIMESTAMP,
      author_id TEXT,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      service TEXT,
      message TEXT NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS subscribers (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS economic_indicators (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      value REAL,
      unit TEXT,
      year INTEGER,
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      date TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (error) {
  console.error("Error initializing SQLite database:", error);
}

// Function to fetch World Bank data
async function updateEconomicIndicator(code: string, country: string = 'ETH') {
  try {
    const response = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/${code}?format=json&mrnev=1`);
    const data = await response.json();
    
    if (Array.isArray(data) && data[1] && data[1][0]) {
      const entry = data[1][0];
      const indicatorValue = entry.value;
      const indicatorName = entry.indicator.value;
      const year = entry.date;
      
      db.prepare(`
        INSERT INTO economic_indicators (code, name, value, year, last_updated)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(code) DO UPDATE SET
          value = excluded.value,
          year = excluded.year,
          last_updated = CURRENT_TIMESTAMP
      `).run(code, indicatorName, indicatorValue, year);
      
      return { code, name: indicatorName, value: indicatorValue, year };
    }
  } catch (error) {
    console.error(`Failed to update indicator ${code}:`, error);
  }
  return null;
}

// Seed initial blog posts if empty
const count = db.prepare('SELECT COUNT(*) as count FROM blog_posts').get() as { count: number };
if (count.count === 0) {
  const insertPost = db.prepare(`
    INSERT INTO blog_posts (id, title, excerpt, content, image_path)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  const posts = [
    {
      id: uuidv4(),
      title: "Sustainable Urbanization in Emerging Economies",
      excerpt: "How rapid city growth can be managed to ensure social equity and environmental protection.",
      content: "Full content about urban growth strategies...",
      image_path: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: uuidv4(),
      title: "Leveraging AI for Economic Forecasting",
      excerpt: "New computational models are providing unprecedented accuracy in predicting market trends.",
      content: "Full content about AI in economics...",
      image_path: "https://images.unsplash.com/photo-1518186239717-2e9b1367ea9b?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: uuidv4(),
      title: "The Green Energy Transition Report 2024",
      excerpt: "Global shifts toward renewable energy source are reshaping investment landscapes.",
      content: "Full content about energy transition...",
      image_path: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=800"
    }
  ];

  for (const post of posts) {
    insertPost.run(post.id, post.title, post.excerpt, post.content, post.image_path);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  
  // Auth - Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    try {
      const user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?')
        .get(email, password) as any;
      
      if (user) {
        res.json(user);
      } else {
        res.status(401).json({ error: 'Invalid credentials' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // Blog Posts / News
  app.get('/api/blog', (req, res) => {
    try {
      const posts = db.prepare('SELECT * FROM blog_posts ORDER BY date DESC').all();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch blog posts' });
    }
  });

  app.get('/api/news', (req, res) => {
    try {
      const posts = db.prepare('SELECT * FROM blog_posts ORDER BY date DESC LIMIT 4').all();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch news posts' });
    }
  });

  app.post('/api/blog', (req, res) => {
    const { title, excerpt, content, imagePath, userId } = req.body;
    
    // Role Check
    const user = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
      return res.status(403).json({ error: 'Unauthorized: Requires Editor or Admin role' });
    }

    if (!title || !excerpt || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const id = uuidv4();
    try {
      db.prepare(`
        INSERT INTO blog_posts (id, title, excerpt, content, image_path, author_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, title, excerpt, content, imagePath || '', userId);
      res.status(201).json({ id, title, excerpt });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create blog post' });
    }
  });

  // Auth - Simple Sign Up
  app.post('/api/auth/register', (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const id = uuidv4();
    try {
      // For demo: First user becomes admin, others are viewers
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
      const role = userCount.count === 0 ? 'admin' : 'user';
      
      db.prepare('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)')
        .run(id, name, email, password, role);
      
      res.status(201).json({ id, name, email, role });
    } catch (error) {
      res.status(400).json({ error: 'Email already exists or invalid data' });
    }
  });

  // Contact Form
  app.post('/api/contact', (req, res) => {
    const { name, email, message, service } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      db.prepare('INSERT INTO contacts (id, name, email, service, message) VALUES (?, ?, ?, ?, ?)')
        .run(uuidv4(), name, email, service || null, message);
      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit' });
    }
  });

  // Newsletter
  app.post('/api/subscribe', (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    try {
      db.prepare('INSERT INTO subscribers (id, email) VALUES (?, ?)').run(uuidv4(), email);
      res.json({ success: true, message: 'Subscribed' });
    } catch (error) {
      res.status(400).json({ error: 'Already subscribed' });
    }
  });

  // Feedback Form
  app.post('/api/feedback', (req, res) => {
    const { userId, category, message } = req.body;
    if (!category || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    try {
      db.prepare('INSERT INTO feedback (id, user_id, category, message) VALUES (?, ?, ?, ?)')
        .run(uuidv4(), userId || null, category, message);
      res.json({ success: true, message: 'Feedback submitted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to submit feedback' });
    }
  });

  // Dashboard Data Mockup
  app.get('/api/stats', (req, res) => {
    res.json({
      gdp: [2.5, 3.1, 2.8, 3.5, 4.2, 4.8],
      employment: [94.2, 94.5, 95.1, 95.8, 96.2, 96.5],
      investment: [120, 145, 138, 160, 185, 210],
      labels: ['2019', '2020', '2021', '2022', '2023', '2024']
    });
  });

  // World Bank GDP Indicator
  app.get('/api/indicator/gdp', async (req, res) => {
    const code = 'NY.GDP.MKTP.CD';
    const country = req.query.country as string || 'ETH';
    try {
      const response = await fetch(`https://api.worldbank.org/v2/country/${country}/indicator/${code}?format=json&mrnev=1`);
      const data = await response.json();
      
      if (Array.isArray(data) && data[1] && data[1][0]) {
        const entry = data[1][0];
        res.json({ 
            code, 
            name: entry.indicator.value, 
            value: entry.value, 
            year: entry.date,
            country: country
        });
      } else {
        res.status(404).json({ error: 'Indicator not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch GDP indicator' });
    }
  });

  // Vite/Static distribution
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
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
