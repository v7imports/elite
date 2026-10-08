// ==========================================================
// V7IMPORTS - PAINEL ADMINISTRATIVO
// ==========================================================

let usuarioAtual = null;


// ==========================================================
// VERIFICAR LOGIN E PERMISSÃO DE ADMIN
// ==========================================================

auth.onAuthStateChanged(async (user) => {

    console.log("Estado de autenticação:", user);

    if (!user) {
        console.warn("Usuário não está logado.");
        window.location.href = "index.html";
        return;
    }

    usuarioAtual = user;

    try {

        const doc = await db
            .collection("usuarios")
            .doc(user.uid)
            .get();

        if (!doc.exists) {

            alert("Usuário não possui cadastro no sistema.");
            window.location.href = "index.html";
            return;
        }

        const dadosUsuario = doc.data();

        console.log("Dados do usuário:", dadosUsuario);

        if (dadosUsuario.perfil !== "admin") {

            alert("Acesso negado. Apenas administradores podem acessar este painel.");

            window.location.href = "index.html";
            return;
        }

        console.log("Administrador autorizado.");

        carregarProdutos();
        carregarUsuarios();

    } catch (error) {

        console.error(
            "Erro ao verificar administrador:",
            error
        );

        mostrarMensagem(
            "Não foi possível verificar suas permissões: " +
            obterMensagemErro(error),
            "danger"
        );
    }

});


// ==========================================================
// ALTERNAR IMAGEM URL / ARQUIVO
// ==========================================================

function alternarEntradaImagem() {

    const tipo = document.getElementById("tipoImagem").value;

    const campoURL =
        document.getElementById("imagemURL");

    const campoArquivo =
        document.getElementById("imagemArquivo");

    if (tipo === "url") {

        campoURL.classList.remove("d-none");
        campoArquivo.classList.add("d-none");

    } else {

        campoURL.classList.add("d-none");
        campoArquivo.classList.remove("d-none");

    }

}


// ==========================================================
// CARREGAR PRODUTOS
// ==========================================================

