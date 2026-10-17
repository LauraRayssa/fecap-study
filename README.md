# FecapStudy — Plataforma de Apoio ao Estudo

Mini-projeto da Aula 9 de Programação Orientada a Objetos (Oficina PBL).
Tela em HTML + CSS + JavaScript, com classes orientadas a objetos, integrada a um backend local em C# + MySQL.

## O que o projeto faz

- Registra sessões de estudo (Pomodoro, Exercícios ou Leitura) e calcula o XP de cada uma.
- Mostra a barra de progresso da meta semanal do discente.
- Permite ao responsável ajustar a meta e receber alertas (e-mail, WhatsApp ou painel).
- Grava as sessões no backend e carrega o histórico e o relatório salvos no servidor.

## Requisitos

- Windows (o `BackendEstudoAPI.exe` é compilado para Windows x64).
- Um navegador atual (Edge ou Chrome).
- MySQL local é **opcional**. Se não estiver rodando, o backend salva em um arquivo JSON local e tudo funciona do mesmo jeito.

## Estrutura de pastas

```
.
├── index.html        # Tela da plataforma
├── app.js            # Classes de POO + tela + integração com o backend
└── Backend/          # Backend fornecido pelo professor
    ├── BackendEstudoAPI.exe
    ├── iniciar_backend.bat
    └── mysql_config.txt
```

## Como rodar

**1. Baixe o projeto**

Clique em **Code → Download ZIP** no GitHub e extraia a pasta (ou use `git clone`).

**2. Inicie o backend**

Dentro da pasta `Backend`, dê dois cliques em `iniciar_backend.bat`.
Uma janela preta vai abrir informando que o servidor está em `http://localhost:5080`. **Deixe essa janela aberta** enquanto usa o site.

Para conferir, abra `http://localhost:5080` no navegador: aparece o painel de diagnóstico do backend.

**3. Abra o site**

Dê dois cliques no `index.html`. Não precisa instalar nada nem usar servidor web.

No topo da tela, o botão de status deve mostrar **"Backend online · MySQL"** ou **"Backend online · JSON local"**.

## Como usar

1. Escolha o **discente ativo** no topo da tela.
2. Em **Nova sessão de estudo**, escolha a disciplina, a modalidade e a duração, preencha o campo extra da modalidade e clique em **Registrar Estudo**.
3. O XP e a barra da meta atualizam na hora, e a sessão é enviada ao backend.
4. Em **Dados gravados no servidor**, clique em **Carregar Histórico do Servidor** ou **Ver Relatório** para ver o que ficou salvo.
5. Clique em **Notificar Responsável** para disparar o alerta pelo canal escolhido.

Para confirmar que gravou, olhe a janela do backend: aparece uma linha como
`POST /api/sessoes -> Lucas Silva estudou POO (Pomodoro, 25 min) -> +65 XP`.
Você também pode abrir `http://localhost:5080/api/sessoes` no navegador.

## Configurando o MySQL (opcional)

O backend lê o arquivo `Backend/mysql_config.txt`:

```
Server=localhost;Port=3306;Database=fecap_estudo;Uid=root;Pwd=;
```

Se o seu MySQL tem senha, coloque em `Pwd=sua_senha;` e reinicie o backend.
O banco `fecap_estudo` e as tabelas são criados automaticamente.

## Problemas comuns

| Problema | Solução |
|---|---|
| Botão mostra "Backend offline" | Verifique se a janela do `iniciar_backend.bat` está aberta e clique no botão de status para testar de novo. |
| Aviso "Backend indisponível: sessão salva só na memória" | O backend não está rodando. O site funciona, mas os dados somem ao recarregar a página. |
| A porta 5080 já está em uso | Feche outra instância do backend que esteja aberta e inicie de novo. |
| O Windows bloqueia o `.exe` | Clique em **Mais informações → Executar assim mesmo**, ou rode pelo `.bat`. |
| Quer usar com MySQL, mas aparece "JSON local" | Inicie o serviço do MySQL, confira o `mysql_config.txt` e reinicie o backend. |

## Conceitos de POO aplicados

| Conceito | Onde |
|---|---|
| Abstração, classe e objeto | `Disciplina` |
| Encapsulamento | `MetaEstudo`, `Usuario` (senha sem getter) |
| Classe abstrata e herança | `Usuario` → `Administrador`, `Responsavel`, `Discente` |
| Polimorfismo dinâmico | `SessaoEstudo` → `SessaoPomodoro`, `SessaoExercicios`, `SessaoLeitura` |
| Polimorfismo estático (sobrecarga) | `Discente.registrarEstudo(...)` com 3 formas de chamada |
| Interfaces | `INotificador` (e-mail, WhatsApp, painel) e `IExportavelJson` |
| Associação | `Responsavel` → `Discente` |
| Agregação | `TrilhaEstudo` ◇── `Disciplina` |
| Composição | `PlanoEstudo` ◆── `ItemCronograma` |
| Dependência | `ServicoAlertaResponsavel` e `ClienteBackendEstudo` |

## Rotas do backend usadas

| Método | Rota | Uso |
|---|---|---|
| GET | `/api/status` | Status de conexão exibido no topo |
| GET | `/api/sessoes?discente=Nome` | Histórico salvo no servidor |
| POST | `/api/sessoes` | Grava a sessão de estudo |
| POST | `/api/metas` | Grava a meta ajustada pelo responsável |
| GET | `/api/relatorio/{nome}` | Relatório consolidado do discente |

## Autor

Seu Nome — ADS, 2º semestre · FECAP
