// ================================
// GEV APP - BACKEND COMPLETO
// Node.js + Express + SQLite
// ================================

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/produtos';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
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

// Criar tabelas
db.serialize(() => {
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

  // Tabela de clientes
  db.run(`
    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT,
      endereco TEXT,
      observacoes TEXT,
      total_comprado REAL DEFAULT 0,
      ultima_compra DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabela de vendas
  db.run(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER,
      cliente_nome TEXT,
      total REAL NOT NULL,
      custo_total REAL NOT NULL,
      lucro REAL NOT NULL,
      forma_pagamento TEXT DEFAULT 'dinheiro',
      parcelas INTEGER DEFAULT 1,
      status TEXT DEFAULT 'concluida',
      observacoes TEXT,
      data_venda DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cliente_id) REFERENCES clientes (id)
    )
  `);

  // Tabela de itens de venda
  db.run(`
    CREATE TABLE IF NOT EXISTS vendas_itens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER NOT NULL,
      produto_id INTEGER NOT NULL,
      produto_nome TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      preco_unitario REAL NOT NULL,
      custo_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (venda_id) REFERENCES vendas (id),
      FOREIGN KEY (produto_id) REFERENCES produtos (id)
    )
  `);

  console.log('✅ Database tables created successfully!');
});

// ================================
// TELA 1: DASHBOARD - APIs
// ================================

// GET /api/dashboard - Dados do dashboard
app.get('/api/dashboard', (req, res) => {
  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();

  const queries = {
    vendas_mes: `
      SELECT COALESCE(SUM(total), 0) as total 
      FROM vendas 
      WHERE data_venda >= ?
    `,
    total_produtos: `
      SELECT COUNT(*) as total 
      FROM produtos
    `,
    lucro_mes: `
      SELECT COALESCE(SUM(lucro), 0) as total 
      FROM vendas 
      WHERE data_venda >= ?
    `,
    vendas_pendentes: `
      SELECT COUNT(*) as total 
      FROM vendas 
      WHERE status = 'pendente'
    `
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.vendas_mes, [inicioMes], (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.total_produtos, [], (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.lucro_mes, [inicioMes], (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    }),
    new Promise((resolve, reject) => {
      db.get(queries.vendas_pendentes, [], (err, row) => {
        if (err) reject(err);
        else resolve(row.total);
      });
    })
  ])
  .then(([vendas_mes, total_produtos, lucro_mes, vendas_pendentes]) => {
    res.json({
      success: true,
      data: {
        vendas_mes: parseFloat(vendas_mes) || 0,
        total_produtos: total_produtos || 0,
        lucro_mes: parseFloat(lucro_mes) || 0,
        vendas_pendentes: vendas_pendentes || 0
      }
    });
  })
  .catch(err => {
    console.error('Dashboard error:', err);
    res.status(500).json({ success: false, error: err.message });
  });
});

// ================================
// TELA 2: PRODUTOS - APIs
// ================================

// GET /api/produtos - Listar todos os produtos
app.get('/api/produtos', (req, res) => {
  const { search } = req.query;
  
  let query = 'SELECT * FROM produtos ORDER BY nome ASC';
  let params = [];
  
  if (search) {
    query = 'SELECT * FROM produtos WHERE nome LIKE ? ORDER BY nome ASC';
    params = [`%${search}%`];
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  });
});

// GET /api/produtos/:id - Obter produto específico
app.get('/api/produtos/:id', (req, res) => {
  db.get('SELECT * FROM produtos WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ success: false, error: 'Produto não encontrado' });
      return;
    }
    
    res.json({ success: true, data: row });
  });
});

