# Refatoração do useTasks.ts

O objetivo  foi melhorar a organização, desempenho e reutilização hook `useTasks`, aplicando boas práticas de React, TypeScript.

---

# Problemas Identificados

## 1. Repetição  nas chamadas da API

### Problema

O código original fazia várias chamadas `fetch` espalhadas pelo hook, o que causava:

* repetição de código;
* dificuldade de manutenção;
* tratamento de erro duplicado.

### Solução

Foi criada a função reutilizável `request()` usando `useCallback`.

```ts
const request = useCallback(async <T>(
  url: string,
  options?: RequestInit
): Promise<T> => {
```

### Por que é melhor?

* Centraliza toda lógica HTTP;
* Facilita manutenção;
* Evita repetição;
* Permite reutilização em todas operações CRUD.

---

## 2. Falta  padronizada do submit

### Problema

As funções `createTask` e `updateTask` repetiam:

* controle de loading;
* try/catch;
* tratamento de erros.

### Solução

Foi criada a função `handleSubmit()`.

```ts
const handleSubmit = useCallback(async (
  callback: () => Promise<void>
): Promise<boolean> => {
```

### Por que é melhor?

* Remove duplicação;
* Mantém padrão de tratamento de erros;
* Deixa funções menores e mais legíveis.

---

## 3. Validação misturada 

### Problema

A validação estava misturada dentro das funções principais.

### Solução

Foi criada a função separada:

```ts
function validateTask(taskData: TaskFormData): string | null
```

### Por que é melhor?

* Responsabilidade única;
* Código mais limpo;
* Facilita reutilização;
* Facilita testes futuros.

---

## 4. Atualização desnecessária da lista de tarefas

### Problema

Após criar, editar ou deletar tarefas, seria comum fazer um novo fetch completo.

Isso gera:

* mais requisições;
* pior desempenho;
* experiência menos fluida.

### Solução

Foi feita atualização local do estado usando:

```ts
setTasks((prev) => [...prev, newTask]);
```

e

```ts
prev.map(...)
```

e

```ts
prev.filter(...)
```

### Por que é melhor?

* Menos chamadas na API;
* Melhor performance;
* Atualização instantânea na interface.

---

## 5. Possibilidade de recriação desnecessária de funções

### Problema

Funções eram recriadas a cada renderização.

### Solução

Foi utilizado `useCallback` nas funções principais.

### Por que é melhor?

* Evita recriações desnecessárias;
* Melhora performance;
* Reduz renderizações em componentes filhos.

---

## 6. Tratamento de resposta HTTP incompleta

### Problema

Respostas com status `204 No Content` poderiam gerar erro ao tentar usar `response.json()`.

### Solução

```ts
if (response.status === 204) {
  return {} as T;
}
```

### Por que é melhor?

Evita erros em requisições DELETE ou respostas vazias.

---

#
