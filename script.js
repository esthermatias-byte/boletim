// ============================================================
// BOLETIM DIGITAL — 8A — Nº 9
// ============================================================

const CONFIG_ALUNO = {
  turma: "8A",
  numeroChamada: 9,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// Estado em memória (o PIN NUNCA vai para storage/URL/console)
const estado = {
  pin: null,
  autenticado: false,
  editando: false,
  disciplinas: [],
  frequenciaDemo: "95%" // frequência fictícia/demonstrativa preservada
};

// ============================================================
// DADOS FICTÍCIOS ORIGINAIS (preservados)
// ============================================================
const dadosBrutos = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// ============================================================
// NORMALIZAÇÃO (dados antigos): 75→7,5 | 82→8,2 | 100→10 | "8,5"→8,5 | 8.5→8,5
// ============================================================
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }
  let num = valor;
  if (typeof num === "string") {
    num = num.replace(",", ".");
  }
  num = Number(num);
  if (isNaN(num)) return null;
  if (num >= 0 && num <= 10) return num;
  if (num > 10 && num <= 100) return num / 10;
  return null;
}

function formatarNotaExibicao(nota) {
  if (nota === null || nota === undefined) return "—";
  return Number(nota).toFixed(1).replace(".", ",");
}

// ============================================================
// CLONE PROFUNDO DO DADOS LOCAIS (para não mutar o original)
// ============================================================
function clonarDadosLocais() {
  return dadosBrutos.map((d) => ({
    disciplina: d.disciplina,
    tri1: d.tri1,
    tri2: d.tri2,
    tri3: d.tri3,
    faltas: Array.isArray(d.faltas) ? d.faltas.slice(0, 3) : [0, 0, 0]
  }));
}

// ============================================================
// CÁLCULOS
// ============================================================
function calcularMedia(item) {
  const n1 = normalizarNota(item.tri1);
  const n2 = normalizarNota(item.tri2);
  const n3 = normalizarNota(item.tri3);
  const validas = [n1, n2, n3].filter((n) => n !== null);
  if (validas.length === 0) return null;
  return validas.reduce((a, b) => a + b, 0) / validas.length;
}

function totalFaltasDisciplina(item) {
  if (!Array.isArray(item.faltas)) return 0;
  return item.faltas.reduce((a, b) => a + (Number(b) || 0), 0);
}

// ============================================================
// REFERÊNCIAS DO DOM
// ============================================================
const el = {
  telaLogin: document.getElementById("tela-login"),
  inputPin: document.getElementById("input-pin"),
  btnEntrar: document.getElementById("btn-entrar"),
  loginStatus: document.getElementById("login-status"),
  conteudo: document.getElementById("conteudo-boletim"),
  tabelaCorpo: document.getElementById("tabela-corpo"),
  cardMediaGeral: document.getElementById("card-media-geral"),
  cardTotalFaltas: document.getElementById("card-total-faltas"),
  cardBomDesempenho: document.getElementById("card-bom-desempenho"),
  cardAtencao: document.getElementById("card-atencao"),
  btnAlterar: document.getElementById("btn-alterar"),
  btnSalvar: document.getElementById("btn-salvar"),
  btnCancelar: document.getElementById("btn-cancelar"),
  statusGeral: document.getElementById("status-geral")
};