async function carregarProdutos() {

    const container =
        document.getElementById("lista-produtos");

    if (!container) return;

    container.innerHTML = `
        <div class="col-12 text-center py-5">
            <div class="spinner-border text-danger"></div>
            <p class="mt-3">
                Carregando camisas...
            </p>
        </div>
    `;

    try {

        const snapshot =
            await db.collection("produtos").get();

        console.log(
            "Quantidade de produtos:",
            snapshot.size
        );

        if (snapshot.empty) {

            container.innerHTML = `
                <div class="col-12">

                    <div class="alert alert-secondary text-center">

                        <h5>
                            Nenhuma camisa cadastrada
                        </h5>

                        <p class="mb-0">
                            Clique em "Adicionar Produto"
                            para cadastrar a primeira camisa.
                        </p>

                    </div>

                </div>
            `;

            return;
        }


        let html = "";


        snapshot.forEach((doc) => {

            const p = doc.data();

            const nome =
                p.nome || "Camisa sem nome";

            const preco =
                Number(p.preco) || 0;

            const estoque =
                Number(p.estoque) || 0;

            const imagem =
                p.imagem ||
                "https://via.placeholder.com/500x500?text=Sem+Imagem";


            html += `

                <div class="col-12 col-sm-6 col-lg-4">

                    <div class="card h-100 shadow-sm">

                        <img
                            src="${escaparHTML(imagem)}"
                            class="card-img-top"
                            alt="${escaparHTML(nome)}"
                            onerror="this.src='https://via.placeholder.com/500x500?text=Imagem+indisponivel'"
                        >

                        <div class="card-body d-flex flex-column">

                            <h5 class="card-title fw-bold">
                                ${escaparHTML(nome)}
                            </h5>

                            <p class="card-text mb-1">
                                <strong>Preço:</strong>
                                R$ ${preco.toFixed(2).replace(".", ",")}
                            </p>

                            <p class="card-text mb-3">
                                <strong>Estoque:</strong>
                                ${estoque} unidade(s)
                            </p>

                            <div class="mt-auto">

                                <button
                                    class="btn btn-warning btn-sm me-2"
                                    onclick='editarProduto(
                                        ${JSON.stringify(doc.id)},
                                        ${JSON.stringify(nome)},
                                        ${preco},
                                        ${estoque},
                                        ${JSON.stringify(imagem)}
                                    )'
                                >
                                    ✏️ Editar
                                </button>

                                <button
                                    class="btn btn-danger btn-sm"
                                    onclick='excluirProduto(
                                        ${JSON.stringify(doc.id)},
                                        ${JSON.stringify(nome)}
                                    )'
                                >
                                    🗑️ Excluir
                                </button>

                            </div>

                        </div>

                    </div>

                </div>

            `;

        });


        container.innerHTML = html;

    } catch (error) {

        console.error(
            "Erro ao carregar produtos:",
            error
        );

        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    <strong>Erro ao carregar produtos.</strong><br>
                    ${escaparHTML(obterMensagemErro(error))}
                </div>
            </div>
        `;

    }

}


// ==========================================================
// ABRIR FORMULÁRIO PARA NOVO PRODUTO
// ==========================================================

function mostrarFormulario() {

    const formulario =
        document.getElementById("form-produto");

    formulario.classList.remove("d-none");


    document.getElementById("id-produto").value = "";

    document.getElementById("nome").value = "";

    document.getElementById("preco").value = "";

    document.getElementById("estoque").value = "";

    document.getElementById("imagemURL").value = "";

    document.getElementById("imagemArquivo").value = "";

    document.getElementById("tipoImagem").value = "url";


    alternarEntradaImagem();


    formulario.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ==========================================================
// CANCELAR FORMULÁRIO
// ==========================================================

function cancelarFormulario() {

    const formulario =
        document.getElementById("form-produto");

    formulario.classList.add("d-none");

}


// ==========================================================
// SALVAR PRODUTO
// ==========================================================

async function salvarProduto() {

    const id =
        document.getElementById("id-produto").value.trim();

    const nome =
        document.getElementById("nome").value.trim();

    const preco =
        Number(
            document.getElementById("preco").value
        );

    const estoque =
        Number(
            document.getElementById("estoque").value
        );

    const tipoImagem =
        document.getElementById("tipoImagem").value;

    const imagemURL =
        document.getElementById("imagemURL").value.trim();

    const imagemArquivo =
        document.getElementById("imagemArquivo").files[0];


    // ------------------------------------------------------
    // VALIDAÇÕES
    // ------------------------------------------------------

    if (!nome) {

        alert("Digite o nome da camisa.");

        return;
    }


    if (isNaN(preco) || preco <= 0) {

        alert("Digite um preço válido.");

        return;
    }


    if (
        isNaN(estoque) ||
        estoque < 0
    ) {

        alert("Digite uma quantidade de estoque válida.");

        return;
    }


    // ------------------------------------------------------
    // DESABILITAR BOTÃO DURANTE SALVAMENTO
    // ------------------------------------------------------

    const botoes =
        document.querySelectorAll(
            "#form-produto button"
        );

    botoes.forEach(botao => {
        botao.disabled = true;
    });


    try {

        let imagemFinal = "";


        // --------------------------------------------------
        // EDITANDO PRODUTO
        // --------------------------------------------------

        if (id) {

            // Se não escolher nova imagem,
            // mantém a imagem atual.

            if (
                tipoImagem === "arquivo" &&
                imagemArquivo
            ) {

                imagemFinal =
                    await enviarImagem(imagemArquivo);

            }

            else if (
                tipoImagem === "url" &&
                imagemURL
            ) {

                imagemFinal = imagemURL;

            }

            else {

                // Buscar imagem atual no Firebase

                const produtoAtual =
                    await db
                        .collection("produtos")
                        .doc(id)
                        .get();

                if (produtoAtual.exists) {

                    imagemFinal =
                        produtoAtual.data().imagem || "";

                }

            }

        }

        // --------------------------------------------------
        // NOVO PRODUTO
        // --------------------------------------------------

        else {

            if (
                tipoImagem === "url"
            ) {

                if (!imagemURL) {

                    alert(
                        "Cole o link da imagem da camisa."
                    );

                    return;
                }

                imagemFinal = imagemURL;

            }

            else if (
                tipoImagem === "arquivo"
            ) {

                if (!imagemArquivo) {

                    alert(
                        "Selecione uma imagem do computador."
                    );

                    return;
                }

                imagemFinal =
                    await enviarImagem(imagemArquivo);

            }

        }


        // --------------------------------------------------
        // DADOS DO PRODUTO
        // --------------------------------------------------

        const dados = {

            nome: nome,

            preco: preco,

            estoque: estoque,

            imagem: imagemFinal,

            atualizadoEm:
                firebase.firestore.FieldValue.serverTimestamp()

        };


        // --------------------------------------------------
        // ATUALIZAR
        // --------------------------------------------------

        if (id) {

            await db
                .collection("produtos")
                .doc(id)
                .update(dados);

            mostrarMensagem(
                "Camisa atualizada com sucesso!",
                "success"
            );

        }

        // --------------------------------------------------
        // ADICIONAR NOVO
        // --------------------------------------------------

        else {

            dados.criadoEm =
                firebase.firestore.FieldValue.serverTimestamp();

            await db
                .collection("produtos")
                .add(dados);

            mostrarMensagem(
                "Camisa adicionada com sucesso!",
                "success"
            );

        }


        // --------------------------------------------------
        // LIMPAR E ATUALIZAR
        // --------------------------------------------------

        cancelarFormulario();

        limparFormulario();

        await carregarProdutos();

    }

    catch (error) {

        console.error(
            "Erro ao salvar produto:",
            error
        );

        mostrarMensagem(
            "Erro ao salvar camisa: " +
            obterMensagemErro(error),
            "danger"
        );

    }

    finally {

        botoes.forEach(botao => {
            botao.disabled = false;
        });

    }

}


// ==========================================================
// ENVIAR IMAGEM PARA FIREBASE STORAGE
// ==========================================================

async function enviarImagem(arquivo) {

    if (!arquivo) {
        throw new Error(
            "Nenhuma imagem foi selecionada."
        );
    }


    // Verificar tipo

    if (
        !arquivo.type.startsWith("image/")
    ) {

        throw new Error(
            "O arquivo selecionado não é uma imagem."
        );

    }


    // Limite de 5 MB

    if (
        arquivo.size > 5 * 1024 * 1024
    ) {

        throw new Error(
            "A imagem deve ter no máximo 5 MB."
        );

    }


    // Criar nome único

    const extensao =
        arquivo.name
            .split(".")
            .pop()
            .toLowerCase();


    const nomeArquivo =
        "camisa_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 8) +
        "." +
        extensao;


    const caminho =
        "produtos/" +
        nomeArquivo;


    console.log(
        "Enviando imagem:",
        caminho
    );


    const storageRef =
        storage.ref(caminho);


    const snapshot =
        await storageRef.put(arquivo);


    const url =
        await snapshot.ref.getDownloadURL();


    console.log(
        "Imagem enviada:",
        url
    );


    return url;

}


// ==========================================================
// EDITAR PRODUTO
// ==========================================================

function editarProduto(
    id,
    nome,
    preco,
    estoque,
    imagem
) {

    document
        .getElementById("form-produto")
        .classList.remove("d-none");


    document.getElementById("id-produto").value =
        id;


    document.getElementById("nome").value =
        nome;


    document.getElementById("preco").value =
        preco;


    document.getElementById("estoque").value =
        estoque;


    document.getElementById("imagemURL").value =
        imagem || "";


    document.getElementById("imagemArquivo").value =
        "";


    document.getElementById("tipoImagem").value =
        "url";


    alternarEntradaImagem();


    document
        .getElementById("form-produto")
        .scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

}


// ==========================================================
// EXCLUIR PRODUTO
// ==========================================================

async function excluirProduto(
    id,
    nome = "este produto"
) {

    const confirmar =
        confirm(
            `Deseja realmente excluir "${nome}"?`
        );


    if (!confirmar) {
        return;
    }


    try {

        await db
            .collection("produtos")
            .doc(id)
            .delete();


        mostrarMensagem(
            "Camisa excluída com sucesso!",
            "danger"
        );


        carregarProdutos();

    }

    catch (error) {

        console.error(
            "Erro ao excluir produto:",
            error
        );

        mostrarMensagem(
            "Erro ao excluir camisa: " +
            obterMensagemErro(error),
            "danger"
        );

    }

}


// ==========================================================
// LIMPAR FORMULÁRIO
// ==========================================================

function limparFormulario() {

    document.getElementById("id-produto").value = "";

    document.getElementById("nome").value = "";

    document.getElementById("preco").value = "";

    document.getElementById("estoque").value = "";

    document.getElementById("imagemURL").value = "";

    document.getElementById("imagemArquivo").value = "";

    document.getElementById("tipoImagem").value = "url";

    alternarEntradaImagem();

}


// ==========================================================
// MENSAGENS
// ==========================================================

function mostrarMensagem(
    texto,
    tipo
) {

    const el =
        document.getElementById("mensagem");


    if (!el) return;


    el.className =
        "alert alert-" + tipo;


    el.textContent =
        texto;


    el.classList.remove(
        "d-none"
    );


    setTimeout(() => {

        el.classList.add(
            "d-none"
        );

    }, 5000);

}


// ==========================================================
// GERENCIAR USUÁRIOS
// ==========================================================

async function carregarUsuarios() {

    const lista =
        document.getElementById("lista-usuarios");

    if (!lista) return;


    try {

        const snapshot =
            await db
                .collection("usuarios")
                .get();


        if (snapshot.empty) {

            lista.innerHTML = `
                <li class="list-group-item">
                    Nenhum usuário cadastrado.
                </li>
            `;

            return;
        }


        let html = "";


        snapshot.forEach((doc) => {

            const u = doc.data();

            const email =
                u.email ||
                "Email não disponível";

            const isAdmin =
                u.perfil === "admin";


            html += `

                <li class="list-group-item
                    d-flex
                    justify-content-between
                    align-items-center">

                    <span>
                        👤 ${escaparHTML(email)}
                    </span>

                    ${
                        isAdmin

                        ?

                        `
                        <span class="badge bg-success">
                            ADMIN
                        </span>
                        `

                        :

                        `
                        <button
                            class="btn btn-sm btn-outline-success"
                            onclick='promover(${JSON.stringify(doc.id)})'
                        >
                            Tornar Admin
                        </button>
                        `
                    }

                </li>

            `;

        });


        lista.innerHTML =
            html;

    }

    catch (error) {

        console.error(
            "Erro ao carregar usuários:",
            error
        );

        mostrarMensagem(
            "Erro ao carregar usuários: " +
            obterMensagemErro(error),
            "danger"
        );

    }

}


// ==========================================================
// PROMOVER USUÁRIO
// ==========================================================

async function promover(uid) {

    const confirmar =
        confirm(
            "Deseja tornar este usuário administrador?"
        );


    if (!confirmar) {
        return;
    }


    try {

        await db
            .collection("usuarios")
            .doc(uid)
            .update({
                perfil: "admin"
            });


        mostrarMensagem(
            "Usuário promovido a administrador!",
            "success"
        );


        carregarUsuarios();

    }

    catch (error) {

        console.error(
            "Erro ao promover usuário:",
            error
        );

        mostrarMensagem(
            "Erro ao promover usuário: " +
            obterMensagemErro(error),
            "danger"
        );

    }

}


// ==========================================================
// TRATAMENTO DE ERROS DO FIREBASE
// ==========================================================

function obterMensagemErro(error) {

    if (!error) {
        return "Erro desconhecido.";
    }


    switch (error.code) {

        case "permission-denied":
            return "Permissão negada pelo Firebase.";

        case "storage/unauthorized":
            return "Sem permissão para enviar a imagem.";

        case "storage/canceled":
            return "Upload da imagem cancelado.";

        case "storage/quota-exceeded":
            return "Limite de armazenamento excedido.";

        case "storage/unknown":
            return "Erro desconhecido no armazenamento.";

        case "unavailable":
            return "Firebase temporariamente indisponível.";

        case "failed-precondition":
            return "Operação não pode ser realizada no estado atual.";

        default:
            return error.message ||
                "Ocorreu um erro inesperado.";
    }

}


// ==========================================================
// PROTEÇÃO CONTRA HTML INJETADO
// ==========================================================

function escaparHTML(texto) {

    return String(texto)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}