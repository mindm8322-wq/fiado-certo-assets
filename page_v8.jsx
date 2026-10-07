"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, X, Check, AlertTriangle, User, ChevronRight, ChevronLeft, Star, Heart, Frown,
  Home, Search, Package, ShoppingBag, ArrowLeft, Trash2, Bell, BellOff, Wallet,
  Lock, ScanFace, Settings, Fuel, Utensils, Car, Truck, Box, CreditCard, Receipt,
  MessageCircle, Pencil, Undo2, Delete, ShieldCheck, StickyNote,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { supabase } from "../lib/supabase";

// =====================================================================
// TEMA
// =====================================================================
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
const FONTE = "'Inter', var(--font-sans), system-ui, sans-serif";

const inputStyle = {
  width: "100%", background: BG_CARD_2, border: `1px solid ${BORDA}`, color: TEXTO,
  borderRadius: 10, padding: "11px 12px", fontSize: 16, boxSizing: "border-box", fontFamily: FONTE,
  outline: "none",
};
const labelStyle = { fontSize: 12, color: TEXTO_SEC, display: "block", marginBottom: 6 };
const cardStyle = { background: BG_CARD, border: `1px solid ${BORDA}`, borderRadius: 14, padding: "1rem" };
const btnBase = { borderRadius: 10, padding: "12px 14px", fontSize: 14, cursor: "pointer", fontFamily: FONTE };
const btnPrimario = { ...btnBase, width: "100%", background: ACENTO, color: "#06251A", border: "none", fontWeight: 600 };
const btnSecundario = { ...btnBase, background: BG_CARD_2, color: TEXTO, border: `1px solid ${BORDA}` };
const btnPerigo = { ...btnBase, background: VERMELHO_BG, color: VERMELHO, border: `1px solid ${VERMELHO_BG}` };

// =====================================================================
// CONFIGURAÇÕES DE NEGÓCIO
// =====================================================================
const CATEGORIAS_GASTO = {
  gasolina: { label: "Gasolina", icon: Fuel, cor: AMARELO },
  alimentacao: { label: "Alimentação", icon: Utensils, cor: "#E28A5B" },
  transporte: { label: "Uber / Transporte", icon: Car, cor: AZUL },
  frete: { label: "Frete / Envio", icon: Truck, cor: "#A07BE2" },
  embalagem: { label: "Embalagem", icon: Box, cor: "#5BD0E2" },
  taxa: { label: "Taxas", icon: CreditCard, cor: VERMELHO },
  outros: { label: "Outros", icon: Receipt, cor: TEXTO_SEC },
};
const MEIOS = {
  pix: "Pix", dinheiro: "Dinheiro", debito: "Cartão de débito", credito: "Cartão de crédito", outro: "Outro",
};
const CLASSIFICACOES = {
  otimo: { label: "Ótimo cliente", bg: VERDE_BG, text: VERDE, icon: Star },
  bom: { label: "Bom cliente", bg: AZUL_BG, text: AZUL, icon: Heart },
  problema: { label: "Já me deu dor de cabeça", bg: VERMELHO_BG, text: VERMELHO, icon: Frown },
  novo: { label: "Sem histórico", bg: BG_CARD_2, text: TEXTO_SEC, icon: User },
};
const STATUS_VENDA = {
  quitada: { label: "Quitada", bg: VERDE_BG, text: VERDE },
  atrasada: { label: "Atrasada", bg: VERMELHO_BG, text: VERMELHO },
  proxima: { label: "Vence em breve", bg: AMARELO_BG, text: AMARELO },
  aberta: { label: "Em aberto", bg: AZUL_BG, text: AZUL },
};
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MESES_CURTO = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

// =====================================================================
// UTILITÁRIOS
// =====================================================================
function formatBRL(v) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v) || 0);
}
function formatCompacto(v) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return Number(v || 0).toFixed(0);
}
// aceita "1.234,56", "1234,56", "1234.56"
function parseValor(s) {
  if (s === null || s === undefined) return NaN;
  if (typeof s === "number") return s;
  let t = String(s).trim().replace(/[R$\s]/g, "");
  if (!t) return NaN;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  const n = parseFloat(t);
  return isNaN(n) ? NaN : n;
}
function valorParaInput(n) {
  if (n === null || n === undefined || isNaN(n)) return "";
  return Number(n).toFixed(2).replace(".", ",");
}
const arred = (n) => Math.round(n * 100) / 100;
function hojeISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isoDeData(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dataDeIso(iso) {
  const [a, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d);
}
function addMeses(iso, n) {
  const d = dataDeIso(iso);
  const dia = d.getDate();
  const alvo = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const ultimo = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0).getDate();
  alvo.setDate(Math.min(dia, ultimo));
  return isoDeData(alvo);
}
function addDias(iso, n) {
  const d = dataDeIso(iso);
  d.setDate(d.getDate() + n);
  return isoDeData(d);
}
function formatData(iso) {
  if (!iso) return "—";
  const d = dataDeIso(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}
function formatDataCurta(iso) {
  if (!iso) return "—";
  const d = dataDeIso(iso);
  return `${String(d.getDate()).padStart(2, "0")} ${MESES_CURTO[d.getMonth()]}`;
}
function diasAte(iso) {
  const h = dataDeIso(hojeISO());
  return Math.round((dataDeIso(iso) - h) / 86400000);
}
function chaveMes(iso) { return String(iso || "").slice(0, 7); }
function chaveDeAnoMes(ano, mes) { return `${ano}-${String(mes + 1).padStart(2, "0")}`; }
function linkWhatsApp(telefone, mensagem) {
  let d = String(telefone || "").replace(/\D/g, "");
  if (!d) return null;
  if (d.length <= 11) d = "55" + d;
  return `https://wa.me/${d}?text=${encodeURIComponent(mensagem)}`;
}
function rotuloParcela(p, total) {
  if (p.numero === 0) return "Entrada";
  return `${p.numero}/${total}`;
}

// Gera parcelas iguais (última absorve centavos)
function gerarParcelas(restante, n, primeiroVenc, intervalo) {
  const qtd = Math.min(60, Math.max(1, parseInt(n, 10) || 1));
  if (!(restante > 0) || !primeiroVenc) return Array.from({ length: qtd }, (_, i) => ({ valor: "", vencimento: primeiroVenc ? proxData(primeiroVenc, i, intervalo) : "" }));
  const base = Math.floor((restante / qtd) * 100) / 100;
  const lista = [];
  for (let i = 0; i < qtd; i++) {
    const valor = i === qtd - 1 ? arred(restante - base * (qtd - 1)) : base;
    lista.push({ valor: valorParaInput(valor), vencimento: proxData(primeiroVenc, i, intervalo) });
  }
  return lista;
}
function proxData(inicio, i, intervalo) {
  if (intervalo === "semanal") return addDias(inicio, 7 * i);
  if (intervalo === "quinzenal") return addDias(inicio, 15 * i);
  return addMeses(inicio, i);
}

// Resumo financeiro de uma venda
function resumoVenda(venda, parcelasVenda, gastosVenda) {
  const ps = parcelasVenda || [];
  const pagas = ps.filter((p) => p.pago);
  const abertas = ps.filter((p) => !p.pago);
  const combinado = arred(ps.reduce((a, p) => a + p.valor, 0));
  const recebido = arred(pagas.reduce((a, p) => a + (p.valorRecebido != null ? p.valorRecebido : p.valor), 0));
  const aReceber = arred(abertas.reduce((a, p) => a + p.valor, 0));
  const diferenca = arred(pagas.reduce((a, p) => a + ((p.valorRecebido != null ? p.valorRecebido : p.valor) - p.valor), 0));
  const totalEfetivo = arred(recebido + aReceber);
  const totalGastos = arred((gastosVenda || []).reduce((a, g) => a + g.valor, 0));
  const lucro = arred(totalEfetivo - venda.valorPago - totalGastos);
  const margem = totalEfetivo > 0 ? (lucro / totalEfetivo) * 100 : 0;
  let status = "aberta";
  if (ps.length > 0 && abertas.length === 0) status = "quitada";
  else if (abertas.some((p) => diasAte(p.vencimento) < 0)) status = "atrasada";
  else if (abertas.some((p) => diasAte(p.vencimento) <= 3)) status = "proxima";
  const proxima = abertas.slice().sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0] || null;
  return { combinado, recebido, aReceber, diferenca, totalEfetivo, totalGastos, lucro, margem, status, proxima, qtdParcelas: ps.filter((p) => p.numero > 0).length };
}

// =====================================================================
// SEGURANÇA — Face ID (WebAuthn) + PIN
// =====================================================================
const LOCK_KEY = "fiadocerto_lock_v1";
function lerConfigBloqueio() {
  try { const r = localStorage.getItem(LOCK_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
}
function salvarConfigBloqueio(cfg) {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(cfg)); return true; } catch (e) { return false; }
}
function b64url(buf) {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function deB64url(s) {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
async function hashPin(pin, salt) {
  const data = new TextEncoder().encode(`${salt}:${pin}`);
  const h = await crypto.subtle.digest("SHA-256", data);
  return b64url(h);
}
async function biometriaDisponivel() {
  try {
    if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (e) { return false; }
}
async function registrarBiometria() {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "Fiado Certo", id: window.location.hostname },
      user: { id: crypto.getRandomValues(new Uint8Array(16)), name: "dono", displayName: "Fiado Certo" },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "preferred" },
      timeout: 60000,
      attestation: "none",
    },
  });
  if (!cred) throw new Error("cancelado");
  return b64url(cred.rawId);
}
async function verificarBiometria(credId) {
  const r = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: window.location.hostname,
      allowCredentials: [{ type: "public-key", id: deB64url(credId), transports: ["internal", "hybrid"] }],
      userVerification: "required",
      timeout: 60000,
    },
  });
  if (!r) return false;
  const flags = new Uint8Array(r.response.authenticatorData)[32];
  return (flags & 0x04) === 0x04; // bit UV: usuário verificado (Face ID / Touch ID / senha do aparelho)
}

function TecladoPin({ valor, setValor, max = 6, onEnviar }) {
  const teclas = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 72px)", gap: 14, justifyContent: "center" }}>
      {teclas.map((t, i) => {
        if (t === "") return <span key={i} />;
        const del = t === "del";
        return (
          <button
            key={i}
            aria-label={del ? "Apagar" : t}
            onClick={() => {
              if (del) { setValor(valor.slice(0, -1)); return; }
              if (valor.length >= max) return;
              const novo = valor + t;
              setValor(novo);
              if (onEnviar && novo.length === max) onEnviar(novo);
            }}
            style={{
              width: 72, height: 72, borderRadius: "50%", border: del ? "none" : `1px solid ${BORDA}`,
              background: del ? "transparent" : BG_CARD, color: TEXTO, fontSize: 26, fontWeight: 500,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontFamily: FONTE,
            }}
          >
            {del ? <Delete size={24} aria-hidden="true" /> : t}
          </button>
        );
      })}
    </div>
  );
}

function PontosPin({ qtd, total, erro }) {
  return (
    <div style={{ display: "flex", gap: 14, justifyContent: "center", margin: "18px 0 26px" }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          width: 14, height: 14, borderRadius: "50%",
          background: i < qtd ? (erro ? VERMELHO : ACENTO) : "transparent",
          border: `2px solid ${erro ? VERMELHO : i < qtd ? ACENTO : TEXTO_TERC}`,
        }} />
      ))}
    </div>
  );
}

function TelaCheia({ children }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: BG, color: TEXTO, fontFamily: FONTE,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24,
      overflowY: "auto",
    }}>
      {children}
    </div>
  );
}

function ConfigurarBloqueio({ onConcluir }) {
  const [etapa, setEtapa] = useState("pin"); // pin | confirmar | biometria
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [erro, setErro] = useState("");
  const [temBio, setTemBio] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const pinFinal = useRef("");

  useEffect(() => { biometriaDisponivel().then(setTemBio); }, []);

  const finalizar = async (credId) => {
    const salt = b64url(crypto.getRandomValues(new Uint8Array(16)));
    const pinHash = await hashPin(pinFinal.current, salt);
    const cfg = { salt, pinHash, credId: credId || null, tamanhoPin: pinFinal.current.length };
    salvarConfigBloqueio(cfg);
    onConcluir(cfg);
  };

  if (etapa === "pin") {
    return (
      <TelaCheia>
        <ShieldCheck size={40} color={ACENTO} aria-hidden="true" />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 6px" }}>Proteja seu app</h1>
        <p style={{ fontSize: 14, color: TEXTO_SEC, margin: 0, textAlign: "center", maxWidth: 300 }}>
          Crie um PIN de 6 dígitos. Ele é o plano B caso o Face ID falhe.
        </p>
        <PontosPin qtd={pin.length} total={6} />
        <TecladoPin valor={pin} setValor={setPin} onEnviar={(v) => { pinFinal.current = v; setTimeout(() => setEtapa("confirmar"), 150); }} />
      </TelaCheia>
    );
  }
  if (etapa === "confirmar") {
    return (
      <TelaCheia>
        <ShieldCheck size={40} color={ACENTO} aria-hidden="true" />
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 6px" }}>Confirme o PIN</h1>
        <p style={{ fontSize: 14, color: erro ? VERMELHO : TEXTO_SEC, margin: 0, textAlign: "center" }}>
          {erro || "Digite de novo pra confirmar."}
        </p>
        <PontosPin qtd={pin2.length} total={6} erro={!!erro} />
        <TecladoPin
          valor={pin2}
          setValor={(v) => { setErro(""); setPin2(v); }}
          onEnviar={(v) => {
            if (v !== pinFinal.current) {
              setErro("Os PINs não batem. Começa de novo.");
              setTimeout(() => { setPin(""); setPin2(""); setErro(""); setEtapa("pin"); }, 1200);
              return;
            }
            if (temBio) setTimeout(() => setEtapa("biometria"), 150);
            else finalizar(null);
          }}
        />
      </TelaCheia>
    );
  }
  return (
    <TelaCheia>
      <ScanFace size={56} color={ACENTO} aria-hidden="true" />
      <h1 style={{ fontSize: 20, fontWeight: 700, margin: "14px 0 6px" }}>Ativar Face ID?</h1>
      <p style={{ fontSize: 14, color: TEXTO_SEC, margin: "0 0 24px", textAlign: "center", maxWidth: 300 }}>
        Toda vez que você sair e voltar pro app, ele pede seu rosto. Sem digitar nada.
      </p>
      {erro && <p style={{ fontSize: 13, color: VERMELHO, margin: "0 0 14px", textAlign: "center", maxWidth: 300 }}>{erro}</p>}
      <div style={{ width: "100%", maxWidth: 320, display: "flex", flexDirection: "column", gap: 10 }}>
        <button
          disabled={ocupado}
          onClick={async () => {
            setOcupado(true); setErro("");
            try {
              window.__fcBioEmAndamento = true;
              const credId = await registrarBiometria();
              await finalizar(credId);
            } catch (e) {
              setErro("Não deu pra ativar agora. Você pode tentar de novo ou seguir só com o PIN.");
            } finally {
              window.__fcBioEmAndamento = false;
              setOcupado(false);
            }
          }}
          style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: ocupado ? 0.6 : 1 }}
        >
          <ScanFace size={18} aria-hidden="true" /> Ativar Face ID
        </button>
        <button onClick={() => finalizar(null)} style={{ ...btnSecundario, width: "100%" }}>Agora não, só PIN</button>
      </div>
    </TelaCheia>
  );
}

