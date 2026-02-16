'use client';

import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import './globals.css';

interface Materia {
  _id: string;
  nome: string;
  codigo: string;
  professor?: string;
  dataCriacao: string;
  alunos: string[]; 
}

function App() {
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [isLightMode, setIsLightMode] = useState(false);
  const [alunosAbertos, setAlunosAbertos] = useState<Record<string, boolean>>({});
  
  // Estados para o formulário
  const [nome, setNome] = useState('');
  const [codigo, setCodigo] = useState('');
  const [professor, setProfessor] = useState('');

  const carregarMaterias = async () => {
    const res = await fetch('http://localhost:3000/materias');
    const dados = await res.json();
    setMaterias(dados);
  };

  const cadastrarMateria = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await fetch('http://localhost:3000/materias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, codigo, professor })
    });
    // Limpa campos e recarrega lista
    setNome(''); setCodigo(''); setProfessor('');
    carregarMaterias();
  };
  const excluirMateria = async (id: string) => {
    await fetch(`http://localhost:3000/materias/${id}`, { method: 'DELETE' });
    carregarMaterias();
  };
  const alternarAlunos = (id: string) => {
    setAlunosAbertos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isLightMode ? 'light' : 'dark');
    carregarMaterias();
  }, [isLightMode]);

  return (
    <div className="container">
      <header>
        <h1>Agenda UnB 🎓</h1>
        <button onClick={() => setIsLightMode(!isLightMode)}>
          {isLightMode ? '☀️ Escuro' : '🌙 Claro'}
        </button>
      </header>

      <form onSubmit={cadastrarMateria} className="form-cadastro">
        <input placeholder="Nome da Matéria" value={nome} onChange={(e: ChangeEvent<HTMLInputElement>) => setNome(e.target.value)} required />
        <input placeholder="Código" value={codigo} onChange={(e: ChangeEvent<HTMLInputElement>) => setCodigo(e.target.value)} required />
        <input placeholder="Professor" value={professor} onChange={(e: ChangeEvent<HTMLInputElement>) => setProfessor(e.target.value)} />
        <button type="submit">Cadastrar</button>
      </form>

      <div className="grid">
        {materias.map(m => (
          <div key={m._id} className="card">
            <h3>{m.nome}</h3>
            <p><strong>{m.codigo}</strong></p>
            <p>{m.professor}</p>
            <p>{m.dataCriacao}</p>
            <button onClick={() => excluirMateria(m._id)} className="btn-excluir">Excluir</button>
            <button onClick={() => alternarAlunos(m._id)} className="btn-exibir-alunos">
              {alunosAbertos[m._id] ? 'Ocultar alunos' : 'Alunos'}
            </button>
            {alunosAbertos[m._id] && (
              <div className="alunos-box">
                <h4>Alunos</h4>
                {m.alunos.length === 0 ? (
                  <p className="alunos-vazio">Sem alunos cadastrados.</p>
                ) : (
                  <ul>
                    {m.alunos.map((aluno, index) => (
                      <li key={`${m._id}-aluno-${index}`}>{aluno}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;