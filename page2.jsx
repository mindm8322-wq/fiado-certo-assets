"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, X, Check, Clock, AlertTriangle, TrendingUp,
  User, ChevronRight, Star, Heart, Frown,
  Home, FileText, Search, ThumbsUp, ThumbsDown, Calendar,
  Package, ShoppingBag, ArrowLeft, BarChart3, Image, Trash2, Upload, Bell, BellOff
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "../lib/supabase";

const MULTA_DIARIA_PERCENTUAL = 0.1;

// Tema dark
const BG = "#121417";
const BG_CARD = "#1C1F24";
const BG_CARD_2 = "#22262C";
const BORDA = "#2C3036";
const TEXTO = "#F2F3F5";
const TEXTO_SEC = "#9AA1AB";
const TEXTO_TERC = "#686F78";
const VERDE = "#5FC97F";
const VERDE_BG = "#1B3024";
const VERMELHO = "#E2675B";
const VERMELHO_BG = "#3A2225";
const AMARELO = "#E2B25B";
const AMARELO_BG = "#3A2F1E";
const AZUL = "#5B9DE2";
const AZUL_BG = "#1E2C3A";
const ACENTO = "#3DDC97";

const FONTE = "'Inter', var(--font-sans)";

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}
function formatBRLCompacto(value) {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return value.toFixed(0);
}
function formatCPF(v) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
function diasAtraso(vencimento) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento + "T00:00:00");
  const dias = Math.round((hoje - venc) / 86400000);
  return dias > 0 ? dias : 0;
}
function diasAte(vencimento) {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const venc = new Date(vencimento + "T00:00:00");
  return Math.round((venc - hoje) / 86400000);
}
function calcularValoresEmprestimo(emp) {
  const valorPrevisto = emp.valorPrevisto != null ? emp.valorPrevisto : emp.valorOriginal;
  const atraso = emp.pago ? 0 : diasAtraso(emp.vencimento);
  const multa = valorPrevisto * MULTA_DIARIA_PERCENTUAL * atraso;
  return { valorComJuros: valorPrevisto, atraso, multa, totalDevido: valorPrevisto + multa };
}
function statusEmprestimo(emp) {
  if (emp.pago) return "pago";
  const dias = diasAte(emp.vencimento);
  if (dias < 0) return "atrasado";
  if (dias <= 3) return "proximo";
  return "ok";
}

const STATUS_CFG = {
  pago: { label: "Pago", bg: VERDE_BG, text: VERDE },
  atrasado: { label: "Atrasado", bg: VERMELHO_BG, text: VERMELHO },
  proximo: { label: "Vence em breve", bg: AMARELO_BG, text: AMARELO },
  ok: { label: "Em dia", bg: AZUL_BG, text: AZUL },
};
const CLASSIFICACOES = {
  otimo: { label: "Ótimo cliente", bg: VERDE_BG, text: VERDE, icon: Star },
  bom: { label: "Bom cliente", bg: AZUL_BG, text: AZUL, icon: Heart },
  problema: { label: "Já me deu dor de cabeça", bg: VERMELHO_BG, text: VERMELHO, icon: Frown },
  novo: { label: "Sem histórico", bg: BG_CARD_2, text: TEXTO_SEC, icon: User },
};

const inputStyle = {
  width: "100%", background: BG_CARD_2, border: `1px solid ${BORDA}`, color: TEXTO,
  borderRadius: 10, padding: "10px 12px", fontSize: 14, boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, color: TEXTO_SEC, display: "block", marginBottom: 5 };
const cardStyle = { background: BG_CARD, border: `1px solid ${BORDA}`, borderRadius: 14, padding: "1rem" };
const btnPrimario = { width: "100%", background: ACENTO, color: "#06251A", border: "none", fontWeight: 600 };
const btnSecundario = { background: BG_CARD_2, color: TEXTO, border: `1px solid ${BORDA}` };

function TopBar({ titulo, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
      {onBack && (
        <button onClick={onBack} aria-label="Voltar" style={{ padding: 6, border: "none", background: "transparent", color: TEXTO }}>
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      )}
      <h1 style={{ fontSize: 17, fontWeight: 600, margin: 0, color: TEXTO }}>{titulo}</h1>
    </div>
  );
}

function NavInferior({ pagina, navegar }) {
  const itens = [
    { id: "clientes", label: "Clientes", icon: User },
    { id: "historico", label: "Histórico", icon: FileText },
    { id: "dashboard", label: "Início", icon: Home, central: true },
    { id: "estoque", label: "Estoque", icon: Package },
    { id: "desempenho", label: "Desempenho", icon: BarChart3 },
  ];
  return (
    <div style={{
      position: "fixed", left: 0, right: 0, bottom: 0, background: "#0C0E10",
      borderTop: `1px solid ${BORDA}`, display: "flex", justifyContent: "space-around",
      padding: "8px 4px 14px", zIndex: 30, maxWidth: "inherit", margin: "0 auto",
    }}>
      {itens.map((item) => {
        const Icon = item.icon;
        const ativo = pagina === item.id;
        if (item.central) {
          return (
            <button key={item.id} onClick={() => navegar(item.id)} aria-label={item.label} style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              width: 52, height: 52, borderRadius: "50%", background: ativo ? ACENTO : BG_CARD_2,
              border: "none", marginTop: -18, boxShadow: "0 2px 10px rgba(0,0,0,0.4)",
            }}>
              <Icon size={22} color={ativo ? "#06251A" : TEXTO} aria-hidden="true" />
            </button>
          );
        }
        return (
          <button key={item.id} onClick={() => navegar(item.id)} style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
            border: "none", background: "transparent", padding: "4px 6px",
            color: ativo ? ACENTO : TEXTO_SEC,
          }}>
            <Icon size={18} aria-hidden="true" />
            <span style={{ fontSize: 10 }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PagamentoForm({ pagamento, setPagamento, inputStyle, labelStyle }) {
  const metodo = pagamento.metodo || "";
  const opcaoBtn = (ativo) => ({
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, padding: "8px",
    background: ativo ? ACENTO : BG_CARD_2, color: ativo ? "#06251A" : TEXTO, border: `1px solid ${ativo ? ACENTO : BORDA}`,
  });

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>Método de pagamento</label>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => setPagamento({ metodo: "cartao", parcelas: pagamento.parcelas || "1" })} style={opcaoBtn(metodo === "cartao")}>Cartão</button>
        <button onClick={() => setPagamento({ metodo: "dinheiro", comEntrada: pagamento.comEntrada || false })} style={opcaoBtn(metodo === "dinheiro")}>Dinheiro / a prazo</button>
      </div>

      {metodo === "cartao" && (
        <div>
          <label style={labelStyle}>Número de parcelas no cartão</label>
          <input
            type="number" min="1" value={pagamento.parcelas || ""}
            onChange={(e) => setPagamento({ ...pagamento, parcelas: e.target.value })}
            placeholder="Ex: 3" style={{ ...inputStyle, marginBottom: 4 }}
          />
        </div>
      )}

      {metodo === "dinheiro" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button onClick={() => setPagamento({ ...pagamento, comEntrada: true })} style={opcaoBtn(pagamento.comEntrada === true)}>Com entrada</button>
            <button onClick={() => setPagamento({ ...pagamento, comEntrada: false })} style={opcaoBtn(pagamento.comEntrada === false)}>Sem entrada</button>
          </div>

          {pagamento.comEntrada && (
            <>
              <label style={labelStyle}>Valor da entrada (R$)</label>
              <input
                type="number" value={pagamento.valorEntrada || ""}
                onChange={(e) => setPagamento({ ...pagamento, valorEntrada: e.target.value })}
                placeholder="0,00" style={{ ...inputStyle, marginBottom: 10 }}
              />
            </>
          )}

          <label style={labelStyle}>Combinado de parcelas (manual)</label>
          <textarea
            value={pagamento.combinadoParcelas || ""}
            onChange={(e) => setPagamento({ ...pagamento, combinadoParcelas: e.target.value })}
            placeholder="Ex: João paga 3x de R$100, dia 10 de cada mês"
            rows={2} style={{ ...inputStyle, resize: "vertical" }}
          />
        </div>
      )}
    </div>
  );
}

