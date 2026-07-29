// Personalize seu sistema alterando estas variáveis abaixo

var touchScreen = true; // Define se o sistema usará tela sensível ao toque (true) ou teclado físico (false)

// Nomes das opções de votação. Observe que o número de itens nesta lista define o número de opções disponíveis na votação.
const nomesFotos = [
	"Café 01",
	"Café 02",
	"Café 03",
	"Café 04",
	"Café 05",
	"Café 06",
	"Café 07",
	"Café 08",
	"Café 09",
	"Café 10"
];
// Ainda, modifique as imagens na pasta "imagens" para corresponder aos nomes e quantidade de opções aqui definidas.
// Observe que, caso haja mais de 10 opções, a votação será feita por meio de digitação do número da opção, e não por botões numéricos.

// Adicione os arquivos de imagens dos apoiadores aqui, separados por vírgula. Exemplo: "logo1.png","logo2.png"
// Observe que a logo do IFRO já está inclusa automaticamente no index.html
const logosApoiadores = [
];

//Tempos das telas em milissegundos
var tempoPadrao = 25000;
var tempoFim = 5000;

//Conexão a servidor de concentração de votos
const enderecoServidorNormal = "http://localhost/TotemVotacao/server/"; // Altere para o endereço do seu servidor se necessário
const enderecoServidorFallback = "http://localhost/TotemVotacao/server/"; // Endereço de fallback caso o servidor principal não esteja acessível. Normalmente é o endereço localhost!

/////////////////////////////////////////////////////////////////
// Abaixo, código do sistema. Evite alterações se não souber o que está fazendo!
const cpfInput = document.getElementById('cpfInput');
const barraTimer = document.getElementById("timer");
const avisoCPF = document.getElementById("avisoCPF");
const imgFotoSelecionada = document.getElementById("imagemSelecionada");
const nomeFotoSelecionada = document.getElementById("nomeImagemSelecionada");
const divAlertaFallback = document.getElementById("alertaFallback");
const divTecladoOpcoes = document.getElementById("tecladoOpcoes");
const divApoiadores = document.getElementById("apoiadores");

// Verifica se o servidor está acessível
var enderecoServidor = enderecoServidorNormal; // Variável para armazenar o endereço do servidor

function verificarServidor() {
	// Verifica se o servidor está acessível
	fetch(enderecoServidor + 'index.php?check=true')
		.then(response => {
			if (!response.ok) {
				divAlertaFallback.style.display = "block"; // Exibe o alerta se o servidor não estiver acessível
				enderecoServidor = enderecoServidorFallback; // Altera o endereço do servidor para o fallback
				console.warn('Servidor principal não acessível, usando fallback:', enderecoServidor);
			} else {
				divAlertaFallback.style.display = "none"; // Oculta o alerta se o servidor estiver acessível
				console.log('Servidor principal acessível:', enderecoServidor);
				enderecoServidor = enderecoServidorNormal; // Garante que o endereço do servidor seja o normal
			}
		})
		.catch(error => {
			console.error('Erro ao verificar o servidor:', error);
			divAlertaFallback.style.display = "block"; // Exibe o alerta se houver erro na verificação
			enderecoServidor = enderecoServidorFallback; // Altera o endereço do servidor para o fallback
		});
}
verificarServidor();

var timerRetornar = null;
var telaAtiva = "comecar";
var numOpcoes = nomesFotos.length;
var votacaoDireta = (numOpcoes <= 10);
if (votacaoDireta) {
	for (let i = 0; i < numOpcoes; i++) {
		const botao = document.createElement("button");
		botao.id = "botaoVoto" + (i === 9 ? '0' : (i + 1).toString()); // Ajusta o ID para que a opção 0 seja o botão '0'
		botao.textContent = (i === 9 ? '0' : (i + 1).toString());
		botao.onclick = () => votar(i === 9 ? '0' : (i + 1).toString()); // Ajusta a função para que a opção 0 seja o voto '0'
		divTecladoOpcoes.appendChild(botao);
	}
}

var numApoiadores = logosApoiadores.length;
for (let i = 0; i < numApoiadores; i++) {
	const imgLogo = document.createElement("img");
	imgLogo.src = logosApoiadores[i];
	imgLogo.alt = "Apoiador " + (i + 1);
	imgLogo.className = "logo";
	divApoiadores.appendChild(imgLogo);
}

// Função para adicionar números ao campo de CPF
function adicionarNumero(numero) {
	if (cpfInput.value.length < 14) {
		cpfInput.value += numero;
	}
	mascara(cpfInput, '###.###.###-##');
	cpfInput.focus();
}

// Função para limpar o campo de CPF
function limpar() {
	document.getElementById('cpfInput').value = '';
	cpfInput.focus();
}

// Função para aplicar a máscara no CPF
function mascara(input, pattern) {
	let i = 0;
	const value = input.value.replace(/\D/g, '');
	input.value = pattern.replace(/#/g, () => value[i++] || '');
	cpfInput.classList.remove("alerta");
}

// Função para validar o CPF
function validaCPF(cpf) {
	cpf = cpf.replace(/\D/g, '');
	if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
		alertarCPF();
		return false;
	}
	let soma = 0, resto;
	for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
	resto = (soma * 10) % 11;
	if (resto === 10 || resto === 11) resto = 0;
	if (resto !== parseInt(cpf.substring(9, 10))) {
		alertarCPF();
		return false;
	}
	soma = 0;
	for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
	resto = (soma * 10) % 11;
	if (resto === 10 || resto === 11) resto = 0;
	if (resto !== parseInt(cpf.substring(10, 11))) {
		alertarCPF();
		return false;
	}
	return true;
}

