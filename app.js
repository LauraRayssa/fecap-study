/* ============================================================================
   FecapStudy — Oficina PBL (Aula 9) — POO em JavaScript
   Missões 1 a 8: domínio | Missão 9: tela | Missão 10: integração com o Backend
   ============================================================================ */
"use strict";

/* ---------------------------------------------------------------------------
   MISSÃO 1 — Abstração, Classes e Objetos
   --------------------------------------------------------------------------- */
class Disciplina {
  #codigo;
  #nome;
  #categoria;
  #cargaHorariaSemanalHoras;

  constructor(codigo, nome, categoria, cargaHorariaSemanalHoras) {
    this.#codigo = codigo;
    this.#nome = nome;
    this.#categoria = categoria;
    const horas = Math.trunc(Number(cargaHorariaSemanalHoras));
    // Regra: carga <= 0 (ou inválida) assume o padrão de 2 horas
    this.#cargaHorariaSemanalHoras = Number.isFinite(horas) && horas > 0 ? horas : 2;
  }

  getCodigo() { return this.#codigo; }
  getNome() { return this.#nome; }
  getCategoria() { return this.#categoria; }
  getCargaHorariaSemanalHoras() { return this.#cargaHorariaSemanalHoras; }

  calcularCargaEmMinutos() {
    return this.#cargaHorariaSemanalHoras * 60;
  }

  exibirResumo() {
    return `[${this.#codigo}] ${this.#nome} (${this.#categoria}) — ` +
           `${this.#cargaHorariaSemanalHoras}h/semana (${this.calcularCargaEmMinutos()} min)`;
  }
}

/* ---------------------------------------------------------------------------
   MISSÃO 6 (parte 1) — Interface IExportavelJson (contrato em JS = duck typing)
   Declarada aqui em cima porque MetaEstudo e SessaoEstudo a utilizam.
   --------------------------------------------------------------------------- */
function verificarExportavelJson(obj) {
  if (!obj || typeof obj.paraJson !== "function") {
    throw new TypeError("O objeto não cumpre o contrato IExportavelJson (falta paraJson()).");
  }
  return obj;
}

/* ---------------------------------------------------------------------------
   MISSÃO 2 — Encapsulamento (MetaEstudo)
   --------------------------------------------------------------------------- */
class MetaEstudo {                         // implementa IExportavelJson
  #metaMinutosSemana = 0;
  #minutosCumpridos = 0;                   // sempre começa em 0 e NÃO tem setter

  constructor(metaMinutosSemana) {
    this.redefinirMeta(metaMinutosSemana); // reaproveita a validação
  }

  /** Única porta de entrada para somar minutos. Devolve false se recusar. */
  registrarAvanco(minutos) {
    if (!Number.isInteger(minutos)) return false;
    if (minutos <= 0) return false;
    if (minutos > 480) return false;       // 8h numa sessão = provável erro de digitação
    this.#minutosCumpridos += minutos;
    return true;
  }

  /** Usado pelo Responsável. Meta sempre entre 30 e 3000 minutos. */
  redefinirMeta(novaMeta) {
    let valor = Math.trunc(Number(novaMeta));
    if (!Number.isFinite(valor) || valor < 30) valor = 30;
    if (valor > 3000) valor = 3000;
    this.#metaMinutosSemana = valor;
  }

  getMetaMinutosSemana() { return this.#metaMinutosSemana; }
  getMinutosCumpridos() { return this.#minutosCumpridos; }

  calcularPercentual() {
    const pct = (this.#minutosCumpridos / this.#metaMinutosSemana) * 100;
    return Math.min(100.0, pct);           // trava em 100 mesmo estudando além da meta
  }

  estaCumprida() {
    return this.#minutosCumpridos >= this.#metaMinutosSemana;
  }

  paraJson() {
    return JSON.stringify({
      metaMinutosSemana: this.#metaMinutosSemana,
      minutosCumpridos: this.#minutosCumpridos,
      percentual: Number(this.calcularPercentual().toFixed(1))
    });
  }
}

/* ---------------------------------------------------------------------------
   MISSÃO 4 — Classe abstrata SessaoEstudo + Polimorfismo Dinâmico
   (declarada antes de Discente, que a usa na Missão 5)
   --------------------------------------------------------------------------- */
class SessaoEstudo {                       // implementa IExportavelJson
  #disciplina;
  #duracaoMinutos;

  constructor(disciplina, duracaoMinutos) {
    if (new.target === SessaoEstudo) throw new Error("SessaoEstudo é abstrata!");
    if (!(disciplina instanceof Disciplina)) throw new TypeError("Informe uma Disciplina válida.");
    this.#disciplina = disciplina;
    this.#duracaoMinutos = duracaoMinutos;
  }

  getDisciplina() { return this.#disciplina; }
  getDuracaoMinutos() { return this.#duracaoMinutos; }

  // ---- métodos abstratos ----
  obterModalidade() { throw new Error("Método abstrato: obterModalidade()"); }
  calcularXp() { throw new Error("Método abstrato: calcularXp()"); }

  // ---- método virtual (pode ser sobrescrito) ----
  gerarFeedback() {
    return `${this.obterModalidade()} em ${this.#disciplina.getNome()} ` +
           `(${this.#duracaoMinutos} min) -> +${this.calcularXp()} XP`;
  }

  paraJson() {
    return JSON.stringify({
      disciplina: this.#disciplina.getNome(),
      tipoModalidade: this.obterModalidade(),
      duracaoMinutos: this.#duracaoMinutos,
      xpGanho: this.calcularXp(),
      resumoFeedback: this.gerarFeedback()
    });
  }
}

class SessaoPomodoro extends SessaoEstudo {
  #ciclosCompletos;

  constructor(disciplina, duracaoMinutos, ciclosCompletos) {
    super(disciplina, duracaoMinutos);
    this.#ciclosCompletos = Math.max(0, Math.trunc(ciclosCompletos) || 0);
  }

  getCiclosCompletos() { return this.#ciclosCompletos; }
  obterModalidade() { return "Pomodoro"; }
  calcularXp() { return this.getDuracaoMinutos() * 2 + this.#ciclosCompletos * 15; }

  gerarFeedback() {
    return `${super.gerarFeedback()} | ${this.#ciclosCompletos} ciclo(s) concluído(s)`;
  }
}

class SessaoExercicios extends SessaoEstudo {
  #totalQuestoes;
  #acertos;

  constructor(disciplina, duracaoMinutos, totalQuestoes, acertos) {
    super(disciplina, duracaoMinutos);
    const total = Math.max(0, Math.trunc(totalQuestoes) || 0);
    const certas = Math.max(0, Math.trunc(acertos) || 0);
    if (certas > total) throw new RangeError("Os acertos não podem passar do total de questões.");
    this.#totalQuestoes = total;
    this.#acertos = certas;
  }

  getTotalQuestoes() { return this.#totalQuestoes; }
  getAcertos() { return this.#acertos; }
  obterModalidade() { return "Exercicios"; }
  calcularXp() { return this.getDuracaoMinutos() + this.#acertos * 10; }

  calcularPercentualAcerto() {
    return this.#totalQuestoes === 0 ? 0 : (this.#acertos / this.#totalQuestoes) * 100;
  }

  gerarFeedback() {
    return `${super.gerarFeedback()} | acertou ${this.#acertos}/${this.#totalQuestoes} ` +
           `(${this.calcularPercentualAcerto().toFixed(0)}%)`;
  }
}

class SessaoLeitura extends SessaoEstudo {
  #paginasLidas;
  #fezResumo;

  constructor(disciplina, duracaoMinutos, paginasLidas, fezResumo) {
    super(disciplina, duracaoMinutos);
    this.#paginasLidas = Math.max(0, Math.trunc(paginasLidas) || 0);
    this.#fezResumo = Boolean(fezResumo);
  }

  getPaginasLidas() { return this.#paginasLidas; }
  getFezResumo() { return this.#fezResumo; }
  obterModalidade() { return "Leitura"; }

  calcularXp() {
    return this.getDuracaoMinutos() + this.#paginasLidas * 3 + (this.#fezResumo ? 25 : 0);
  }

  gerarFeedback() {
    return `${super.gerarFeedback()} | ${this.#paginasLidas} página(s)` +
           `${this.#fezResumo ? " + resumo" : ""}`;
  }
}

/* ---------------------------------------------------------------------------
   MISSÃO 3 — Classe Abstrata e Herança (Usuario e os 3 perfis)
   MISSÃO 5 — Polimorfismo Estático (sobrecarga de registrarEstudo em Discente)
   MISSÃO 7 — Associação (Responsavel ——> Discente)
   --------------------------------------------------------------------------- */
class Usuario {
  #id;
  #nome;
  #email;
  #senha;                                  // dado privado: NÃO existe getter para ela

  constructor(id, nome, email, senha) {
    if (new.target === Usuario) throw new Error("Usuario é uma classe abstrata!");
    this.#id = id;
    this.#nome = nome;
    this.#email = email;
    this.#senha = senha;
  }

  getId() { return this.#id; }
  getNome() { return this.#nome; }
  getEmail() { return this.#email; }

  autenticar(senhaDigitada) {
    return senhaDigitada === this.#senha;
  }

  // ---- métodos abstratos ----
  obterTipoPerfil() { throw new Error("Método abstrato: obterTipoPerfil()"); }
  gerarPainelResumo() { throw new Error("Método abstrato: gerarPainelResumo()"); }
}

class Administrador extends Usuario {
  #cargo;

  constructor(id, nome, email, senha, cargo) {
    super(id, nome, email, senha);
    this.#cargo = cargo;
  }

  getCargo() { return this.#cargo; }
  obterTipoPerfil() { return "Administrador"; }
  gerarPainelResumo() { return `Administrador ${this.getNome()} — ${this.#cargo}`; }
}

class Responsavel extends Usuario {
  #parentesco;
  #discentesAcompanhados = [];             // Associação: os Discentes existem fora daqui
  #metas = new Map();                      // id do discente -> MetaEstudo

  constructor(id, nome, email, senha, parentesco) {
    super(id, nome, email, senha);
    this.#parentesco = parentesco;
  }

  getParentesco() { return this.#parentesco; }
  obterTipoPerfil() { return "Responsável"; }

  /** Recebe um Discente criado fora da classe. Não duplica. */
  vincularDiscente(discente, meta = null) {
    if (!(discente instanceof Discente)) throw new TypeError("Informe um Discente.");
    if (this.#discentesAcompanhados.includes(discente)) return false;
    this.#discentesAcompanhados.push(discente);
    if (meta) this.#metas.set(discente.getId(), meta);
    return true;
  }

  getDiscentesAcompanhados() { return [...this.#discentesAcompanhados]; }
  getMeta(discente) { return this.#metas.get(discente.getId()) ?? null; }

  gerarPainelResumo() {
    return `Responsável ${this.getNome()} (${this.#parentesco}) — acompanhando ` +
           `${this.#discentesAcompanhados.length} discente(s)`;
  }
}

class Discente extends Usuario {
  #ra;
  #xpTotal = 0;
  #historico = [];

  constructor(id, nome, email, senha, ra) {
    super(id, nome, email, senha);
    this.#ra = ra;
  }

  getRa() { return this.#ra; }
  getXpTotal() { return this.#xpTotal; }
  getHistorico() { return [...this.#historico]; }   // cópia: a lista interna não vaza

  adicionarXp(pontos) {
    if (Number.isFinite(pontos) && pontos > 0) this.#xpTotal += pontos;
  }

  obterTipoPerfil() { return "Discente"; }
  gerarPainelResumo() {
    return `Discente ${this.getNome()} — RA ${this.#ra} — ${this.#xpTotal} XP`;
  }

  /**
   * Polimorfismo estático (sobrecarga). JS não tem métodos com o mesmo nome,
   * então um único método trata as 3 assinaturas:
   *   Forma 1: registrarEstudo(sessao)
   *   Forma 2: registrarEstudo(disciplina, minutos)
   *   Forma 3: registrarEstudo(disciplina, horaInicio, horaFim, paginasLidas)
   */
  registrarEstudo(arg1, arg2, arg3, arg4) {
    // Forma 1
    if (arg1 instanceof SessaoEstudo) {
      this.#historico.push(arg1);
      this.adicionarXp(arg1.calcularXp());
      return arg1;
    }
    // Forma 2 — atalho rápido (Pomodoro padrão)
    if (arg1 instanceof Disciplina && arg3 === undefined) {
      const minutos = arg2;
      const ciclos = Math.max(1, Math.floor(minutos / 25));
      return this.registrarEstudo(new SessaoPomodoro(arg1, minutos, ciclos));
    }
    // Forma 3 — por horário (Leitura com resumo)
    if (arg1 instanceof Disciplina && arg3 !== undefined) {
      const minutos = (arg3 - arg2) * 60;
      if (!(minutos > 0)) throw new RangeError("A hora final precisa ser maior que a inicial.");
      return this.registrarEstudo(new SessaoLeitura(arg1, minutos, arg4, true));
    }
    throw new TypeError("Assinatura inválida para registrarEstudo().");
  }
}

/* ---------------------------------------------------------------------------
   MISSÃO 6 (parte 2) — Interface INotificador (contrato em JS = duck typing)
   --------------------------------------------------------------------------- */
function verificarNotificador(obj) {
  if (!obj || typeof obj.obterCanal !== "function" || typeof obj.enviarAlerta !== "function") {
    throw new TypeError("O objeto não cumpre o contrato INotificador (obterCanal/enviarAlerta).");
  }
  return obj;
}

// Cada notificador recebe um callback "aoEnviar" (a tela usa para mostrar o toast).
const saidaPadrao = (canal, destinatario, mensagem) =>
  console.log(`[${canal}] para ${destinatario}: ${mensagem}`);

class NotificadorEmail {
  #aoEnviar;
  constructor(aoEnviar = saidaPadrao) { this.#aoEnviar = aoEnviar; }
  obterCanal() { return "E-mail"; }
  enviarAlerta(destinatario, mensagem) {
    if (!destinatario || !mensagem) return false;
    this.#aoEnviar(this.obterCanal(), destinatario, mensagem);
    return true;
  }
}

class NotificadorWhatsApp {
  #aoEnviar;
  constructor(aoEnviar = saidaPadrao) { this.#aoEnviar = aoEnviar; }
  obterCanal() { return "WhatsApp"; }
  enviarAlerta(destinatario, mensagem) {
    if (!destinatario || !mensagem) return false;
    this.#aoEnviar(this.obterCanal(), destinatario, mensagem);
    return true;
  }
}

class NotificadorPainel {
  #aoEnviar;
  constructor(aoEnviar = saidaPadrao) { this.#aoEnviar = aoEnviar; }
  obterCanal() { return "Painel"; }
  enviarAlerta(destinatario, mensagem) {
    if (!destinatario || !mensagem) return false;
    this.#aoEnviar(this.obterCanal(), destinatario, mensagem);
    return true;
  }
}

/* ---------------------------------------------------------------------------
   MISSÃO 7 — Agregação (TrilhaEstudo ◇── Disciplina)
   --------------------------------------------------------------------------- */
class TrilhaEstudo {
  #titulo;
  #administrador;                          // Associação
  #disciplinas = [];                       // Agregação: as disciplinas vêm prontas de fora

  constructor(titulo, administrador) {
    if (!(administrador instanceof Administrador)) throw new TypeError("Informe um Administrador.");
    this.#titulo = titulo;
    this.#administrador = administrador;
  }

  getTitulo() { return this.#titulo; }
  getAdministrador() { return this.#administrador; }
  getDisciplinas() { return [...this.#disciplinas]; }

  adicionarDisciplina(disciplina) {
    if (!(disciplina instanceof Disciplina)) throw new TypeError("Informe uma Disciplina.");
    if (this.#disciplinas.includes(disciplina)) return false;
    this.#disciplinas.push(disciplina);
    return true;
  }

  calcularCargaHorariaTotal() {
    return this.#disciplinas.reduce((soma, d) => soma + d.getCargaHorariaSemanalHoras(), 0);
  }
}

/* ---------------------------------------------------------------------------
   MISSÃO 8 — Composição (PlanoEstudo ◆── ItemCronograma) e
              Dependência (ServicoAlertaResponsavel - - -> ...)
   --------------------------------------------------------------------------- */
class ItemCronograma {                     // só o PlanoEstudo cria objetos desta classe
  #diaSemana;
  #minutosPlanejados;

  constructor(diaSemana, minutosPlanejados) {
    this.#diaSemana = diaSemana;
    this.#minutosPlanejados = minutosPlanejados;
  }

  getDiaSemana() { return this.#diaSemana; }
  getMinutosPlanejados() { return this.#minutosPlanejados; }
  descrever() { return `${this.#diaSemana}: ${this.#minutosPlanejados} min`; }
}

class PlanoEstudo {
  #itens = [];

  /** Recebe dados primitivos e faz o "new" aqui dentro (Composição). */
  adicionarItem(diaSemana, minutos) {
    if (!diaSemana || !Number.isInteger(minutos) || minutos <= 0) return false;
    this.#itens.push(new ItemCronograma(diaSemana, minutos));
    return true;
  }

  /** Devolve só texto: nenhuma referência aos ItemCronograma sai da classe. */
  listarResumo() { return this.#itens.map(item => item.descrever()); }

  calcularMinutosPlanejados() {
    return this.#itens.reduce((soma, item) => soma + item.getMinutosPlanejados(), 0);
  }
}

class ServicoAlertaResponsavel {           // sem campos de instância
  /** Dependência: tudo chega por parâmetro e nada é guardado. */
  avaliarDiscente(discente, meta, responsavel, notificador) {
    verificarNotificador(notificador);
    const percentual = meta.calcularPercentual();
    const mensagem = meta.estaCumprida()
      ? `Parabéns! ${discente.getNome()} atingiu 100% da meta semanal.`
      : `${discente.getNome()} está com ${percentual.toFixed(0)}% da meta semanal.`;
    return notificador.enviarAlerta(responsavel.getEmail(), mensagem);
  }
}

/* ---------------------------------------------------------------------------
   MISSÃO 10 — Cliente do Backend (Dependência: a tela depende desta classe)
   --------------------------------------------------------------------------- */
class ClienteBackendEstudo {
  #urlBase;

  constructor(urlBase = "http://localhost:5080") { this.#urlBase = urlBase; }

  async #requisitar(caminho, opcoes) {
    const resposta = await fetch(`${this.#urlBase}${caminho}`, opcoes);
    if (!resposta.ok) {
      let detalhe = "";
      try { detalhe = (await resposta.json()).erro ?? ""; } catch { /* sem corpo JSON */ }
      throw new Error(`Backend respondeu ${resposta.status}. ${detalhe}`.trim());
    }
    return resposta.json();
  }

  #post(caminho, corpo) {
    return this.#requisitar(caminho, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo)
    });
  }

  obterStatus() { return this.#requisitar("/api/status"); }

  listarSessoes(nomeDiscente = "") {
    const filtro = nomeDiscente ? `?discente=${encodeURIComponent(nomeDiscente)}` : "";
    return this.#requisitar(`/api/sessoes${filtro}`);
  }

  obterRelatorio(nomeDiscente) {
    return this.#requisitar(`/api/relatorio/${encodeURIComponent(nomeDiscente)}`);
  }

  /** Usa o ParaJson() da própria sessão (IExportavelJson) e acrescenta o nome do aluno. */
  salvarSessao(nomeDiscente, sessao) {
    const dados = JSON.parse(verificarExportavelJson(sessao).paraJson());
    return this.#post("/api/sessoes", { discenteNome: nomeDiscente, ...dados });
  }

  salvarMeta(nomeDiscente, nomeResponsavel, meta) {
    return this.#post("/api/metas", {
      discenteNome: nomeDiscente,
      responsavelNome: nomeResponsavel,
      metaMinutosSemana: meta.getMetaMinutosSemana(),
      minutosCumpridos: meta.getMinutosCumpridos()
    });
  }
}

/* ---------------------------------------------------------------------------
   Cenário inicial (os mesmos nomes do banco de demonstração do Backend)
   --------------------------------------------------------------------------- */
function montarCenario() {
  const catalogo = [
    new Disciplina("ADS201", "Programação Orientada a Objetos", "Computação", 4),
    new Disciplina("ADS202", "Banco de Dados e Modelagem SQL", "Dados", 4),
    new Disciplina("ADS203", "Projeto Interdisciplinar (PI)", "Prática", 6)
  ];

  const admin = new Administrador(1, "Profa. Helena (Coordenação)", "helena@fecap.br", "admin123", "Coordenação PI");
  const responsavel = new Responsavel(2, "Carlos Silva (Pai do Lucas)", "carlos@email.com", "resp123", "Pai");
  const lucas = new Discente(3, "Lucas Silva", "lucas.silva@edu.fecap.br", "lucas123", "RA-2026101");
  const mariana = new Discente(4, "Mariana Costa", "mariana.costa@edu.fecap.br", "mari123", "RA-2026102");

  const metaLucas = new MetaEstudo(180);
  const metaMariana = new MetaEstudo(240);
  responsavel.vincularDiscente(lucas, metaLucas);
  responsavel.vincularDiscente(mariana, metaMariana);

  const trilha = new TrilhaEstudo("Trilha 2º Semestre ADS", admin);
  catalogo.forEach(d => trilha.adicionarDisciplina(d));

  const planos = new Map([[lucas.getId(), new PlanoEstudo()], [mariana.getId(), new PlanoEstudo()]]);

  return { catalogo, admin, responsavel, discentes: [lucas, mariana], trilha, planos };
}

/* ===========================================================================
   MISSÃO 9 e 10 — TELA (só roda no navegador)
   A tela NÃO calcula XP nem percentual: ela só lê os campos, instancia a
   subclasse correta e pede para os objetos fazerem as contas.
   =========================================================================== */
if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    const cenario = montarCenario();
    const cliente = new ClienteBackendEstudo();
    const $ = id => document.getElementById(id);
    let discenteAtivo = cenario.discentes[0];

    // ---------- utilidades de tela ----------
    function toast(texto, tipo = "info") {
      const t = document.createElement("div");
      t.className = `toast ${tipo}`;
      t.textContent = texto;
      $("toasts").appendChild(t);
      setTimeout(() => t.remove(), 4500);
    }

    function limpar(elemento) { elemento.replaceChildren(); }

    function itemLista(texto, classe = "") {
      const li = document.createElement("li");
      li.textContent = texto;
      if (classe) li.className = classe;
      return li;
    }

    const metaAtiva = () => cenario.responsavel.getMeta(discenteAtivo);
    const planoAtivo = () => cenario.planos.get(discenteAtivo.getId());

    // ---------- notificadores (Interface INotificador) ----------
    const exibirAlerta = (canal, destinatario, mensagem) =>
      toast(`[${canal}] para ${destinatario}: ${mensagem}`, "ok");

    const notificadores = {
      email: new NotificadorEmail(exibirAlerta),
      whatsapp: new NotificadorWhatsApp(exibirAlerta),
      painel: new NotificadorPainel(exibirAlerta)
    };
    const servicoAlerta = new ServicoAlertaResponsavel();

    // ---------- renderização ----------
    function renderPerfis() {
      $("painelDiscente").textContent = discenteAtivo.gerarPainelResumo();       // polimorfismo
      $("painelResponsavel").textContent = cenario.responsavel.gerarPainelResumo();
      $("painelAdmin").textContent = cenario.admin.gerarPainelResumo();
    }

    function renderMeta() {
      const meta = metaAtiva();
      const pct = meta.calcularPercentual();
      $("barraPreenchida").style.width = `${pct}%`;
      $("barra").setAttribute("aria-valuenow", pct.toFixed(0));
      $("barraTexto").textContent =
        `${meta.getMinutosCumpridos()} / ${meta.getMetaMinutosSemana()} min (${pct.toFixed(0)}%)` +
        (meta.estaCumprida() ? " — meta cumprida! 🎉" : "");
      $("inpMeta").value = meta.getMetaMinutosSemana();
    }

    function renderHistorico() {
      const lista = $("listaHistorico");
      limpar(lista);
      const historico = discenteAtivo.getHistorico().reverse();
      if (historico.length === 0) lista.appendChild(itemLista("Nenhuma sessão registrada ainda.", "vazio"));
      historico.forEach(s => lista.appendChild(itemLista(s.gerarFeedback())));
    }

    function renderPlano() {
      const plano = planoAtivo();
      const lista = $("listaPlano");
      limpar(lista);
      const itens = plano.listarResumo();
      if (itens.length === 0) lista.appendChild(itemLista("Nenhum horário planejado.", "vazio"));
      itens.forEach(texto => lista.appendChild(itemLista(texto)));
      $("totalPlano").textContent = `Total planejado: ${plano.calcularMinutosPlanejados()} min`;
    }

    function renderTrilha() {
      const t = cenario.trilha;
      $("trilhaTitulo").textContent = `${t.getTitulo()} — carga total: ${t.calcularCargaHorariaTotal()}h/semana`;
      const lista = $("listaTrilha");
      limpar(lista);
      t.getDisciplinas().forEach(d => lista.appendChild(itemLista(d.exibirResumo())));
    }

    function renderTudo() {
      renderPerfis();
      renderMeta();
      renderHistorico();
      renderPlano();
      limpar($("listaServidor"));
      $("relatorio").hidden = true;
    }

    async function atualizarStatusBackend() {
      const pill = $("pillBackend");
      try {
        const s = await cliente.obterStatus();
        pill.textContent = `Backend online · ${s.usandoMySql ? "MySQL" : "JSON local"}`;
        pill.className = "pill on";
      } catch {
        pill.textContent = "Backend offline";
        pill.className = "pill off";
      }
    }

    // ---------- formulário de nova sessão ----------
    function preencherDisciplinas() {
      const sel = $("selDisciplina");
      cenario.catalogo.forEach((d, i) => {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = d.getNome();
        sel.appendChild(opt);
      });
    }

    function preencherDiscentes() {
      const sel = $("selDiscente");
      cenario.discentes.forEach((d, i) => {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = d.getNome();
        sel.appendChild(opt);
      });
    }

    function alternarCamposExtras() {
      const modalidade = $("selModalidade").value;
      document.querySelectorAll(".extra").forEach(grupo => {
        grupo.hidden = grupo.dataset.mod !== modalidade;
      });
    }

    /** Instancia a subclasse correta a partir dos campos da tela. */
    function criarSessaoDoFormulario() {
      const disciplina = cenario.catalogo[Number($("selDisciplina").value)];
      const minutos = Number($("inpDuracao").value);
      switch ($("selModalidade").value) {
        case "Pomodoro":
          return new SessaoPomodoro(disciplina, minutos, Number($("inpCiclos").value));
        case "Exercicios":
          return new SessaoExercicios(disciplina, minutos, Number($("inpQuestoes").value), Number($("inpAcertos").value));
        case "Leitura":
          return new SessaoLeitura(disciplina, minutos, Number($("inpPaginas").value), $("chkResumo").checked);
        default:
          throw new Error("Modalidade desconhecida.");
      }
    }

    async function registrarEstudo() {
      let sessao;
      try {
        sessao = criarSessaoDoFormulario();
      } catch (erro) {
        toast(erro.message, "erro");
        return;
      }

      // A meta valida a duração (1 a 480 min). Se recusar, nada é registrado.
      if (!metaAtiva().registrarAvanco(sessao.getDuracaoMinutos())) {
        toast("Duração inválida: informe de 1 a 480 minutos.", "erro");
        return;
      }
      discenteAtivo.registrarEstudo(sessao);
      renderPerfis();
      renderMeta();
      renderHistorico();
      toast(sessao.gerarFeedback(), "ok");

      // Missão 10: persistir no Backend (a tela segue funcionando se ele estiver fora)
      try {
        await cliente.salvarSessao(discenteAtivo.getNome(), sessao);
        toast("Sessão gravada no backend.", "ok");
        atualizarStatusBackend();
      } catch {
        toast("Backend indisponível: sessão salva só na memória.", "aviso");
        atualizarStatusBackend();
      }
    }

    function notificarResponsavel() {
      const canal = $("selCanal").value;
      servicoAlerta.avaliarDiscente(discenteAtivo, metaAtiva(), cenario.responsavel, notificadores[canal]);
    }

    async function ajustarMeta() {
      const meta = metaAtiva();
      meta.redefinirMeta(Number($("inpMeta").value));   // a classe corrige para 30..3000
      renderMeta();
      try {
        await cliente.salvarMeta(discenteAtivo.getNome(), cenario.responsavel.getNome(), meta);
        toast(`Meta de ${discenteAtivo.getNome()}: ${meta.getMetaMinutosSemana()} min/semana.`, "ok");
      } catch {
        toast("Meta alterada só na memória (backend indisponível).", "aviso");
      }
    }

    function adicionarAoPlano() {
      const ok = planoAtivo().adicionarItem($("selDia").value, Number($("inpMinPlano").value));
      if (!ok) { toast("Informe um número inteiro de minutos maior que zero.", "erro"); return; }
      renderPlano();
    }

    // ---------- leitura do servidor ----------
    async function carregarHistoricoServidor() {
      const lista = $("listaServidor");
      limpar(lista);
      try {
        const sessoes = await cliente.listarSessoes(discenteAtivo.getNome());
        if (sessoes.length === 0) lista.appendChild(itemLista("Nenhuma sessão gravada no servidor.", "vazio"));
        sessoes.forEach(s => lista.appendChild(itemLista(
          `${s.dataRegistro} · ${s.disciplina} · ${s.tipoModalidade} · ${s.duracaoMinutos} min · +${s.xpGanho} XP`
        )));
        toast(`${sessoes.length} sessão(ões) carregada(s) do servidor.`, "ok");
      } catch (erro) {
        toast(`Não foi possível carregar: ${erro.message}`, "erro");
      }
    }

    async function carregarRelatorio() {
      try {
        const r = await cliente.obterRelatorio(discenteAtivo.getNome());
        const caixa = $("relatorio");
        limpar(caixa);
        [
          `Discente: ${r.discente}`,
          `Sessões: ${r.totalSessoes} · Minutos: ${r.totalMinutosEstudados} · XP: ${r.totalXpAcumulado}`,
          `Meta semanal: ${r.metaMinutosSemana} min (${r.percentualMetaConcluida}% concluída)`,
          r.statusAcompanhamento
        ].forEach(linha => { const p = document.createElement("p"); p.textContent = linha; caixa.appendChild(p); });
        caixa.hidden = false;
      } catch (erro) {
        toast(`Não foi possível carregar o relatório: ${erro.message}`, "erro");
      }
    }

    // ---------- eventos ----------
    $("selDiscente").addEventListener("change", e => {
      discenteAtivo = cenario.discentes[Number(e.target.value)];
      renderTudo();
    });
    $("selModalidade").addEventListener("change", alternarCamposExtras);
    $("btnRegistrar").addEventListener("click", registrarEstudo);
    $("btnNotificar").addEventListener("click", notificarResponsavel);
    $("btnMeta").addEventListener("click", ajustarMeta);
    $("btnPlano").addEventListener("click", adicionarAoPlano);
    $("btnCarregar").addEventListener("click", carregarHistoricoServidor);
    $("btnRelatorio").addEventListener("click", carregarRelatorio);
    $("pillBackend").addEventListener("click", atualizarStatusBackend);

    // ---------- início ----------
    preencherDisciplinas();
    preencherDiscentes();
    alternarCamposExtras();
    renderTrilha();
    renderTudo();
    atualizarStatusBackend();
  });
}

// Permite testar o domínio no Node (node teste.js) sem abrir o navegador.
if (typeof module !== "undefined") {
  module.exports = {
    Disciplina, MetaEstudo, Usuario, Administrador, Responsavel, Discente,
    SessaoEstudo, SessaoPomodoro, SessaoExercicios, SessaoLeitura,
    NotificadorEmail, NotificadorWhatsApp, NotificadorPainel, verificarNotificador,
    TrilhaEstudo, PlanoEstudo, ServicoAlertaResponsavel, ClienteBackendEstudo, montarCenario
  };
}