// POST /api/produtos - Criar novo produto
app.post('/api/produtos', upload.single('imagem'), (req, res) => {
  const { nome, preco_custo, preco_venda, observacoes, estoque_atual } = req.body;
  
  // Validações
  if (!nome || !preco_custo || !preco_venda) {
    return res.status(400).json({ 
      success: false, 
      error: 'Nome, preço de custo e preço de venda são obrigatórios' 
    });
  }
  
  const custo = parseFloat(preco_custo);
  const venda = parseFloat(preco_venda);
  const margem = ((venda - custo) / custo * 100).toFixed(2);
  const imagem = req.file ? `/uploads/produtos/${req.file.filename}` : null;
  
  db.run(`
    INSERT INTO produtos (nome, preco_custo, preco_venda, margem_lucro, imagem, observacoes, estoque_atual)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [nome, custo, venda, margem, imagem, observacoes || '', estoque_atual || 0], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    res.json({
      success: true,
      data: {
        id: this.lastID,
        nome,
        preco_custo: custo,
        preco_venda: venda,
        margem_lucro: margem,
        imagem,
        observacoes: observacoes || '',
        estoque_atual: estoque_atual || 0
      },
      message: 'Produto criado com sucesso!'
    });
  });
});

// PUT /api/produtos/:id - Atualizar produto
app.put('/api/produtos/:id', upload.single('imagem'), (req, res) => {
  const { nome, preco_custo, preco_venda, observacoes, estoque_atual } = req.body;
  const produtoId = req.params.id;
  
  const custo = parseFloat(preco_custo);
  const venda = parseFloat(preco_venda);
  const margem = ((venda - custo) / custo * 100).toFixed(2);
  
  let query = `
    UPDATE produtos 
    SET nome = ?, preco_custo = ?, preco_venda = ?, margem_lucro = ?, 
        observacoes = ?, estoque_atual = ?, updated_at = CURRENT_TIMESTAMP
  `;
  let params = [nome, custo, venda, margem, observacoes || '', estoque_atual || 0];
  
  if (req.file) {
    query += ', imagem = ?';
    params.push(`/uploads/produtos/${req.file.filename}`);
  }
  
  query += ' WHERE id = ?';
  params.push(produtoId);
  
  db.run(query, params, function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    res.json({
      success: true,
      message: 'Produto atualizado com sucesso!'
    });
  });
});

// DELETE /api/produtos/:id - Excluir produto
app.delete('/api/produtos/:id', (req, res) => {
  db.run('DELETE FROM produtos WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ success: false, error: 'Produto não encontrado' });
      return;
    }
    
    res.json({
      success: true,
      message: 'Produto excluído com sucesso!'
    });
  });
});

// ================================
// TELA 3: NOVA VENDA - APIs
// ================================

// POST /api/vendas - Criar nova venda
app.post('/api/vendas', (req, res) => {
  const { itens, cliente_nome, forma_pagamento, parcelas, observacoes } = req.body;
  
  if (!itens || itens.length === 0) {
    return res.status(400).json({ 
      success: false, 
      error: 'É necessário pelo menos um item na venda' 
    });
  }
  
  // Calcular totais
  let total = 0;
  let custo_total = 0;
  
  // Buscar preços dos produtos
  const produtoIds = itens.map(item => item.produto_id);
  const placeholders = produtoIds.map(() => '?').join(',');
  
  db.all(`SELECT id, nome, preco_custo, preco_venda FROM produtos WHERE id IN (${placeholders})`, produtoIds, (err, produtos) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    // Preparar itens da venda
    const itens_venda = itens.map(item => {
      const produto = produtos.find(p => p.id === item.produto_id);
      if (!produto) {
        throw new Error(`Produto ${item.produto_id} não encontrado`);
      }
      
      const subtotal = produto.preco_venda * item.quantidade;
      const custo_subtotal = produto.preco_custo * item.quantidade;
      
      total += subtotal;
      custo_total += custo_subtotal;
      
      return {
        produto_id: item.produto_id,
        produto_nome: produto.nome,
        quantidade: item.quantidade,
        preco_unitario: produto.preco_venda,
        custo_unitario: produto.preco_custo,
        subtotal: subtotal
      };
    });
    
    const lucro = total - custo_total;
    
    // Inserir venda
    db.run(`
      INSERT INTO vendas (cliente_nome, total, custo_total, lucro, forma_pagamento, parcelas, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [cliente_nome || 'Cliente Avulso', total, custo_total, lucro, forma_pagamento || 'dinheiro', parcelas || 1, observacoes || ''], function(err) {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
        return;
      }
      
      const vendaId = this.lastID;
      
      // Inserir itens da venda
      const stmt = db.prepare(`
        INSERT INTO vendas_itens (venda_id, produto_id, produto_nome, quantidade, preco_unitario, custo_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      itens_venda.forEach(item => {
        stmt.run(vendaId, item.produto_id, item.produto_nome, item.quantidade, item.preco_unitario, item.custo_unitario, item.subtotal);
      });
      
      stmt.finalize();
      
      res.json({
        success: true,
        data: {
          id: vendaId,
          total,
          lucro,
          itens: itens_venda.length
        },
        message: 'Venda realizada com sucesso!'
      });
    });
  });
});

// ================================
// TELA 4: HISTÓRICO DE VENDAS - APIs
// ================================

// GET /api/vendas - Listar vendas
app.get('/api/vendas', (req, res) => {
  const { periodo } = req.query;
  
  let query = 'SELECT * FROM vendas ORDER BY data_venda DESC';
  let params = [];
  
  // Filtro por período
  if (periodo) {
    const hoje = new Date();
    let dataInicio;
    
    switch (periodo) {
      case 'hoje':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).toISOString();
        break;
      case 'semana':
        dataInicio = new Date(hoje.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
        break;
      case 'mes':
        dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
        break;
    }
    
    if (dataInicio) {
      query = 'SELECT * FROM vendas WHERE data_venda >= ? ORDER BY data_venda DESC';
      params = [dataInicio];
    }
  }
  
  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  });
});

// GET /api/vendas/:id - Detalhes de uma venda
app.get('/api/vendas/:id', (req, res) => {
  const vendaId = req.params.id;
  
  // Buscar dados da venda
  db.get('SELECT * FROM vendas WHERE id = ?', [vendaId], (err, venda) => {
    if (err) {
      res.status(500).json({ success: false, error: err.message });
      return;
    }
    
    if (!venda) {
      res.status(404).json({ success: false, error: 'Venda não encontrada' });
      return;
    }
    
    // Buscar itens da venda
    db.all('SELECT * FROM vendas_itens WHERE venda_id = ?', [vendaId], (err, itens) => {
      if (err) {
        res.status(500).json({ success: false, error: err.message });
        return;
      }
      
      res.json({
        success: true,
        data: {
          ...venda,
          itens
        }
      });
    });
  });
});

// ================================
// TELA 5: RELATÓRIOS - APIs
// ================================

// GET /api/relatorios/dashboard - Relatórios para dashboard
app.get('/api/relatorios/dashboard', (req, res) => {
  const hoje = new Date();
  const ultimos7Dias = new Date(hoje.getTime() - (7 * 24 * 60 * 60 * 1000)).toISOString();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString();
  
  Promise.all([
    // Vendas por dia (últimos 7 dias)
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          DATE(data_venda) as data,
          SUM(total) as total_vendas,
          COUNT(*) as quantidade_vendas
        FROM vendas 
        WHERE data_venda >= ?
        GROUP BY DATE(data_venda)
        ORDER BY data_venda ASC
      `, [ultimos7Dias], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    
    // Top 5 produtos mais vendidos
    new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          produto_nome,
          SUM(quantidade) as total_vendido,
          SUM(subtotal) as receita_total
        FROM vendas_itens vi
        INNER JOIN vendas v ON vi.venda_id = v.id
        WHERE v.data_venda >= ?
        GROUP BY produto_nome
        ORDER BY total_vendido DESC
        LIMIT 5
      `, [inicioMes], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    }),
    
    // Resumo financeiro do mês
    new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_vendas,
          SUM(total) as receita_total,
          SUM(custo_total) as custo_total,
          SUM(lucro) as lucro_total,
          AVG(total) as ticket_medio
        FROM vendas
        WHERE data_venda >= ?
      `, [inicioMes], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    })
  ])
  .then(([vendas_diarias, top_produtos, resumo_financeiro]) => {
    res.json({
      success: true,
      data: {
        vendas_diarias,
        top_produtos,
        resumo_financeiro
      }
    });
  })
  .catch(err => {
    console.error('Relatórios error:', err);
    res.status(500).json({ success: false, error: err.message });
  });
});

