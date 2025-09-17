// ================================
// GEV APP - BACKEND COMPLETO
// Node.js + Express + SQLite + Auth
// ================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:19006', // endereço do seu frontend web
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// ================================
// MULTER - UPLOAD DE IMAGENS
// ================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/produtos';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `produto_${Date.now()}_${file.originalname}`);
  }
});
const upload = multer({ storage });

// ================================
// DATABASE SETUP
// ================================

const db = new sqlite3.Database('gev_app.db');

db.serialize(() => {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      reset_token TEXT,
      reset_expires DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de produtos
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      preco_custo REAL NOT NULL,
      preco_venda REAL NOT NULL,
      margem_lucro REAL NOT NULL,
      imagem TEXT,
      observacoes TEXT,
      estoque_atual INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de vendas
  db.run(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_nome TEXT,
      total REAL,
      custo_total REAL,
      lucro REAL,
      forma_pagamento TEXT,
      parcelas INTEGER,
      observacoes TEXT,
      status TEXT DEFAULT 'finalizada',
      data_venda DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de itens da venda
  db.run(`
    CREATE TABLE IF NOT EXISTS vendas_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      produto_nome TEXT,
      quantidade INTEGER,
      preco_unitario REAL,
      custo_unitario REAL,
      subtotal REAL
    )
  `);

  console.log('✅ Database tables created successfully!');
});

// ================================
// AUTENTICAÇÃO
// ================================

// Register
app.post('/api/register', async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha)
    return res.json({success: false, error: 'Preencha todos os campos'});
    //return res.status(400).json({ success: false, error: 'Preencha todos os campos' });

  //db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    //if (err) return res.status(500).json({ success: false, error: err.message });
    //if (user) return res.status(400).json({ success: false, error: 'Email já cadastrado' });

    const hashedPassword = await bcrypt.hash(senha, 10);
    db.run(
      'INSERT INTO users (nome, email, senha) VALUES (?, ?, ?)', 
      [nome, email, hashedPassword], 
      function(err) {
      if (err){return res.json({ success: false, error: 'Erro ao cadastrar: ' + err.message });
      }
         //return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, userId: this.lastID//message: 'Cadastro realizado com sucesso!', userId: this.lastID });
    });
  });
});

// Login
app.post('/api/login', (req, res) => {
  const { email, senha } = req.body;
  //if (!email || !senha)
   // return res.status(400).json({ success: false, error: 'Preencha todos os campos' });
   db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (err) return res.json({ success: false, error: 'Erro no servidor' });
    if (!user) return res.json({ success: false, error: 'Usuário não encontrado' });

    const match = await bcrypt.compare(senha, user.senha);
    if (!match) return res.json({ success: false, error: 'Senha incorreta' });

    res.json({ success: true, userId: user.id, nome: user.nome });
  });
});


// Forgot password
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, error: 'Informe o email' });

  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!user) return res.status(400).json({ success: false, error: 'Email não encontrado' });

    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hora

    db.run('UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?', [token, expires, email], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Token gerado, válido por 1 hora', token });
    });
  });
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  const { token, novaSenha } = req.body;
  if (!token || !novaSenha) return res.status(400).json({ success: false, error: 'Token e nova senha são obrigatórios' });

  db.get('SELECT * FROM users WHERE reset_token = ? AND reset_expires >= ?', [token, new Date().toISOString()], async (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!user) return res.status(400).json({ success: false, error: 'Token inválido ou expirado' });

    const hashedPassword = await bcrypt.hash(novaSenha, 10);
    db.run('UPDATE users SET senha = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hashedPassword, user.id], (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Senha atualizada com sucesso!' });
    });
  });
});