// ============================================================
// RENDERIZAÇÃO (limpa antes de reconstruir — evita duplicar)
// ============================================================
function renderizarBoletim() {
  el.tabelaCorpo.innerHTML = "";

  let somaMedias = 0;
  let qtdMedias = 0;
  let totalFaltas = 0;
  let bom = 0;
  let atencao = 0;

  estado.disciplinas.forEach((item, indice) => {
    const media = calcularMedia(item);
    let situacao = "Nota ainda não disponível";
    let classe = "status-indisponivel";

    if (media !== null) {
      somaMedias += media;
      qtdMedias++;
      if (media >= 6.0) {
        situacao = "Bom desempenho";
        classe = "status-bom";
        bom++;
      } else {
        situacao = "Atenção";
        classe = "status-atencao";
        atencao++;
      }
    }

    totalFaltas += totalFaltasDisciplina(item);

    const tr = document.createElement("tr");
    tr.dataset.indice = String(indice);

    if (estado.editando) {
      tr.innerHTML = `
        <td class="celula-disciplina"></td>
        <td><input class="nota-input" data-campo="tri1" type="text" /></td>
        <td><input class="nota-input" data-campo="tri2" type="text" /></td>
        <td><input class="nota-input" data-campo="tri3" type="text" /></td>
        <td class="celula-media"></td>
        <td>
          <input class="falta-input" data-campo="f1" type="text" style="width:50px;" />
          <input class="falta-input" data-campo="f2" type="text" style="width:50px;" />
          <input class="falta-input" data-campo="f3" type="text" style="width:50px;" />
        </td>
        <td class="celula-situacao"></td>
      `;
      tr.querySelector(".celula-disciplina").textContent = item.disciplina;
      tr.querySelector('[data-campo="tri1"]').value = valorEditavel(item.tri1);
      tr.querySelector('[data-campo="tri2"]').value = valorEditavel(item.tri2);
      tr.querySelector('[data-campo="tri3"]').value = valorEditavel(item.tri3);
      const f = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
      tr.querySelector('[data-campo="f1"]').value = String(f[0] ?? 0);
      tr.querySelector('[data-campo="f2"]').value = String(f[1] ?? 0);
      tr.querySelector('[data-campo="f3"]').value = String(f[2] ?? 0);
      tr.querySelector(".celula-media").textContent = formatarNotaExibicao(media);
      const sit = tr.querySelector(".celula-situacao");
      sit.textContent = situacao;
      sit.className = "celula-situacao " + classe;
    } else {
      tr.innerHTML = `
        <td class="celula-disciplina"></td>
        <td class="celula-tri1"></td>
        <td class="celula-tri2"></td>
        <td class="celula-tri3"></td>
        <td class="celula-media"></td>
        <td class="celula-faltas"></td>
        <td class="celula-situacao"></td>
      `;
      tr.querySelector(".celula-disciplina").textContent = item.disciplina;
      tr.querySelector(".celula-tri1").textContent = formatarNotaExibicao(normalizarNota(item.tri1));
      tr.querySelector(".celula-tri2").textContent = formatarNotaExibicao(normalizarNota(item.tri2));
      tr.querySelector(".celula-tri3").textContent = formatarNotaExibicao(normalizarNota(item.tri3));
      tr.querySelector(".celula-media").textContent = formatarNotaExibicao(media);
      const f = Array.isArray(item.faltas) ? item.faltas : [0, 0, 0];
      tr.querySelector(".celula-faltas").textContent = `${f[0] ?? 0} / ${f[1] ?? 0} / ${f[2] ?? 0}`;
      const sit = tr.querySelector(".celula-situacao");
      sit.textContent = situacao;
      sit.className = "celula-situacao " + classe;
    }

    el.tabelaCorpo.appendChild(tr);
  });

  el.cardMediaGeral.textContent = qtdMedias > 0 ? formatarNotaExibicao(somaMedias / qtdMedias) : "—";
  el.cardTotalFaltas.textContent = String(totalFaltas);
  el.cardBomDesempenho.textContent = String(bom);
  el.cardAtencao.textContent = String(atencao);
}

function valorEditavel(v) {
  const n = normalizarNota(v);
  return n === null ? "" : String(n).replace(".", ",");
}

