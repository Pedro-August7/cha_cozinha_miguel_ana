import bcrypt from "bcryptjs";

function sanitizeExcelValue(val) {
  if (val === null || val === undefined) return "";
  const rawStr = String(val);
  if (/^[=+\-@\t\r]/.test(rawStr) || /^[=+\-@\t\r]/.test(rawStr.trim())) {
    return `'${rawStr.trim()}`;
  }
  return rawStr.trim();
}

async function runSecurityTests() {
  console.log("🔒 Executando bateria de testes de segurança...\n");
  let passed = 0;
  let total = 0;

  function assert(condition, testName) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${testName}`);
    }
  }

  // 1. Teste de Hash Bcrypt
  const password = "anaju0120";
  const hash = await bcrypt.hash(password, 12);
  assert(await bcrypt.compare("anaju0120", hash), "Validação de hash Bcrypt com senha correta");
  assert(!(await bcrypt.compare("senhaErrada", hash)), "Rejeição de hash Bcrypt com senha incorreta");
  assert(hash.startsWith("$2"), "Algoritmo de hash é Bcrypt padrão seguro");

  // 2. Teste de Sanitização de CSV / Formula Injection
  assert(sanitizeExcelValue("=SUM(1+1)") === "'=SUM(1+1)", "Anti-Formula Injection: bloqueia prefixo '='");
  assert(sanitizeExcelValue("+cmd|' /C calc'!A0") === "'+cmd|' /C calc'!A0", "Anti-Formula Injection: bloqueia prefixo '+'");
  assert(sanitizeExcelValue("-2+3") === "'-2+3", "Anti-Formula Injection: bloqueia prefixo '-'");
  assert(sanitizeExcelValue("@SUM(A1:A5)") === "'@SUM(A1:A5)", "Anti-Formula Injection: bloqueia prefixo '@'");
  assert(sanitizeExcelValue("\tTabbed").startsWith("'"), "Anti-Formula Injection: bloqueia tabulações");
  assert(sanitizeExcelValue("Ralador Inox") === "Ralador Inox", "Anti-Formula Injection: preserva textos normais");

  // 3. Teste de Validação de IDs de Presente (Regex)
  const isValidGiftId = (id) => typeof id === "string" && /^[a-z0-9_]+__[a-z0-9_-]+$/i.test(id) && id.length <= 100;
  assert(isValidGiftId("cozinha__ralador"), "Validação de ID: ID válido é aceito");
  assert(!isValidGiftId("cozinha__ralador; DROP TABLE users;--"), "Validação de ID: rejeita SQL Injection / caracteres especiais");
  assert(!isValidGiftId("../../etc/passwd"), "Validação de ID: rejeita Path Traversal");
  assert(!isValidGiftId("<script>alert(1)</script>"), "Validação de ID: rejeita tags XSS");

  // 4. Teste de Sanitização de Nomes e XSS
  const sanitizeText = (str, maxLength = 60) => (str || "").replace(/[<>]/g, "").trim().slice(0, maxLength);
  assert(sanitizeText("<script>alert('XSS')</script>Maria") === "scriptalert('XSS')/scriptMaria", "Sanitização de texto: remove tags HTML e scripts");
  assert(sanitizeText("   Ana Júlia   ") === "Ana Júlia", "Sanitização de texto: executa trim corretamente");
  assert(sanitizeText("A".repeat(100)).length === 60, "Sanitização de texto: limita tamanho máximo a 60 caracteres");

  // 5. Teste de Validação de URLs de Lojas
  const isValidUrl = (url) => typeof url === "string" && /^https?:\/\/[^\s$.?#].[^\s]*$/i.test(url.trim());
  assert(isValidUrl("https://www.mercadolivre.com.br/item"), "Validação de URL: HTTPS válido é aceito");
  assert(isValidUrl("http://localhost:4000/teste"), "Validação de URL: HTTP localhost é aceito");
  assert(!isValidUrl("javascript:alert(1)"), "Validação de URL: rejeita protocolo javascript:");
  assert(!isValidUrl("data:text/html,<script>alert(1)</script>"), "Validação de URL: rejeita payload data: URI");

  console.log(`\n🛡️ Resultado dos testes: ${passed}/${total} passaram.`);
  if (passed === total) {
    console.log("✅ Todos os testes de segurança passaram com sucesso!\n");
  } else {
    process.exit(1);
  }
}

runSecurityTests();