function Wrapper({ children, pagina, navegar }) {
  return (
    <div style={{ fontFamily: FONTE, background: BG, color: TEXTO, minHeight: "100%", padding: "0 0 84px", position: "relative" }}>
      {children}
      <NavInferior pagina={pagina} navegar={navegar} />
    </div>
  );
}

export default function App() {
  const [pagina, setPagina] = useState("dashboard");
  const [clientes, setClientes] = useState([]);
  const [emprestimos, setEmprestimos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clienteSelecionado, setClienteSelecionado] = useState(null);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroHistorico, setFiltroHistorico] = useState("todos");
  const [avaliandoEmprestimo, setAvaliandoEmprestimo] = useState(null);
  const [fotosCliente, setFotosCliente] = useState([]);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [erroExclusao, setErroExclusao] = useState("");
  const [statusNotificacao, setStatusNotificacao] = useState("indisponivel");
  const [contasOrigem, setContasOrigem] = useState(["Nubank", "Itaú"]);
  const [novaContaInput, setNovaContaInput] = useState("");
  const [mostrarNovaConta, setMostrarNovaConta] = useState(false);

  const [formCliente, setFormCliente] = useState({ nomeCompleto: "", cpf: "", rg: "", endereco: "", telefone: "", classificacao: "novo" });
  const [formEmprestimo, setFormEmprestimo] = useState({ clienteId: "", valorOriginal: "", valorPrevisto: "", contaOrigem: "", formaPagamento: "avista", numParcelas: "2", parcelasDetalhe: [], vencimento: "", observacao: "", pagamento: {} });
  const [formProduto, setFormProduto] = useState({ nome: "", precoCompra: "", precoVenda: "", especificacoes: "", quantidade: "1" });

  const loadData = useCallback(async () => {
    try {
      const { data: c } = await supabase.from("clientes").select("*").order("criado_em", { ascending: false });
      if (c) setClientes(c.map(mapClienteFromDb));
    } catch (e) {}
    try {
      const { data: e2 } = await supabase.from("emprestimos").select("*").order("criado_em", { ascending: false });
      if (e2) setEmprestimos(e2.map(mapEmprestimoFromDb));
    } catch (e) {}
    try {
      const { data: p } = await supabase.from("produtos").select("*").order("criado_em", { ascending: false });
      if (p) setProdutos(p.map(mapProdutoFromDb));
    } catch (e) {}
    setLoading(false);
  }, []);
  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      navigator.serviceWorker.register("/sw.js").then(async (registration) => {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          setStatusNotificacao("ativo");
        } else if (Notification.permission === "denied") {
          setStatusNotificacao("negado");
        } else {
          setStatusNotificacao("disponivel");
        }
      }).catch(() => setStatusNotificacao("indisponivel"));
    } else {
      setStatusNotificacao("indisponivel");
    }
  }, []);

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  const ativarNotificacoes = async () => {
    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setStatusNotificacao("negado");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });
      const subJson = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subJson.endpoint, keys: subJson.keys }),
      });
      setStatusNotificacao("ativo");
    } catch (e) {
      setStatusNotificacao("indisponivel");
    }
  };


  const adicionarCliente = async () => {
    if (!formCliente.nomeCompleto) return;
    const { data, error } = await supabase.from("clientes").insert({
      nome_completo: formCliente.nomeCompleto, cpf: formCliente.cpf, rg: formCliente.rg,
      endereco: formCliente.endereco, telefone: formCliente.telefone, classificacao: formCliente.classificacao,
    }).select().single();
    if (!error && data) setClientes([mapClienteFromDb(data), ...clientes]);
    setFormCliente({ nomeCompleto: "", cpf: "", rg: "", endereco: "", telefone: "", classificacao: "novo" });
    setPagina("clientes");
  };

  const atualizarClassificacao = async (id, nova) => {
    const { error } = await supabase.from("clientes").update({ classificacao: nova }).eq("id", id);
    if (!error) setClientes(clientes.map((c) => (c.id === id ? { ...c, classificacao: nova } : c)));
  };

  const carregarFotosCliente = async (clienteId) => {
    const { data } = await supabase.from("fotos_cliente").select("*").eq("cliente_id", clienteId).order("criado_em", { ascending: false });
    setFotosCliente(data || []);
  };

  const enviarFoto = async (clienteId, file) => {
    setEnviandoFoto(true);
    try {
      const nomeArquivo = `${clienteId}/${Date.now()}_${file.name}`;
      const { error: erroUpload } = await supabase.storage.from("comprovantes").upload(nomeArquivo, file);
      if (erroUpload) { setEnviandoFoto(false); return; }
      const { data: urlData } = supabase.storage.from("comprovantes").getPublicUrl(nomeArquivo);
      const { data, error } = await supabase.from("fotos_cliente").insert({
        cliente_id: clienteId, url: urlData.publicUrl, nome_arquivo: file.name,
      }).select().single();
      if (!error && data) setFotosCliente([data, ...fotosCliente]);
    } catch (e) {}
    setEnviandoFoto(false);
  };

  const excluirFoto = async (fotoId) => {
    const { error } = await supabase.from("fotos_cliente").delete().eq("id", fotoId);
    if (!error) setFotosCliente(fotosCliente.filter((f) => f.id !== fotoId));
  };

  const excluirCliente = async (id) => {
    const temPendente = emprestimos.some((e) => e.clienteId === id && !e.pago);
    if (temPendente) {
      setErroExclusao("Esse cliente tem empréstimo pendente. Marque como pago antes de excluir.");
      return;
    }
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (!error) {
      setClientes(clientes.filter((c) => c.id !== id));
      setPagina("clientes");
    }
  };

  const adicionarEmprestimo = async () => {
    if (!formEmprestimo.clienteId || !formEmprestimo.valorOriginal || !formEmprestimo.valorPrevisto || !formEmprestimo.vencimento) return;
    const { data, error } = await supabase.from("emprestimos").insert({
      cliente_id: formEmprestimo.clienteId, valor_original: parseFloat(formEmprestimo.valorOriginal),
      valor_previsto: parseFloat(formEmprestimo.valorPrevisto),
      conta_origem: formEmprestimo.contaOrigem, forma_pagamento: formEmprestimo.formaPagamento,
      parcelas: formEmprestimo.formaPagamento === "parcelado" ? formEmprestimo.parcelasDetalhe : null,
      vencimento: formEmprestimo.vencimento, observacao: formEmprestimo.observacao,
      pagamento: formEmprestimo.pagamento, pago: false,
    }).select().single();
    if (!error && data) setEmprestimos([mapEmprestimoFromDb(data), ...emprestimos]);
    setFormEmprestimo({ clienteId: "", valorOriginal: "", valorPrevisto: "", contaOrigem: "", formaPagamento: "avista", numParcelas: "2", parcelasDetalhe: [], vencimento: "", observacao: "", pagamento: {} });
    setPagina("dashboard");
  };

  const togglePago = (id) => {
    const emp = emprestimos.find((e) => e.id === id);
    if (emp && !emp.pago) {
      setAvaliandoEmprestimo(id);
    } else {
      supabase.from("emprestimos").update({ pago: false, pago_em: null }).eq("id", id).then(({ error }) => {
        if (!error) setEmprestimos(emprestimos.map((e) => (e.id === id ? { ...e, pago: false, pagoEm: null } : e)));
      });
    }
  };
  const finalizarComAvaliacao = async (avaliacao) => {
    const id = avaliandoEmprestimo;
    const pagoEm = new Date().toISOString();
    const { error } = await supabase.from("emprestimos").update({ pago: true, pago_em: pagoEm, avaliacao }).eq("id", id);
    if (!error) setEmprestimos(emprestimos.map((e) => (e.id === id ? { ...e, pago: true, pagoEm, avaliacao } : e)));
    setAvaliandoEmprestimo(null);
  };
  const excluirEmprestimo = async (id) => {
    const { error } = await supabase.from("emprestimos").delete().eq("id", id);
    if (!error) setEmprestimos(emprestimos.filter((e) => e.id !== id));
  };

  const adicionarProduto = async () => {
    if (!formProduto.nome || !formProduto.precoCompra) return;
    const { data, error } = await supabase.from("produtos").insert({
      nome: formProduto.nome, preco_compra: parseFloat(formProduto.precoCompra),
      preco_venda: formProduto.precoVenda ? parseFloat(formProduto.precoVenda) : null,
      especificacoes: formProduto.especificacoes, quantidade: parseInt(formProduto.quantidade) || 1,
      vendido: false,
    }).select().single();
    if (!error && data) setProdutos([mapProdutoFromDb(data), ...produtos]);
    setFormProduto({ nome: "", precoCompra: "", precoVenda: "", especificacoes: "", quantidade: "1" });
    setPagina("estoque");
  };
  const marcarVendido = async (id, precoVendaFinal, pagamento) => {
    const vendidoEm = new Date().toISOString();
    const { error } = await supabase.from("produtos").update({ vendido: true, preco_venda: precoVendaFinal, pagamento, vendido_em: vendidoEm }).eq("id", id);
    if (!error) setProdutos(produtos.map((p) => (p.id === id ? { ...p, vendido: true, precoVenda: precoVendaFinal, pagamento, vendidoEm } : p)));
  };
  const reabrirProduto = async (id) => {
    const { error } = await supabase.from("produtos").update({ vendido: false, vendido_em: null }).eq("id", id);
    if (!error) setProdutos(produtos.map((p) => (p.id === id ? { ...p, vendido: false, vendidoEm: null } : p)));
  };
  const excluirProduto = async (id) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (!error) setProdutos(produtos.filter((p) => p.id !== id));
  };

  const getCliente = (id) => clientes.find((c) => c.id === id);
  const navegar = (destino) => setPagina(destino);

  // ---- Totais Empréstimos ----
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();
  const emprestimosDoMes = emprestimos.filter((e) => { const c = new Date(e.criadoEm); return c.getMonth() === mesAtual && c.getFullYear() === anoAtual; });
  const totalEmprestadoMes = emprestimosDoMes.reduce((a, e) => a + e.valorOriginal, 0);
  const totalRetornoMes = emprestimosDoMes.reduce((a, e) => a + calcularValoresEmprestimo(e).totalDevido, 0);
  const totalLucroEmprestimoMes = totalRetornoMes - totalEmprestadoMes;
  const totalAReceber = emprestimos.filter((e) => !e.pago).reduce((a, e) => a + calcularValoresEmprestimo(e).totalDevido, 0);
  const atrasados = emprestimos.filter((e) => statusEmprestimo(e) === "atrasado").length;

  // ---- Totais Vendas ----
  const produtosVendidosDoMes = produtos.filter((p) => { if (!p.vendido || !p.vendidoEm) return false; const v = new Date(p.vendidoEm); return v.getMonth() === mesAtual && v.getFullYear() === anoAtual; });
  const totalInvestidoVendasMes = produtosVendidosDoMes.reduce((a, p) => a + p.precoCompra * 1, 0);
  const totalVendidoMes = produtosVendidosDoMes.reduce((a, p) => a + (p.precoVenda || 0), 0);
  const totalLucroVendasMes = totalVendidoMes - totalInvestidoVendasMes;
  const produtosEmEstoque = produtos.filter((p) => !p.vendido);
  const valorEmEstoque = produtosEmEstoque.reduce((a, p) => a + p.precoCompra, 0);

  // ---- Gráfico mensal combinado ----
  const dadosGrafico = (() => {
    const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
    const buckets = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      buckets.push({ ano: d.getFullYear(), mes: d.getMonth(), label: meses[d.getMonth()], lucroEmprestimo: 0, lucroVendas: 0 });
    }
    emprestimos.forEach((e) => {
      if (!e.pago || !e.pagoEm) return;
      const p = new Date(e.pagoEm);
      const b = buckets.find((bk) => bk.ano === p.getFullYear() && bk.mes === p.getMonth());
      if (b) b.lucroEmprestimo += calcularValoresEmprestimo(e).totalDevido - e.valorOriginal;
    });
    produtos.forEach((p) => {
      if (!p.vendido || !p.vendidoEm) return;
      const v = new Date(p.vendidoEm);
      const b = buckets.find((bk) => bk.ano === v.getFullYear() && bk.mes === v.getMonth());
      if (b) b.lucroVendas += (p.precoVenda || 0) - p.precoCompra;
    });
    return buckets;
  })();

  const emprestimosFiltrados = emprestimos
    .filter((e) => { if (filtroHistorico === "todos") return true; if (filtroHistorico === "pendentes") return !e.pago; if (filtroHistorico === "atrasados") return statusEmprestimo(e) === "atrasado"; if (filtroHistorico === "pagos") return e.pago; return true; })
    .sort((a, b) => { if (a.pago !== b.pago) return a.pago ? 1 : -1; return new Date(a.vencimento) - new Date(b.vencimento); });

  const clientesFiltrados = clientes.filter((c) => c.nomeCompleto.toLowerCase().includes(busca.toLowerCase()));
  const produtosFiltrados = produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()));

  if (loading) {
    return <div style={{ padding: "2rem 0", textAlign: "center", color: TEXTO_SEC, fontFamily: FONTE, background: BG }}>Carregando...</div>;
  }

  // ================= DASHBOARD =================
  if (pagina === "dashboard") {
    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <h2 className="sr-only" style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}>
          Painel geral: lucro de empréstimos e vendas, gráfico mensal, pendências
        </h2>

        <div style={{ marginBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 12, color: TEXTO_SEC, margin: 0 }}>Fiado certo</p>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: "2px 0 0" }}>Painel geral</h1>
          </div>
          {statusNotificacao === "disponivel" && (
            <button
              onClick={ativarNotificacoes}
              style={{ ...btnSecundario, display: "flex", alignItems: "center", gap: 6, fontSize: 12, padding: "8px 12px" }}
            >
              <Bell size={14} aria-hidden="true" /> Ativar avisos
            </button>
          )}
          {statusNotificacao === "ativo" && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: VERDE, padding: "8px 4px" }}>
              <Bell size={14} aria-hidden="true" /> Avisos ativos
            </span>
          )}
          {statusNotificacao === "negado" && (
            <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: TEXTO_TERC, padding: "8px 4px" }}>
              <BellOff size={14} aria-hidden="true" /> Avisos bloqueados
            </span>
          )}
        </div>

        {/* Bloco Empréstimos */}
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <User size={14} aria-hidden="true" /> Empréstimos
            </span>
            <span style={{ fontSize: 11, color: TEXTO_TERC }}>mês atual</span>
          </div>
          <p style={{ fontSize: 11, color: TEXTO_SEC, margin: "0 0 2px" }}>A receber</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>{formatBRL(totalAReceber)}</p>
          <div style={{ display: "flex", gap: 16 }}>
            <div><p style={{ fontSize: 11, color: TEXTO_SEC, margin: "0 0 2px" }}>Emprestado</p><p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{formatBRL(totalEmprestadoMes)}</p></div>
            <div><p style={{ fontSize: 11, color: TEXTO_SEC, margin: "0 0 2px" }}>Retorno</p><p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{formatBRL(totalRetornoMes)}</p></div>
            <div><p style={{ fontSize: 11, color: TEXTO_SEC, margin: "0 0 2px" }}>Lucro</p><p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: VERDE }}>{formatBRL(totalLucroEmprestimoMes)}</p></div>
          </div>
          {atrasados > 0 && (
            <div style={{ marginTop: 10, background: VERMELHO_BG, borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={13} color={VERMELHO} aria-hidden="true" />
              <span style={{ fontSize: 12, color: VERMELHO }}>{atrasados} em atraso</span>
            </div>
          )}
        </div>

        {/* Bloco Vendas */}
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
              <ShoppingBag size={14} aria-hidden="true" /> Vendas
            </span>
            <span style={{ fontSize: 11, color: TEXTO_TERC }}>mês atual</span>
          </div>
          <p style={{ fontSize: 11, color: TEXTO_SEC, margin: "0 0 2px" }}>Lucro do mês</p>
          <p style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px", color: totalLucroVendasMes >= 0 ? TEXTO : VERMELHO }}>{formatBRL(totalLucroVendasMes)}</p>
          <div style={{ display: "flex", gap: 16 }}>
            <div><p style={{ fontSize: 11, color: TEXTO_SEC, margin: "0 0 2px" }}>Investido</p><p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{formatBRL(totalInvestidoVendasMes)}</p></div>
            <div><p style={{ fontSize: 11, color: TEXTO_SEC, margin: "0 0 2px" }}>Vendido</p><p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>{formatBRL(totalVendidoMes)}</p></div>
            <div><p style={{ fontSize: 11, color: TEXTO_SEC, margin: "0 0 2px" }}>Em estoque</p><p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: AMARELO }}>{formatBRL(valorEmEstoque)}</p></div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: 0 }}>Lucro mensal (últimos 6 meses)</p>
        </div>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: TEXTO_SEC, marginBottom: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: AZUL, display: "inline-block" }} /> Empréstimos</span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: ACENTO, display: "inline-block" }} /> Vendas</span>
        </div>
        <div style={{ height: 150, marginBottom: "1.5rem" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={BORDA} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: TEXTO_SEC }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: TEXTO_SEC }} axisLine={false} tickLine={false} tickFormatter={formatBRLCompacto} width={36} />
              <Tooltip formatter={(value) => formatBRL(value)} contentStyle={{ fontSize: 12, borderRadius: 8, background: BG_CARD_2, border: `1px solid ${BORDA}` }} labelStyle={{ color: TEXTO }} />
              <Bar dataKey="lucroEmprestimo" fill={AZUL} radius={[3, 3, 0, 0]} />
              <Bar dataKey="lucroVendas" fill={ACENTO} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <button onClick={() => navegar("novoEmprestimo")} style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px" }}>
            <Plus size={15} aria-hidden="true" /> Empréstimo
          </button>
          <button onClick={() => navegar("novoProduto")} style={{ ...btnSecundario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px" }}>
            <Plus size={15} aria-hidden="true" /> Produto
          </button>
        </div>
      </Wrapper>
    );
  }

  // ================= CLIENTES =================
  if (pagina === "clientes") {
    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <TopBar titulo="Clientes" />
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <Search size={16} style={{ position: "absolute", left: 10, top: 11, color: TEXTO_TERC }} aria-hidden="true" />
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar cliente..." style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <button onClick={() => navegar("novoCliente")} style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: "1.25rem" }}>
          <Plus size={16} aria-hidden="true" /> Cadastrar cliente
        </button>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {clientesFiltrados.length === 0 && <p style={{ fontSize: 13, color: TEXTO_SEC, textAlign: "center", padding: "1rem 0" }}>{clientes.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado."}</p>}
          {clientesFiltrados.map((c) => {
            const cls = CLASSIFICACOES[c.classificacao || "novo"];
            const Icon = cls.icon;
            const pend = emprestimos.filter((e) => e.clienteId === c.id && !e.pago).length;
            return (
              <div key={c.id} onClick={() => { setClienteSelecionado(c.id); setErroExclusao(""); carregarFotosCliente(c.id); setPagina("detalheCliente"); }} style={{ ...cardStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: BG_CARD_2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: ACENTO }}>{c.nomeCompleto.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{c.nomeCompleto}</p>
                    <span style={{ fontSize: 11, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 8px", borderRadius: 6, background: cls.bg, color: cls.text }}><Icon size={11} aria-hidden="true" /> {cls.label}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {pend > 0 && <span style={{ fontSize: 12, color: TEXTO_SEC }}>{pend} pend.</span>}
                  <ChevronRight size={16} color={TEXTO_TERC} aria-hidden="true" />
                </div>
              </div>
            );
          })}
        </div>
      </Wrapper>
    );
  }

  // ================= NOVO CLIENTE =================
  if (pagina === "novoCliente") {
    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <TopBar titulo="Cadastrar cliente" onBack={() => navegar("clientes")} />
        <p style={{ fontSize: 12, color: TEXTO_SEC, marginBottom: "1rem", lineHeight: 1.6 }}>Esses dados ficam salvos só no seu app.</p>
        <label style={labelStyle}>Nome completo</label>
        <input type="text" value={formCliente.nomeCompleto} onChange={(e) => setFormCliente({ ...formCliente, nomeCompleto: e.target.value })} placeholder="Nome completo" style={{ ...inputStyle, marginBottom: 10 }} />
        <label style={labelStyle}>CPF</label>
        <input type="text" value={formCliente.cpf} onChange={(e) => setFormCliente({ ...formCliente, cpf: formatCPF(e.target.value) })} placeholder="000.000.000-00" style={{ ...inputStyle, marginBottom: 10 }} />
        <label style={labelStyle}>RG</label>
        <input type="text" value={formCliente.rg} onChange={(e) => setFormCliente({ ...formCliente, rg: e.target.value })} placeholder="00.000.000-0" style={{ ...inputStyle, marginBottom: 10 }} />
        <label style={labelStyle}>Endereço</label>
        <input type="text" value={formCliente.endereco} onChange={(e) => setFormCliente({ ...formCliente, endereco: e.target.value })} placeholder="Rua, número, bairro" style={{ ...inputStyle, marginBottom: 10 }} />
        <label style={labelStyle}>Telefone</label>
        <input type="text" value={formCliente.telefone} onChange={(e) => setFormCliente({ ...formCliente, telefone: e.target.value })} placeholder="(00) 00000-0000" style={{ ...inputStyle, marginBottom: 14 }} />
        <label style={{ ...labelStyle, marginBottom: 8 }}>Classificação inicial</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {Object.entries(CLASSIFICACOES).filter(([k]) => k !== "novo").map(([key, cfg]) => {
            const Icon = cfg.icon; const ativo = formCliente.classificacao === key;
            return <button key={key} onClick={() => setFormCliente({ ...formCliente, classificacao: key })} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, padding: "8px", borderRadius: 10, background: ativo ? cfg.bg : BG_CARD_2, color: ativo ? cfg.text : TEXTO, border: `1px solid ${ativo ? cfg.text : BORDA}` }}><Icon size={13} aria-hidden="true" /> {cfg.label}</button>;
          })}
        </div>
        <button onClick={adicionarCliente} disabled={!formCliente.nomeCompleto} style={{ ...btnPrimario, opacity: !formCliente.nomeCompleto ? 0.5 : 1 }}>Salvar cliente</button>
      </Wrapper>
    );
  }

  // ================= DETALHE CLIENTE =================
  if (pagina === "detalheCliente" && clienteSelecionado) {
    const cliente = getCliente(clienteSelecionado);
    if (!cliente) { setPagina("clientes"); return null; }
    const empCliente = emprestimos.filter((e) => e.clienteId === cliente.id);
    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <TopBar titulo="Detalhes do cliente" onBack={() => setPagina("clientes")} />
        <div style={{ ...cardStyle, marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: BG_CARD_2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 600, color: ACENTO }}>{cliente.nomeCompleto.slice(0, 2).toUpperCase()}</div>
            <div><p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{cliente.nomeCompleto}</p><p style={{ fontSize: 12, color: TEXTO_SEC, margin: "2px 0 0" }}>{cliente.telefone || "Sem telefone"}</p></div>
          </div>
          <div style={{ borderTop: `1px solid ${BORDA}`, paddingTop: 10, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: TEXTO_SEC }}>CPF</span><span>{cliente.cpf || "—"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: TEXTO_SEC }}>RG</span><span>{cliente.rg || "—"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: TEXTO_SEC }}>Endereço</span><span style={{ textAlign: "right", maxWidth: "60%" }}>{cliente.endereco || "—"}</span></div>
          </div>
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Classificação</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: "1.25rem" }}>
          {Object.entries(CLASSIFICACOES).filter(([k]) => k !== "novo").map(([key, cfg]) => {
            const Icon = cfg.icon; const ativo = cliente.classificacao === key;
            return <button key={key} onClick={() => atualizarClassificacao(cliente.id, key)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 12, padding: "8px", borderRadius: 10, background: ativo ? cfg.bg : BG_CARD_2, color: ativo ? cfg.text : TEXTO, border: `1px solid ${ativo ? cfg.text : BORDA}` }}><Icon size={13} aria-hidden="true" /> {cfg.label}</button>;
          })}
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Empréstimos deste cliente</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.25rem" }}>
          {empCliente.length === 0 && <p style={{ fontSize: 13, color: TEXTO_SEC }}>Nenhum empréstimo registrado ainda.</p>}
          {empCliente.map((e) => {
            const status = statusEmprestimo(e); const cfg = STATUS_CFG[status]; const { totalDevido } = calcularValoresEmprestimo(e);
            return <div key={e.id} style={{ background: BG_CARD_2, borderRadius: 10, padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}><span style={{ fontSize: 12, fontWeight: 500, padding: "2px 8px", borderRadius: 6, background: cfg.bg, color: cfg.text }}>{cfg.label}</span><span style={{ fontSize: 14, fontWeight: 600 }}>{formatBRL(totalDevido)}</span></div>;
          })}
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
          <Image size={14} aria-hidden="true" /> Fotos e comprovantes
        </p>
        <label style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontSize: 13,
          padding: "10px", borderRadius: 10, background: BG_CARD_2, border: `1px dashed ${BORDA}`,
          marginBottom: 10, cursor: "pointer", color: TEXTO_SEC,
        }}>
          <Upload size={14} aria-hidden="true" />
          {enviandoFoto ? "Enviando..." : "Adicionar foto (RG, comprovante, etc)"}
          <input
            type="file" accept="image/*" style={{ display: "none" }} disabled={enviandoFoto}
            onChange={(e) => { if (e.target.files[0]) enviarFoto(cliente.id, e.target.files[0]); e.target.value = ""; }}
          />
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: "1.5rem" }}>
          {fotosCliente.map((f) => (
            <div key={f.id} style={{ position: "relative", borderRadius: 10, overflow: "hidden", aspectRatio: "1", background: BG_CARD_2 }}>
              <img src={f.url} alt={f.nome_arquivo || "Comprovante"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => excluirFoto(f.id)} aria-label="Excluir foto"
                style={{
                  position: "absolute", top: 4, right: 4, width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(0,0,0,0.6)", border: "none", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>

        {erroExclusao && (
          <div style={{ background: VERMELHO_BG, borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={14} color={VERMELHO} aria-hidden="true" />
            <span style={{ fontSize: 13, color: VERMELHO }}>{erroExclusao}</span>
          </div>
        )}
        <button
          onClick={() => excluirCliente(cliente.id)}
          style={{ width: "100%", background: VERMELHO_BG, color: VERMELHO, border: `1px solid ${VERMELHO}`, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
        >
          <Trash2 size={14} aria-hidden="true" /> Excluir cliente
        </button>
      </Wrapper>
    );
  }

  // ================= NOVO EMPRÉSTIMO =================
  if (pagina === "novoEmprestimo") {
    const valorEmprestadoNum = parseFloat(formEmprestimo.valorOriginal) || 0;
    const valorPrevistoNum = parseFloat(formEmprestimo.valorPrevisto) || 0;
    const lucroPrevisto = valorPrevistoNum - valorEmprestadoNum;
    const numParcelasInt = parseInt(formEmprestimo.numParcelas) || 2;

    const atualizarNumParcelas = (n) => {
      setFormEmprestimo((prev) => {
        const arr = Array.from({ length: n }, (_, i) => (prev.parcelasDetalhe && prev.parcelasDetalhe[i]) || { valor: "", data: "" });
        return { ...prev, numParcelas: String(n), parcelasDetalhe: arr };
      });
    };
    const ativarParcelado = () => {
      setFormEmprestimo((prev) => {
        const n = parseInt(prev.numParcelas) || 2;
        const arr = Array.from({ length: n }, (_, i) => (prev.parcelasDetalhe && prev.parcelasDetalhe[i]) || { valor: "", data: "" });
        return { ...prev, formaPagamento: "parcelado", numParcelas: String(n), parcelasDetalhe: arr };
      });
    };
    const atualizarParcela = (i, campo, valor) => {
      setFormEmprestimo((prev) => {
        const arr = [...prev.parcelasDetalhe];
        arr[i] = { ...arr[i], [campo]: valor };
        return { ...prev, parcelasDetalhe: arr };
      });
    };
    const somaParcelas = (formEmprestimo.parcelasDetalhe || []).reduce((a, p) => a + (parseFloat(p.valor) || 0), 0);

    const adicionarNovaConta = () => {
      if (novaContaInput.trim() && !contasOrigem.includes(novaContaInput.trim())) {
        setContasOrigem([...contasOrigem, novaContaInput.trim()]);
        setFormEmprestimo({ ...formEmprestimo, contaOrigem: novaContaInput.trim() });
      }
      setNovaContaInput("");
      setMostrarNovaConta(false);
    };

    const formValido = formEmprestimo.clienteId && formEmprestimo.valorOriginal && formEmprestimo.valorPrevisto && formEmprestimo.vencimento;

    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <TopBar titulo="Novo empréstimo" onBack={() => navegar("dashboard")} />
        {clientes.length === 0 ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <p style={{ fontSize: 13, color: TEXTO_SEC, marginBottom: 12 }}>Cadastre um cliente antes de registrar um empréstimo.</p>
            <button onClick={() => navegar("novoCliente")} style={btnPrimario}>Cadastrar cliente</button>
          </div>
        ) : (
          <>
            <label style={labelStyle}>Cliente</label>
            <select value={formEmprestimo.clienteId} onChange={(e) => setFormEmprestimo({ ...formEmprestimo, clienteId: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }}>
              <option value="">Selecione um cliente</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nomeCompleto}</option>)}
            </select>

            <label style={labelStyle}>Valor emprestado (R$)</label>
            <input type="number" value={formEmprestimo.valorOriginal} onChange={(e) => setFormEmprestimo({ ...formEmprestimo, valorOriginal: e.target.value })} placeholder="0,00" style={{ ...inputStyle, marginBottom: 10 }} />

            <label style={labelStyle}>Valor previsto para receber (R$)</label>
            <input type="number" value={formEmprestimo.valorPrevisto} onChange={(e) => setFormEmprestimo({ ...formEmprestimo, valorPrevisto: e.target.value })} placeholder="0,00" style={{ ...inputStyle, marginBottom: 10 }} />

            {valorEmprestadoNum > 0 && valorPrevistoNum > 0 && (
              <div style={{ background: AZUL_BG, borderRadius: 10, padding: "0.75rem 1rem", marginBottom: 14, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: AZUL }}>Lucro previsto</span>
                  <span style={{ fontWeight: 600, color: AZUL }}>{formatBRL(lucroPrevisto)}</span>
                </div>
                <p style={{ fontSize: 11, color: AZUL, margin: 0, opacity: 0.85 }}>Se não for pago na data, soma 10% do valor previsto por dia de atraso</p>
              </div>
            )}

            <label style={labelStyle}>Conta de origem do dinheiro</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
              {contasOrigem.map((conta) => (
                <button
                  key={conta}
                  onClick={() => setFormEmprestimo({ ...formEmprestimo, contaOrigem: conta })}
                  style={{
                    padding: "8px 14px", fontSize: 13, borderRadius: 10,
                    background: formEmprestimo.contaOrigem === conta ? ACENTO : BG_CARD_2,
                    color: formEmprestimo.contaOrigem === conta ? "#06251A" : TEXTO,
                    border: `1px solid ${formEmprestimo.contaOrigem === conta ? ACENTO : BORDA}`,
                  }}
                >
                  {conta}
                </button>
              ))}
              <button onClick={() => setMostrarNovaConta(!mostrarNovaConta)} style={{ ...btnSecundario, padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <Plus size={13} aria-hidden="true" /> Nova conta
              </button>
            </div>
            {mostrarNovaConta && (
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <input
                  type="text" value={novaContaInput} onChange={(e) => setNovaContaInput(e.target.value)}
                  placeholder="Ex: Bradesco, Caixa..." style={{ ...inputStyle, flex: 1 }}
                />
                <button onClick={adicionarNovaConta} style={btnPrimario}>Adicionar</button>
              </div>
            )}

            <label style={labelStyle}>Data de pagamento {formEmprestimo.formaPagamento === "parcelado" ? "(última parcela)" : ""}</label>
            <input type="date" value={formEmprestimo.vencimento} onChange={(e) => setFormEmprestimo({ ...formEmprestimo, vencimento: e.target.value })} style={{ ...inputStyle, marginBottom: 14 }} />

            <label style={labelStyle}>Pagamento</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                onClick={() => setFormEmprestimo({ ...formEmprestimo, formaPagamento: "avista" })}
                style={{ flex: 1, padding: "10px", fontSize: 13, borderRadius: 10, background: formEmprestimo.formaPagamento === "avista" ? ACENTO : BG_CARD_2, color: formEmprestimo.formaPagamento === "avista" ? "#06251A" : TEXTO, border: `1px solid ${formEmprestimo.formaPagamento === "avista" ? ACENTO : BORDA}` }}
              >
                À vista
              </button>
              <button
                onClick={ativarParcelado}
                style={{ flex: 1, padding: "10px", fontSize: 13, borderRadius: 10, background: formEmprestimo.formaPagamento === "parcelado" ? ACENTO : BG_CARD_2, color: formEmprestimo.formaPagamento === "parcelado" ? "#06251A" : TEXTO, border: `1px solid ${formEmprestimo.formaPagamento === "parcelado" ? ACENTO : BORDA}` }}
              >
                Parcelado
              </button>
            </div>

            {formEmprestimo.formaPagamento === "parcelado" && (
              <div style={{ ...cardStyle, marginBottom: 14 }}>
                <label style={labelStyle}>Quantidade de parcelas</label>
                <input
                  type="number" min="2" value={formEmprestimo.numParcelas}
                  onChange={(e) => atualizarNumParcelas(parseInt(e.target.value) || 2)}
                  style={{ ...inputStyle, marginBottom: 12, width: "100%" }}
                />
                {(formEmprestimo.parcelasDetalhe || []).map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: TEXTO_SEC, width: 36 }}>{i + 1}ª</span>
                    <input
                      type="number" placeholder="Valor (R$)" value={p.valor}
                      onChange={(e) => atualizarParcela(i, "valor", e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <input
                      type="date" value={p.data}
                      onChange={(e) => atualizarParcela(i, "data", e.target.value)}
                      style={{ ...inputStyle, flex: 1 }}
                    />
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 8, color: somaParcelas === valorPrevistoNum ? VERDE : AMARELO }}>
                  <span>Soma das parcelas</span>
                  <span style={{ fontWeight: 600 }}>{formatBRL(somaParcelas)} {valorPrevistoNum > 0 && `/ ${formatBRL(valorPrevistoNum)}`}</span>
                </div>
              </div>
            )}

            <label style={labelStyle}>Observação (opcional)</label>
            <input type="text" value={formEmprestimo.observacao} onChange={(e) => setFormEmprestimo({ ...formEmprestimo, observacao: e.target.value })} placeholder="Ex: combinado em parcelas..." style={{ ...inputStyle, marginBottom: 16 }} />
            <button onClick={adicionarEmprestimo} disabled={!formValido} style={{ ...btnPrimario, opacity: !formValido ? 0.5 : 1 }}>Registrar empréstimo</button>
          </>
        )}
      </Wrapper>
    );
  }

  // ================= HISTÓRICO =================
  if (pagina === "historico") {
    const empAvaliando = avaliandoEmprestimo ? emprestimos.find((e) => e.id === avaliandoEmprestimo) : null;
    const clienteAvaliando = empAvaliando ? getCliente(empAvaliando.clienteId) : null;
    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        {empAvaliando && (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 40, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: BG_CARD, border: `1px solid ${BORDA}`, borderRadius: 16, padding: "1.5rem 1.25rem", width: "85%", maxWidth: 320, boxSizing: "border-box" }}>
              <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "0 0 4px", textAlign: "center" }}>Empréstimo encerrado</p>
              <p style={{ fontSize: 16, fontWeight: 600, margin: "0 0 4px", textAlign: "center" }}>{clienteAvaliando ? clienteAvaliando.nomeCompleto : "Cliente"}</p>
              <p style={{ fontSize: 13, color: TEXTO_SEC, margin: "0 0 20px", textAlign: "center" }}>Como foi essa experiência?</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button onClick={() => finalizarComAvaliacao("antecipado")} style={{ ...btnSecundario, display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "10px 12px", justifyContent: "flex-start" }}><ThumbsUp size={16} color={VERDE} aria-hidden="true" /> Pagou antes ou na data certa</button>
                <button onClick={() => finalizarComAvaliacao("tranquilo")} style={{ ...btnSecundario, display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "10px 12px", justifyContent: "flex-start" }}><Heart size={16} color={AZUL} aria-hidden="true" /> Atrasou um pouco, sem estresse</button>
                <button onClick={() => finalizarComAvaliacao("dificil")} style={{ ...btnSecundario, display: "flex", alignItems: "center", gap: 10, fontSize: 13, padding: "10px 12px", justifyContent: "flex-start" }}><ThumbsDown size={16} color={VERMELHO} aria-hidden="true" /> Deu trabalho, tive que cobrar bastante</button>
              </div>
              <button onClick={() => setAvaliandoEmprestimo(null)} style={{ width: "100%", marginTop: 14, fontSize: 12, border: "none", background: "transparent", color: TEXTO_SEC }}>Pular avaliação</button>
            </div>
          </div>
        )}
        <TopBar titulo="Histórico" />
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {[{ id: "todos", label: "Todos" }, { id: "pendentes", label: "Pendentes" }, { id: "atrasados", label: "Atrasados" }, { id: "pagos", label: "Pagos" }].map((f) => (
            <button key={f.id} onClick={() => setFiltroHistorico(f.id)} style={{ padding: "5px 12px", fontSize: 13, borderRadius: 8, background: filtroHistorico === f.id ? ACENTO : BG_CARD_2, color: filtroHistorico === f.id ? "#06251A" : TEXTO, border: `1px solid ${filtroHistorico === f.id ? ACENTO : BORDA}` }}>{f.label}</button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {emprestimosFiltrados.length === 0 && <p style={{ fontSize: 13, color: TEXTO_SEC, textAlign: "center", padding: "1rem 0" }}>Nada por aqui com esse filtro.</p>}
          {emprestimosFiltrados.map((e) => {
            const cliente = getCliente(e.clienteId); const status = statusEmprestimo(e); const cfg = STATUS_CFG[status];
            const { valorComJuros, atraso, multa, totalDevido } = calcularValoresEmprestimo(e);
            const dataFormatada = new Date(e.vencimento + "T00:00:00").toLocaleDateString("pt-BR");
            return (
              <div key={e.id} style={{ ...cardStyle, opacity: e.pago ? 0.65 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{cliente ? cliente.nomeCompleto : "Cliente removido"}</p>
                    <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "2px 0 0" }}>Emprestado: {formatBRL(e.valorOriginal)}</p>
                    <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                      <Calendar size={11} aria-hidden="true" /> Início: {new Date(e.criadoEm).toLocaleDateString("pt-BR")}
                      {e.pago && e.pagoEm && ` · Pago em: ${new Date(e.pagoEm).toLocaleDateString("pt-BR")}`}
                    </p>
                  </div>
                  <p style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>{formatBRL(totalDevido)}</p>
                </div>
                {!e.pago && <div style={{ fontSize: 11, color: TEXTO_TERC, marginBottom: 8 }}>Previsto: {formatBRL(valorComJuros)}{atraso > 0 && ` · Juros de atraso (${atraso}d): ${formatBRL(multa)}`}</div>}
                {e.contaOrigem && <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "0 0 4px" }}>Saiu de: {e.contaOrigem}</p>}
                {e.parcelas && e.parcelas.length > 0 && (
                  <div style={{ fontSize: 11, color: TEXTO_TERC, margin: "0 0 8px" }}>
                    Parcelado em {e.parcelas.length}x: {e.parcelas.map((p, i) => `${formatBRL(parseFloat(p.valor) || 0)}${p.data ? ` (${new Date(p.data + "T00:00:00").toLocaleDateString("pt-BR")})` : ""}`).join(", ")}
                  </div>
                )}
                {e.observacao && <p style={{ fontSize: 13, color: TEXTO_SEC, margin: "0 0 8px" }}>{e.observacao}</p>}
                {e.pagamento && e.pagamento.metodo && (
                  <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "0 0 8px" }}>
                    {e.pagamento.metodo === "cartao" && `Cartão · ${e.pagamento.parcelas || 1}x`}
                    {e.pagamento.metodo === "dinheiro" && `Dinheiro · ${e.pagamento.comEntrada ? `com entrada de ${formatBRL(parseFloat(e.pagamento.valorEntrada) || 0)}` : "sem entrada"}`}
                    {e.pagamento.combinadoParcelas && ` · ${e.pagamento.combinadoParcelas}`}
                  </p>
                )}
                {e.pago && e.avaliacao && (
                  <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "0 0 8px" }}>
                    {e.avaliacao === "antecipado" && "Pagou antes ou na data certa"}
                    {e.avaliacao === "tranquilo" && "Atrasou um pouco, sem estresse"}
                    {e.avaliacao === "dificil" && "Deu trabalho, precisou cobrar"}
                  </p>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, fontWeight: 500, padding: "3px 10px", borderRadius: 8, background: cfg.bg, color: cfg.text, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {status === "atrasado" && <AlertTriangle size={12} aria-hidden="true" />}
                    {status === "proximo" && <Clock size={12} aria-hidden="true" />}
                    {e.pago ? "Pago" : status === "atrasado" ? `Atrasado há ${atraso} dia${atraso !== 1 ? "s" : ""}` : `Vence em ${dataFormatada}`}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => togglePago(e.id)} style={{ ...btnSecundario, padding: "4px 8px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Check size={13} aria-hidden="true" /> {e.pago ? "Reabrir" : "Pago"}</button>
                    <button onClick={() => excluirEmprestimo(e.id)} aria-label="Excluir" style={{ ...btnSecundario, padding: "4px 8px" }}><X size={13} aria-hidden="true" /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Wrapper>
    );
  }

  // ================= ESTOQUE (lista de produtos) =================
  if (pagina === "estoque") {
    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <TopBar titulo="Estoque e vendas" />
        <div style={{ position: "relative", marginBottom: "1rem" }}>
          <Search size={16} style={{ position: "absolute", left: 10, top: 11, color: TEXTO_TERC }} aria-hidden="true" />
          <input type="text" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." style={{ ...inputStyle, paddingLeft: 34 }} />
        </div>
        <button onClick={() => navegar("novoProduto")} style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: "1.25rem" }}>
          <Plus size={16} aria-hidden="true" /> Cadastrar produto
        </button>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Em estoque ({produtosEmEstoque.length})</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1.5rem" }}>
          {produtosFiltrados.filter((p) => !p.vendido).length === 0 && <p style={{ fontSize: 13, color: TEXTO_SEC, textAlign: "center", padding: "0.5rem 0" }}>Nenhum produto em estoque.</p>}
          {produtosFiltrados.filter((p) => !p.vendido).map((p) => (
            <div key={p.id} onClick={() => { setProdutoSelecionado(p.id); setPagina("detalheProduto"); }} style={{ ...cardStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: BG_CARD_2, display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={17} color={ACENTO} aria-hidden="true" /></div>
                <div><p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{p.nome}</p><p style={{ fontSize: 11, color: TEXTO_SEC, margin: "2px 0 0" }}>Custo: {formatBRL(p.precoCompra)}{p.precoVenda ? ` · Pretende vender: ${formatBRL(p.precoVenda)}` : ""}</p></div>
              </div>
              <ChevronRight size={16} color={TEXTO_TERC} aria-hidden="true" />
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Vendidos</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {produtosFiltrados.filter((p) => p.vendido).length === 0 && <p style={{ fontSize: 13, color: TEXTO_SEC }}>Nenhuma venda ainda.</p>}
          {produtosFiltrados.filter((p) => p.vendido).map((p) => (
            <div key={p.id} onClick={() => { setProdutoSelecionado(p.id); setPagina("detalheProduto"); }} style={{ ...cardStyle, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem", opacity: 0.7 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>{p.nome}</p>
                <p style={{ fontSize: 11, color: TEXTO_SEC, margin: "2px 0 0" }}>Lucro: <span style={{ color: (p.precoVenda - p.precoCompra) >= 0 ? VERDE : VERMELHO }}>{formatBRL(p.precoVenda - p.precoCompra)}</span></p>
              </div>
              <ChevronRight size={16} color={TEXTO_TERC} aria-hidden="true" />
            </div>
          ))}
        </div>
      </Wrapper>
    );
  }

  // ================= NOVO PRODUTO =================
  if (pagina === "novoProduto") {
    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <TopBar titulo="Cadastrar produto" onBack={() => navegar("estoque")} />
        <label style={labelStyle}>Nome do produto</label>
        <input type="text" value={formProduto.nome} onChange={(e) => setFormProduto({ ...formProduto, nome: e.target.value })} placeholder="Ex: iPhone 12, Perfume X..." style={{ ...inputStyle, marginBottom: 10 }} />
        <label style={labelStyle}>Preço de compra (R$)</label>
        <input type="number" value={formProduto.precoCompra} onChange={(e) => setFormProduto({ ...formProduto, precoCompra: e.target.value })} placeholder="0,00" style={{ ...inputStyle, marginBottom: 10 }} />
        <label style={labelStyle}>Preço de venda pretendido (R$, opcional)</label>
        <input type="number" value={formProduto.precoVenda} onChange={(e) => setFormProduto({ ...formProduto, precoVenda: e.target.value })} placeholder="0,00" style={{ ...inputStyle, marginBottom: 10 }} />
        <label style={labelStyle}>Quantidade</label>
        <input type="number" min="1" value={formProduto.quantidade} onChange={(e) => setFormProduto({ ...formProduto, quantidade: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
        <label style={labelStyle}>Especificações (opcional)</label>
        <textarea value={formProduto.especificacoes} onChange={(e) => setFormProduto({ ...formProduto, especificacoes: e.target.value })} placeholder="Ex: 128GB, cor azul, usado, com nota fiscal..." rows={3} style={{ ...inputStyle, marginBottom: 16, resize: "vertical" }} />
        <button onClick={adicionarProduto} disabled={!formProduto.nome || !formProduto.precoCompra} style={{ ...btnPrimario, opacity: (!formProduto.nome || !formProduto.precoCompra) ? 0.5 : 1 }}>Salvar produto</button>
      </Wrapper>
    );
  }

  // ================= DETALHE PRODUTO =================
  if (pagina === "detalheProduto" && produtoSelecionado) {
    const produto = produtos.find((p) => p.id === produtoSelecionado);
    if (!produto) { setPagina("estoque"); return null; }
    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <TopBar titulo="Detalhes do produto" onBack={() => setPagina("estoque")} />
        <div style={{ ...cardStyle, marginBottom: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: BG_CARD_2, display: "flex", alignItems: "center", justifyContent: "center" }}><Package size={22} color={ACENTO} aria-hidden="true" /></div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{produto.nome}</p>
              <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "2px 0 0" }}>{produto.vendido ? "Vendido" : "Em estoque"} · Cadastrado em {new Date(produto.criadoEm).toLocaleDateString("pt-BR")}</p>
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${BORDA}`, paddingTop: 10, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: TEXTO_SEC }}>Preço de compra</span><span>{formatBRL(produto.precoCompra)}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: TEXTO_SEC }}>{produto.vendido ? "Vendido por" : "Pretende vender por"}</span><span>{produto.precoVenda ? formatBRL(produto.precoVenda) : "—"}</span></div>
            {produto.vendido && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: TEXTO_SEC }}>Lucro</span>
                <span style={{ fontWeight: 600, color: (produto.precoVenda - produto.precoCompra) >= 0 ? VERDE : VERMELHO }}>{formatBRL(produto.precoVenda - produto.precoCompra)}</span>
              </div>
            )}
            {produto.vendido && produto.vendidoEm && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={{ color: TEXTO_SEC }}>Vendido em</span><span>{new Date(produto.vendidoEm).toLocaleDateString("pt-BR")}</span></div>
            )}
            {produto.pagamento && produto.pagamento.metodo && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                <span style={{ color: TEXTO_SEC }}>Pagamento</span>
                <span style={{ textAlign: "right" }}>
                  {produto.pagamento.metodo === "cartao" && `Cartão · ${produto.pagamento.parcelas || 1}x`}
                  {produto.pagamento.metodo === "dinheiro" && `Dinheiro · ${produto.pagamento.comEntrada ? `entrada ${formatBRL(parseFloat(produto.pagamento.valorEntrada) || 0)}` : "sem entrada"}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {produto.especificacoes && (
          <div style={{ ...cardStyle, marginBottom: "1rem" }}>
            <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "0 0 6px" }}>Especificações</p>
            <p style={{ fontSize: 13, margin: 0, lineHeight: 1.6 }}>{produto.especificacoes}</p>
          </div>
        )}

        {!produto.vendido ? (
          <VenderProdutoForm produto={produto} onConfirmar={(valor, pagamento) => { marcarVendido(produto.id, valor, pagamento); setPagina("estoque"); }} btnPrimario={btnPrimario} inputStyle={inputStyle} labelStyle={labelStyle} />
        ) : (
          <button onClick={() => reabrirProduto(produto.id)} style={btnSecundario}>Marcar como não vendido</button>
        )}

        <button onClick={() => { excluirProduto(produto.id); setPagina("estoque"); }} style={{ ...btnSecundario, width: "100%", marginTop: 10, color: VERMELHO }}>Excluir produto</button>
      </Wrapper>
    );
  }

  // ================= DESEMPENHO TOTAL =================
  if (pagina === "desempenho") {
    const totalEmprestadoGeral = emprestimos.reduce((a, e) => a + e.valorOriginal, 0);
    const totalRetornoGeral = emprestimos.reduce((a, e) => a + calcularValoresEmprestimo(e).totalDevido, 0);
    const totalLucroEmprestimoGeral = totalRetornoGeral - totalEmprestadoGeral;
    const totalRecebidoGeral = emprestimos.filter((e) => e.pago).reduce((a, e) => a + calcularValoresEmprestimo(e).totalDevido, 0);
    const totalPendenteGeral = emprestimos.filter((e) => !e.pago).reduce((a, e) => a + calcularValoresEmprestimo(e).totalDevido, 0);
    const totalAtrasadoGeral = emprestimos.filter((e) => statusEmprestimo(e) === "atrasado").reduce((a, e) => a + calcularValoresEmprestimo(e).totalDevido, 0);

    const produtosVendidos = produtos.filter((p) => p.vendido);
    const totalInvestidoVendasGeral = produtosVendidos.reduce((a, p) => a + p.precoCompra, 0);
    const totalVendidoGeral = produtosVendidos.reduce((a, p) => a + (p.precoVenda || 0), 0);
    const totalLucroVendasGeral = totalVendidoGeral - totalInvestidoVendasGeral;

    const lucroTotalCombinado = totalLucroEmprestimoGeral + totalLucroVendasGeral;

    return (
      <Wrapper pagina={pagina} navegar={navegar}>
        <TopBar titulo="Desempenho total" />
        <p style={{ fontSize: 12, color: TEXTO_SEC, marginBottom: "1.25rem" }}>Acumulado desde o início, sem zerar por mês.</p>

        <div style={{ background: BG_CARD, border: `1px solid ${ACENTO}`, borderRadius: 14, padding: "1.25rem", marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "0 0 6px" }}>Lucro total combinado</p>
          <p style={{ fontSize: 28, fontWeight: 700, margin: 0, color: lucroTotalCombinado >= 0 ? VERDE : VERMELHO }}>{formatBRL(lucroTotalCombinado)}</p>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}><User size={14} aria-hidden="true" /> Empréstimos</p>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Total emprestado</span><span style={{ fontSize: 13, fontWeight: 600 }}>{formatBRL(totalEmprestadoGeral)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Retorno total (com juros)</span><span style={{ fontSize: 13, fontWeight: 600 }}>{formatBRL(totalRetornoGeral)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Já recebido</span><span style={{ fontSize: 13, fontWeight: 600, color: VERDE }}>{formatBRL(totalRecebidoGeral)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Pendente</span><span style={{ fontSize: 13, fontWeight: 600, color: AMARELO }}>{formatBRL(totalPendenteGeral)}</span></div>
          {totalAtrasadoGeral > 0 && <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Em atraso</span><span style={{ fontSize: 13, fontWeight: 600, color: VERMELHO }}>{formatBRL(totalAtrasadoGeral)}</span></div>}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${BORDA}`, marginTop: 4 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Lucro</span><span style={{ fontSize: 14, fontWeight: 700, color: VERDE }}>{formatBRL(totalLucroEmprestimoGeral)}</span></div>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}><ShoppingBag size={14} aria-hidden="true" /> Vendas</p>
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Total investido em produtos vendidos</span><span style={{ fontSize: 13, fontWeight: 600 }}>{formatBRL(totalInvestidoVendasGeral)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Total vendido</span><span style={{ fontSize: 13, fontWeight: 600 }}>{formatBRL(totalVendidoGeral)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Valor parado em estoque</span><span style={{ fontSize: 13, fontWeight: 600, color: AMARELO }}>{formatBRL(valorEmEstoque)}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${BORDA}`, marginTop: 4 }}><span style={{ fontSize: 13, fontWeight: 600 }}>Lucro</span><span style={{ fontSize: 14, fontWeight: 700, color: totalLucroVendasGeral >= 0 ? VERDE : VERMELHO }}>{formatBRL(totalLucroVendasGeral)}</span></div>
        </div>

        <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Resumo geral</p>
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDA}` }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Empréstimos feitos</span><span style={{ fontSize: 13, fontWeight: 600 }}>{emprestimos.length}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${BORDA}` }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Produtos cadastrados</span><span style={{ fontSize: 13, fontWeight: 600 }}>{produtos.length}</span></div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}><span style={{ fontSize: 13, color: TEXTO_SEC }}>Produtos vendidos</span><span style={{ fontSize: 13, fontWeight: 600 }}>{produtosVendidos.length}</span></div>
        </div>
      </Wrapper>
    );
  }

  return null;
}