// ================================
// DASHBOARD COMPLETO - CARDS + HISTÓRICO
// ================================
app.get('/api/dashboard', (req, res) => {
  const hoje = new Date();
  const mesAtual = hoje.getMonth() + 1; // 1-12
  const anoAtual = hoje.getFullYear();

  // 1) Total de produtos cadastrados
  db.get(`SELECT COUNT(*) as totalProdutos FROM produtos`, [], (err, produtos) => {
    if (err) return res.status(500).json({ error: err.message });

    // 2) Total de vendas no mês
    db.get(
      `SELECT COUNT(*) as totalVendas 
       FROM vendas 
       WHERE strftime('%m', data_venda) = ? 
         AND strftime('%Y', data_venda) = ?`,
      [mesAtual.toString().padStart(2, '0'), anoAtual.toString()],
      (err, vendas) => {
        if (err) return res.status(500).json({ error: err.message });

        // 3) Lucro do mês
        db.get(
          `SELECT SUM(lucro) as lucroMes
           FROM vendas
           WHERE strftime('%m', data_venda) = ? 
             AND strftime('%Y', data_venda) = ?`,
          [mesAtual.toString().padStart(2, '0'), anoAtual.toString()],
          (err, lucro) => {
            if (err) return res.status(500).json({ error: err.message });

            // 4) Vendas pendentes
            db.get(`SELECT COUNT(*) as pendentes FROM vendas WHERE status = 'pendente'`, [], (err, pendentes) => {
              if (err) return res.status(500).json({ error: err.message });

              // 5) Histórico diário de vendas e lucro
              db.all(
                `SELECT 
                   strftime('%d', data_venda) as dia,
                   SUM(total) as total_vendido,
                   SUM(lucro) as lucro
                 FROM vendas
                 WHERE strftime('%m', data_venda) = ? 
                   AND strftime('%Y', data_venda) = ?
                 GROUP BY dia
                 ORDER BY dia ASC`,
                [mesAtual.toString().padStart(2, '0'), anoAtual.toString()],
                (err, rows) => {
                  if (err) return res.status(500).json({ error: err.message });

                  // Preencher dias sem vendas com zero
                  const diasNoMes = new Date(anoAtual, mesAtual, 0).getDate();
                  const historico = [];
                  for (let d = 1; d <= diasNoMes; d++) {
                    const diaStr = d.toString().padStart(2, '0');
                    const dataDia = rows.find(r => r.dia === diaStr);
                    historico.push({
                      dia: diaStr,
                      total_vendido: dataDia && dataDia.total_vendido != null ? Number (dataDia.total_vendido) : 0,
                      lucro: dataDia && dataDia.lucro != null ? Number (dataDia.lucro): 0,
                    });
                  }

                  res.json({
                    success: true,
                    cards: {
                      produtos: Number(produtos.totalProdutos) || 0,
                      vendasMes: Number(vendas.totalVendas) || 0,
                      lucroMes: Number(lucro.lucroMes) || 0,
                      pendentes: Number(pendentes.pendentes) || 0,
                    },
                    historico: historico.map(h => ({
                      dia: h.dia,
                      total_vendido: Number(h.total_vendido) || 0,
                      lucro: Number(h.lucro) || 0,
                    })),
                  });

                }
              );
            });
          }
        );
      }
    );
  });
});



// ================================
// PRODUTOS
// ================================

// Listar produtos
app.get('/api/produtos', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM produtos ORDER BY nome ASC';
  let params = [];

  if (search) {
    query = 'SELECT * FROM produtos WHERE nome LIKE ? ORDER BY nome ASC';
    params = [`%${search}%`];
  }

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows, total: rows.length });
  });
});

// Obter produto
app.get('/api/produtos/:id', (req, res) => {
  db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!row) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
    res.json({ success: true, data: row });
  });
});

// Criar produto
app.post('/api/produtos', upload.single('imagem'), (req, res) => {
  const { nome, preco_custo, preco_venda, observacoes, estoque_atual } = req.body;
  if (!nome || !preco_custo || !preco_venda)
    return res.status(400).json({ success: false, error: 'Nome, preço de custo e preço de venda são obrigatórios' });

  const custo = parseFloat(preco_custo);
  const venda = parseFloat(preco_venda);
  const margem = ((venda - custo) / custo * 100).toFixed(2);
  const imagem = req.file ? `/uploads/produtos/${req.file.filename}` : null;

  db.run(`
    INSERT INTO produtos (nome, preco_custo, preco_venda, margem_lucro, imagem, observacoes, estoque_atual)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [nome, custo, venda, margem, imagem, observacoes || '', estoque_atual || 0], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });

    res.json({
      success: true,
      data: {
        id: this.lastID,
        nome, preco_custo: custo, preco_venda: venda, margem_lucro: margem,
        imagem, observacoes, estoque_atual: estoque_atual || 0
      }
    });
  });
});

// Atualizar produto
app.put('/api/produtos/:id', upload.single('imagem'), (req, res) => {
  const { nome, preco_custo, preco_venda, observacoes, estoque_atual } = req.body;
  const imagem = req.file ? `/uploads/produtos/${req.file.filename}` : null;

  db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id], (err, produto) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!produto) return res.status(404).json({ success: false, error: 'Produto não encontrado' });

    const custo = preco_custo || produto.preco_custo;
    const venda = preco_venda || produto.preco_venda;
    const margem = ((venda - custo) / custo * 100).toFixed(2);

    db.run(`
      UPDATE produtos
      SET nome = ?, preco_custo = ?, preco_venda = ?, margem_lucro = ?, imagem = ?, observacoes = ?, estoque_atual = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nome || produto.nome, custo, venda, margem, imagem || produto.imagem, observacoes || produto.observacoes, estoque_atual || produto.estoque_atual, req.params.id], function(err) {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: 'Produto atualizado com sucesso' });
    });
  });
});