// ============================================================
// LOGIN POR PIN
// ============================================================
async function entrarComPin() {
  const pin = el.inputPin.value.trim();
  if (!pin) {
    el.loginStatus.textContent = "Digite o PIN.";
    el.loginStatus.className = "card-subtext msg-erro";
    return;
  }

  el.btnEntrar.disabled = true;
  el.loginStatus.textContent = "Conectando...";
  el.loginStatus.className = "card-subtext";

  try {
    const resp = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: pin
      })
    });

    if (resp.status === 401) {
      el.loginStatus.textContent = "Turma, chamada ou PIN inválidos.";
      el.loginStatus.className = "card-subtext msg-erro";
      el.btnEntrar.disabled = false;
      return;
    }
    if (resp.status === 429) {
      el.loginStatus.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      el.loginStatus.className = "card-subtext msg-erro";
      el.btnEntrar.disabled = false;
      return;
    }
    if (!resp.ok) {
      el.loginStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
      el.loginStatus.className = "card-subtext msg-erro";
      el.btnEntrar.disabled = false;
      return;
    }

    const json = await resp.json();

    // Guarda o PIN apenas em memória durante a sessão
    estado.pin = pin;
    estado.autenticado = true;

    // Regra: DADOS DA API > DADOS LOCAIS
    if (json && json.dados && Array.isArray(json.dados.disciplinas)) {
      estado.disciplinas = json.dados.disciplinas.map((d) => ({
        disciplina: String(d.disciplina ?? ""),
        tri1: d.tri1 ?? null,
        tri2: d.tri2 ?? null,
        tri3: d.tri3 ?? null,
        faltas: Array.isArray(d.faltas) ? d.faltas.slice(0, 3) : [0, 0, 0]
      }));
    } else {
      estado.disciplinas = clonarDadosLocais();
    }

    // Limpa o campo do PIN após sucesso
    el.inputPin.value = "";

    el.telaLogin.style.display = "none";
    el.conteudo.style.display = "block";
    el.statusGeral.textContent = "";
    el.statusGeral.className = "card-subtext";
    renderizarBoletim();
    atualizarGraficos();
  } catch (e) {
    el.loginStatus.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
    el.loginStatus.className = "card-subtext msg-erro";
    el.btnEntrar.disabled = false;
  }
}

// ============================================================
// EDIÇÃO
// ============================================================
function entrarEdicao() {
  estado.editando = true;
  el.btnAlterar.style.display = "none";
  el.btnSalvar.style.display = "inline-block";
  el.btnCancelar.style.display = "inline-block";
  el.statusGeral.textContent = "";
  el.statusGeral.className = "card-subtext";
  renderizarBoletim();
}

function cancelarEdicao() {
  estado.editando = false;
  el.btnAlterar.style.display = "inline-block";
  el.btnSalvar.style.display = "none";
  el.btnCancelar.style.display = "none";
  el.statusGeral.textContent = "";
  el.statusGeral.className = "card-subtext";
  renderizarBoletim();
}

// Validação ESTRITA da nota digitada (regra diferente dos dados antigos)
function validarNotaDigitada(texto) {
  const t = String(texto).trim();
  if (t === "") return { ok: true, valor: null };
  if (!/^\d+([.,]\d+)?$/.test(t)) return { ok: false };
  const num = Number(t.replace(",", "."));
  if (isNaN(num) || num < 0 || num > 10) return { ok: false };
  return { ok: true, valor: num };
}

function validarFaltaDigitada(texto) {
  const t = String(texto).trim();
  if (!/^\d+$/.test(t)) return { ok: false };
  const num = Number(t);
  if (!Number.isInteger(num) || num < 0) return { ok: false };
  return { ok: true, valor: num };
}

function limparErro(input) {
  input.classList.remove("campo-invalido");
}

