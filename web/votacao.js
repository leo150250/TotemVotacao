const cpfInput = document.getElementById('cpfInput');
const barraTimer = document.getElementById("timer");
const avisoCPF = document.getElementById("avisoCPF");
const enderecoServidor = "http://localhost/TotemVotacao/server/"; // Altere para o endereço do seu servidor se necessário

var timerRetornar = null;
var telaAtiva = "comecar";
var tempoPadrao = 10000;
var tempoFim = 5000;

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
		document.getElementById('opcaoSelecionada').textContent = opcao;
		ativarTela("confirmar", 20000);
	} else {
		const cpfValido = validaCPF(document.getElementById('cpfInput').value);
		if (cpfValido) {
			// Bloqueia a tela de CPF e aguarda resposta do servidor sobre a existência ou não do voto deste CPF
			travarTela("cpf");
			const cpfNumeros = cpfInput.value.replace(/\D/g, '');
			fetch(enderecoServidor + 'index.php?cpf=' + cpfNumeros)
				.then(response => response.json())
				.then(data => {
					if (data === true) {
						avisoCPF.style.removeProperty("display");
					} else {
						avisoCPF.style.display = "none";
					}
					travarTela("cpf", false);
					ativarTela("votacao", 20000);
				})
				.catch(error => {
					console.error('Erro ao consultar o servidor:', error);
					travarTela("cpf", false);
					ativarTela("votacao", 20000);
				});
		}
	}
}

// Função para confirmar o voto
function confirmarVoto() {
	travarTela("votacao");
	const cpfNumeros = cpfInput.value.replace(/\D/g, '');
	const opcao = document.getElementById('opcaoSelecionada').textContent;
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
			} else if (event.key === 'Backspace') {
				limpar();
			} else if (event.key === 'Enter') {
				votar();
			}
		} break;
		case "votacao": {
			if (event.key >= '0' && event.key <= '9') {
				event.preventDefault();
				let voto = event.key;
				if (voto == "0") {
					voto = "10";
				}
				votar(voto);
			}
		} break;
		case "confirmar": {
			if (event.key === 'Enter') {
				confirmarVoto();
			} else if (event.key === 'Esc' || event.key === 'Escape' || event.key === 'Backspace') {
				cancelarVoto();
			}
		} break;
	}
	if (telaAtiva !== "fim") {
		resetarTimer();
	}
}

resetarTotem();
//ativarTela("votacao",100000000);