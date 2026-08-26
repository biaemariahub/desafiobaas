## Relatório de Correção de Bugs

## BUG #1 — Erro de Login Engolido

### O que estava acontecendo
Quando o usuário informava um e-mail inexistente ou uma senha incorreta, o login falhava, mas nenhuma mensagem era exibida na tela. A interface não informava ao usuário o motivo da falha.

### Por que acontecia
Na função `handleSubmit`, da página de login, o erro lançado pelo Firebase era capturado pelo bloco `catch`, mas esse bloco não fazia nada. Dessa forma, o erro era silenciado e o estado de erro não recebia nenhuma mensagem.

### Como corrigi
Foi adicionada uma mensagem ao bloco `catch`:

```tsx
try {
	await entrar(email, senha);
	router.push("/dashboard");
} catch {
	setErro("E-mail ou senha inválidos.");
}
```

Assim, a falha de autenticação é tratada e apresentada ao usuário.

### Screenshot ou resultado
[Insira aqui as prints do comportamento antes e depois da correção.]

## BUG #2 — A Rota Protegida não Protege

### O que estava acontecendo
Usuários não autenticados conseguiam acessar páginas privadas, como `/dashboard`, `/criar-personagem` e `/personagem`, sem serem redirecionados para a página de login.

### Por que acontecia
No middleware, a decisão de redirecionamento depende da existência do cookie `__session`. A condição estava invertida: o código redirecionava quando havia um token, em vez de redirecionar quando não havia sessão.

### Como corrigi
Foi alterada a condição para verificar a ausência do token:

```ts
if (!token) {
	return NextResponse.redirect(new URL("/login", request.url));
}
```

Com isso, visitantes sem sessão são enviados para `/login`, enquanto usuários autenticados podem continuar nas rotas protegidas.

### Screenshot ou resultado
[Insira aqui as prints do acesso sem login antes e depois da correção.]

## BUG #3 — Confirmação de Senha Quebrada

### O que estava acontecendo
O formulário de cadastro não validava corretamente o campo de confirmação de senha. Senhas diferentes podiam ser aceitas, pois a comparação era feita com o campo errado.

### Por que acontecia
Na função `handleSubmit`, a senha era comparada com `nome`, em vez de ser comparada com `confirmarSenha`. O campo `confirmarSenha` existia, mas não participava da validação correta.

### Como corrigi
A comparação foi corrigida para usar os dois campos de senha:

```ts
if (senha !== confirmarSenha) {
	setErro("As senhas não coincidem.");
	return;
}
```

Também foi mantida a validação de tamanho mínimo de seis caracteres antes da criação da conta.

### Screenshot ou resultado
[Insira aqui as prints do cadastro com senhas diferentes e com senhas iguais.]