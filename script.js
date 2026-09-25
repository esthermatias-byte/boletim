// CONCEITO: ARRAY DE OBJETOS
// Um ARRAY é uma lista ordenada de elementos.
// Um OBJETO é um conjunto de propriedades que representam uma entidade (aqui, uma disciplina).
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

// CONCEITO: FUNÇÃO
// Bloco de código reutilizável que executa uma tarefa específica.
// Normaliza valores de entrada para a escala de 0 a 10.
function normalizarNota(valor) {
  // CONCEITO: IF / ESTRUTURA CONDICIONAL
  // Avalia se uma condição é verdadeira ou falsa para decidir o fluxo do código.
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  let num = valor;
  if (typeof num === "string") {
    num = num.replace(",", ".");
  }
  num = Number(num);

  if (isNaN(num)) {
    return null;
  }

  if (num >= 0 && num <= 10) {
    return num;
  } else if (num > 10 && num <= 100) {
    return num / 10;
  } else {
    return null; // Inválido
  }
}

// FORMATADOR DE NOTAS PARA EXIBIÇÃO
function formatarNotaExibicao(nota) {
  if (nota === null) return "—";
  return nota.toFixed(1).replace(".", ",");
}

// INICIALIZAÇÃO E MANIPULAÇÃO DO DOM
// CONCEITO: DOM (Document Object Model)
// É a representação em código da página HTML, permitindo alterar textos, tabelas e estilos via JavaScript.
function renderizarBoletim() {
  const tabelaCorpo = document.getElementById("tabela-corpo");
  tabelaCorpo.innerHTML = "";

  // CONCEITO: VARIÁVEL
  // Espaço na memória para guardar dados que podem ser lidos ou alterados durante o código.
  let somaMediasGerais = 0;
  let qtdDisciplinasComMedia = 0;
  let totalFaltasGeral = 0;
  let contBomDesempenho = 0;
  let contAtencao = 0;

  // CONCEITO: FOREACH
  // Método que percorre cada item de um ARRAY automaticamente.
  dadosBrutos.forEach((item) => {
    // Normalização das notas
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // Cálculo da média
    const notasValidas = [n1, n2, n3].filter((n) => n !== null);
    let media = null;
    let situacao = "Nota ainda não disponível";
    let classeStatus = "status-indisponivel";

    if (notasValidas.length > 0) {
      const soma = notasValidas.reduce((acc, curr) => acc + curr, 0);
      media = soma / notasValidas.length;
      somaMediasGerais += media;
      qtdDisciplinasComMedia++;

      if (media >= 6.0) {
        situacao = "Bom desempenho";
        classeStatus = "status-bom";
        contBomDesempenho++;
      } else {
        situacao = "Atenção";
        classeStatus = "status-atencao";
        contAtencao++;
      }
    }

    // Soma das faltas
    const totalFaltasDisciplina = item.faltas.reduce((acc, curr) => acc + curr, 0);
    totalFaltasGeral += totalFaltasDisciplina;

    // Criar linha da tabela no DOM
    const tr = document.createElement("tr");
    tr.innerHTML = `