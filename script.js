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
  return item.faltas.reduce((a, b) => a + (Number(b) || 0),