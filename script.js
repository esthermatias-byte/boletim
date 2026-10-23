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

  linhas.forEach((tr, i) => {
    const itemOriginal = estado.disciplinas[i];
    if (!itemOriginal) return;

    const camposNota = ["tri1", "tri2", "tri3"];
    const camposFalta = ["f1", "f2", "f3"];
    const nova = { ...itemOriginal, faltas: [0, 0, 0] };

    camposNota.forEach((campo) => {
      const input = tr.querySelector(`[data-campo="${campo}"]`);
      limparErro(input);
      const r = validarNotaDigitada(input.value);
      if (!r.ok) {
        input.classList.add("campo-invalido");
        temErro = true;
      } else {
        nova[campo] = r.valor;
      }
    });

    const faltas = [0, 0, 0];
    camposFalta.forEach((campo, idx) => {
      const input = tr.querySelector(`[data-campo="${campo}"]`);
      limparErro(input);
      const r = validarFaltaDigitada(input.value);
      if (!r.ok) {
        input.classList.add("campo-invalido");
        temErro = true;
      } else {
        faltas[idx] = r.valor;
      }
    });
    nova.faltas = faltas;

    novasDisciplinas.push(nova);
  });

  if (temErro) {
    el.statusGeral.textContent = "Há campos inválidos. Corrija os destaques em vermelho antes de salvar.";
    el.statusGeral.className = "card-subtext msg-erro";
    return;
  }

  el.btnSalvar.disabled = true;
  el.statusGeral.textContent = "Salvando...";
  el.statusGeral.className = "card-subtext";

  try {
    const resp = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        turma: CONFIG_ALUNO.turma,
        numero_chamada: CONFIG_ALUNO.numeroChamada,
        pin: estado.pin,
        dados: { disciplinas: novasDisciplinas }
      })
    });

    if (resp.status === 401) {
      el.statusGeral.textContent = "Sessão inválida. Entre novamente.";
      el.statusGeral.className = "card-subtext msg-erro";
      el.btnSalvar.disabled = false;
      return;
    }
    if (resp.status === 429) {
      el.statusGeral.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
      el.statusGeral.className = "card-subtext msg-erro";
      el.btnSalvar.disabled = false;
      return;
    }
    if (!resp.ok) {
      el.statusGeral.textContent = "Não foi possível salvar. Tente novamente.";
      el.statusGeral.className = "card-subtext msg-erro";
      el.btnSalvar.disabled = false;
      return;
    }

    estado.disciplinas = novasDisciplinas;
    estado.editando = false;
    el.btnSalvar.disabled = false;
    el.btnSalvar.style.display = "none";
    el.btnCancelar.style.display = "none";
    el.btnAlterar.style.display = "inline-block";

    el.statusGeral.textContent = "Dados salvos com sucesso.";
    el.statusGeral.className = "card-subtext msg-ok";

    renderizarBoletim();
  } catch (e) {
    el.statusGeral.textContent = "Não foi possível salvar. Tente novamente.";
    el.statusGeral.className = "card-subtext msg-erro";
    el.btnSalvar.disabled = false;
  }
}

// ============================================================
// EVENTOS
// ============================================================
el.btnEntrar.addEventListener("click", entrarComPin);
el.inputPin.addEventListener("keydown", (e) => {
  if (e.key === "Enter") entrarComPin();
});
el.btnAlterar.addEventListener("click", entrarEdicao);
el.btnCancelar.addEventListener("click", cancelarEdicao);
el.btnSalvar.addEventListener("click", salvarAlteracoes);

// Recalcula a média em tempo real enquanto edita
el.tabelaCorpo.addEventListener("input", (e) => {
  if (!estado.editando) return;
  if (!e.target.matches("input.nota-input")) return;
  const tr = e.target.closest("tr");
  const i = Number(tr.dataset.indice);
  if (Number.isNaN(i)) return;
  const r1 = validarNotaDigitada(tr.querySelector('[data-campo="tri1"]').value);
  const r2 = validarNotaDigitada(tr.querySelector('[data-campo="tri2"]').value);
  const r3 = validarNotaDigitada(tr.querySelector('[data-campo="tri3"]').value);
  const validas = [r1, r2, r3].filter((r) => r.ok && r.valor !== null).map((r) => r.valor);
  const media = validas.length ? validas.reduce((a, b) => a + b, 0) / validas.length : null;
  tr.querySelector(".celula-media").textContent = formatarNotaExibicao(media);
});