// ================================
// TELA 6: CONFIGURAÇÕES - APIs
// ================================

// POST /api/backup - Fazer backup dos dados
app.post('/api/backup', (req, res) => {
  const backupData = {};
  
  Promise.all([
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM produtos', [], (err, rows) => {
        if (err) reject(err);
        else resolve({ produtos: rows });
      });
    }),
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM vendas', [], (err, rows) => {
        if (err) reject(err);
        else resolve({ vendas: rows });
      });
    }),
    new Promise((resolve, reject) => {
      db.all('SELECT * FROM vendas_itens', [], (err, rows) => {
        if (err) reject(err);
        else resolve({ vendas_itens: rows });
      });
    })
  ])
  .then((results) => {
    results.forEach(result => Object.assign(backupData, result));
    
    res.json({
      success: true,
      data: backupData,
      timestamp: new Date().toISOString(),
      message: 'Backup realizado com sucesso!'
    });
  })
  .catch(err => {
    res.status(500).json({ success: false, error: err.message });
  });
});

// GET /api/status - Status da aplicação
app.get('/api/status', (req, res) => {
  res.json({
    success: true,
    data: {
      app: 'GEV App Backend',
      version: '1.0.0',
      status: 'running',
      database: 'sqlite',
      timestamp: new Date().toISOString()
    }
  });
});

// ================================
// INICIAR SERVIDOR
// ================================

app.listen(PORT, () => {
  console.log(`
🚀 GEV App Backend rodando!
📡 Servidor: http://localhost:${PORT}
💾 Database: SQLite (gev_app.db)
📱 API pronta para React Native!

📋 Rotas disponíveis:
   GET  /api/dashboard
   GET  /api/produtos
   POST /api/produtos
   PUT  /api/produtos/:id
   DELETE /api/produtos/:id
   POST /api/vendas
   GET  /api/vendas
   GET  /api/vendas/:id
   GET  /api/relatorios/dashboard
   POST /api/backup
   GET  /api/status
  `);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});