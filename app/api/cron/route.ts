import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Inicializa o Supabase no Backend usando variáveis de ambiente seguras
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Chave mestre que ignora travas de segurança para o robô trabalhar
);

export async function GET(request: Request) {
  // Validação de Segurança: Garante que só o agendador da Vercel execute isso
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Não autorizado', { status: 401 });
  }

  try {
    // 1. Busca no banco jogos que já deveriam ter começado ou terminado, mas estão abertos
    const agora = new Date().toISOString();
    const { data: jogosAbertos } = await supabase
      .from('jogos')
      .select('*')
      .eq('finalizado', false)
      .lte('data_jogo', agora);

    if (!jogosAbertos || jogosAbertos.length === 0) {
      return NextResponse.json({ message: 'Nenhum jogo precisando de atualização agora.' });
    }

    // 2. Loop para checar cada jogo na API externa de futebol
    for (const jogo of jogosAbertos) {
      // Faz a chamada para a API-Football (Exemplo usando requisição HTTP padrão)
      // Nota: Em produção, você precisará passar o ID correto do jogo mapeado da API deles
      const response = await fetch(`https://v3.football.api-sports.io/fixtures?id=${jogo.api_id}`, {
        method: "GET",
        headers: {
          "x-rapidapi-host": "v3.football.api-sports.io",
          "x-rapidapi-key": process.env.API_FOOTBALL_KEY! // Sua chave secreta guardada na Vercel
        }
      });

      const resData = await response.json();
      const fixture = resData.response?.[0];

      if (fixture) {
        const status = fixture.fixture.status.short; // Ex: 'FT' significa Finished (Terminado)
        const golsA = fixture.goals.home;
        const golsB = fixture.goals.away;

        // Se o jogo terminou na vida real, atualizamos nosso banco
        if (status === 'FT' || status === 'AET' || status === 'PEN') {
          await supabase
            .from('jogos')
            .update({
              gols_a: golsA,
              gols_b: golsB,
              finalizado: true // Isso dispara a nossa Trigger SQL automaticamente!
            })
            .eq('id', jogo.id);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Jogos checados e atualizados com sucesso.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}