async function salvarAlteracoes() {
  if (!estado.editando) return;

  const linhas = el.tabelaCorpo.querySelectorAll("tr");
  let temErro = false;
  const novasDisciplinas = [];

  linhas.forEach((tr) => {
    const idx = Number(tr.dataset.indice);
    const discOriginal = estado.disciplinas[idx].disciplina;

    const inT1 = tr.querySelector('[data-campo="tri1"]');
    const inT2 = tr.querySelector('[data-campo="tri2"]');
    const inT3 = tr.querySelector('[data-campo="tri3"]');
    const inF1 = tr.querySelector('[data-campo="f1"]');
    const inF2 = tr.querySelector('[data-campo="f2"]');
    const inF3 = tr.querySelector('[data-campo="f3"]');

    limparErro(inT1);
    limparErro(inT2);
    limparErro(inT3);
    limparErro(inF1);
    limparErro(inF2);
    limparErro(inF3);

    const vT1 = validarNotaDigitada(inT1.value);
    const vT2 = validarNotaDigitada(inT2.value);
    const vT3 = validarNotaDigitada(inT3.value);
    const vF1 = validarFaltaDigitada(inF1.value);
    const vF2 = validarFaltaDigitada(inF2.value);
    const vF3 = validarFaltaDigitada(inF3.value);

    if (!vT1.ok) { inT1.classList.add("campo-invalido"); temErro = true; }
    if (!vT2.ok) { inT2.classList.add("campo-invalido"); temErro = true; }
    if (!vT3.ok) { inT3.classList.add("campo-invalido"); temErro = true; }
    if (!vF1.ok) { inF1.classList.add("campo-invalido"); temErro = true; }
    if (!vF2.ok) { inF2.classList.add("campo-invalido"); temErro = true; }
    if (!vF3.ok) { inF3.classList.add("campo-invalido"); temErro = true; }

    if (!temErro) {
      novasDisciplinas.push({
        disciplina: discOriginal,
        tri1: vT1.valor,
        tri2: vT2.valor,
        tri3: vT3.valor,
        faltas: [vF1.valor, vF2.valor, vF3.valor]
      });
    }
  });

  if (temErro) {
    el.statusGeral.textContent = "Corrija os campos destacados em vermelho (notas 0 a 10, faltas inteiras ≥ 0).";
    el.statusGeral.className = "card-subtext msg-erro";
    return;
  }

  el.btnSalvar.disabled = true;
  el.btnCancelar.disabled = true;
  el.statusGeral.textContent = "Salvando alterações...";
  el.statusGeral.className = "card-subtext";

  try {
    const payload = {
      turma: CONFIG_ALUNO.turma,
      numero_chamada: CONFIG_ALUNO.numeroChamada,
      pin: estado.pin,
      dados: {
        disciplinas: novasDisciplinas
      }
    };

    const resp = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (resp.status === 401) {
      el.statusGeral.textContent = "Sessão expirada ou PIN incorreto. Faça login novamente.";
      el.statusGeral.className = "card-subtext msg-erro";
      el.btnSalvar.disabled = false;
      el.btnCancelar.disabled = false;
      return;
    }
    if (!resp.ok) {
      el.statusGeral.textContent = "Erro ao salvar no servidor. Tente novamente.";
      el.statusGeral.className = "card-subtext msg-erro";
      el.btnSalvar.disabled = false;
      el.btnCancelar.disabled = false;
      return;
    }

    estado.disciplinas = novasDisciplinas;
    estado.editando = false;

    el.btnAlterar.style.display = "inline-block";
    el.btnSalvar.style.display = "none";
    el.btnCancelar.style.display = "none";
    el.btnSalvar.disabled = false;
    el.btnCancelar.disabled = false;

    el.statusGeral.textContent = "Alterações salvas com sucesso!";
    el.statusGeral.className = "card-subtext msg-ok";

    renderizarBoletim();
    atualizarGraficos();
  } catch (e) {
    el.statusGeral.textContent = "Falha de conexão ao salvar. Tente novamente.";
    el.statusGeral.className = "card-subtext msg-erro";
    el.btnSalvar.disabled = false;
    el.btnCancelar.disabled = false;
  }
}

// ============================================================
// EVENT LISTENERS DO NÚCLEO
// ============================================================
el.btnEntrar.addEventListener("click", entrarComPin);
el.inputPin.addEventListener("keyup", (e) => {
  if (e.key === "Enter") entrarComPin();
});

el.btnAlterar.addEventListener("click", entrarEdicao);
el.btnCancelar.addEventListener("click", cancelarEdicao);
el.btnSalvar.addEventListener("click", salvarAlteracoes);

// ============================================================
// CAMADA EXCLUSIVA DOS GRÁFICOS (SOMENTE LEITURA)
// ============================================================
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

