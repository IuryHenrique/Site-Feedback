const questions = [
  'De 0 a 5, qual nota você dá para a facilidade de acesso a informações no site?',
  'De 0 a 5, qual nota você dá para a aparência geral do site?',
  'De 0 a 5, qual nota você dá para as cores usadas no site?',
  'De 0 a 5, qual nota você dá para o tamanho das letras do site?',
  'De 0 a 5, qual nota você dá para a qualidade das imagens no site?'
];

const $ = (selector) => document.querySelector(selector);
const storageKey = 'avaliaReports';
let lastReport = null;

function renderQuestions() {
  $('#questions').innerHTML = questions.map((question, index) => `
    <article class="question-card">
      <div><div class="question-number">PERGUNTA ${index + 1}</div><p class="question-text">${question}</p></div>
      <div class="rating" role="radiogroup" aria-label="Resposta da pergunta ${index + 1}">
        ${[0, 1, 2, 3, 4, 5].map(value => `<input id="q${index}-${value}" type="radio" name="q${index}" value="${value}"><label for="q${index}-${value}">${value}</label>`).join('')}
      </div>
    </article>`).join('');
}

function getReports() { return JSON.parse(localStorage.getItem(storageKey) || '[]'); }
function saveReports(reports) { localStorage.setItem(storageKey, JSON.stringify(reports)); }
function formatDate(date) { return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date)); }
function formatAverage(value) { return value.toFixed(1).replace('.', ','); }

function reportText(report) {
  return `RELATÓRIO DE AVALIAÇÃO DE USABILIDADE\n${'='.repeat(43)}\n\nSistema avaliado: ${report.systemName}\nData da avaliação: ${formatDate(report.createdAt)}\n\nRESPOSTAS\n\n${questions.map((question, i) => `${i + 1}. ${question}\n   Nota: ${report.answers[i]}`).join('\n\n')}\n\n${'-'.repeat(43)}\nMÉDIA FINAL: ${formatAverage(report.average)} / 5,0\n`;
}

function downloadReport(report) {
  const blob = new Blob([reportText(report)], { type: 'text/plain;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relatorio-${report.systemName.trim().toLowerCase().replace(/[^a-z0-9]+/gi, '-') || 'avaliacao'}.txt`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(link.href);
}

function renderReports() {
  const reports = getReports(); const list = $('#reportsList');
  $('#downloadAllButton').disabled = reports.length === 0;
  list.innerHTML = reports.length ? reports.map((report, index) => `
    <article class="report-card"><div><h3>${escapeHtml(report.systemName)}</h3><p>Realizada em ${formatDate(report.createdAt)} · ${report.answers.join(' · ')}</p></div>
    <div class="report-right"><div class="report-average"><small>Média final</small><strong>${formatAverage(report.average)}</strong></div><button class="download-one" data-index="${index}">Baixar .txt</button></div></article>`).join('') :
    '<div class="empty-state"><strong>Nenhuma avaliação registrada</strong>Realize uma pesquisa para visualizar os relatórios aqui.</div>';
  document.querySelectorAll('.download-one').forEach(button => button.addEventListener('click', () => downloadReport(reports[button.dataset.index])));
}
function escapeHtml(value) { const element = document.createElement('div'); element.textContent = value; return element.innerHTML; }
function showView(view) {
  $('#surveyView').classList.toggle('hidden', view !== 'survey'); $('#reportsView').classList.toggle('hidden', view !== 'reports');
  $('#pageEyebrow').textContent = view === 'survey' ? 'Nova avaliação' : 'Histórico'; $('#pageTitle').textContent = view === 'survey' ? 'Pesquisa de usabilidade' : 'Relatórios';
  document.querySelectorAll('.nav-link').forEach(link => link.classList.toggle('active', link.dataset.view === view));
  if (view === 'reports') renderReports();
}

renderQuestions();
$('#loginForm').addEventListener('submit', (event) => { event.preventDefault(); const user = $('#username').value.trim(); const pass = $('#password').value; if (user === 'admin' && pass === 'admin123') { $('#loginScreen').classList.add('hidden'); $('#appScreen').classList.remove('hidden'); } else $('#loginError').textContent = 'Usuário ou senha inválidos. Tente as credenciais de demonstração.'; });
$('#togglePassword').addEventListener('click', () => {
  const input = $('#password');
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  $('#togglePassword').setAttribute('aria-label', isHidden ? 'Ocultar senha' : 'Mostrar senha');
  $('#togglePassword').setAttribute('aria-pressed', String(isHidden));
});
document.querySelectorAll('.nav-link').forEach(link => link.addEventListener('click', () => showView(link.dataset.view)));
$('#logoutButton').addEventListener('click', () => { $('#appScreen').classList.add('hidden'); $('#loginScreen').classList.remove('hidden'); $('#loginForm').reset(); $('#loginError').textContent = ''; });
$('#clearButton').addEventListener('click', () => { $('#surveyForm').reset(); $('#surveyError').textContent = ''; $('#systemName').focus(); });
$('#surveyForm').addEventListener('submit', (event) => { event.preventDefault(); const systemName = $('#systemName').value.trim(); const answers = questions.map((_, i) => document.querySelector(`input[name="q${i}"]:checked`)?.value); if (!systemName || answers.includes(undefined)) { $('#surveyError').textContent = 'Informe o nome do sistema e responda todas as 5 perguntas.'; return; } const numericAnswers = answers.map(Number); lastReport = { systemName, answers: numericAnswers, average: numericAnswers.reduce((a, b) => a + b, 0) / numericAnswers.length, createdAt: new Date().toISOString() }; saveReports([lastReport, ...getReports()]); $('#successText').textContent = `As respostas para “${systemName}” foram salvas com sucesso.`; $('#modalAverage').textContent = formatAverage(lastReport.average); $('#successModal').classList.remove('hidden'); $('#surveyForm').reset(); $('#surveyError').textContent = ''; });
$('#modalClose').addEventListener('click', () => $('#successModal').classList.add('hidden'));
$('#downloadLastButton').addEventListener('click', () => { if (lastReport) downloadReport(lastReport); });
$('#downloadAllButton').addEventListener('click', () => { const reports = getReports(); const blob = new Blob([reports.map(reportText).join('\n\n'),], { type: 'text/plain;charset=utf-8' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'relatorios-avalia.txt'; link.click(); URL.revokeObjectURL(link.href); });