// Deletar produto
app.delete('/api/produtos/:id', (req, res) => {
  db.run('DELETE FROM produtos WHERE id = ?', [req.params.id], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, message: 'Produto deletado com sucesso' });
  });
});

// ================================
// VENDAS
// ================================

// Registrar venda
app.post('/api/vendas', (req, res) => {
  const { cliente_nome, itens, forma_pagamento, parcelas, observacoes } = req.body;
  if (!itens || itens.length === 0) return res.status(400).json({ success: false, error: 'Itens da venda são obrigatórios' });

  let total = 0;
  let custo_total = 0;

  itens.forEach(item => {
    total += item.preco_unitario * item.quantidade;
    custo_total += item.custo_unitario * item.quantidade;
  });

  const lucro = total - custo_total;

  db.run(`
    INSERT INTO vendas (cliente_nome, total, custo_total, lucro, forma_pagamento, parcelas, observacoes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [cliente_nome || '', total, custo_total, lucro, forma_pagamento || '', parcelas || 1, observacoes || ''], function(err) {
    if (err) return res.status(500).json({ success: false, error: err.message });

    const venda_id = this.lastID;

    itens.forEach(item => {
      db.run(`
        INSERT INTO vendas_itens (venda_id, produto_id, produto_nome, quantidade, preco_unitario, custo_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [venda_id, item.produto_id, item.produto_nome, item.quantidade, item.preco_unitario, item.custo_unitario, item.preco_unitario * item.quantidade]);

      // Atualizar estoque
      db.run('UPDATE produtos SET estoque_atual = estoque_atual - ? WHERE id = ?', [item.quantidade, item.produto_id]);
    });

    res.json({ success: true, message: 'Venda registrada com sucesso', venda_id });
  });
});

// Listar vendas
app.get('/api/vendas', (req, res) => {
  db.all('SELECT * FROM vendas ORDER BY data_venda DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

// Obter itens de uma venda
app.get('/api/vendas/:id/itens', (req, res) => {
  db.all('SELECT * FROM vendas_itens WHERE venda_id = ?', [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

// ================================
// RELATÓRIOS SIMPLES
// ================================

// Lucro total
app.get('/api/relatorios/lucro', (req, res) => {
  db.get('SELECT SUM(lucro) as lucro_total FROM vendas', [], (err, row) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, lucro_total: row.lucro_total || 0 });
  });
});

// Ranking de produtos mais vendidos
app.get('/api/relatorios/produtos', (req, res) => {
  db.all(`
    SELECT produto_nome, SUM(quantidade) as total_vendido
    FROM vendas_itens
    GROUP BY produto_nome
    ORDER BY total_vendido DESC
  `, [], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.json({ success: true, data: rows });
  });
});

// ================================
// BACKUP SIMPLES (export DB)
// ================================

app.get('/api/backup', (req, res) => {
  const backupFile = `backup_gev_${Date.now()}.db`;
  fs.copyFile('gev_app.db', backupFile, (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.download(backupFile, (err) => { if (!err) fs.unlinkSync(backupFile); });
  });
});

// ================================
// STATUS / HEALTH
// ================================

app.get('/api/status', (req, res) => {
  res.json({ success: true, status: 'Backend funcionando', timestamp: new Date() });
});

// ================================
// INICIAR SERVIDOR
// ================================

app.listen(PORT, () => console.log(`🚀 GEV App Backend rodando em http://localhost:${PORT}`));

process.on('uncaughtException', (err) => console.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('Unhandled Rejection at:', promise, 'reason:', reason));
