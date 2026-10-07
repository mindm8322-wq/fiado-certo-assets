import { NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function dataSP(offsetDias = 0) {
  const hoje = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  const [a, m, d] = hoje.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d + offsetDias));
  return dt.toISOString().slice(0, 10);
}
const brl = (v) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
const dataBR = (iso) => iso.split("-").reverse().join("/");

async function handler(req) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const hoje = dataSP(0);
  const amanha = dataSP(1);

  const { data: abertas, error } = await supabase
    .from("venda_parcelas").select("*").eq("pago", false).lte("vencimento", amanha);
  if (error) return NextResponse.json({ erro: error.message }, { status: 500 });

  const { data: jaEnviadas } = await supabase.from("notificacoes_vendas").select("parcela_id, tipo");
  const enviado = new Set((jaEnviadas || []).map((n) => `${n.parcela_id}:${n.tipo}`));

  const vendaIds = [...new Set((abertas || []).map((p) => p.venda_id))];
  const { data: vendas } = vendaIds.length
    ? await supabase.from("vendas").select("id, produto_nome, cliente_id").in("id", vendaIds)
    : { data: [] };
  const clienteIds = [...new Set((vendas || []).map((v) => v.cliente_id).filter(Boolean))];
  const { data: clientes } = clienteIds.length
    ? await supabase.from("clientes").select("id, nome_completo").in("id", clienteIds)
    : { data: [] };
  const vendaPor = Object.fromEntries((vendas || []).map((v) => [v.id, v]));
  const clientePor = Object.fromEntries((clientes || []).map((c) => [c.id, c]));
  const quem = (p) => {
    const v = vendaPor[p.venda_id];
    const c = v && v.cliente_id ? clientePor[v.cliente_id] : null;
    return c ? `${c.nome_completo} (${v.produto_nome})` : v ? v.produto_nome : "Venda";
  };

  const mensagens = [];
  const registrar = [];
  const atrasadasNovas = [];

  for (const p of abertas || []) {
    const venc = String(p.vencimento).slice(0, 10);
    let tipo = null;
    if (venc === amanha) tipo = "vespera";
    else if (venc === hoje) tipo = "hoje";
    else if (venc < hoje) tipo = "atraso";
    if (!tipo || enviado.has(`${p.id}:${tipo}`)) continue;
    registrar.push({ parcela_id: p.id, tipo });
    if (tipo === "atraso") { atrasadasNovas.push(p); continue; }
    mensagens.push({
      title: tipo === "hoje" ? "Parcela vence hoje" : "Parcela vence amanhã",
      body: `${quem(p)} — ${brl(p.valor)} em ${dataBR(venc)}`,
      url: `/?venda=${p.venda_id}`,
    });
  }
  if (atrasadasNovas.length === 1) {
    const p = atrasadasNovas[0];
    mensagens.push({ title: "Parcela atrasada", body: `${quem(p)} — ${brl(p.valor)}, venceu ${dataBR(String(p.vencimento).slice(0, 10))}`, url: `/?venda=${p.venda_id}` });
  } else if (atrasadasNovas.length > 1) {
    const total = atrasadasNovas.reduce((a, p) => a + Number(p.valor), 0);
    mensagens.push({ title: `${atrasadasNovas.length} parcelas atrasadas`, body: `Total de ${brl(total)} pra cobrar. Abre o app pra ver.`, url: "/" });
  }

  if (mensagens.length === 0) return NextResponse.json({ ok: true, enviadas: 0 });

  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  let enviadas = 0;
  for (const s of subs || []) {
    const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
    for (const m of mensagens) {
      try {
        await webpush.sendNotification(sub, JSON.stringify(m));
        enviadas++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", s.id);
          break;
        }
      }
    }
  }
  if (registrar.length) await supabase.from("notificacoes_vendas").insert(registrar);

  return NextResponse.json({ ok: true, mensagens: mensagens.length, enviadas });
}

export const GET = handler;
export const POST = handler;
