const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// ==========================================
// 1. CONFIGURAÇÃO DOS SCHEMAS (MODELS)
// ==========================================
const { Schema } = mongoose;

const ComponenteSchema = new Schema({
    codigo: { type: String, required: true, unique: true },
    nome: { type: String, required: true },
    carga_horaria: { type: Number, required: true },
    requisitos: [{ type: Schema.Types.ObjectId, ref: 'Componente' }]
});

const MatrizSchema = new Schema({
    nome_curso: { type: String, default: "Engenharia de Redes - UnB" },
    codigo_matriz: String,
    ch_exigida: {
        obrigatoria: Number,
        optativa: Number,
        total: Number
    }
});

const TurmaSchema = new Schema({
    fk_componente: { type: Schema.Types.ObjectId, ref: 'Componente', required: true },
    codigo_turma: String,
    professor: String,
    periodo_letivo: String,
    horarios: [{ dia: String, inicio: String, fim: String, local: String }]
});

const AlunoSchema = new Schema({
    nome: { type: String, required: true },
    senha: { type: String, required: true },
    ira: { type: Number, default: 0.0 },
    fk_matriz: { type: Schema.Types.ObjectId, ref: 'Matriz' }
});

const HistoricoSchema = new Schema({
    fk_aluno: { type: Schema.Types.ObjectId, ref: 'Aluno', required: true, unique: true },
    concluidas: [{
        fk_componente: { type: Schema.Types.ObjectId, ref: 'Componente' },
        mencao: String,
        periodo: String
    }]
});

const Componente = mongoose.model('Componente', ComponenteSchema);
const Matriz = mongoose.model('Matriz', MatrizSchema);
const Turma = mongoose.model('Turma', TurmaSchema);
const Aluno = mongoose.model('Aluno', AlunoSchema);
const Historico = mongoose.model('Historico', HistoricoSchema);

// ==========================================
// 2. ROTAS DA API
// ==========================================

// Listar todos os alunos e seus dados de matriz
app.get('/api/alunos', async (req, res) => {
    const alunos = await Aluno.find().populate('fk_matriz');
    res.json(alunos);
});

// Listar turmas disponíveis com detalhes da disciplina
app.get('/api/turmas', async (req, res) => {
    const turmas = await Turma.find().populate('fk_componente');
    res.json(turmas);
});

// Rota de Matrícula com validação de pré-requisitos
app.post('/api/matricular', async (req, res) => {
    const { alunoId, turmaId } = req.body;

    try {
        const aluno = await Aluno.findById(alunoId);
        const turma = await Turma.findById(turmaId).populate('fk_componente');
        const historico = await Historico.findOne({ fk_aluno: alunoId });

        if (!aluno || !turma || !historico) return res.status(404).json({ error: "Dados não encontrados." });

        // Validação de Pré-requisitos
        const requisitosDaDisciplina = turma.fk_componente.requisitos;
        const concluidasIds = historico.concluidas.map(c => c.fk_componente.toString());

        const faltaRequisito = requisitosDaDisciplina.filter(reqId => !concluidasIds.includes(reqId.toString()));

        if (faltaRequisito.length > 0) {
            return res.status(403).json({ 
                error: "Pré-requisitos não atendidos", 
                pendentes: faltaRequisito 
            });
        }

        res.json({ message: `Sucesso! Pablo, você foi matriculado em ${turma.fk_componente.nome}.` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. SEED & TESTES (Executa ao iniciar)
// ==========================================
async function runTests() {
    console.log("🧪 Rodando sementes de teste...");
    
   // 1. Matriz
    const matrizRedes = await Matriz.findOneAndUpdate(
        { codigo_matriz: "ENGR_2023" }, 
        { ch_exigida: { obrigatoria: 2400, optativa: 600, total: 3000 } }, 
        { upsert: true, returnDocument: 'after' } // <--- Alterado aqui
    );

    // 2. Disciplinas
    const apc = await Componente.findOneAndUpdate(
        { codigo: "CIC0001" }, 
        { nome: "Algoritmos e Prog. de Computadores", carga_horaria: 60 }, 
        { upsert: true, returnDocument: 'after' } // <--- Alterado aqui
    );

    const ed = await Componente.findOneAndUpdate(
        { codigo: "CIC0002" }, 
        { nome: "Estrutura de Dados", carga_horaria: 60, requisitos: [apc._id] }, 
        { upsert: true, returnDocument: 'after' } // <--- Alterado aqui
    );

    // 3. Criar Aluno e Histórico (Ex: Aluno que já passou em APC)
    const aluno = await Aluno.findOneAndUpdate(
        { nome: "Pablo Yuri" }, { senha: "123", ira: 4.8, fk_matriz: matrizRedes._id }, { upsert: true, new: true }
    );
    await Historico.findOneAndUpdate(
        { fk_aluno: aluno._id }, 
        { concluidas: [{ fk_componente: apc._id, mencao: "SS", periodo: "2025/2" }] }, 
        { upsert: true }
    );

    // 4. Criar Turma de ED
    const turmaED = await Turma.findOneAndUpdate(
        { codigo_turma: "Turma A", fk_componente: ed._id },
        { professor: "Doutor Exemplo", periodo_letivo: "2026/1" },
        { upsert: true, new: true }
    );

    console.log("✅ Banco populado. Tente matricular o Pablo Yuri em Estrutura de Dados!");
}

// ==========================================
// 4. START SERVER
// ==========================================
const MONGO_URI = 'mongodb://127.0.0.1:27017/unb_organizacao';
mongoose.connect(MONGO_URI).then(() => {
    app.listen(3000, () => {
        console.log("🚀 Server: http://localhost:3000");
        runTests();
    });
});