function TelaBloqueio({ config, onDesbloquear, autoBio }) {
  const [modo, setModo] = useState(config.credId ? "bio" : "pin");
  const [pin, setPin] = useState("");
  const [erro, setErro] = useState("");
  const [falhasBio, setFalhasBio] = useState(0);
  const [tentativasPin, setTentativasPin] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState(0);
  const [agora, setAgora] = useState(Date.now());
  const tentouAuto = useRef(false);
  const tamanho = config.tamanhoPin || 6;

  useEffect(() => {
    if (!bloqueadoAte) return;
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, [bloqueadoAte]);

  const tentarBio = useCallback(async (automatico) => {
    if (!config.credId) return;
    setErro("");
    try {
      window.__fcBioEmAndamento = true;
      const ok = await verificarBiometria(config.credId);
      if (ok) { onDesbloquear(); return; }
      throw new Error("nao verificado");
    } catch (e) {
      if (automatico) return; // iOS às vezes exige toque — não conta como falha
      const f = falhasBio + 1;
      setFalhasBio(f);
      if (f >= 3) { setModo("pin"); setErro("Face ID falhou 3 vezes. Usa o PIN."); }
      else setErro("Não reconheceu. Tenta de novo.");
    } finally {
      window.__fcBioEmAndamento = false;
    }
  }, [config.credId, falhasBio, onDesbloquear]);

  useEffect(() => {
    if (autoBio && config.credId && !tentouAuto.current) {
      tentouAuto.current = true;
      tentarBio(true);
    }
  }, [autoBio, config.credId, tentarBio]);

  const conferirPin = async (v) => {
    if (bloqueadoAte && Date.now() < bloqueadoAte) return;
    const h = await hashPin(v, config.salt);
    if (h === config.pinHash) { onDesbloquear(); return; }
    const t = tentativasPin + 1;
    setTentativasPin(t);
    setErro("PIN errado.");
    setTimeout(() => setPin(""), 400);
    if (t >= 5) {
      setBloqueadoAte(Date.now() + 30000);
      setTentativasPin(0);
      setErro("Muitas tentativas. Espera 30 segundos.");
    }
  };

  const restante = bloqueadoAte ? Math.max(0, Math.ceil((bloqueadoAte - agora) / 1000)) : 0;

  if (modo === "bio") {
    return (
      <TelaCheia>
        <Lock size={22} color={TEXTO_SEC} aria-hidden="true" />
        <p style={{ fontSize: 13, color: TEXTO_SEC, margin: "8px 0 28px" }}>Fiado Certo bloqueado</p>
        <button
          onClick={() => tentarBio(false)}
          aria-label="Desbloquear com Face ID"
          style={{ width: 110, height: 110, borderRadius: 28, background: BG_CARD, border: `1px solid ${BORDA}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <ScanFace size={56} color={ACENTO} aria-hidden="true" />
        </button>
        <p style={{ fontSize: 15, fontWeight: 600, margin: "18px 0 4px" }}>Toque pra usar o Face ID</p>
        <p style={{ fontSize: 13, color: erro ? VERMELHO : TEXTO_SEC, margin: "0 0 28px", minHeight: 18 }}>{erro}</p>
        <button onClick={() => { setErro(""); setModo("pin"); }} style={{ ...btnSecundario, padding: "10px 18px" }}>Usar PIN</button>
      </TelaCheia>
    );
  }
  return (
    <TelaCheia>
      <Lock size={22} color={TEXTO_SEC} aria-hidden="true" />
      <h1 style={{ fontSize: 18, fontWeight: 600, margin: "8px 0 4px" }}>Digite seu PIN</h1>
      <p style={{ fontSize: 13, color: erro ? VERMELHO : TEXTO_SEC, margin: 0, minHeight: 18 }}>
        {restante > 0 ? `Muitas tentativas. Espera ${restante}s.` : erro}
      </p>
      <PontosPin qtd={pin.length} total={tamanho} erro={!!erro && restante === 0 && pin.length === tamanho} />
      <div style={{ opacity: restante > 0 ? 0.35 : 1, pointerEvents: restante > 0 ? "none" : "auto" }}>
        <TecladoPin valor={pin} setValor={(v) => { setErro(""); setPin(v); }} max={tamanho} onEnviar={conferirPin} />
      </div>
      {config.credId && (
        <button onClick={() => { setErro(""); setPin(""); setFalhasBio(0); setModo("bio"); }} style={{ ...btnSecundario, marginTop: 26, display: "flex", alignItems: "center", gap: 8, padding: "10px 18px" }}>
          <ScanFace size={16} aria-hidden="true" /> Usar Face ID
        </button>
      )}
    </TelaCheia>
  );
}

function PortaoSeguranca({ children, setControleBloqueio }) {
  const [config, setConfig] = useState(undefined);
  const [bloqueado, setBloqueado] = useState(true);
  const [jaDesbloqueou, setJaDesbloqueou] = useState(false);
  const [chaveTela, setChaveTela] = useState(0);

  useEffect(() => { setConfig(lerConfigBloqueio()); }, []);

  // Bloqueia sempre que o app vai pro fundo (sair e voltar)
  useEffect(() => {
    const aoMudar = () => {
      if (document.visibilityState === "hidden" && !window.__fcBioEmAndamento && !window.__fcSemBloqueio) {
        setBloqueado(true);
        setChaveTela((k) => k + 1);
      }
    };
    document.addEventListener("visibilitychange", aoMudar);
    window.addEventListener("pagehide", aoMudar);
    return () => {
      document.removeEventListener("visibilitychange", aoMudar);
      window.removeEventListener("pagehide", aoMudar);
    };
  }, []);

  useEffect(() => {
    if (!setControleBloqueio) return;
    setControleBloqueio({
      config,
      bloquearAgora: () => { setBloqueado(true); setChaveTela((k) => k + 1); },
      atualizarConfig: (cfg) => { salvarConfigBloqueio(cfg); setConfig(cfg); },
    });
  }, [config, setControleBloqueio]);

  const desbloquear = useCallback(() => { setBloqueado(false); setJaDesbloqueou(true); }, []);

  if (config === undefined) return <div style={{ position: "fixed", inset: 0, background: BG }} />;
  if (config === null) {
    return <ConfigurarBloqueio onConcluir={(cfg) => { setConfig(cfg); desbloquear(); }} />;
  }
  return (
    <>
      {jaDesbloqueou && children}
      {bloqueado && <TelaBloqueio key={chaveTela} config={config} onDesbloquear={desbloquear} autoBio />}
    </>
  );
}

// =====================================================================
// COMPONENTES DE UI (fora do App pra não perder foco nos inputs)
// =====================================================================
function TopBar({ titulo, onBack, direita }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "1.1rem", minHeight: 36 }}>
      {onBack && (
        <button onClick={onBack} aria-label="Voltar" style={{ padding: 6, marginLeft: -6, border: "none", background: "transparent", color: TEXTO, cursor: "pointer" }}>
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
      )}
      <h1 style={{ fontSize: 18, fontWeight: 650, margin: 0, color: TEXTO, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{titulo}</h1>
      {direita}
    </div>
  );
}

function NavInferior({ pagina, irPara }) {
  const itens = [
    { id: "vendas", label: "Vendas", icon: ShoppingBag, grupo: ["vendas", "detalheVenda", "novaVenda"] },
    { id: "estoque", label: "Estoque", icon: Package, grupo: ["estoque", "detalheProduto", "novoProduto"] },
    { id: "dashboard", label: "Início", icon: Home, central: true, grupo: ["dashboard"] },
    { id: "gastos", label: "Gastos", icon: Wallet, grupo: ["gastos", "novoGasto"] },
    { id: "clientes", label: "Clientes", icon: User, grupo: ["clientes", "detalheCliente", "novoCliente"] },
  ];
  return (
    <nav style={{
      position: "fixed", left: 0, right: 0, bottom: 0, background: "#0C0E10",
      borderTop: `1px solid ${BORDA}`, zIndex: 30, paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", padding: "8px 4px 10px", maxWidth: 560, margin: "0 auto" }}>
        {itens.map((item) => {
          const Icon = item.icon;
          const ativo = item.grupo.includes(pagina);
          if (item.central) {
            return (
              <button key={item.id} onClick={() => irPara(item.id)} aria-label={item.label} style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 54, height: 54, borderRadius: "50%", background: ativo ? ACENTO : BG_CARD_2,
                border: "none", marginTop: -20, boxShadow: "0 2px 12px rgba(0,0,0,0.45)", cursor: "pointer",
              }}>
                <Icon size={23} color={ativo ? "#06251A" : TEXTO} aria-hidden="true" />
              </button>
            );
          }
          return (
            <button key={item.id} onClick={() => irPara(item.id)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 3, minWidth: 56,
              border: "none", background: "transparent", padding: "4px 6px", cursor: "pointer",
              color: ativo ? ACENTO : TEXTO_SEC, fontFamily: FONTE,
            }}>
              <Icon size={19} aria-hidden="true" />
              <span style={{ fontSize: 10.5 }}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Wrapper({ children, pagina, irPara }) {
  return (
    <div style={{ fontFamily: FONTE, background: BG, color: TEXTO, minHeight: "100vh" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "calc(16px + env(safe-area-inset-top)) 16px 110px", boxSizing: "border-box" }}>
        {children}
      </div>
      <NavInferior pagina={pagina} irPara={irPara} />
    </div>
  );
}

function Badge({ cfg, children }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: cfg.bg, color: cfg.text, whiteSpace: "nowrap" }}>
      {children || cfg.label}
    </span>
  );
}

function Linha({ rotulo, valor, cor, forte, borda }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, padding: "7px 0", borderTop: borda ? `1px solid ${BORDA}` : "none", marginTop: borda ? 4 : 0 }}>
      <span style={{ fontSize: 13, color: forte ? TEXTO : TEXTO_SEC, fontWeight: forte ? 600 : 400 }}>{rotulo}</span>
      <span style={{ fontSize: forte ? 15 : 13, fontWeight: forte ? 700 : 600, color: cor || TEXTO, textAlign: "right" }}>{valor}</span>
    </div>
  );
}

function Campo({ rotulo, children, dica }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {rotulo && <label style={labelStyle}>{rotulo}</label>}
      {children}
      {dica && <p style={{ fontSize: 11.5, color: TEXTO_TERC, margin: "5px 0 0" }}>{dica}</p>}
    </div>
  );
}

function InputValor({ value, onChange, placeholder = "0,00", autoFocus, style }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TEXTO_TERC, fontSize: 14 }}>R$</span>
      <input
        type="text" inputMode="decimal" autoFocus={autoFocus} value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ""))}
        placeholder={placeholder} style={{ ...inputStyle, paddingLeft: 38, ...style }}
      />
    </div>
  );
}

function Chips({ opcoes, valor, onChange, pequeno }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {opcoes.map((o) => {
        const ativo = valor === o.id;
        const Icon = o.icon;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: pequeno ? "7px 11px" : "9px 13px", borderRadius: 999,
            fontSize: 13, cursor: "pointer", fontFamily: FONTE,
            background: ativo ? ACENTO : BG_CARD_2, color: ativo ? "#06251A" : TEXTO,
            border: `1px solid ${ativo ? ACENTO : BORDA}`, fontWeight: ativo ? 600 : 400,
          }}>
            {Icon && <Icon size={14} aria-hidden="true" />}{o.label}
          </button>
        );
      })}
    </div>
  );
}

function Segmentado({ opcoes, valor, onChange }) {
  return (
    <div style={{ display: "flex", background: BG_CARD_2, border: `1px solid ${BORDA}`, borderRadius: 12, padding: 3 }}>
      {opcoes.map((o) => {
        const ativo = valor === o.id;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            flex: 1, padding: "9px 6px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: FONTE,
            background: ativo ? ACENTO : "transparent", color: ativo ? "#06251A" : TEXTO_SEC,
            fontSize: 13, fontWeight: ativo ? 650 : 500,
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function Folha({ titulo, onFechar, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onFechar}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: BG_CARD, borderTop: `1px solid ${BORDA}`, borderRadius: "18px 18px 0 0", width: "100%", maxWidth: 560,
        maxHeight: "88vh", overflowY: "auto", padding: "16px 16px calc(20px + env(safe-area-inset-bottom))", boxSizing: "border-box",
        fontFamily: FONTE, color: TEXTO,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, fontWeight: 650, margin: 0 }}>{titulo}</h2>
          <button onClick={onFechar} aria-label="Fechar" style={{ background: "transparent", border: "none", color: TEXTO_SEC, padding: 4, cursor: "pointer" }}><X size={20} aria-hidden="true" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BotaoConfirmar({ rotulo, rotuloConfirmar = "Toque de novo pra confirmar", onConfirmar, estilo, icone }) {
  const [armado, setArmado] = useState(false);
  useEffect(() => {
    if (!armado) return;
    const t = setTimeout(() => setArmado(false), 3500);
    return () => clearTimeout(t);
  }, [armado]);
  const Icon = icone;
  return (
    <button onClick={() => { if (armado) { setArmado(false); onConfirmar(); } else setArmado(true); }} style={{ ...btnPerigo, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, ...estilo, ...(armado ? { background: VERMELHO, color: "#fff" } : {}) }}>
      {Icon && <Icon size={15} aria-hidden="true" />}{armado ? rotuloConfirmar : rotulo}
    </button>
  );
}

function BarraProgresso({ valor, total, cor = ACENTO }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (valor / total) * 100)) : 0;
  return (
    <div style={{ height: 6, borderRadius: 999, background: BG_CARD_2, overflow: "hidden" }}>
      <div style={{ width: `${pct}%`, height: "100%", background: cor, borderRadius: 999, transition: "width .3s" }} />
    </div>
  );
}

function SeletorMes({ ano, mes, onChange }) {
  const mover = (d) => {
    const dt = new Date(ano, mes + d, 1);
    onChange(dt.getFullYear(), dt.getMonth());
  };
  const h = new Date();
  const ehAtual = ano === h.getFullYear() && mes === h.getMonth();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: BG_CARD, border: `1px solid ${BORDA}`, borderRadius: 12, padding: 4, marginBottom: 12 }}>
      <button onClick={() => mover(-1)} aria-label="Mês anterior" style={{ background: "transparent", border: "none", color: TEXTO, padding: 8, cursor: "pointer" }}><ChevronLeft size={18} aria-hidden="true" /></button>
      <span style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{MESES[mes]} {ano}</span>
      <button onClick={() => mover(1)} aria-label="Próximo mês" disabled={ehAtual} style={{ background: "transparent", border: "none", color: ehAtual ? TEXTO_TERC : TEXTO, padding: 8, cursor: ehAtual ? "default" : "pointer" }}><ChevronRight size={18} aria-hidden="true" /></button>
    </div>
  );
}

function Vazio({ icone: Icon, texto, acao }) {
  return (
    <div style={{ ...cardStyle, textAlign: "center", padding: "2rem 1rem" }}>
      {Icon && <Icon size={28} color={TEXTO_TERC} aria-hidden="true" />}
      <p style={{ fontSize: 13, color: TEXTO_SEC, margin: "10px 0 0" }}>{texto}</p>
      {acao && <div style={{ marginTop: 14 }}>{acao}</div>}
    </div>
  );
}

function Busca({ valor, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: TEXTO_TERC }} aria-hidden="true" />
      <input type="text" value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, paddingLeft: 36 }} />
    </div>
  );
}

// ---------------- Formulários em folha (estado próprio) ----------------
function FormReceberParcela({ parcela, onSalvar, salvando }) {
  const [valor, setValor] = useState(valorParaInput(parcela.valor));
  const [data, setData] = useState(hojeISO());
  const [obs, setObs] = useState(parcela.observacao || "");
  const v = parseValor(valor);
  const dif = !isNaN(v) ? arred(v - parcela.valor) : 0;
  return (
    <div>
      <Campo rotulo="Quanto você recebeu?" dica={`Valor combinado dessa parcela: ${formatBRL(parcela.valor)}`}>
        <InputValor value={valor} onChange={setValor} autoFocus />
      </Campo>
      {dif !== 0 && !isNaN(v) && (
        <div style={{ background: dif > 0 ? VERDE_BG : AMARELO_BG, color: dif > 0 ? VERDE : AMARELO, borderRadius: 10, padding: "8px 12px", fontSize: 12.5, marginBottom: 14 }}>
          {dif > 0 ? `Recebeu ${formatBRL(dif)} a mais que o combinado.` : `Recebeu ${formatBRL(-dif)} a menos que o combinado. A diferença fica registrada na venda.`}
        </div>
      )}
      <Campo rotulo="Data do recebimento">
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={inputStyle} />
      </Campo>
      <Campo rotulo="Observação (opcional)">
        <input type="text" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: pagou no pix da esposa" style={inputStyle} />
      </Campo>
      <button disabled={salvando || isNaN(v) || v < 0 || !data} onClick={() => onSalvar({ valorRecebido: v, data, obs })} style={{ ...btnPrimario, opacity: salvando || isNaN(v) || v < 0 ? 0.5 : 1 }}>
        Confirmar recebimento
      </button>
    </div>
  );
}

function FormParcela({ parcela, onSalvar, onExcluir, podeExcluir, salvando }) {
  const [valor, setValor] = useState(parcela ? valorParaInput(parcela.valor) : "");
  const [venc, setVenc] = useState(parcela ? parcela.vencimento : hojeISO());
  const [obs, setObs] = useState(parcela?.observacao || "");
  const v = parseValor(valor);
  return (
    <div>
      <Campo rotulo="Valor da parcela"><InputValor value={valor} onChange={setValor} autoFocus={!parcela} /></Campo>
      <Campo rotulo="Vencimento"><input type="date" value={venc} onChange={(e) => setVenc(e.target.value)} style={inputStyle} /></Campo>
      <Campo rotulo="Observação (opcional)"><input type="text" value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Ex: renegociado, deu desconto" style={inputStyle} /></Campo>
      <button disabled={salvando || isNaN(v) || v <= 0 || !venc} onClick={() => onSalvar({ valor: v, vencimento: venc, observacao: obs })} style={{ ...btnPrimario, opacity: salvando || isNaN(v) || v <= 0 || !venc ? 0.5 : 1, marginBottom: 10 }}>
        Salvar parcela
      </button>
      {parcela && podeExcluir && <BotaoConfirmar rotulo="Excluir parcela" icone={Trash2} onConfirmar={onExcluir} estilo={{ width: "100%" }} />}
    </div>
  );
}

function FormEditarVenda({ venda, clientes, onSalvar, salvando }) {
  const [f, setF] = useState({
    produtoNome: venda.produtoNome, descricao: venda.descricao || "", clienteId: venda.clienteId || "",
    dataVenda: venda.dataVenda, valorPago: valorParaInput(venda.valorPago), meio: venda.meio || "pix",
  });
  const custo = parseValor(f.valorPago);
  return (
    <div>
      <Campo rotulo="Produto"><input type="text" value={f.produtoNome} onChange={(e) => setF({ ...f, produtoNome: e.target.value })} style={inputStyle} /></Campo>
      <Campo rotulo="Descrição / especificações"><input type="text" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} style={inputStyle} /></Campo>
      <Campo rotulo="Cliente">
        <select value={f.clienteId} onChange={(e) => setF({ ...f, clienteId: e.target.value })} style={inputStyle}>
          <option value="">Sem cliente</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
      </Campo>
      <Campo rotulo="Data da venda"><input type="date" value={f.dataVenda} onChange={(e) => setF({ ...f, dataVenda: e.target.value })} style={inputStyle} /></Campo>
      <Campo rotulo="Quanto você pagou no produto (custo)"><InputValor value={f.valorPago} onChange={(v) => setF({ ...f, valorPago: v })} /></Campo>
      <Campo rotulo="Meio de pagamento">
        <Chips pequeno valor={f.meio} onChange={(m) => setF({ ...f, meio: m })} opcoes={Object.entries(MEIOS).map(([id, label]) => ({ id, label }))} />
      </Campo>
      <p style={{ fontSize: 11.5, color: TEXTO_TERC, margin: "0 0 14px" }}>O valor da venda é a soma das parcelas — pra mudar, edite as parcelas.</p>
      <button disabled={salvando || !f.produtoNome.trim() || !f.dataVenda} onClick={() => onSalvar({ ...f, valorPago: isNaN(custo) ? 0 : custo })} style={{ ...btnPrimario, opacity: salvando || !f.produtoNome.trim() ? 0.5 : 1 }}>Salvar alterações</button>
    </div>
  );
}

function FormGasto({ gasto, vendas, produtos, onSalvar, onExcluir, salvando, vendaFixa, produtoFixo }) {
  const [f, setF] = useState({
    categoria: gasto?.categoria || "gasolina",
    valor: gasto ? valorParaInput(gasto.valor) : "",
    data: gasto?.data || hojeISO(),
    descricao: gasto?.descricao || "",
    vinculo: vendaFixa || gasto?.vendaId ? "venda" : produtoFixo || gasto?.produtoId ? "produto" : "nenhum",
    vendaId: vendaFixa || gasto?.vendaId || "",
    produtoId: produtoFixo || gasto?.produtoId || "",
  });
  const v = parseValor(f.valor);
  const valido = !isNaN(v) && v > 0 && f.data && (f.vinculo !== "venda" || f.vendaId) && (f.vinculo !== "produto" || f.produtoId);
  const travado = !!(vendaFixa || produtoFixo);
  return (
    <div>
      <Campo rotulo="Tipo de gasto">
        <Chips pequeno valor={f.categoria} onChange={(c) => setF({ ...f, categoria: c })} opcoes={Object.entries(CATEGORIAS_GASTO).map(([id, c]) => ({ id, label: c.label, icon: c.icon }))} />
      </Campo>
      <Campo rotulo="Valor"><InputValor value={f.valor} onChange={(val) => setF({ ...f, valor: val })} autoFocus={!gasto} /></Campo>
      <Campo rotulo="Data"><input type="date" value={f.data} onChange={(e) => setF({ ...f, data: e.target.value })} style={inputStyle} /></Campo>
      <Campo rotulo="Descrição (opcional)"><input type="text" value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} placeholder="Ex: ida até o fornecedor" style={inputStyle} /></Campo>
      {!travado && (
        <Campo rotulo="Esse gasto foi pra quê?">
          <Segmentado valor={f.vinculo} onChange={(x) => setF({ ...f, vinculo: x })} opcoes={[{ id: "nenhum", label: "Geral" }, { id: "venda", label: "Uma venda" }, { id: "produto", label: "Item do estoque" }]} />
          {f.vinculo === "venda" && (
            <select value={f.vendaId} onChange={(e) => setF({ ...f, vendaId: e.target.value })} style={{ ...inputStyle, marginTop: 10 }}>
              <option value="">Escolha a venda…</option>
              {vendas.map((vd) => <option key={vd.id} value={vd.id}>{vd.produtoNome} — {formatDataCurta(vd.dataVenda)}</option>)}
            </select>
          )}
          {f.vinculo === "produto" && (
            <select value={f.produtoId} onChange={(e) => setF({ ...f, produtoId: e.target.value })} style={{ ...inputStyle, marginTop: 10 }}>
              <option value="">Escolha o item…</option>
              {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          )}
        </Campo>
      )}
      <button disabled={salvando || !valido} onClick={() => onSalvar({
        categoria: f.categoria, valor: v, data: f.data, descricao: f.descricao,
        vendaId: f.vinculo === "venda" ? f.vendaId : null, produtoId: f.vinculo === "produto" ? f.produtoId : null,
      })} style={{ ...btnPrimario, opacity: salvando || !valido ? 0.5 : 1, marginBottom: 10 }}>
        {gasto ? "Salvar gasto" : "Lançar gasto"}
      </button>
      {gasto && onExcluir && <BotaoConfirmar rotulo="Excluir gasto" icone={Trash2} onConfirmar={onExcluir} estilo={{ width: "100%" }} />}
    </div>
  );
}

function FormCliente({ cliente, onSalvar, salvando }) {
  const [f, setF] = useState({
    nome: cliente?.nome || "", telefone: cliente?.telefone || "", endereco: cliente?.endereco || "",
    classificacao: cliente?.classificacao || "novo", observacao: cliente?.observacao || "",
  });
  return (
    <div>
      <Campo rotulo="Nome *"><input type="text" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Nome do cliente" style={inputStyle} autoFocus={!cliente} /></Campo>
      <Campo rotulo="WhatsApp / telefone" dica="Com DDD. Usado no botão de cobrança."><input type="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: e.target.value })} placeholder="(11) 99999-9999" style={inputStyle} /></Campo>
      <Campo rotulo="Endereço (opcional)"><input type="text" value={f.endereco} onChange={(e) => setF({ ...f, endereco: e.target.value })} style={inputStyle} /></Campo>
      <Campo rotulo="Como é esse cliente?">
        <Chips pequeno valor={f.classificacao} onChange={(c) => setF({ ...f, classificacao: c })} opcoes={Object.entries(CLASSIFICACOES).map(([id, c]) => ({ id, label: c.label, icon: c.icon }))} />
      </Campo>
      <Campo rotulo="Anotações"><textarea value={f.observacao} onChange={(e) => setF({ ...f, observacao: e.target.value })} rows={3} placeholder="Qualquer coisa que valha lembrar sobre ele" style={{ ...inputStyle, resize: "vertical" }} /></Campo>
      <button disabled={salvando || !f.nome.trim()} onClick={() => onSalvar(f)} style={{ ...btnPrimario, opacity: salvando || !f.nome.trim() ? 0.5 : 1 }}>
        {cliente ? "Salvar alterações" : "Cadastrar cliente"}
      </button>
    </div>
  );
}

function FormProduto({ produto, onSalvar, salvando }) {
  const [f, setF] = useState({
    nome: produto?.nome || "", precoCompra: produto ? valorParaInput(produto.precoCompra) : "",
    precoVenda: produto?.precoVenda != null ? valorParaInput(produto.precoVenda) : "",
    especificacoes: produto?.especificacoes || "", quantidade: "1",
  });
  const custo = parseValor(f.precoCompra);
  const venda = parseValor(f.precoVenda);
  const qtd = Math.max(1, parseInt(f.quantidade, 10) || 1);
  const valido = f.nome.trim() && !isNaN(custo) && custo >= 0;
  return (
    <div>
      <Campo rotulo="Nome do produto *"><input type="text" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} placeholder="Ex: iPhone 13 128GB" style={inputStyle} autoFocus={!produto} /></Campo>
      <Campo rotulo="Quanto você pagou (por unidade) *"><InputValor value={f.precoCompra} onChange={(v) => setF({ ...f, precoCompra: v })} /></Campo>
      <Campo rotulo="Preço que pretende vender (opcional)"><InputValor value={f.precoVenda} onChange={(v) => setF({ ...f, precoVenda: v })} /></Campo>
      {!isNaN(custo) && !isNaN(venda) && venda > 0 && (
        <p style={{ fontSize: 12.5, color: venda - custo >= 0 ? VERDE : VERMELHO, margin: "-6px 0 14px" }}>
          Lucro previsto por unidade: {formatBRL(venda - custo)}
        </p>
      )}
      <Campo rotulo="Especificações (opcional)"><textarea value={f.especificacoes} onChange={(e) => setF({ ...f, especificacoes: e.target.value })} rows={2} placeholder="Cor, tamanho, estado…" style={{ ...inputStyle, resize: "vertical" }} /></Campo>
      {!produto && (
        <Campo rotulo="Quantidade" dica={qtd > 1 ? `Vão ser criadas ${qtd} unidades separadas, cada uma vendida individualmente.` : undefined}>
          <input type="number" inputMode="numeric" min="1" value={f.quantidade} onChange={(e) => setF({ ...f, quantidade: e.target.value })} style={inputStyle} />
        </Campo>
      )}
      <button disabled={salvando || !valido} onClick={() => onSalvar({ nome: f.nome.trim(), precoCompra: custo, precoVenda: isNaN(venda) ? null : venda, especificacoes: f.especificacoes, quantidade: qtd })} style={{ ...btnPrimario, opacity: salvando || !valido ? 0.5 : 1 }}>
        {produto ? "Salvar alterações" : qtd > 1 ? `Adicionar ${qtd} unidades` : "Adicionar ao estoque"}
      </button>
    </div>
  );
}

function FormTrocarPin({ onSalvar }) {
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [etapa, setEtapa] = useState(1);
  const [erro, setErro] = useState("");
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: 14, color: erro ? VERMELHO : TEXTO_SEC, margin: 0 }}>{erro || (etapa === 1 ? "Digite o novo PIN de 6 dígitos" : "Confirme o novo PIN")}</p>
      <PontosPin qtd={etapa === 1 ? pin.length : pin2.length} total={6} erro={!!erro} />
      {etapa === 1 ? (
        <TecladoPin valor={pin} setValor={(v) => { setErro(""); setPin(v); }} onEnviar={() => setTimeout(() => setEtapa(2), 150)} />
      ) : (
        <TecladoPin valor={pin2} setValor={(v) => { setErro(""); setPin2(v); }} onEnviar={(v) => {
          if (v !== pin) { setErro("Não bateu. Começa de novo."); setTimeout(() => { setPin(""); setPin2(""); setEtapa(1); setErro(""); }, 1100); return; }
          onSalvar(v);
        }} />
      )}
    </div>
  );
}

// =====================================================================
// MAPEADORES DO BANCO
// =====================================================================
const num = (v) => (v === null || v === undefined ? 0 : parseFloat(v));
function mapCliente(c) {
  return { id: c.id, nome: c.nome_completo || "", telefone: c.telefone || "", endereco: c.endereco || "", classificacao: c.classificacao || "novo", observacao: c.observacao || "", criadoEm: c.criado_em };
}
function mapVenda(v) {
  return {
    id: v.id, clienteId: v.cliente_id, produtoId: v.produto_id, produtoNome: v.produto_nome || "", descricao: v.descricao || "",
    valorPago: num(v.valor_pago), valorVenda: num(v.valor_venda), forma: v.forma || "avista", meio: v.meio || "",
    parcelasCartao: v.parcelas_cartao, observacao: v.observacao || "", dataVenda: String(v.data_venda || v.criado_em || hojeISO()).slice(0, 10), criadoEm: v.criado_em,
  };
}
function mapParcela(p) {
  return {
    id: p.id, vendaId: p.venda_id, numero: p.numero, valor: num(p.valor), vencimento: String(p.vencimento).slice(0, 10),
    pago: !!p.pago, pagoEm: p.pago_em ? String(p.pago_em).slice(0, 10) : null,
    valorRecebido: p.valor_recebido !== null && p.valor_recebido !== undefined ? num(p.valor_recebido) : null,
    observacao: p.observacao || "",
  };
}
function mapGasto(g) {
  return { id: g.id, vendaId: g.venda_id, produtoId: g.produto_id, categoria: g.categoria || "outros", descricao: g.descricao || "", valor: num(g.valor), data: String(g.data || g.criado_em).slice(0, 10), criadoEm: g.criado_em };
}
function mapProduto(p) {
  return {
    id: p.id, nome: p.nome || "", precoCompra: num(p.preco_compra), precoVenda: p.preco_venda !== null && p.preco_venda !== undefined ? num(p.preco_venda) : null,
    especificacoes: p.especificacoes || "", vendido: !!p.vendido, vendidoEm: p.vendido_em, criadoEm: p.criado_em,
  };
}

function formVendaVazio(prefill) {
  const hoje = hojeISO();
  return {
    produtoId: "", produtoNome: "", descricao: "", clienteId: "", novoClienteNome: "", novoClienteTel: "", modoCliente: "lista",
    dataVenda: hoje, valorPago: "", valorVenda: "", forma: "avista", meio: "pix", parcelasCartao: "1",
    temEntrada: false, valorEntrada: "", numParcelas: "2", primeiroVenc: addMeses(hoje, 1), intervalo: "mensal",
    parcelas: [], gastos: [], observacao: "",
    ...(prefill || {}),
  };
}

// =====================================================================
// APP
// =====================================================================
export default function Page() {
  const [controleBloqueio, setControleBloqueio] = useState(null);
  return (
    <PortaoSeguranca setControleBloqueio={setControleBloqueio}>
      <App controleBloqueio={controleBloqueio} />
    </PortaoSeguranca>
  );
}

function App({ controleBloqueio }) {
  const [pilha, setPilha] = useState([{ pagina: "dashboard" }]);
  const atual = pilha[pilha.length - 1];
  const pagina = atual.pagina;

  const [clientes, setClientes] = useState([]);
  const [vendas, setVendas] = useState([]);
  const [parcelas, setParcelas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarga, setErroCarga] = useState("");
  const [salvando, setSalvando] = useState(false);
  const salvandoRef = useRef(false);
  const [aviso, setAviso] = useState("");
  const [folha, setFolha] = useState(null);

  const h0 = new Date();
  const [mesRef, setMesRef] = useState({ ano: h0.getFullYear(), mes: h0.getMonth() });
  const [mesGastos, setMesGastos] = useState({ ano: h0.getFullYear(), mes: h0.getMonth() });
  const [buscaVendas, setBuscaVendas] = useState("");
  const [filtroVendas, setFiltroVendas] = useState("todas");
  const [buscaClientes, setBuscaClientes] = useState("");
  const [buscaEstoque, setBuscaEstoque] = useState("");
  const [formVenda, setFormVenda] = useState(formVendaVazio());
  const [obsRascunho, setObsRascunho] = useState(null);
  const [statusNotificacao, setStatusNotificacao] = useState("indisponivel");
  const [bioDisponivel, setBioDisponivel] = useState(false);

  // ---------------- navegação ----------------
  const irPara = (p, params = {}) => { setPilha([{ pagina: p, ...params }]); setFolha(null); window.scrollTo(0, 0); };
  const abrir = (p, params = {}) => { setPilha((s) => [...s, { pagina: p, ...params }]); setFolha(null); window.scrollTo(0, 0); };
  const voltar = () => { setPilha((s) => (s.length > 1 ? s.slice(0, -1) : [{ pagina: "dashboard" }])); setFolha(null); window.scrollTo(0, 0); };
  const substituir = (p, params = {}) => { setPilha((s) => [...s.slice(0, -1), { pagina: p, ...params }]); setFolha(null); window.scrollTo(0, 0); };

  const mostrarAviso = (t) => { setAviso(t); setTimeout(() => setAviso(""), 2600); };

  // ---------------- dados ----------------
  const carregar = useCallback(async () => {
    const erros = [];
    const busca = async (tabela, ordem, asc, map, set) => {
      try {
        const { data, error } = await supabase.from(tabela).select("*").order(ordem, { ascending: asc });
        if (error) { erros.push(tabela); return; }
        set((data || []).map(map));
      } catch (e) { erros.push(tabela); }
    };
    await Promise.all([
      busca("clientes", "nome_completo", true, mapCliente, setClientes),
      busca("vendas", "data_venda", false, mapVenda, setVendas),
      busca("venda_parcelas", "numero", true, mapParcela, setParcelas),
      busca("gastos", "data", false, mapGasto, setGastos),
      busca("produtos", "criado_em", false, mapProduto, setProdutos),
    ]);
    setErroCarga(erros.length ? `Não consegui carregar: ${erros.join(", ")}. Confere se o SQL da nova versão foi rodado no Supabase.` : "");
    setCarregando(false);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  // Recarrega ao voltar pro app (dados podem ter mudado em outro aparelho)
  useEffect(() => {
    const f = () => { if (document.visibilityState === "visible") carregar(); };
    document.addEventListener("visibilitychange", f);
    return () => document.removeEventListener("visibilitychange", f);
  }, [carregar]);

  useEffect(() => { biometriaDisponivel().then(setBioDisponivel); }, []);

  // Abre direto a venda quando o app é aberto por uma notificação (/?venda=ID)
  useEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get("venda");
      if (id) {
        setPilha([{ pagina: "vendas" }, { pagina: "detalheVenda", id }]);
        window.history.replaceState(null, "", "/");
      }
    } catch (e) {}
  }, []);

  // ---------------- notificações ----------------
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("serviceWorker" in navigator && "PushManager" in window && typeof Notification !== "undefined") {
      navigator.serviceWorker.register("/sw.js").then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setStatusNotificacao("ativo");
        else if (Notification.permission === "denied") setStatusNotificacao("negado");
        else setStatusNotificacao("disponivel");
      }).catch(() => setStatusNotificacao("indisponivel"));
    }
  }, []);
  const urlBase64ToUint8Array = (b) => {
    const pad = "=".repeat((4 - (b.length % 4)) % 4);
    const raw = window.atob((b + pad).replace(/-/g, "+").replace(/_/g, "/"));
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
    return out;
  };
  const ativarNotificacoes = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setStatusNotificacao("negado"); return; }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) });
      const j = sub.toJSON();
      await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: j.endpoint, keys: j.keys }) });
      setStatusNotificacao("ativo");
      mostrarAviso("Avisos ativados");
    } catch (e) { setStatusNotificacao("indisponivel"); }
  };

  // ---------------- índices ----------------
  const parcelasPorVenda = {};
  parcelas.forEach((p) => { (parcelasPorVenda[p.vendaId] = parcelasPorVenda[p.vendaId] || []).push(p); });
  Object.values(parcelasPorVenda).forEach((l) => l.sort((a, b) => a.numero - b.numero || a.vencimento.localeCompare(b.vencimento)));
  const gastosPorVenda = {};
  gastos.forEach((g) => { if (g.vendaId) (gastosPorVenda[g.vendaId] = gastosPorVenda[g.vendaId] || []).push(g); });
  const clientePorId = {};
  clientes.forEach((c) => { clientePorId[c.id] = c; });
  const resumos = {};
  vendas.forEach((v) => { resumos[v.id] = resumoVenda(v, parcelasPorVenda[v.id], gastosPorVenda[v.id]); });
  const vendasOrdenadas = vendas.slice().sort((a, b) => b.dataVenda.localeCompare(a.dataVenda) || String(b.criadoEm).localeCompare(String(a.criadoEm)));

  // ---------------- ações: vendas ----------------
  const sincronizarTotalVenda = async (vendaId) => {
    const { data } = await supabase.from("venda_parcelas").select("*").eq("venda_id", vendaId);
    const total = arred((data || []).reduce((a, p) => a + num(p.valor), 0));
    await supabase.from("vendas").update({ valor_venda: total }).eq("id", vendaId);
  };

  const executar = async (fn, msgOk) => {
    if (salvandoRef.current) return false; // trava duplo toque
    salvandoRef.current = true;
    setSalvando(true);
    try {
      await fn();
      await carregar();
      if (msgOk) mostrarAviso(msgOk);
      return true;
    } catch (e) {
      mostrarAviso("Deu erro ao salvar. Tenta de novo.");
      return false;
    } finally {
      salvandoRef.current = false;
      setSalvando(false);
    }
  };
  const checar = ({ error }) => { if (error) throw error; };

  const salvarNovaVenda = async () => {
    const f = formVenda;
    const total = parseValor(f.valorVenda);
    const custo = parseValor(f.valorPago);
    const entrada = f.temEntrada ? parseValor(f.valorEntrada) : 0;
    let novaId = null;
    const ok = await executar(async () => {
      let clienteId = f.clienteId || null;
      if (f.modoCliente === "novo" && f.novoClienteNome.trim()) {
        const r = await supabase.from("clientes").insert({ nome_completo: f.novoClienteNome.trim(), telefone: f.novoClienteTel, classificacao: "novo" }).select().single();
        checar(r);
        clienteId = r.data.id;
      }
      const r = await supabase.from("vendas").insert({
        cliente_id: clienteId, produto_id: f.produtoId || null, produto_nome: f.produtoNome.trim(), descricao: f.descricao,
        valor_pago: isNaN(custo) ? 0 : custo, valor_venda: total, forma: f.forma, meio: f.meio,
        parcelas_cartao: f.forma === "avista" && f.meio === "credito" ? parseInt(f.parcelasCartao, 10) || 1 : null,
        observacao: f.observacao, data_venda: f.dataVenda,
      }).select().single();
      checar(r);
      novaId = r.data.id;
      let linhas;
      if (f.forma === "avista") {
        linhas = [{ venda_id: novaId, numero: 1, valor: total, vencimento: f.dataVenda, pago: true, pago_em: f.dataVenda, valor_recebido: total }];
      } else {
        linhas = [];
        if (f.temEntrada && entrada > 0) linhas.push({ venda_id: novaId, numero: 0, valor: entrada, vencimento: f.dataVenda, pago: true, pago_em: f.dataVenda, valor_recebido: entrada });
        f.parcelas.forEach((p, i) => linhas.push({ venda_id: novaId, numero: i + 1, valor: parseValor(p.valor), vencimento: p.vencimento, pago: false }));
      }
      checar(await supabase.from("venda_parcelas").insert(linhas).select());
      const gastosValidos = f.gastos.filter((g) => parseValor(g.valor) > 0);
      if (gastosValidos.length) {
        checar(await supabase.from("gastos").insert(gastosValidos.map((g) => ({ venda_id: novaId, categoria: g.categoria, valor: parseValor(g.valor), descricao: g.descricao || "", data: f.dataVenda }))).select());
      }
      if (f.produtoId) {
        checar(await supabase.from("produtos").update({ vendido: true, preco_venda: total, vendido_em: new Date().toISOString() }).eq("id", f.produtoId));
        checar(await supabase.from("gastos").update({ venda_id: novaId }).eq("produto_id", f.produtoId));
      }
    }, "Venda registrada");
    if (ok && novaId) {
      setFormVenda(formVendaVazio());
      setPilha([{ pagina: "vendas" }, { pagina: "detalheVenda", id: novaId }]);
      window.scrollTo(0, 0);
    }
  };

  const receberParcela = (p, { valorRecebido, data, obs }) => executar(async () => {
    checar(await supabase.from("venda_parcelas").update({ pago: true, pago_em: data, valor_recebido: valorRecebido, observacao: obs }).eq("id", p.id));
    setFolha(null);
  }, "Recebimento registrado");

  const desfazerRecebimento = (p) => executar(async () => {
    checar(await supabase.from("venda_parcelas").update({ pago: false, pago_em: null, valor_recebido: null }).eq("id", p.id));
  }, "Recebimento desfeito");

  const salvarParcela = (vendaId, parcela, dados) => executar(async () => {
    if (parcela) {
      checar(await supabase.from("venda_parcelas").update({ valor: dados.valor, vencimento: dados.vencimento, observacao: dados.observacao }).eq("id", parcela.id));
    } else {
      const lista = parcelasPorVenda[vendaId] || [];
      const proximo = lista.reduce((m, p) => Math.max(m, p.numero), 0) + 1;
      checar(await supabase.from("venda_parcelas").insert({ venda_id: vendaId, numero: proximo, valor: dados.valor, vencimento: dados.vencimento, observacao: dados.observacao, pago: false }).select());
    }
    await sincronizarTotalVenda(vendaId);
    setFolha(null);
  }, parcela ? "Parcela atualizada" : "Parcela adicionada");

  const excluirParcela = (p) => executar(async () => {
    checar(await supabase.from("venda_parcelas").delete().eq("id", p.id));
    await sincronizarTotalVenda(p.vendaId);
    setFolha(null);
  }, "Parcela excluída");

  const editarVenda = (venda, d) => executar(async () => {
    checar(await supabase.from("vendas").update({ produto_nome: d.produtoNome.trim(), descricao: d.descricao, cliente_id: d.clienteId || null, data_venda: d.dataVenda, valor_pago: d.valorPago, meio: d.meio }).eq("id", venda.id));
    setFolha(null);
  }, "Venda atualizada");

  const salvarObsVenda = (venda, texto) => executar(async () => {
    checar(await supabase.from("vendas").update({ observacao: texto }).eq("id", venda.id));
    setObsRascunho(null);
  }, "Anotação salva");

  const excluirVenda = async (venda) => {
    const ok = await executar(async () => {
      if (venda.produtoId) {
        checar(await supabase.from("produtos").update({ vendido: false, preco_venda: null, vendido_em: null }).eq("id", venda.produtoId));
      }
      checar(await supabase.from("gastos").update({ venda_id: null }).eq("venda_id", venda.id));
      checar(await supabase.from("venda_parcelas").delete().eq("venda_id", venda.id));
      checar(await supabase.from("vendas").delete().eq("id", venda.id));
    }, venda.produtoId ? "Venda excluída — item voltou pro estoque" : "Venda excluída");
    if (ok) voltar();
  };

  // ---------------- ações: gastos ----------------
  const salvarGasto = async (gasto, d, depois) => {
    const ok = await executar(async () => {
      const linha = { categoria: d.categoria, valor: d.valor, data: d.data, descricao: d.descricao, venda_id: d.vendaId || null, produto_id: d.produtoId || null };
      if (gasto) checar(await supabase.from("gastos").update(linha).eq("id", gasto.id));
      else checar(await supabase.from("gastos").insert(linha).select());
      setFolha(null);
    }, gasto ? "Gasto atualizado" : "Gasto lançado");
    if (ok && depois) depois();
  };
  const excluirGasto = (g) => executar(async () => {
    checar(await supabase.from("gastos").delete().eq("id", g.id));
    setFolha(null);
  }, "Gasto excluído");

  // ---------------- ações: clientes ----------------
  const salvarCliente = async (cliente, f) => {
    let novoId = null;
    const ok = await executar(async () => {
      const linha = { nome_completo: f.nome.trim(), telefone: f.telefone, endereco: f.endereco, classificacao: f.classificacao, observacao: f.observacao };
      if (cliente) checar(await supabase.from("clientes").update(linha).eq("id", cliente.id));
      else {
        const r = await supabase.from("clientes").insert(linha).select().single();
        checar(r);
        novoId = r.data.id;
      }
      setFolha(null);
    }, cliente ? "Cliente atualizado" : "Cliente cadastrado");
    if (ok && novoId) substituir("detalheCliente", { id: novoId });
  };
  const excluirCliente = async (c) => {
    const ok = await executar(async () => {
      checar(await supabase.from("vendas").update({ cliente_id: null }).eq("cliente_id", c.id));
      checar(await supabase.from("clientes").delete().eq("id", c.id));
    }, "Cliente excluído");
    if (ok) voltar();
  };

  // ---------------- ações: estoque ----------------
  const salvarProduto = async (produto, d) => {
    const ok = await executar(async () => {
      const base = { nome: d.nome, preco_compra: d.precoCompra, preco_venda: d.precoVenda, especificacoes: d.especificacoes };
      if (produto) checar(await supabase.from("produtos").update(base).eq("id", produto.id));
      else {
        const linhas = Array.from({ length: d.quantidade }, () => ({ ...base, quantidade: 1, vendido: false }));
        checar(await supabase.from("produtos").insert(linhas).select());
      }
      setFolha(null);
    }, produto ? "Item atualizado" : d.quantidade > 1 ? `${d.quantidade} unidades adicionadas` : "Item adicionado");
    if (ok && !produto) voltar();
  };
  const excluirProduto = async (p) => {
    const ok = await executar(async () => {
      checar(await supabase.from("gastos").update({ produto_id: null }).eq("produto_id", p.id));
      checar(await supabase.from("produtos").delete().eq("id", p.id));
    }, "Item excluído");
    if (ok) voltar();
  };

  const iniciarVendaDoProduto = (p) => {
    setFormVenda(formVendaVazio({
      produtoId: p.id, produtoNome: p.nome, descricao: p.especificacoes,
      valorPago: valorParaInput(p.precoCompra), valorVenda: p.precoVenda != null ? valorParaInput(p.precoVenda) : "",
    }));
    abrir("novaVenda");
  };

  // =====================================================================
  // RENDER
  // =====================================================================
  const toast = aviso ? (
    <div role="status" style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 96, zIndex: 300, background: TEXTO, color: BG, padding: "10px 16px", borderRadius: 999, fontSize: 13, fontWeight: 600, fontFamily: FONTE, boxShadow: "0 4px 16px rgba(0,0,0,.4)", whiteSpace: "nowrap" }}>
      {aviso}
    </div>
  ) : null;

  const tela = (conteudo) => (
    <Wrapper pagina={pagina} irPara={irPara}>
      {erroCarga && (
        <div style={{ background: VERMELHO_BG, color: VERMELHO, borderRadius: 10, padding: "10px 12px", fontSize: 12.5, marginBottom: 12, display: "flex", gap: 8 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />{erroCarga}
        </div>
      )}
      {conteudo}
      {folha}
      {toast}
    </Wrapper>
  );

  if (carregando) {
    return <div style={{ minHeight: "100vh", background: BG, color: TEXTO_SEC, fontFamily: FONTE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>Carregando…</div>;
  }

  // ---------------- card de venda (lista) ----------------
  const CardVenda = ({ v }) => {
    const r = resumos[v.id];
    const cli = v.clienteId ? clientePorId[v.clienteId] : null;
    return (
      <button onClick={() => abrir("detalheVenda", { id: v.id })} style={{ ...cardStyle, textAlign: "left", width: "100%", cursor: "pointer", color: TEXTO, fontFamily: FONTE, display: "block" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "flex-start" }}>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 14.5, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.produtoNome}</p>
            <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "3px 0 0" }}>
              {cli ? cli.nome : "Sem cliente"} · {formatDataCurta(v.dataVenda)}{r.qtdParcelas > 1 ? ` · ${r.qtdParcelas}x` : ""}
            </p>
          </div>
          <Badge cfg={STATUS_VENDA[r.status]} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "12px 0 6px" }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{formatBRL(r.totalEfetivo)}</span>
          <span style={{ fontSize: 12, color: r.lucro >= 0 ? VERDE : VERMELHO, fontWeight: 600 }}>lucro {formatBRL(r.lucro)}</span>
        </div>
        {r.status !== "quitada" && (
          <>
            <BarraProgresso valor={r.recebido} total={r.totalEfetivo} />
            <p style={{ fontSize: 11.5, color: TEXTO_SEC, margin: "6px 0 0" }}>
              Recebido {formatBRL(r.recebido)} · falta {formatBRL(r.aReceber)}
              {r.proxima ? ` · próx. ${formatDataCurta(r.proxima.vencimento)}` : ""}
            </p>
          </>
        )}
      </button>
    );
  };

  // =============== DASHBOARD ===============
  if (pagina === "dashboard") {
    const chave = chaveDeAnoMes(mesRef.ano, mesRef.mes);
    const vendasMes = vendas.filter((v) => chaveMes(v.dataVenda) === chave);
    const totalVendido = arred(vendasMes.reduce((a, v) => a + resumos[v.id].totalEfetivo, 0));
    const custoMes = arred(vendasMes.reduce((a, v) => a + v.valorPago, 0));
    const gastosMes = gastos.filter((g) => chaveMes(g.data) === chave);
    const totalGastosMes = arred(gastosMes.reduce((a, g) => a + g.valor, 0));
    const lucroMes = arred(totalVendido - custoMes - totalGastosMes);
    const recebidoMes = arred(parcelas.filter((p) => p.pago && chaveMes(p.pagoEm) === chave).reduce((a, p) => a + (p.valorRecebido != null ? p.valorRecebido : p.valor), 0));
    const abertas = parcelas.filter((p) => !p.pago);
    const aReceberGeral = arred(abertas.reduce((a, p) => a + p.valor, 0));
    const atrasadas = abertas.filter((p) => diasAte(p.vencimento) < 0);
    const totalAtrasado = arred(atrasadas.reduce((a, p) => a + p.valor, 0));
    const proximas = abertas.filter((p) => diasAte(p.vencimento) <= 7).sort((a, b) => a.vencimento.localeCompare(b.vencimento)).slice(0, 6);
    const estoqueValor = arred(produtos.filter((p) => !p.vendido).reduce((a, p) => a + p.precoCompra, 0));

    const grafico = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(mesRef.ano, mesRef.mes - i, 1);
      const k = chaveDeAnoMes(d.getFullYear(), d.getMonth());
      const vs = vendas.filter((v) => chaveMes(v.dataVenda) === k);
      const vendido = vs.reduce((a, v) => a + resumos[v.id].totalEfetivo, 0);
      const custo = vs.reduce((a, v) => a + v.valorPago, 0);
      const gs = gastos.filter((g) => chaveMes(g.data) === k).reduce((a, g) => a + g.valor, 0);
      grafico.push({ label: MESES_CURTO[d.getMonth()], lucro: arred(vendido - custo - gs), gastos: arred(gs) });
    }

    return tela(
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div>
            <p style={{ fontSize: 12, color: TEXTO_SEC, margin: 0 }}>Fiado Certo</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "2px 0 0" }}>Painel</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => controleBloqueio?.bloquearAgora()} aria-label="Bloquear agora" style={{ ...btnSecundario, padding: 10, display: "flex" }}><Lock size={17} aria-hidden="true" /></button>
            <button onClick={() => abrir("ajustes")} aria-label="Ajustes" style={{ ...btnSecundario, padding: 10, display: "flex" }}><Settings size={17} aria-hidden="true" /></button>
          </div>
        </div>

        <SeletorMes ano={mesRef.ano} mes={mesRef.mes} onChange={(ano, mes) => setMesRef({ ano, mes })} />

        <div style={{ ...cardStyle, borderColor: lucroMes >= 0 ? "#2A5A45" : VERMELHO_BG, marginBottom: 10 }}>
          <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "0 0 4px" }}>Lucro do mês</p>
          <p style={{ fontSize: 30, fontWeight: 750, margin: 0, color: lucroMes >= 0 ? VERDE : VERMELHO, letterSpacing: -0.5 }}>{formatBRL(lucroMes)}</p>
          <p style={{ fontSize: 11.5, color: TEXTO_TERC, margin: "6px 0 0" }}>Vendido − custo dos produtos − gastos</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <button onClick={() => irPara("vendas")} style={{ ...cardStyle, textAlign: "left", cursor: "pointer", color: TEXTO, fontFamily: FONTE }}>
            <p style={{ fontSize: 11.5, color: TEXTO_SEC, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 5 }}><ShoppingBag size={13} aria-hidden="true" /> Total vendido</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{formatBRL(totalVendido)}</p>
            <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "4px 0 0" }}>{vendasMes.length} {vendasMes.length === 1 ? "venda" : "vendas"} · custo {formatBRL(custoMes)}</p>
          </button>
          <button onClick={() => { setMesGastos(mesRef); irPara("gastos"); }} style={{ ...cardStyle, textAlign: "left", cursor: "pointer", color: TEXTO, fontFamily: FONTE }}>
            <p style={{ fontSize: 11.5, color: TEXTO_SEC, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 5 }}><Wallet size={13} aria-hidden="true" /> Total de gastos</p>
            <p style={{ fontSize: 18, fontWeight: 700, margin: 0, color: totalGastosMes > 0 ? VERMELHO : TEXTO }}>{formatBRL(totalGastosMes)}</p>
            <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "4px 0 0" }}>{gastosMes.length} {gastosMes.length === 1 ? "lançamento" : "lançamentos"}</p>
          </button>
          <div style={cardStyle}>
            <p style={{ fontSize: 11.5, color: TEXTO_SEC, margin: "0 0 4px" }}>Entrou no caixa</p>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: VERDE }}>{formatBRL(recebidoMes)}</p>
            <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "4px 0 0" }}>recebido nesse mês</p>
          </div>
          <button onClick={() => { setFiltroVendas("abertas"); irPara("vendas"); }} style={{ ...cardStyle, textAlign: "left", cursor: "pointer", color: TEXTO, fontFamily: FONTE }}>
            <p style={{ fontSize: 11.5, color: TEXTO_SEC, margin: "0 0 4px" }}>A receber</p>
            <p style={{ fontSize: 16, fontWeight: 700, margin: 0, color: AMARELO }}>{formatBRL(aReceberGeral)}</p>
            <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "4px 0 0" }}>{abertas.length} {abertas.length === 1 ? "parcela aberta" : "parcelas abertas"}</p>
          </button>
        </div>

        {atrasadas.length > 0 && (
          <button onClick={() => { setFiltroVendas("atrasadas"); irPara("vendas"); }} style={{ width: "100%", background: VERMELHO_BG, border: "none", borderRadius: 12, padding: "11px 14px", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: FONTE }}>
            <AlertTriangle size={16} color={VERMELHO} aria-hidden="true" />
            <span style={{ fontSize: 13, color: VERMELHO, fontWeight: 600, flex: 1, textAlign: "left" }}>{atrasadas.length} {atrasadas.length === 1 ? "parcela atrasada" : "parcelas atrasadas"} · {formatBRL(totalAtrasado)}</span>
            <ChevronRight size={16} color={VERMELHO} aria-hidden="true" />
          </button>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "4px 0 18px" }}>
          <button onClick={() => { setFormVenda(formVendaVazio()); abrir("novaVenda"); }} style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={16} aria-hidden="true" /> Nova venda</button>
          <button onClick={() => abrir("novoGasto")} style={{ ...btnSecundario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={16} aria-hidden="true" /> Gasto</button>
        </div>

        {proximas.length > 0 && (
          <>
            <p style={{ fontSize: 13.5, fontWeight: 650, margin: "0 0 8px" }}>Próximos recebimentos</p>
            <div style={{ ...cardStyle, padding: "4px 14px", marginBottom: 18 }}>
              {proximas.map((p, i) => {
                const v = vendas.find((x) => x.id === p.vendaId);
                if (!v) return null;
                const cli = v.clienteId ? clientePorId[v.clienteId] : null;
                const d = diasAte(p.vencimento);
                const cor = d < 0 ? VERMELHO : d <= 1 ? AMARELO : TEXTO_SEC;
                const quando = d < 0 ? `${-d} ${-d === 1 ? "dia" : "dias"} atrasada` : d === 0 ? "vence hoje" : d === 1 ? "vence amanhã" : `em ${d} dias`;
                return (
                  <button key={p.id} onClick={() => abrir("detalheVenda", { id: v.id })} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "11px 0", border: "none", borderTop: i ? `1px solid ${BORDA}` : "none", background: "transparent", color: TEXTO, cursor: "pointer", fontFamily: FONTE, textAlign: "left" }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cli ? cli.nome : v.produtoNome}</p>
                      <p style={{ fontSize: 11.5, color: cor, margin: "2px 0 0" }}>{v.produtoNome !== (cli ? cli.nome : "") && cli ? `${v.produtoNome} · ` : ""}{quando}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>{formatBRL(p.valor)}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        <p style={{ fontSize: 13.5, fontWeight: 650, margin: "0 0 6px" }}>Últimos 6 meses</p>
        <div style={{ display: "flex", gap: 14, fontSize: 11, color: TEXTO_SEC, marginBottom: 8 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: ACENTO }} /> Lucro</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 9, height: 9, borderRadius: 2, background: VERMELHO }} /> Gastos</span>
        </div>
        <div style={{ height: 160, marginBottom: 18 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grafico} margin={{ top: 4, right: 0, left: -6, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={BORDA} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: TEXTO_SEC }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: TEXTO_SEC }} axisLine={false} tickLine={false} tickFormatter={formatCompacto} width={42} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(value, name) => [formatBRL(value), name === "lucro" ? "Lucro" : "Gastos"]} contentStyle={{ fontSize: 12, borderRadius: 8, background: BG_CARD_2, border: `1px solid ${BORDA}` }} labelStyle={{ color: TEXTO }} itemStyle={{ color: TEXTO }} />
              <Bar dataKey="lucro" fill={ACENTO} radius={[3, 3, 0, 0]} />
              <Bar dataKey="gastos" fill={VERMELHO} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <button onClick={() => irPara("estoque")} style={{ ...cardStyle, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", color: TEXTO, fontFamily: FONTE }}>
          <span style={{ fontSize: 13, color: TEXTO_SEC, display: "flex", alignItems: "center", gap: 6 }}><Package size={14} aria-hidden="true" /> Parado em estoque</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{formatBRL(estoqueValor)}</span>
        </button>
      </>
    );
  }

  // =============== LISTA DE VENDAS ===============
  if (pagina === "vendas") {
    const termo = buscaVendas.trim().toLowerCase();
    const filtradas = vendasOrdenadas.filter((v) => {
      const r = resumos[v.id];
      if (filtroVendas === "abertas" && r.status === "quitada") return false;
      if (filtroVendas === "atrasadas" && r.status !== "atrasada") return false;
      if (filtroVendas === "quitadas" && r.status !== "quitada") return false;
      if (!termo) return true;
      const cli = v.clienteId ? clientePorId[v.clienteId] : null;
      return v.produtoNome.toLowerCase().includes(termo) || (cli && cli.nome.toLowerCase().includes(termo));
    });
    const totalFiltrado = arred(filtradas.reduce((a, v) => a + resumos[v.id].aReceber, 0));
    return tela(
      <>
        <TopBar titulo="Vendas" direita={
          <button onClick={() => { setFormVenda(formVendaVazio()); abrir("novaVenda"); }} style={{ ...btnPrimario, width: "auto", padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} aria-hidden="true" /> Nova</button>
        } />
        <Busca valor={buscaVendas} onChange={setBuscaVendas} placeholder="Buscar produto ou cliente…" />
        <div style={{ marginBottom: 12 }}>
          <Chips pequeno valor={filtroVendas} onChange={setFiltroVendas} opcoes={[
            { id: "todas", label: "Todas" }, { id: "abertas", label: "Em aberto" }, { id: "atrasadas", label: "Atrasadas" }, { id: "quitadas", label: "Quitadas" },
          ]} />
        </div>
        {(filtroVendas === "abertas" || filtroVendas === "atrasadas") && filtradas.length > 0 && (
          <p style={{ fontSize: 12.5, color: TEXTO_SEC, margin: "0 0 10px" }}>Falta receber nessas vendas: <strong style={{ color: AMARELO }}>{formatBRL(totalFiltrado)}</strong></p>
        )}
        {filtradas.length === 0 ? (
          <Vazio icone={ShoppingBag} texto={vendas.length === 0 ? "Nenhuma venda ainda. Bora registrar a primeira?" : "Nada encontrado com esse filtro."}
            acao={vendas.length === 0 ? <button onClick={() => { setFormVenda(formVendaVazio()); abrir("novaVenda"); }} style={{ ...btnPrimario, width: "auto", padding: "10px 18px" }}>Registrar venda</button> : null} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtradas.map((v) => <CardVenda key={v.id} v={v} />)}
          </div>
        )}
      </>
    );
  }

  // =============== NOVA VENDA ===============
  if (pagina === "novaVenda") {
    const f = formVenda;
    const set = (patch) => setFormVenda((prev) => ({ ...prev, ...patch }));
    const total = parseValor(f.valorVenda);
    const custo = parseValor(f.valorPago);
    const entrada = f.temEntrada ? parseValor(f.valorEntrada) : 0;
    const restante = !isNaN(total) ? arred(total - (isNaN(entrada) ? 0 : entrada)) : NaN;
    const gastosDoItem = f.produtoId ? gastos.filter((g) => g.produtoId === f.produtoId && !g.vendaId).reduce((a, g) => a + g.valor, 0) : 0;
    const gastosForm = f.gastos.reduce((a, g) => a + (parseValor(g.valor) || 0), 0) + gastosDoItem;
    const lucroPrev = !isNaN(total) ? arred(total - (isNaN(custo) ? 0 : custo) - gastosForm) : null;
    const somaParcelas = arred(f.parcelas.reduce((a, p) => a + (parseValor(p.valor) || 0), 0));
    const difParcelas = !isNaN(restante) ? arred(restante - somaParcelas) : 0;

    // regenera parcelas quando muda algo que define a divisão
    const regerar = (patch) => {
      const n = { ...f, ...patch };
      const t = parseValor(n.valorVenda);
      const e = n.temEntrada ? parseValor(n.valorEntrada) || 0 : 0;
      const rest = !isNaN(t) ? arred(t - e) : NaN;
      set({ ...patch, parcelas: gerarParcelas(rest, n.numParcelas, n.primeiroVenc, n.intervalo) });
    };

    const produtosDisponiveis = produtos.filter((p) => !p.vendido);
    const erros = [];
    if (!f.produtoNome.trim()) erros.push("Diga o que foi vendido");
    if (isNaN(total) || total <= 0) erros.push("Coloque o valor da venda");
    if (f.forma === "parcelado") {
      if (f.temEntrada && (isNaN(entrada) || entrada <= 0)) erros.push("Valor da entrada inválido");
      if (!isNaN(restante) && restante <= 0) erros.push("A entrada não pode ser maior ou igual ao total");
      if (f.parcelas.length === 0) erros.push("Gere as parcelas");
      if (f.parcelas.some((p) => !(parseValor(p.valor) > 0) || !p.vencimento)) erros.push("Toda parcela precisa de valor e data");
      if (Math.abs(difParcelas) >= 0.01) erros.push("A soma das parcelas não bate");
    }
    if (f.modoCliente === "novo" && !f.novoClienteNome.trim()) erros.push("Nome do novo cliente");

    return tela(
      <>
        <TopBar titulo="Nova venda" onBack={voltar} />

        {/* O QUE */}
        <p style={{ fontSize: 12, fontWeight: 700, color: ACENTO, letterSpacing: 0.6, margin: "0 0 10px" }}>1 · O QUE VOCÊ VENDEU</p>
        {produtosDisponiveis.length > 0 && (
          <Campo rotulo="Puxar do estoque (opcional)" dica={f.produtoId ? `Ao salvar, esse item sai do estoque automaticamente.${gastosDoItem > 0 ? ` Os ${formatBRL(gastosDoItem)} de gastos dele vêm junto pra essa venda.` : ""}` : undefined}>
            <select value={f.produtoId} onChange={(e) => {
              const p = produtos.find((x) => x.id === e.target.value);
              if (!p) { set({ produtoId: "" }); return; }
              regerar({ produtoId: p.id, produtoNome: p.nome, descricao: p.especificacoes, valorPago: valorParaInput(p.precoCompra), valorVenda: p.precoVenda != null ? valorParaInput(p.precoVenda) : f.valorVenda });
            }} style={inputStyle}>
              <option value="">Não, vou digitar</option>
              {produtosDisponiveis.map((p) => <option key={p.id} value={p.id}>{p.nome} — custo {formatBRL(p.precoCompra)}</option>)}
            </select>
          </Campo>
        )}
        <Campo rotulo="Produto *"><input type="text" value={f.produtoNome} onChange={(e) => set({ produtoNome: e.target.value })} placeholder="Ex: Tênis Nike 42" style={inputStyle} /></Campo>
        <Campo rotulo="Detalhes (opcional)"><input type="text" value={f.descricao} onChange={(e) => set({ descricao: e.target.value })} placeholder="Cor, tamanho, modelo…" style={inputStyle} /></Campo>

        <Campo rotulo="Pra quem?">
          <Segmentado valor={f.modoCliente} onChange={(m) => set({ modoCliente: m })} opcoes={[{ id: "lista", label: "Cliente cadastrado" }, { id: "novo", label: "Cliente novo" }]} />
          {f.modoCliente === "lista" ? (
            <select value={f.clienteId} onChange={(e) => set({ clienteId: e.target.value })} style={{ ...inputStyle, marginTop: 10 }}>
              <option value="">Sem cliente / não quero informar</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
              <input type="text" value={f.novoClienteNome} onChange={(e) => set({ novoClienteNome: e.target.value })} placeholder="Nome" style={inputStyle} />
              <input type="tel" value={f.novoClienteTel} onChange={(e) => set({ novoClienteTel: e.target.value })} placeholder="WhatsApp" style={inputStyle} />
            </div>
          )}
        </Campo>
        <Campo rotulo="Data da venda"><input type="date" value={f.dataVenda} onChange={(e) => set({ dataVenda: e.target.value })} style={inputStyle} /></Campo>

        {/* VALORES */}
        <p style={{ fontSize: 12, fontWeight: 700, color: ACENTO, letterSpacing: 0.6, margin: "22px 0 10px" }}>2 · VALORES</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Campo rotulo="Você pagou (custo)"><InputValor value={f.valorPago} onChange={(v) => set({ valorPago: v })} /></Campo>
          <Campo rotulo="Vendeu por *"><InputValor value={f.valorVenda} onChange={(v) => regerar({ valorVenda: v })} /></Campo>
        </div>
        {lucroPrev !== null && (
          <div style={{ background: lucroPrev >= 0 ? VERDE_BG : VERMELHO_BG, borderRadius: 10, padding: "10px 12px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12.5, color: lucroPrev >= 0 ? VERDE : VERMELHO }}>Lucro previsto{gastosForm > 0 ? " (já tirando os gastos)" : ""}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: lucroPrev >= 0 ? VERDE : VERMELHO }}>{formatBRL(lucroPrev)}{total > 0 ? ` · ${Math.round((lucroPrev / total) * 100)}%` : ""}</span>
          </div>
        )}

        {/* PAGAMENTO */}
        <p style={{ fontSize: 12, fontWeight: 700, color: ACENTO, letterSpacing: 0.6, margin: "22px 0 10px" }}>3 · COMO VAI RECEBER</p>
        <Campo>
          <Segmentado valor={f.forma} onChange={(fm) => fm === "parcelado" ? regerar({ forma: fm }) : set({ forma: fm })} opcoes={[{ id: "avista", label: "Recebi à vista" }, { id: "parcelado", label: "Parcelado / fiado" }]} />
        </Campo>
        <Campo rotulo="Meio de pagamento">
          <Chips pequeno valor={f.meio} onChange={(m) => set({ meio: m })} opcoes={Object.entries(MEIOS).map(([id, label]) => ({ id, label }))} />
        </Campo>
        {f.forma === "avista" && f.meio === "credito" && (
          <Campo rotulo="Cliente parcelou no cartão em quantas vezes?" dica="Só pra registro — você recebe o valor cheio da maquininha. Se teve taxa, lança como gasto abaixo.">
            <input type="number" inputMode="numeric" min="1" value={f.parcelasCartao} onChange={(e) => set({ parcelasCartao: e.target.value })} style={inputStyle} />
          </Campo>
        )}

        {f.forma === "parcelado" && (
          <div style={{ ...cardStyle, marginBottom: 14 }}>
            <Campo rotulo="Teve entrada?">
              <Segmentado valor={f.temEntrada ? "sim" : "nao"} onChange={(x) => regerar({ temEntrada: x === "sim" })} opcoes={[{ id: "nao", label: "Sem entrada" }, { id: "sim", label: "Com entrada" }]} />
            </Campo>
            {f.temEntrada && (
              <Campo rotulo="Valor da entrada (já recebido)"><InputValor value={f.valorEntrada} onChange={(v) => regerar({ valorEntrada: v })} /></Campo>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 10 }}>
              <Campo rotulo="Quantas parcelas?">
                <input type="number" inputMode="numeric" min="1" max="48" value={f.numParcelas} onChange={(e) => regerar({ numParcelas: e.target.value })} style={inputStyle} />
              </Campo>
              <Campo rotulo="1º vencimento">
                <input type="date" value={f.primeiroVenc} onChange={(e) => regerar({ primeiroVenc: e.target.value })} style={inputStyle} />
              </Campo>
            </div>
            <Campo rotulo="De quanto em quanto tempo?">
              <Segmentado valor={f.intervalo} onChange={(x) => regerar({ intervalo: x })} opcoes={[{ id: "semanal", label: "Semanal" }, { id: "quinzenal", label: "Quinzenal" }, { id: "mensal", label: "Mensal" }]} />
            </Campo>

            {f.parcelas.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", margin: "6px 0 8px" }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Parcelas</span>
                  <span style={{ fontSize: 11.5, color: TEXTO_TERC }}>dá pra mudar valor e data de cada uma</span>
                </div>
                {f.parcelas.map((p, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "34px 1fr 1fr", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, color: TEXTO_SEC, fontWeight: 600 }}>{i + 1}ª</span>
                    <InputValor value={p.valor} onChange={(v) => set({ parcelas: f.parcelas.map((x, j) => (j === i ? { ...x, valor: v } : x)) })} style={{ padding: "9px 8px 9px 34px", fontSize: 15 }} />
                    <input type="date" value={p.vencimento} onChange={(e) => set({ parcelas: f.parcelas.map((x, j) => (j === i ? { ...x, vencimento: e.target.value } : x)) })} style={{ ...inputStyle, padding: "9px 8px", fontSize: 14 }} />
                  </div>
                ))}
                {!isNaN(restante) && restante > 0 && (
                  Math.abs(difParcelas) < 0.01 ? (
                    <p style={{ fontSize: 12, color: VERDE, margin: "4px 0 0", display: "flex", alignItems: "center", gap: 5 }}><Check size={14} aria-hidden="true" /> Soma das parcelas bate: {formatBRL(somaParcelas)}</p>
                  ) : (
                    <div style={{ background: AMARELO_BG, borderRadius: 10, padding: "9px 12px", marginTop: 6 }}>
                      <p style={{ fontSize: 12.5, color: AMARELO, margin: "0 0 8px" }}>
                        Parcelas somam {formatBRL(somaParcelas)}, mas faltam {formatBRL(restante)}{f.temEntrada ? " (total − entrada)" : ""}. Diferença: {formatBRL(difParcelas)}.
                      </p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button onClick={() => {
                          const ult = f.parcelas.length - 1;
                          const novoUlt = arred((parseValor(f.parcelas[ult].valor) || 0) + difParcelas);
                          if (novoUlt > 0) set({ parcelas: f.parcelas.map((x, j) => (j === ult ? { ...x, valor: valorParaInput(novoUlt) } : x)) });
                        }} style={{ ...btnSecundario, padding: "7px 11px", fontSize: 12.5 }}>Ajustar última parcela</button>
                        <button onClick={() => set({ valorVenda: valorParaInput(arred(somaParcelas + (isNaN(entrada) ? 0 : entrada))) })} style={{ ...btnSecundario, padding: "7px 11px", fontSize: 12.5 }}>Usar soma como total</button>
                      </div>
                    </div>
                  )
                )}
              </>
            )}
          </div>
        )}

        {/* GASTOS */}
        <p style={{ fontSize: 12, fontWeight: 700, color: ACENTO, letterSpacing: 0.6, margin: "22px 0 6px" }}>4 · GASTOS DESSA VENDA <span style={{ color: TEXTO_TERC, fontWeight: 500 }}>(opcional)</span></p>
        <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "0 0 10px" }}>Gasolina pra buscar, frete, lanche no caminho… entra no lucro dessa venda.</p>
        {f.gastos.map((g, i) => (
          <div key={i} style={{ ...cardStyle, padding: 12, marginBottom: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <select value={g.categoria} onChange={(e) => set({ gastos: f.gastos.map((x, j) => (j === i ? { ...x, categoria: e.target.value } : x)) })} style={{ ...inputStyle, width: "auto", padding: "8px 10px", fontSize: 14 }}>
                {Object.entries(CATEGORIAS_GASTO).map(([id, c]) => <option key={id} value={id}>{c.label}</option>)}
              </select>
              <button onClick={() => set({ gastos: f.gastos.filter((_, j) => j !== i) })} aria-label="Remover gasto" style={{ background: "transparent", border: "none", color: TEXTO_SEC, cursor: "pointer" }}><X size={18} aria-hidden="true" /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 8 }}>
              <InputValor value={g.valor} onChange={(v) => set({ gastos: f.gastos.map((x, j) => (j === i ? { ...x, valor: v } : x)) })} />
              <input type="text" value={g.descricao} onChange={(e) => set({ gastos: f.gastos.map((x, j) => (j === i ? { ...x, descricao: e.target.value } : x)) })} placeholder="Descrição" style={inputStyle} />
            </div>
          </div>
        ))}
        <button onClick={() => set({ gastos: [...f.gastos, { categoria: "gasolina", valor: "", descricao: "" }] })} style={{ ...btnSecundario, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 14 }}>
          <Plus size={15} aria-hidden="true" /> Adicionar gasto
        </button>

        {/* OBS */}
        <p style={{ fontSize: 12, fontWeight: 700, color: ACENTO, letterSpacing: 0.6, margin: "22px 0 10px" }}>5 · ANOTAÇÕES <span style={{ color: TEXTO_TERC, fontWeight: 500 }}>(opcional)</span></p>
        <Campo>
          <textarea value={f.observacao} onChange={(e) => set({ observacao: e.target.value })} rows={3} placeholder="Qualquer coisa que você queira lembrar sobre essa venda" style={{ ...inputStyle, resize: "vertical" }} />
        </Campo>

        {erros.length > 0 && (
          <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "4px 0 10px" }}>Falta: {erros.join(" · ")}</p>
        )}
        <button disabled={salvando || erros.length > 0} onClick={salvarNovaVenda} style={{ ...btnPrimario, padding: 15, fontSize: 15, opacity: salvando || erros.length > 0 ? 0.5 : 1 }}>
          {salvando ? "Salvando…" : "Salvar venda"}
        </button>
      </>
    );
  }

  // =============== DETALHE DA VENDA ===============
  if (pagina === "detalheVenda") {
    const v = vendas.find((x) => x.id === atual.id);
    if (!v) return tela(<><TopBar titulo="Venda" onBack={voltar} /><Vazio icone={ShoppingBag} texto="Venda não encontrada." /></>);
    const r = resumos[v.id];
    const ps = parcelasPorVenda[v.id] || [];
    const gs = (gastosPorVenda[v.id] || []).slice().sort((a, b) => b.data.localeCompare(a.data));
    const cli = v.clienteId ? clientePorId[v.clienteId] : null;
    const qtdNumeradas = ps.filter((p) => p.numero > 0).length;
    const textoObs = obsRascunho !== null && obsRascunho.id === v.id ? obsRascunho.texto : v.observacao;
    const obsAlterada = obsRascunho !== null && obsRascunho.id === v.id && obsRascunho.texto !== v.observacao;

    return tela(
      <>
        <TopBar titulo={v.produtoNome} onBack={voltar} direita={
          <button onClick={() => setFolha(<Folha titulo="Editar venda" onFechar={() => setFolha(null)}><FormEditarVenda venda={v} clientes={clientes} salvando={false} onSalvar={(d) => editarVenda(v, d)} /></Folha>)} aria-label="Editar venda" style={{ ...btnSecundario, padding: 9, display: "flex" }}><Pencil size={16} aria-hidden="true" /></button>
        } />

        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <Badge cfg={STATUS_VENDA[r.status]} />
          <span style={{ fontSize: 12.5, color: TEXTO_SEC }}>
            {formatData(v.dataVenda)}{v.meio ? ` · ${MEIOS[v.meio] || v.meio}` : ""}{v.parcelasCartao > 1 ? ` em ${v.parcelasCartao}x` : ""}
          </span>
        </div>
        {v.descricao && <p style={{ fontSize: 13, color: TEXTO_SEC, margin: "-4px 0 12px" }}>{v.descricao}</p>}

        {cli ? (
          <button onClick={() => abrir("detalheCliente", { id: cli.id })} style={{ ...cardStyle, width: "100%", display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer", color: TEXTO, fontFamily: FONTE, padding: "12px 14px" }}>
            <User size={16} color={TEXTO_SEC} aria-hidden="true" />
            <span style={{ fontSize: 14, fontWeight: 600, flex: 1, textAlign: "left" }}>{cli.nome}</span>
            <ChevronRight size={16} color={TEXTO_TERC} aria-hidden="true" />
          </button>
        ) : null}

        {/* números */}
        <div style={{ ...cardStyle, marginBottom: 10 }}>
          <Linha rotulo="Valor da venda" valor={formatBRL(r.totalEfetivo)} />
          {r.diferenca !== 0 && <Linha rotulo="Combinado originalmente" valor={formatBRL(r.combinado)} cor={TEXTO_SEC} />}
          <Linha rotulo="Você pagou (custo)" valor={`− ${formatBRL(v.valorPago)}`} cor={TEXTO_SEC} />
          <Linha rotulo={`Gastos vinculados${gs.length ? ` (${gs.length})` : ""}`} valor={`− ${formatBRL(r.totalGastos)}`} cor={r.totalGastos > 0 ? VERMELHO : TEXTO_SEC} />
          <Linha rotulo="Lucro" valor={`${formatBRL(r.lucro)}${r.totalEfetivo > 0 ? ` · ${Math.round(r.margem)}%` : ""}`} cor={r.lucro >= 0 ? VERDE : VERMELHO} forte borda />
        </div>

        <div style={{ ...cardStyle, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12.5, color: TEXTO_SEC }}>Recebido</span>
            <span style={{ fontSize: 12.5, color: TEXTO_SEC }}>Falta receber</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: VERDE }}>{formatBRL(r.recebido)}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: r.aReceber > 0 ? AMARELO : TEXTO_TERC }}>{formatBRL(r.aReceber)}</span>
          </div>
          <BarraProgresso valor={r.recebido} total={r.totalEfetivo} />
          {r.diferenca !== 0 && (
            <p style={{ fontSize: 12, color: r.diferenca > 0 ? VERDE : AMARELO, margin: "10px 0 0" }}>
              {r.diferenca > 0 ? `Recebeu ${formatBRL(r.diferenca)} a mais que o combinado nas parcelas pagas.` : `Recebeu ${formatBRL(-r.diferenca)} a menos que o combinado nas parcelas pagas.`}
            </p>
          )}
        </div>

        {/* parcelas */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ fontSize: 13.5, fontWeight: 650, margin: 0 }}>{ps.length === 1 && ps[0].pago && v.forma === "avista" ? "Pagamento" : `Parcelas (${ps.length})`}</p>
          <button onClick={() => setFolha(<Folha titulo="Nova parcela" onFechar={() => setFolha(null)}><FormParcela salvando={false} onSalvar={(d) => salvarParcela(v.id, null, d)} /></Folha>)} style={{ ...btnSecundario, padding: "6px 10px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}><Plus size={14} aria-hidden="true" /> Parcela</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {ps.map((p) => {
            const d = diasAte(p.vencimento);
            const st = p.pago ? "quitada" : d < 0 ? "atrasada" : d <= 3 ? "proxima" : "aberta";
            const cfg = STATUS_VENDA[st];
            const recebido = p.valorRecebido != null ? p.valorRecebido : p.valor;
            const dif = p.pago ? arred(recebido - p.valor) : 0;
            const msgCobranca = `Oi${cli ? `, ${cli.nome.split(" ")[0]}` : ""}! Passando pra lembrar da parcela ${rotuloParcela(p, qtdNumeradas)} de ${formatBRL(p.valor)} (${v.produtoNome}), ${d < 0 ? `que venceu em ${formatData(p.vencimento)}` : d === 0 ? "que vence hoje" : `com vencimento em ${formatData(p.vencimento)}`}. Qualquer coisa me chama!`;
            const wa = cli && cli.telefone ? linkWhatsApp(cli.telefone, msgCobranca) : null;
            return (
              <div key={p.id} style={{ ...cardStyle, padding: "12px 14px", borderLeft: `3px solid ${cfg.text}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div>
                    <p style={{ fontSize: 13, color: TEXTO_SEC, margin: 0 }}>
                      {rotuloParcela(p, qtdNumeradas)} · {p.pago ? `paga em ${formatData(p.pagoEm)}` : `vence ${formatData(p.vencimento)}`}
                    </p>
                    <p style={{ fontSize: 17, fontWeight: 700, margin: "3px 0 0" }}>{formatBRL(p.pago ? recebido : p.valor)}</p>
                    {dif !== 0 && (
                      <p style={{ fontSize: 11.5, color: dif > 0 ? VERDE : AMARELO, margin: "3px 0 0" }}>
                        combinado {formatBRL(p.valor)} · {dif > 0 ? "+" : "−"}{formatBRL(Math.abs(dif))}
                      </p>
                    )}
                  </div>
                  <Badge cfg={cfg}>{p.pago ? "Recebida" : st === "atrasada" ? `${-d}d atraso` : st === "proxima" ? (d === 0 ? "Hoje" : d === 1 ? "Amanhã" : `Em ${d}d`) : "Aberta"}</Badge>
                </div>
                {p.observacao && <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "8px 0 0", display: "flex", gap: 5 }}><StickyNote size={13} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />{p.observacao}</p>}
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {!p.pago ? (
                    <>
                      <button onClick={() => setFolha(<Folha titulo={`Receber ${rotuloParcela(p, qtdNumeradas)}`} onFechar={() => setFolha(null)}><FormReceberParcela parcela={p} salvando={false} onSalvar={(d2) => receberParcela(p, d2)} /></Folha>)} style={{ ...btnPrimario, width: "auto", padding: "8px 13px", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}><Check size={14} aria-hidden="true" /> Recebi</button>
                      <button onClick={() => setFolha(<Folha titulo={`Editar ${rotuloParcela(p, qtdNumeradas)}`} onFechar={() => setFolha(null)}><FormParcela parcela={p} podeExcluir={ps.length > 1} salvando={false} onSalvar={(d2) => salvarParcela(v.id, p, d2)} onExcluir={() => excluirParcela(p)} /></Folha>)} style={{ ...btnSecundario, padding: "8px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}><Pencil size={13} aria-hidden="true" /> Editar</button>
                      {wa && (
                        <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => { window.__fcSemBloqueio = true; setTimeout(() => { window.__fcSemBloqueio = false; }, 1500); }} style={{ ...btnSecundario, padding: "8px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 5, textDecoration: "none" }}><MessageCircle size={13} aria-hidden="true" /> Cobrar</a>
                      )}
                    </>
                  ) : (
                    <button onClick={() => desfazerRecebimento(p)} disabled={salvando} style={{ ...btnSecundario, padding: "7px 11px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 5, color: TEXTO_SEC }}><Undo2 size={13} aria-hidden="true" /> Desfazer</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* gastos */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ fontSize: 13.5, fontWeight: 650, margin: 0 }}>Gastos dessa venda</p>
          <button onClick={() => setFolha(<Folha titulo="Gasto da venda" onFechar={() => setFolha(null)}><FormGasto vendas={vendasOrdenadas} produtos={produtos} vendaFixa={v.id} salvando={false} onSalvar={(d) => salvarGasto(null, d)} /></Folha>)} style={{ ...btnSecundario, padding: "6px 10px", fontSize: 12.5, display: "flex", alignItems: "center", gap: 4 }}><Plus size={14} aria-hidden="true" /> Gasto</button>
        </div>
        {gs.length === 0 ? (
          <p style={{ fontSize: 12.5, color: TEXTO_TERC, margin: "0 0 18px" }}>Nenhum gasto vinculado.</p>
        ) : (
          <div style={{ ...cardStyle, padding: "2px 14px", marginBottom: 18 }}>
            {gs.map((g, i) => {
              const c = CATEGORIAS_GASTO[g.categoria] || CATEGORIAS_GASTO.outros;
              const Icon = c.icon;
              return (
                <button key={g.id} onClick={() => setFolha(<Folha titulo="Editar gasto" onFechar={() => setFolha(null)}><FormGasto gasto={g} vendas={vendasOrdenadas} produtos={produtos} salvando={false} onSalvar={(d) => salvarGasto(g, d)} onExcluir={() => excluirGasto(g)} /></Folha>)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 0", border: "none", borderTop: i ? `1px solid ${BORDA}` : "none", background: "transparent", color: TEXTO, cursor: "pointer", fontFamily: FONTE, textAlign: "left" }}>
                  <Icon size={16} color={c.cor} aria-hidden="true" />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13.5, display: "block" }}>{c.label}</span>
                    <span style={{ fontSize: 11.5, color: TEXTO_SEC }}>{formatDataCurta(g.data)}{g.descricao ? ` · ${g.descricao}` : ""}</span>
                  </span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: VERMELHO }}>{formatBRL(g.valor)}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* anotações */}
        <p style={{ fontSize: 13.5, fontWeight: 650, margin: "0 0 8px" }}>Anotações</p>
        <textarea value={textoObs} onChange={(e) => setObsRascunho({ id: v.id, texto: e.target.value })} rows={4} placeholder="Escreva aqui qualquer coisa sobre essa venda…" style={{ ...inputStyle, resize: "vertical", marginBottom: 8 }} />
        {obsAlterada && (
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <button onClick={() => salvarObsVenda(v, obsRascunho.texto)} disabled={salvando} style={{ ...btnPrimario, flex: 1 }}>Salvar anotação</button>
            <button onClick={() => setObsRascunho(null)} style={{ ...btnSecundario }}>Cancelar</button>
          </div>
        )}

        <div style={{ marginTop: 22 }}>
          <BotaoConfirmar rotulo="Excluir venda" icone={Trash2} onConfirmar={() => excluirVenda(v)} estilo={{ width: "100%" }} rotuloConfirmar={v.produtoId ? "Confirmar? O item volta pro estoque" : "Toque de novo pra confirmar"} />
        </div>
      </>
    );
  }

  // =============== GASTOS ===============
  if (pagina === "gastos") {
    const chave = chaveDeAnoMes(mesGastos.ano, mesGastos.mes);
    const doMes = gastos.filter((g) => chaveMes(g.data) === chave).sort((a, b) => b.data.localeCompare(a.data) || String(b.criadoEm).localeCompare(String(a.criadoEm)));
    const total = arred(doMes.reduce((a, g) => a + g.valor, 0));
    const porCat = {};
    doMes.forEach((g) => { porCat[g.categoria] = (porCat[g.categoria] || 0) + g.valor; });
    const cats = Object.entries(porCat).sort((a, b) => b[1] - a[1]);
    const maior = cats.length ? cats[0][1] : 0;
    const porDia = {};
    doMes.forEach((g) => { (porDia[g.data] = porDia[g.data] || []).push(g); });

    return tela(
      <>
        <TopBar titulo="Gastos" direita={
          <button onClick={() => abrir("novoGasto")} style={{ ...btnPrimario, width: "auto", padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} aria-hidden="true" /> Lançar</button>
        } />
        <SeletorMes ano={mesGastos.ano} mes={mesGastos.mes} onChange={(ano, mes) => setMesGastos({ ano, mes })} />
        <div style={{ ...cardStyle, marginBottom: 14 }}>
          <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "0 0 4px" }}>Total gasto no mês</p>
          <p style={{ fontSize: 26, fontWeight: 750, margin: "0 0 12px", color: total > 0 ? VERMELHO : TEXTO }}>{formatBRL(total)}</p>
          {cats.map(([id, val]) => {
            const c = CATEGORIAS_GASTO[id] || CATEGORIAS_GASTO.outros;
            const Icon = c.icon;
            return (
              <div key={id} style={{ marginBottom: 9 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: TEXTO_SEC }}><Icon size={13} color={c.cor} aria-hidden="true" />{c.label}</span>
                  <span style={{ fontWeight: 600 }}>{formatBRL(val)}</span>
                </div>
                <BarraProgresso valor={val} total={maior} cor={c.cor} />
              </div>
            );
          })}
        </div>
        {doMes.length === 0 ? (
          <Vazio icone={Wallet} texto="Nenhum gasto nesse mês." acao={<button onClick={() => abrir("novoGasto")} style={{ ...btnPrimario, width: "auto", padding: "10px 18px" }}>Lançar gasto</button>} />
        ) : (
          Object.keys(porDia).sort((a, b) => b.localeCompare(a)).map((dia) => (
            <div key={dia} style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: TEXTO_SEC, margin: "0 0 6px", fontWeight: 600 }}>{formatData(dia)}</p>
              <div style={{ ...cardStyle, padding: "2px 14px" }}>
                {porDia[dia].map((g, i) => {
                  const c = CATEGORIAS_GASTO[g.categoria] || CATEGORIAS_GASTO.outros;
                  const Icon = c.icon;
                  const vd = g.vendaId ? vendas.find((x) => x.id === g.vendaId) : null;
                  const pd = !vd && g.produtoId ? produtos.find((x) => x.id === g.produtoId) : null;
                  return (
                    <button key={g.id} onClick={() => setFolha(<Folha titulo="Editar gasto" onFechar={() => setFolha(null)}><FormGasto gasto={g} vendas={vendasOrdenadas} produtos={produtos} salvando={false} onSalvar={(d) => salvarGasto(g, d)} onExcluir={() => excluirGasto(g)} /></Folha>)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 0", border: "none", borderTop: i ? `1px solid ${BORDA}` : "none", background: "transparent", color: TEXTO, cursor: "pointer", fontFamily: FONTE, textAlign: "left" }}>
                      <span style={{ width: 32, height: 32, borderRadius: 9, background: BG_CARD_2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={16} color={c.cor} aria-hidden="true" /></span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: 13.5, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.descricao || c.label}</span>
                        <span style={{ fontSize: 11.5, color: TEXTO_SEC, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {g.descricao ? c.label : ""}{vd ? `${g.descricao ? " · " : ""}venda: ${vd.produtoNome}` : pd ? `${g.descricao ? " · " : ""}item: ${pd.nome}` : !g.descricao ? "geral" : " · geral"}
                        </span>
                      </span>
                      <span style={{ fontSize: 14, fontWeight: 650, color: VERMELHO, whiteSpace: "nowrap" }}>{formatBRL(g.valor)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </>
    );
  }

  if (pagina === "novoGasto") {
    return tela(
      <>
        <TopBar titulo="Lançar gasto" onBack={voltar} />
        <FormGasto vendas={vendasOrdenadas} produtos={produtos.filter((p) => !p.vendido)} produtoFixo={atual.produtoId} salvando={salvando} onSalvar={(d) => salvarGasto(null, d, voltar)} />
      </>
    );
  }

  // =============== CLIENTES ===============
  if (pagina === "clientes") {
    const termo = buscaClientes.trim().toLowerCase();
    const lista = clientes.filter((c) => c.nome.toLowerCase().includes(termo));
    return tela(
      <>
        <TopBar titulo="Clientes" direita={
          <button onClick={() => abrir("novoCliente")} style={{ ...btnPrimario, width: "auto", padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} aria-hidden="true" /> Novo</button>
        } />
        <Busca valor={buscaClientes} onChange={setBuscaClientes} placeholder="Buscar cliente…" />
        {lista.length === 0 ? (
          <Vazio icone={User} texto={clientes.length === 0 ? "Nenhum cliente cadastrado." : "Ninguém com esse nome."} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lista.map((c) => {
              const vs = vendas.filter((v) => v.clienteId === c.id);
              const aberto = arred(vs.reduce((a, v) => a + resumos[v.id].aReceber, 0));
              const atrasado = vs.some((v) => resumos[v.id].status === "atrasada");
              const cfg = CLASSIFICACOES[c.classificacao] || CLASSIFICACOES.novo;
              const Icon = cfg.icon;
              return (
                <button key={c.id} onClick={() => abrir("detalheCliente", { id: c.id })} style={{ ...cardStyle, display: "flex", alignItems: "center", gap: 12, width: "100%", cursor: "pointer", color: TEXTO, fontFamily: FONTE, textAlign: "left", padding: "12px 14px" }}>
                  <span style={{ width: 38, height: 38, borderRadius: "50%", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={17} color={cfg.text} aria-hidden="true" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.nome}</span>
                    <span style={{ fontSize: 12, color: TEXTO_SEC }}>{vs.length} {vs.length === 1 ? "compra" : "compras"}{aberto > 0 ? ` · deve ${formatBRL(aberto)}` : ""}</span>
                  </span>
                  {atrasado && <Badge cfg={STATUS_VENDA.atrasada} />}
                  <ChevronRight size={16} color={TEXTO_TERC} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  }

  if (pagina === "novoCliente") {
    return tela(
      <>
        <TopBar titulo="Novo cliente" onBack={voltar} />
        <FormCliente salvando={salvando} onSalvar={(f) => salvarCliente(null, f)} />
      </>
    );
  }

  if (pagina === "detalheCliente") {
    const c = clientes.find((x) => x.id === atual.id);
    if (!c) return tela(<><TopBar titulo="Cliente" onBack={voltar} /><Vazio icone={User} texto="Cliente não encontrado." /></>);
    const vs = vendasOrdenadas.filter((v) => v.clienteId === c.id);
    const totalComprado = arred(vs.reduce((a, v) => a + resumos[v.id].totalEfetivo, 0));
    const totalPago = arred(vs.reduce((a, v) => a + resumos[v.id].recebido, 0));
    const aberto = arred(vs.reduce((a, v) => a + resumos[v.id].aReceber, 0));
    const lucro = arred(vs.reduce((a, v) => a + resumos[v.id].lucro, 0));
    const cfg = CLASSIFICACOES[c.classificacao] || CLASSIFICACOES.novo;
    const wa = c.telefone ? linkWhatsApp(c.telefone, `Oi, ${c.nome.split(" ")[0]}!`) : null;
    return tela(
      <>
        <TopBar titulo={c.nome} onBack={voltar} direita={
          <button onClick={() => setFolha(<Folha titulo="Editar cliente" onFechar={() => setFolha(null)}><FormCliente cliente={c} salvando={false} onSalvar={(f) => salvarCliente(c, f)} /></Folha>)} aria-label="Editar cliente" style={{ ...btnSecundario, padding: 9, display: "flex" }}><Pencil size={16} aria-hidden="true" /></button>
        } />
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <Badge cfg={cfg} />
          {c.telefone && <span style={{ fontSize: 12.5, color: TEXTO_SEC }}>{c.telefone}</span>}
        </div>
        {c.endereco && <p style={{ fontSize: 13, color: TEXTO_SEC, margin: "0 0 10px" }}>{c.endereco}</p>}
        {c.observacao && <div style={{ ...cardStyle, padding: "10px 12px", marginBottom: 10, display: "flex", gap: 8 }}><StickyNote size={15} color={TEXTO_SEC} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden="true" /><p style={{ fontSize: 13, margin: 0, whiteSpace: "pre-wrap" }}>{c.observacao}</p></div>}
        <div style={{ ...cardStyle, marginBottom: 10 }}>
          <Linha rotulo="Total comprado" valor={formatBRL(totalComprado)} />
          <Linha rotulo="Já pagou" valor={formatBRL(totalPago)} cor={VERDE} />
          <Linha rotulo="Ainda deve" valor={formatBRL(aberto)} cor={aberto > 0 ? AMARELO : TEXTO_SEC} />
          <Linha rotulo="Lucro que ele te deu" valor={formatBRL(lucro)} cor={lucro >= 0 ? VERDE : VERMELHO} forte borda />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: wa ? "1fr 1fr" : "1fr", gap: 10, marginBottom: 18 }}>
          <button onClick={() => { setFormVenda(formVendaVazio({ clienteId: c.id })); abrir("novaVenda"); }} style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={15} aria-hidden="true" /> Nova venda</button>
          {wa && <a href={wa} target="_blank" rel="noopener noreferrer" onClick={() => { window.__fcSemBloqueio = true; setTimeout(() => { window.__fcSemBloqueio = false; }, 1500); }} style={{ ...btnSecundario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}><MessageCircle size={15} aria-hidden="true" /> WhatsApp</a>}
        </div>
        <p style={{ fontSize: 13.5, fontWeight: 650, margin: "0 0 8px" }}>Compras</p>
        {vs.length === 0 ? <p style={{ fontSize: 12.5, color: TEXTO_TERC }}>Nenhuma compra ainda.</p> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>{vs.map((v) => <CardVenda key={v.id} v={v} />)}</div>
        )}
        <div style={{ marginTop: 22 }}>
          <BotaoConfirmar rotulo="Excluir cliente" icone={Trash2} onConfirmar={() => excluirCliente(c)} estilo={{ width: "100%" }} rotuloConfirmar={vs.length ? "Confirmar? As vendas ficam, só sem cliente" : "Toque de novo pra confirmar"} />
        </div>
      </>
    );
  }

  // =============== ESTOQUE ===============
  if (pagina === "estoque") {
    const termo = buscaEstoque.trim().toLowerCase();
    const emEstoque = produtos.filter((p) => !p.vendido && p.nome.toLowerCase().includes(termo));
    const valorTotal = arred(produtos.filter((p) => !p.vendido).reduce((a, p) => a + p.precoCompra, 0));
    const potencial = arred(produtos.filter((p) => !p.vendido && p.precoVenda != null).reduce((a, p) => a + (p.precoVenda - p.precoCompra), 0));
    return tela(
      <>
        <TopBar titulo="Estoque" direita={
          <button onClick={() => abrir("novoProduto")} style={{ ...btnPrimario, width: "auto", padding: "9px 14px", display: "flex", alignItems: "center", gap: 6 }}><Plus size={16} aria-hidden="true" /> Item</button>
        } />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
          <div style={cardStyle}>
            <p style={{ fontSize: 11.5, color: TEXTO_SEC, margin: "0 0 4px" }}>Dinheiro parado</p>
            <p style={{ fontSize: 17, fontWeight: 700, margin: 0, color: AMARELO }}>{formatBRL(valorTotal)}</p>
            <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "4px 0 0" }}>{produtos.filter((p) => !p.vendido).length} unidades</p>
          </div>
          <div style={cardStyle}>
            <p style={{ fontSize: 11.5, color: TEXTO_SEC, margin: "0 0 4px" }}>Lucro previsto</p>
            <p style={{ fontSize: 17, fontWeight: 700, margin: 0, color: VERDE }}>{formatBRL(potencial)}</p>
            <p style={{ fontSize: 11, color: TEXTO_TERC, margin: "4px 0 0" }}>se vender no preço</p>
          </div>
        </div>
        <Busca valor={buscaEstoque} onChange={setBuscaEstoque} placeholder="Buscar item…" />
        {emEstoque.length === 0 ? (
          <Vazio icone={Package} texto={produtos.some((p) => !p.vendido) ? "Nada com esse nome." : "Estoque vazio."} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {emEstoque.map((p) => {
              const gp = gastos.filter((g) => g.produtoId === p.id && !g.vendaId).reduce((a, g) => a + g.valor, 0);
              return (
                <button key={p.id} onClick={() => abrir("detalheProduto", { id: p.id })} style={{ ...cardStyle, width: "100%", display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: TEXTO, fontFamily: FONTE, textAlign: "left", padding: "12px 14px" }}>
                  <span style={{ width: 38, height: 38, borderRadius: 10, background: BG_CARD_2, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Package size={17} color={ACENTO} aria-hidden="true" /></span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 600, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.nome}</span>
                    <span style={{ fontSize: 12, color: TEXTO_SEC }}>custo {formatBRL(p.precoCompra)}{p.precoVenda != null ? ` · vender por ${formatBRL(p.precoVenda)}` : ""}{gp > 0 ? ` · +${formatBRL(gp)} gastos` : ""}</span>
                  </span>
                  <ChevronRight size={16} color={TEXTO_TERC} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        )}
      </>
    );
  }

  if (pagina === "novoProduto") {
    return tela(
      <>
        <TopBar titulo="Novo item no estoque" onBack={voltar} />
        <FormProduto salvando={salvando} onSalvar={(d) => salvarProduto(null, d)} />
      </>
    );
  }

  if (pagina === "detalheProduto") {
    const p = produtos.find((x) => x.id === atual.id);
    if (!p) return tela(<><TopBar titulo="Item" onBack={voltar} /><Vazio icone={Package} texto="Item não encontrado." /></>);
    const gs = gastos.filter((g) => g.produtoId === p.id).sort((a, b) => b.data.localeCompare(a.data));
    const totalG = arred(gs.reduce((a, g) => a + g.valor, 0));
    const vendaDoItem = p.vendido ? vendas.find((v) => v.produtoId === p.id) : null;
    return tela(
      <>
        <TopBar titulo={p.nome} onBack={voltar} direita={
          <button onClick={() => setFolha(<Folha titulo="Editar item" onFechar={() => setFolha(null)}><FormProduto produto={p} salvando={false} onSalvar={(d) => salvarProduto(p, d)} /></Folha>)} aria-label="Editar item" style={{ ...btnSecundario, padding: 9, display: "flex" }}><Pencil size={16} aria-hidden="true" /></button>
        } />
        {p.especificacoes && <p style={{ fontSize: 13, color: TEXTO_SEC, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{p.especificacoes}</p>}
        <div style={{ ...cardStyle, marginBottom: 12 }}>
          <Linha rotulo="Você pagou" valor={formatBRL(p.precoCompra)} />
          <Linha rotulo="Gastos com esse item" valor={formatBRL(totalG)} cor={totalG > 0 ? VERMELHO : TEXTO_SEC} />
          <Linha rotulo="Custo real" valor={formatBRL(p.precoCompra + totalG)} forte borda />
          {p.precoVenda != null && <Linha rotulo="Pretende vender por" valor={formatBRL(p.precoVenda)} />}
          {p.precoVenda != null && <Linha rotulo="Lucro previsto" valor={formatBRL(p.precoVenda - p.precoCompra - totalG)} cor={p.precoVenda - p.precoCompra - totalG >= 0 ? VERDE : VERMELHO} />}
          <Linha rotulo="No estoque desde" valor={formatData(String(p.criadoEm).slice(0, 10))} cor={TEXTO_SEC} />
        </div>
        {!p.vendido ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
            <button onClick={() => iniciarVendaDoProduto(p)} style={{ ...btnPrimario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><ShoppingBag size={15} aria-hidden="true" /> Vender</button>
            <button onClick={() => abrir("novoGasto", { produtoId: p.id })} style={{ ...btnSecundario, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}><Plus size={15} aria-hidden="true" /> Gasto</button>
          </div>
        ) : vendaDoItem ? (
          <button onClick={() => abrir("detalheVenda", { id: vendaDoItem.id })} style={{ ...btnSecundario, width: "100%", marginBottom: 18 }}>Ver a venda desse item</button>
        ) : null}
        {gs.length > 0 && (
          <>
            <p style={{ fontSize: 13.5, fontWeight: 650, margin: "0 0 8px" }}>Gastos com esse item</p>
            <div style={{ ...cardStyle, padding: "2px 14px", marginBottom: 18 }}>
              {gs.map((g, i) => {
                const c = CATEGORIAS_GASTO[g.categoria] || CATEGORIAS_GASTO.outros;
                const Icon = c.icon;
                return (
                  <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 0", borderTop: i ? `1px solid ${BORDA}` : "none" }}>
                    <Icon size={16} color={c.cor} aria-hidden="true" />
                    <span style={{ flex: 1, fontSize: 13 }}>{g.descricao || c.label} <span style={{ color: TEXTO_SEC }}>· {formatDataCurta(g.data)}</span></span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: VERMELHO }}>{formatBRL(g.valor)}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
        {!p.vendido && <BotaoConfirmar rotulo="Excluir item" icone={Trash2} onConfirmar={() => excluirProduto(p)} estilo={{ width: "100%" }} />}
      </>
    );
  }

  // =============== AJUSTES ===============
  if (pagina === "ajustes") {
    const cfg = controleBloqueio?.config;
    return tela(
      <>
        <TopBar titulo="Ajustes" onBack={voltar} />
        <p style={{ fontSize: 12, fontWeight: 700, color: TEXTO_SEC, letterSpacing: 0.6, margin: "0 0 8px" }}>SEGURANÇA</p>
        <div style={{ ...cardStyle, marginBottom: 18, padding: "4px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 0" }}>
            <ScanFace size={18} color={cfg?.credId ? ACENTO : TEXTO_SEC} aria-hidden="true" />
            <span style={{ flex: 1, fontSize: 14 }}>Face ID</span>
            {cfg?.credId ? (
              <button onClick={() => { controleBloqueio.atualizarConfig({ ...cfg, credId: null }); mostrarAviso("Face ID desativado"); }} style={{ ...btnSecundario, padding: "7px 12px", fontSize: 12.5 }}>Desativar</button>
            ) : bioDisponivel ? (
              <button onClick={async () => {
                try {
                  window.__fcBioEmAndamento = true;
                  const credId = await registrarBiometria();
                  controleBloqueio.atualizarConfig({ ...cfg, credId });
                  mostrarAviso("Face ID ativado");
                } catch (e) { mostrarAviso("Não deu pra ativar o Face ID"); }
                finally { window.__fcBioEmAndamento = false; }
              }} style={{ ...btnPrimario, width: "auto", padding: "7px 12px", fontSize: 12.5 }}>Ativar</button>
            ) : (
              <span style={{ fontSize: 12, color: TEXTO_TERC }}>indisponível aqui</span>
            )}
          </div>
          <button onClick={() => setFolha(<Folha titulo="Trocar PIN" onFechar={() => setFolha(null)}><FormTrocarPin onSalvar={async (novo) => {
            const salt = b64url(crypto.getRandomValues(new Uint8Array(16)));
            const pinHash = await hashPin(novo, salt);
            controleBloqueio.atualizarConfig({ ...controleBloqueio.config, salt, pinHash, tamanhoPin: novo.length });
            setFolha(null);
            mostrarAviso("PIN trocado");
          }} /></Folha>)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 0", borderTop: `1px solid ${BORDA}`, borderLeft: "none", borderRight: "none", borderBottom: "none", background: "transparent", color: TEXTO, cursor: "pointer", fontFamily: FONTE }}>
            <Lock size={18} color={TEXTO_SEC} aria-hidden="true" />
            <span style={{ flex: 1, fontSize: 14, textAlign: "left" }}>Trocar PIN</span>
            <ChevronRight size={16} color={TEXTO_TERC} aria-hidden="true" />
          </button>
        </div>
        <p style={{ fontSize: 11.5, color: TEXTO_TERC, margin: "-10px 0 18px" }}>O app bloqueia toda vez que você sai e volta. Se esquecer o PIN e o Face ID não funcionar, é só remover o app da tela inicial e instalar de novo — seus dados ficam salvos no servidor.</p>

        <p style={{ fontSize: 12, fontWeight: 700, color: TEXTO_SEC, letterSpacing: 0.6, margin: "0 0 8px" }}>AVISOS</p>
        <div style={{ ...cardStyle, marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          {statusNotificacao === "ativo" ? <Bell size={18} color={VERDE} aria-hidden="true" /> : <BellOff size={18} color={TEXTO_SEC} aria-hidden="true" />}
          <span style={{ flex: 1 }}>
            <span style={{ fontSize: 14, display: "block" }}>Avisos de parcelas</span>
            <span style={{ fontSize: 11.5, color: TEXTO_SEC }}>Véspera e dia do vencimento, e atrasos</span>
          </span>
          {statusNotificacao === "disponivel" && <button onClick={ativarNotificacoes} style={{ ...btnPrimario, width: "auto", padding: "7px 12px", fontSize: 12.5 }}>Ativar</button>}
          {statusNotificacao === "ativo" && <span style={{ fontSize: 12.5, color: VERDE }}>Ativos</span>}
          {statusNotificacao === "negado" && <span style={{ fontSize: 12, color: TEXTO_TERC }}>Bloqueados no iPhone</span>}
          {statusNotificacao === "indisponivel" && <span style={{ fontSize: 12, color: TEXTO_TERC }}>Instale o app pra ativar</span>}
        </div>

        <p style={{ fontSize: 12, fontWeight: 700, color: TEXTO_SEC, letterSpacing: 0.6, margin: "0 0 8px" }}>RESUMO GERAL</p>
        <div style={cardStyle}>
          <Linha rotulo="Vendas registradas" valor={vendas.length} />
          <Linha rotulo="Total vendido (tudo)" valor={formatBRL(vendas.reduce((a, v) => a + resumos[v.id].totalEfetivo, 0))} />
          <Linha rotulo="Gastos (tudo)" valor={formatBRL(gastos.reduce((a, g) => a + g.valor, 0))} cor={VERMELHO} />
          <Linha rotulo="Lucro acumulado" valor={formatBRL(vendas.reduce((a, v) => a + resumos[v.id].totalEfetivo - v.valorPago, 0) - gastos.reduce((a, g) => a + g.valor, 0))} cor={VERDE} forte borda />
        </div>
      </>
    );
  }

  return tela(<><TopBar titulo="Ops" onBack={() => irPara("dashboard")} /><Vazio texto="Página não encontrada." /></>);
}