function alertarCPF() {
	cpfInput.classList.add("alerta");
}

// Função para avançar para a votação
function votar(opcao) {
	if (opcao) {
		console.log(typeof opcao);
		if (opcao == 0) {
			opcao = 10; // Opção 0 corresponde à foto 10
		}
		opcao -= 1; // Ajusta o índice para começar em 0
		document.getElementById('opcaoSelecionada').textContent = (opcao + 1);
		imgFotoSelecionada.src = `imagens/${opcao + 1}.jpg`; // Atualiza a imagem com base na opção selecionada
		nomeFotoSelecionada.textContent = '"' + nomesFotos[opcao] + '"'; // Atualiza o nome da foto
		ativarTela("confirmar");
	} else {
		const cpfValido = validaCPF(document.getElementById('cpfInput').value);
		if (cpfValido) {
			// Bloqueia a tela de CPF e aguarda resposta do servidor sobre a existência ou não do voto deste CPF
			travarTela("cpf");
			const cpfNumeros = cpfInput.value.replace(/\D/g, '');
			verificarServidor();
			fetch(enderecoServidor + 'index.php?cpf=' + cpfNumeros)
				.then(response => response.json())
				.then(data => {
					if (data === true) {
						avisoCPF.style.removeProperty("display");
					} else {
						avisoCPF.style.display = "none";
					}
					travarTela("cpf", false);
					ativarTela("votacao");
				})
				.catch(error => {
					console.error('Erro ao consultar o servidor:', error);
					travarTela("cpf", false);
					ativarTela("votacao");
				});
		}
	}
}

// Função para confirmar o voto
function confirmarVoto() {
	travarTela("votacao");
	const cpfNumeros = cpfInput.value.replace(/\D/g, '');
	const opcao = document.getElementById('opcaoSelecionada').textContent;
	verificarServidor();
	fetch(`${enderecoServidor}index.php?cpf=${cpfNumeros}&voto=${opcao}`)
		.then(response => response.json())
		.then(data => {
			travarTela("votacao", false);
			ativarTela("fim", tempoFim);
		})
		.catch(error => {
			console.error('Erro ao enviar voto:', error);
			travarTela("votacao", false);
			ativarTela("fim", tempoFim);
		});
}

// Função para cancelar o voto e voltar à tela de votação
function cancelarVoto() {
	ativarTela("votacao");
}

// Função para reiniciar o processo de votação
function reiniciar() {
	ativarTela("cpf");
	limpar();
	verificarServidor();
}

function travarTela(argTela,argTravar = true) {
	if (argTravar) {
		document.getElementById(argTela).disabled = true;
	} else {
		document.getElementById(argTela).disabled = false;
	}
}
function ativarTela(argTela,argTempo = tempoPadrao) {
	document.getElementById(telaAtiva).classList.remove("ativo");
	telaAtiva = argTela;
	document.getElementById(telaAtiva).classList.add("ativo");
	document.getElementById(telaAtiva).focus();
	resetarTimer(argTempo);
}
function resetarTotem() {
	ativarTela("comecar");
	limpar();
	verificarServidor();
	clearTimeout(timerRetornar);
	barraTimer.style.height = null;
	barraTimer.style.animation = 'none';
	avisoCPF.style.display = "none";
	document.body.focus();
}
function resetarTimer(argTempo = tempoPadrao) {
	//console.log(argTempo);
	clearTimeout(timerRetornar);
	timerRetornar = setTimeout(resetarTotem,argTempo);
	barraTimer.style.animation = 'none';
	barraTimer.offsetHeight; /* trigger reflow */
	barraTimer.style.animation = null; 
	barraTimer.style.animationDuration = argTempo + "ms";
	barraTimer.style.animationPlayState = "running";
	barraTimer.style.height = "1rem";
}
function simulacaoMouseAtivo(argElemento) {
    argElemento.classList.add("active");
	setTimeout(() => {
		argElemento.classList.remove("active");
	}, 150);
}
function computarTecla(event) {
	console.log(event.key || event.code);
	switch (telaAtiva) {
		case "comecar": {
			reiniciar();
		} break;
		case "cpf": {
			if (event.key >= '0' && event.key <= '9') {
				event.preventDefault();
				adicionarNumero(event.key);
				simulacaoMouseAtivo(document.getElementById('botaoCPF' + event.key));
			} else if (event.key === 'Backspace') {
				event.preventDefault();
				limpar();
			} else if (event.key === 'Enter') {
				event.preventDefault();
				simulacaoMouseAtivo(document.getElementById('btnVotar'));
				votar();
			}
		} break;
		case "votacao": {
			if (event.key >= '0' && event.key <= '9') {
				event.preventDefault();
				let voto = event.key;
				let opcao = parseInt(voto);
				//console.log(opcao);
				if (opcao == 0) {
					opcao = 10; // Opção 0 corresponde à foto 10
				}
				opcao -= 1; // Ajusta o índice para começar em 0
				if (nomesFotos[opcao] === undefined) {
					console.log("Opção inválida!");
					return;
				}
				votar(voto);
				simulacaoMouseAtivo(document.getElementById('botaoVoto' + event.key));
			}
		} break;
		case "confirmar": {
			event.preventDefault();
			if (event.key === 'Enter') {
				confirmarVoto();
				simulacaoMouseAtivo(document.getElementById('btnConfirmarVoto'));
			} else {
				cancelarVoto();
				simulacaoMouseAtivo(document.getElementById('btnCancelarVoto'));
			}
		} break;
	}
	if (telaAtiva !== "fim") {
		resetarTimer();
	} else {
		event.preventDefault();
	}
}

resetarTotem();
//ativarTela("votacao",100000000);