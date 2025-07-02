<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// Define file path
$filePath = __DIR__ . '/votos.json';

// Read existing votes from JSON file with error handling
if (file_exists($filePath)) {
    $json = file_get_contents($filePath);
    if ($json === false) {
        header('Content-Type: application/json');
        echo json_encode([
            "error" => "Erro ao ler o arquivo JSON",
            "details" => error_get_last()
        ]);
        die();
    }
} else {
    $json = '[]';
}

$votos = json_decode($json, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    header('Content-Type: application/json');
    echo json_encode([
        "error" => "Erro ao decodificar JSON",
        "details" => json_last_error_msg()
    ]);
    die();
}

// Se "admin" for enviado, exibe os dados em duas tabelas
if (isset($_GET['admin'])) {
    // Calcula o resumo: quantidade de votos por opção
    $resumo = [];
    foreach ($votos as $voto) {
        $opcao = $voto['opcao'];
        if (!isset($resumo[$opcao])) {
            $resumo[$opcao] = 0;
        }
        $resumo[$opcao]++;
    }
    // Ordena o resumo por quantidade de votos
    arsort($resumo);
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Admin - Votação</title></head><body>";
    echo "<h2>Resumo de Votos</h2>";
    echo "<table border='1' cellpadding='5'><tr><th>Opção</th><th>Total</th></tr>";
    foreach ($resumo as $opcao => $total) {
        echo "<tr><td>{$opcao}</td><td>{$total}</td></tr>";
    }
    echo "</table><br>";

    echo "<h2>Detalhamento de Votos</h2>";
    echo "<table border='1' cellpadding='5'><tr><th>Timestamp</th><th>CPF</th><th>Opção</th></tr>";
    foreach ($votos as $voto) {
        echo "<tr><td>{$voto['timestamp']}</td><td>{$voto['cpf']}</td><td>{$voto['opcao']}</td></tr>";
    }
    echo "</table></body></html>";
    exit;
}

// Se "voto" for enviado, insere/atualiza o voto
if (isset($_GET['voto'])) {
    if (!isset($_GET['cpf']) || empty($_GET['cpf'])) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'CPF is required when submitting a vote']);
        exit;
    }
    $cpf = $_GET['cpf'];
    $opcao = $_GET['voto'];
    $timestamp = date('Y-m-d H:i:s');

    $found = false;
    // Atualiza voto se CPF já existir
    foreach ($votos as &$voto) {
        if ($voto['cpf'] === $cpf) {
            $voto['timestamp'] = $timestamp;
            $voto['opcao'] = $opcao;
            $found = true;
            break;
        }
    }
    unset($voto);
    // Se não encontrou, adiciona novo voto
    if (!$found) {
        $votos[] = [
            'timestamp' => $timestamp,
            'cpf' => $cpf,
            'opcao' => $opcao
        ];
    }
    // Faz um backup do arquivo de votos
    if (file_exists($filePath)) {
        copy($filePath, $filePath . '.bak');
    }
    // Salva os votos atualizados
    file_put_contents($filePath, json_encode($votos, JSON_PRETTY_PRINT));
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'updated' => $found ? 'vote updated' : 'vote added']);
    exit;
}

// Se apenas "cpf" for enviado, verifica se o CPF já votou
if (isset($_GET['cpf'])) {
    $cpf = $_GET['cpf'];
    $hasVoted = false;
    foreach ($votos as $voto) {
        if ($voto['cpf'] === $cpf) {
            $hasVoted = true;
            break;
        }
    }
    header('Content-Type: application/json');
    echo json_encode($hasVoted);
    exit;
}

// Se nenhuma variável GET for enviada, exibe instruções
header('Content-Type: text/plain; charset=utf-8');
echo "API de Votação:\n\n";
echo "Para verificar se um CPF já votou, envie ?cpf=SEU_CPF\n";
echo "Para registrar um voto, envie ?cpf=SEU_CPF&voto=OPCAO\n";
echo "Para ver o relatório de administração, envie ?admin\n";
?>