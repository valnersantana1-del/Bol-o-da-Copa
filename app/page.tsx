'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Chaves públicas (seguras para ficar no cliente)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [jogo, setJogo] = useState<any>(null);
  const [scoreA, setScoreA] = useState(0);
  const [scoreB, setScoreB] = useState(0);
  const [ranking, setRanking] = useState([]);
  const [statusText, setStatusText] = useState('');

  useEffect(() => {
    // Checa sessão ativa ao carregar a página
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        carregarJogoEApostas(session.user.id);
      }
    });
    carregarRanking();
  }, []);

  async function carregarJogoEApostas(userId: string) {
    // Busca o próximo jogo ativo
    const { data: jogos } = await supabase.from('jogos').select('*').eq('finalizado', false).limit(1);
    if (jogos && jogos.length > 0) {
      setJogo(jogos[0]);
      // Busca palpite existente
      const { data: palpite } = await supabase.from('palpites').select('*').eq('user_id', userId).eq('jogo_id', jogos[0].id).single();
      if (palpite) {
        setScoreA(palpite.palpite_a);
        setScoreB(palpite.palpite_b);
        setStatusText("Você já palpitou neste jogo!");
      }
    }
  }

  async function handleLogin() {
    const email = prompt("Digite seu e-mail:");
    const password = prompt("Digite sua senha:");
    if (!email || !password || !username) return alert("Preencha o nome, e-mail e senha.");

    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return alert(signInError.message);
      window.location.reload();
    } else if (data.user) {
      await supabase.from('perfis').insert({ id: data.user.id, nome: username });
      window.location.reload();
    }
  }

  async function handleSaveBet() {
    if (!user || !jogo) return;
    
    // Trava de segurança no Frontend também (Prevenir cliques fora de hora)
    if (new Date() >= new Date(jogo.data_jogo)) {
      alert("O jogo já começou! Palpites encerrados.");
      return;
    }

    const { error } = await supabase.from('palpites').upsert({
      user_id: user.id,
      jogo_id: juego.id,
      palpite_a: scoreA,
      palpite_b: scoreB
    }, { onConflict: 'user_id,jogo_id' });

    if (error) alert(error.message);
    else setStatusText("Palpite salvo com sucesso na nuvem!");
  }

  async function carregarRanking() {
    const { data } = await supabase.from('perfis').select('*').order('pontos_totais', { ascending: false });
    if (data) setRanking(data as any);
  }

  return (
    <main style={styles.container}>
      <header style={{ textAlign: 'center', margin: '20px 0' }}>
        <h1 style={{ color: '#4f46e5' }}>🏆 Bolão Copa 2026</h1>
        <p>Automação Serverless Ativa</p>
      </header>

      {!user ? (
        <div style={styles.card}>
          <h2>👤 Identificação</h2>
          <input style={styles.input} type="text" placeholder="Seu Apelido" value={username} onChange={e => setUsername(e.target.value)} />
          <button style={styles.button} onClick={handleLogin}>Entrar / Cadastrar</button>
        </div>
      ) : (
        <div style={styles.card}>
          <h2>⚽ Registrar Palpite</h2>
          {jogo ? (
            <>
              <p style={{ marginBottom: '10px' }}>Jogo: <strong>{jogo.time_a} vs {jogo.time_b}</strong></p>
              <div style={styles.matchRow}>
                <span>{jogo.time_a}</span>
                <input style={styles.matchInput} type="number" value={scoreA} onChange={e => setScoreA(parseInt(e.target.value) || 0)} />
                <span>X</span>
                <input style={styles.matchInput} type="number" value={scoreB} onChange={e => setScoreB(parseInt(e.target.value) || 0)} />
                <span>{jogo.time_b}</span>
              </div>
              <button style={styles.button} onClick={handleSaveBet}>Salvar Palpite</button>
              <p style={{ color: '#10b981', marginTop: '10px', textAlign: 'center' }}>{statusText}</p>
            </>
          ) : (
            <p>Nenhum jogo aberto no momento.</p>
          )}
        </div>
      )}

      <div style={styles.card}>
        <h2>📊 Ranking Geral</h2>
        <ul style={{ listStyle: 'none' }}>
          {ranking.map((player: any, idx) => (
            <li key={idx} style={styles.rankItem}>
              <span>{idx + 1}° {player.nome}</span>
              <span style={styles.badge}>{player.pontos_totais} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

const styles = {
  container: { fontFamily: 'sans-serif', backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center' } as any,
  card: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '20px' },
  input: { padding: '10px', width: '100%', borderRadius: '6px', border: '1px solid #d1d5db', marginBottom: '10px' },
  button: { background: '#4f46e5', color: 'white', padding: '10px', border: 'none', borderRadius: '6px', width: '100%', fontWeight: 'bold', cursor: 'pointer' } as any,
  matchRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '15px 0' },
  matchInput: { width: '50px', text-align: 'center', padding: '5px' } as any,
  rankItem: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' },
  badge: { background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }
};