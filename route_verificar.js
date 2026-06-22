import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

function hojeStr() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}
function amanhaStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

async function jaNotificado(emprestimoId, tipo) {
  const { data } = await supabase
    .from("notificacoes_enviadas")
    .select("id")
    .eq("emprestimo_id", emprestimoId)
    .eq("tipo", tipo)
    .limit(1);
  return data && data.length > 0;
}

async function marcarNotificado(emprestimoId, tipo) {
  await supabase.from("notificacoes_enviadas").insert({ emprestimo_id: emprestimoId, tipo });
}

async function enviarParaTodos(payload) {
  const { data: subs } = await supabase.from("push_subscriptions").select("*");
  if (!subs) return;

  for (const sub of subs) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
      }
    }
  }
}

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Não autorizado" }, { status: 401 });
  }

  const hoje = hojeStr();
  const amanha = amanhaStr();

  const { data: emprestimos } = await supabase
    .from("emprestimos")
    .select("*, clientes(nome_completo)")
    .eq("pago", false);

  if (!emprestimos) {
    return Response.json({ enviados: 0 });
  }

  let enviados = 0;

  for (const emp of emprestimos) {
    const nomeCliente = emp.clientes ? emp.clientes.nome_completo : "Cliente";

    if (emp.vencimento === amanha && !(await jaNotificado(emp.id, "um_dia_antes"))) {
      await enviarParaTodos({
        title: "Vence amanhã",
        body: `${nomeCliente} tem pagamento previsto para amanhã.`,
        tag: `emprestimo-${emp.id}-amanha`,
        url: "/",
      });
      await marcarNotificado(emp.id, "um_dia_antes");
      enviados++;
    }

    if (emp.vencimento === hoje && !(await jaNotificado(emp.id, "no_dia"))) {
      await enviarParaTodos({
        title: "Vence hoje",
        body: `${nomeCliente} tem pagamento previsto para hoje.`,
        tag: `emprestimo-${emp.id}-hoje`,
        url: "/",
      });
      await marcarNotificado(emp.id, "no_dia");
      enviados++;
    }
  }

  return Response.json({ enviados });
}