function mapClienteFromDb(c) {
  return {
    id: c.id, nomeCompleto: c.nome_completo, cpf: c.cpf, rg: c.rg,
    endereco: c.endereco, telefone: c.telefone, classificacao: c.classificacao,
    criadoEm: c.criado_em,
  };
}
function mapEmprestimoFromDb(e) {
  return {
    id: e.id, clienteId: e.cliente_id, valorOriginal: parseFloat(e.valor_original),
    valorPrevisto: e.valor_previsto != null ? parseFloat(e.valor_previsto) : parseFloat(e.valor_original),
    contaOrigem: e.conta_origem, formaPagamento: e.forma_pagamento, parcelas: e.parcelas || null,
    vencimento: e.vencimento, observacao: e.observacao, pagamento: e.pagamento || {},
    pago: e.pago, pagoEm: e.pago_em, avaliacao: e.avaliacao, criadoEm: e.criado_em,
  };
}
function mapProdutoFromDb(p) {
  return {
    id: p.id, nome: p.nome, precoCompra: parseFloat(p.preco_compra),
    precoVenda: p.preco_venda !== null ? parseFloat(p.preco_venda) : null,
    especificacoes: p.especificacoes, quantidade: p.quantidade, pagamento: p.pagamento || {},
    vendido: p.vendido, vendidoEm: p.vendido_em, criadoEm: p.criado_em,
  };
}

function VenderProdutoForm({ produto, onConfirmar, btnPrimario, inputStyle, labelStyle }) {
  const [valor, setValor] = useState(produto.precoVenda ? String(produto.precoVenda) : "");
  const [pagamento, setPagamento] = useState({});
  return (
    <div>
      <label style={labelStyle}>Confirmar venda por (R$)</label>
      <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" style={{ ...inputStyle, marginBottom: 14 }} />
      <PagamentoForm pagamento={pagamento} setPagamento={setPagamento} inputStyle={inputStyle} labelStyle={labelStyle} />
      <button onClick={() => valor && onConfirmar(parseFloat(valor), pagamento)} disabled={!valor} style={{ ...btnPrimario, opacity: !valor ? 0.5 : 1 }}>Marcar como vendido</button>
    </div>
  );
}
