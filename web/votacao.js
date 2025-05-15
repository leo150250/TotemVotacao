const cpfInput = document.getElementById('cpfInput');
const barraTimer = document.getElementById("timer");

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
}

// Função para limpar o campo de CPF
function limpar() {
	document.getElementById('cpfInput').value = '';
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
		ativarTela("confirmar");
	} else {
		const cpfValido = validaCPF(document.getElementById('cpfInput').value);
		if (cpfValido) {
			ativarTela("votacao");
		}
	}
}

// Função para confirmar o voto
function confirmarVoto() {
	ativarTela("fim", tempoFim);
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

function ativarTela(argTela,argTempo = tempoPadrao) {
	document.getElementById(telaAtiva).classList.remove("ativo");
	telaAtiva = argTela;
	document.getElementById(telaAtiva).classList.add("ativo");
	resetarTimer(argTempo);
}
function resetarTotem() {
	ativarTela("comecar");
	limpar();
	clearTimeout(timerRetornar);
	barraTimer.style.height = null;
	barraTimer.style.animation = 'none';
}
function resetarTimer(argTempo = tempoPadrao) {
	console.log(argTempo);
	clearTimeout(timerRetornar);
	timerRetornar = setTimeout(resetarTotem,argTempo);
	barraTimer.style.animation = 'none';
	barraTimer.offsetHeight; /* trigger reflow */
	barraTimer.style.animation = null; 
	barraTimer.style.animationDuration = argTempo + "ms";
	barraTimer.style.animationPlayState = "running";
	barraTimer.style.height = "1rem";
}

resetarTotem();
//ativarTela("votacao",100000000);