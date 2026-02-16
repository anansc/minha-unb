const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors()); // Libera o acesso para o React
app.use(express.json()); // Middleware para JSON

app.get('/teste', (req, res) => {
    res.send("O servidor está funcionando!");
});

// 1. Conexão com MongoDB Local
mongoose.connect('mongodb://127.0.0.1:27017/minha-unb')
    .then(() => console.log("✅ Conectado ao MongoDB"))
    .catch(err => console.error("❌ Erro de conexão:", err));

// 2. Modelo de Dados (Schema)
const MateriaSchema = new mongoose.Schema({
    nome: { type: String, required: true },
    codigo: { type: String, required: true, unique: true },
    professor: String,
    creditos: Number,
    alunos: [String],
    dataCriacao: {
        type: String,
        default: () => {
            const agora = new Date();
            const dia = String(agora.getDate()).padStart(2, '0');
            const mes = String(agora.getMonth() + 1).padStart(2, '0');
            const ano = agora.getFullYear();
            const hora = String(agora.getHours()).padStart(2, '0');
            const minuto = String(agora.getMinutes()).padStart(2, '0');
            return `${dia}/${mes}/${ano} ${hora}:${minuto}`;
        }
    }
});

const Materia = mongoose.model('Materia', MateriaSchema);

// --- ROTAS (API) ---

// POST: Criar matéria
app.post('/materias', async (req, res) => {
    try {
        const novaMateria = new Materia(req.body);
        await novaMateria.save();
        res.status(201).json({ mensagem: "Salvo com sucesso!", dado: novaMateria });
    } catch (err) {
        res.status(400).json({ erro: "Erro ao salvar. Código duplicado?" });
    }
});

// GET: Listar todas
app.get('/materias', async (req, res) => {
    const lista = await Materia.find();
    res.json(lista);
});

// DELETE: Remover por ID
app.delete('/materias/:id', async (req, res) => {
    await Materia.findByIdAndDelete(req.params.id);
    res.json({ mensagem: "Matéria removida!" });
});

// 3. Inicialização
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});