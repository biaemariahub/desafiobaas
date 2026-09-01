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
[<img src="./prints/image1.png" alt="bug 01" />
]

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
[<img src="./prints/image2.png" alt="bug02" />
]

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
[<img src="./prints/image3.png" alt="bug 03" />
]

## BUG #4 — Dashboard Mostra Personagens de Todos os Usuários

### O que estava acontecendo
Ao acessar o Dashboard, o usuário conseguia visualizar uma lista contendo os personagens criados por todos os outros usuários cadastrados no sistema, quebrando a privacidade e o propósito do painel individual.

### Por que acontecia
Na função `buscarPersonagens` dentro do arquivo `src/services/personagens.ts`, a busca no banco de dados utilizava apenas o método `getDocs(collection(...))`. Isso trazia a coleção inteira do Firestore de forma irrestrita, sem aplicar nenhum filtro de propriedade.

### Como corrigi
Modifiquei a função para receber o `userId` do usuário autenticado e estruturei uma consulta filtrada utilizando os métodos `query` e `where` do Firestore:

```typescript
export async function buscarPersonagens(userId: string) {
  const q = query(
    collection(db, "personagens"), 
    where("userId", "==", userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ 
    id: doc.id, 
    ...doc.data() 
  }));
}
```

### Screenshot ou resultado
[<img src="./prints/image4.png" alt="bug 04" />]

## BUG #5 — Personagem Criado Não Aparece no Dashboard

### O que estava acontecendo
Após preencher o formulário e criar com sucesso um novo personagem, o usuário era redirecionado de volta ao Dashboard, mas o personagem recém-criado não era listado na tela.

### Por que acontecia
Na função `criarPersonagem`, o objeto com as características do personagem era gravado no Firestore sem passar a propriedade `userId`. Como o documento não possuía o ID do dono, a nova busca filtrada do Dashboard não conseguia encontrá-lo.

### Como corrigi
Ajustei a assinatura e o corpo da função `criarPersonagem` para exigir e injetar o `userId` do usuário logado diretamente no documento no momento da criação:

```typescript
export async function criarPersonagem(dados: any, userId: string) {
  return await addDoc(collection(db, "personagens"), {
    ...dados,
    userId: userId,
    createdAt: new Date()
  });
}
```

### Screenshot ou resultado
[<img src="./prints/image5.png" alt="bug 05" />]

## BUG #6 — Equipar Item Apaga os Outros Equipamentos

### O que estava acontecendo
Ao tentar equipar uma nova peça (como uma arma ou armadura), todos os outros itens que o personagem já estava vestindo sumiam da tela, restando apenas o último item modificado.

### Por que acontecia
Na função `equiparItem` dentro de `src/services/personagens.ts`, a operação de escrita utilizava uma substituição total do objeto de `equipamentos` ou sobrescrevia o documento inteiro, apagando os campos que não tinham sido explicitamente enviados na requisição atual.

### Como corrigi
Modifiquei a função para utilizar o método `updateDoc` em conjunto com a notação de ponto (`.`). Dessa forma, o Firestore atualiza cirurgicamente apenas a propriedade do slot modificado, preservando o restante do objeto:

```typescript
export async function equiparItem(personagemId: string, tipoSlot: string, item: any) {
  const personajeRef = doc(db, "personagens", personagemId);
  await updateDoc(personajeRef, {
    [`equipamentos.${tipoSlot}`]: item
  });
}
```

### Screenshot ou resultado
[<img src="./prints/image6.png" alt="bug 06" />]

## BUG #7 — Deletar Personagem Deleta o Errado

### O que estava acontecendo
Ao clicar no botão de excluir um personagem específico da listagem, o sistema acabava excluindo um registro diferente do selecionado ou gerava erro por falha de referência.

### Por que acontecia
A função responsável pela deleção estava configurada com um identificador estático/fixo ou a renderização dos componentes na interface passava o índice ou ID incorreto do documento para a chamada do Firestore.

### Como corrigi
Ajustei a função de exclusão para receber e injetar dinamicamente a referência única e correta extraída do documento que disparou o evento de clique:

```typescript
export async function deletarPersonagem(personagemId: string) {
  if (!personagemId) return;
  const personagemRef = doc(db, "personagens", personagemId);
  await deleteDoc(personagemRef);
}
```

### Screenshot ou resultado
[<img src="./prints/image7.png" alt="bug 07" />]

## BUG #8 — Banco de Dados Sem Proteção Alguma

### O que estava acontecendo
Qualquer usuário na internet, mesmo sem possuir uma conta ou estar autenticado na plataforma, conseguia acessar, alterar ou apagar todos os dados de personagens contidos no banco de dados.

### Por que acontecia
O arquivo de regras de segurança `firestore.rules` estava configurado no modo aberto irrestrito (`allow read, write: if true;`), o que anula qualquer validação de identidade ou restrição por parte do servidor do Firebase.

### Como corrigi
Reestruturei as políticas de segurança no arquivo `firestore.rules`, passando a exigir autenticação válida (`request.auth != null`) e restringindo as permissões para que os usuários manipulem estritamente os documentos que possuem o seu respectivo ID de criador:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /personagens/{personagemId} {
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow read, update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Screenshot ou resultado
[<img src="./prints/image8.png" alt="bug 08" />]