function atualizarGraficoMedias() {
  if (graficoMedias) {
    graficoMedias.destroy();
  }

  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas) return;

  const labels = estado.disciplinas.map((d) => d.disciplina);
  const data = estado.disciplinas.map((d) => {
    const m = calcularMedia(d);
    return m !== null ? Number(m.toFixed(1)) : null;
  });

  const ctx = canvas.getContext("2d");
  graficoMedias = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Média",
          data: data,
          backgroundColor: "#00b4d8",
          borderRadius: 4
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.raw;
              if (val === null || val === undefined) return " Sem nota";
              return ` Média: ${Number(val).toFixed(1).replace(".", ",")}`;
            }
          }
        }
      },
      scales: {
        x: {
          min: 0,
          max: 10,
          grid: { color: "#29292e" },
          ticks: { color: "#a8a8b3" }
        },
        y: {
          grid: { display: false },
          ticks: { color: "#e1e1e6", font: { size: 11 } }
        }
      }
    }
  });
}

function atualizarGraficoEvolucao() {
  if (graficoEvolucao) {
    graficoEvolucao.destroy();
  }

  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas) return;

  function calcularMediaGeralTrimestre(chaveTri) {
    let soma = 0;
    let count = 0;
    estado.disciplinas.forEach((d) => {
      const nota = normalizarNota(d[chaveTri]);
      if (nota !== null) {
        soma += nota;
        count++;
      }
    });
    return count > 0 ? Number((soma / count).toFixed(1)) : null;
  }

  const m1 = calcularMediaGeralTrimestre("tri1");
  const m2 = calcularMediaGeralTrimestre("tri2");
  const m3 = calcularMediaGeralTrimestre("tri3");

  const ctx = canvas.getContext("2d");
  graficoEvolucao = new Chart(ctx, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [
        {
          label: "Média Geral",
          data: [m1, m2, m3],
          borderColor: "#00f5d4",
          backgroundColor: "rgba(0, 245, 212, 0.1)",
          borderWidth: 3,
          pointBackgroundColor: "#00f5d4",
          pointRadius: 6,
          fill: true,
          tension: 0.2,
          spanGaps: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.raw;
              if (val === null || val === undefined) return " Sem notas";
              return ` Média Geral: ${Number(val).toFixed(1).replace(".", ",")}`;
            }
          }
        }
      },
      scales: {
        y: {
          min: 0,
          max: 10,
          grid: { color: "#29292e" },
          ticks: { color: "#a8a8b3" }
        },
        x: {
          grid: { color: "#29292e" },
          ticks: { color: "#e1e1e6" }
        }
      }
    }
  });
}

function atualizarGraficoFaltas() {
  if (graficoFaltas) {
    graficoFaltas.destroy();
  }

  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas) return;

  let faltasTri1 = 0;
  let faltasTri2 = 0;
  let faltasTri3 = 0;

  estado.disciplinas.forEach((d) => {
    if (Array.isArray(d.faltas)) {
      faltasTri1 += Number(d.faltas[0]) || 0;
      faltasTri2 += Number(d.faltas[1]) || 0;
      faltasTri3 += Number(d.faltas[2]) || 0;
    }
  });

  const totalFaltasInterno = faltasTri1 + faltasTri2 + faltasTri3;
  const LIMITE_REFERENCIA_INTERNO = 350;

  const cardFaltas = document.getElementById("cardFaltas");
  const estadoFaltas = document.getElementById("estadoFaltas");

  if (totalFaltasInterno >= LIMITE_REFERENCIA_INTERNO) {
    if (estadoFaltas) estadoFaltas.innerHTML = '<span class="badge-perigo">Perigo</span>';
    if (cardFaltas) cardFaltas.classList.add("card-perigo");
  } else {
    if (estadoFaltas) estadoFaltas.innerHTML = "";
    if (cardFaltas) cardFaltas.classList.remove("card-perigo");
  }

  const ctx = canvas.getContext("2d");
  graficoFaltas = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [
        {
          label: "Faltas",
          data: [faltasTri1, faltasTri2, faltasTri3],
          backgroundColor: "#ff5555",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return ` ${context.label}: ${context.raw} faltas`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: "#29292e" },
          ticks: { color: "#a8a8b3", precision: 0 }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#e1e1e6" }
        }
      }
    }
  });
}

function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}