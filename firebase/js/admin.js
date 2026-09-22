
let usuarioAtual = null;


// ===============================
// VERIFICAÇÃO DE AUTENTICAÇÃO
// ===============================

auth.onAuthStateChanged((user) => {

    console.log("Verificando autenticação do administrador...");

    if (!user) {
        console.log("Nenhum usuário autenticado.");
        window.location.href = "index.html";
        return;
    }

    usuarioAtual = user;

    console.log("Usuário autenticado:", user.email);
    console.log("UID:", user.uid);

    db.collection("usuarios")
        .doc(user.uid)
        .get()
        .then((doc) => {

            if (!doc.exists) {
                alert("Usuário não possui cadastro no sistema.");
                window.location.href = "index.html";
                return;
            }

            const dados = doc.data();

            console.log("Dados do usuário:", dados);

            if (dados.perfil !== "admin") {
                alert("Acesso negado. Este usuário não é administrador.");
                window.location.href = "index.html";
                return;
            }

            console.log("Acesso administrativo autorizado.");

            carregarProdutos();
            carregarUsuarios();
        })
        .catch((error) => {

            console.error(
                "Erro ao verificar administrador:",
                error
            );

            alert(
                "Erro ao verificar suas permissões: " +
                error.message
            );

            window.location.href = "index.html";
        });
});


// ===============================
// IMAGEM
// ===============================

function alternarEntradaImagem() {

    const tipo = document.getElementById("tipoImagem").value;

    document
        .getElementById("imagemURL")
        .classList.toggle("d-none", tipo !== "url");

    document
        .getElementById("imagemArquivo")
        .classList.toggle("d-none", tipo !== "arquivo");
}


// ===============================
// CARREGAR PRODUTOS
// ===============================

function carregarProdutos() {

    db.collection("produtos")
        .get()
        .then((snapshot) => {

            let html = "";

            snapshot.forEach((doc) => {

                const p = doc.data();

                html += `
                    <div class="col-md-4 mb-3">

                        <div class="card">

                            <img
                                src="${p.imagem || "https://via.placeholder.com/300x200"}"
                                class="card-img-top"
                                alt="${p.nome || "Produto"}"
                            >

                            <div class="card-body">

                                <h5 class="card-title">
                                    ${p.nome || "Produto"}
                                </h5>

                                <p class="card-text">
                                    Preço: R$ ${Number(p.preco).toFixed(2)}
                                </p>

                                <p class="card-text">
                                    Estoque: ${p.estoque ?? 0}
                                </p>

                                <button
                                    class="btn btn-sm btn-warning me-2"
                                    onclick="editarProduto(
                                        '${doc.id}',
                                        '${String(p.nome || "").replace(/'/g, "\\'")}',
                                        ${Number(p.preco)},
                                        ${Number(p.estoque)},
                                        '${String(p.imagem || "").replace(/'/g, "\\'")}'
                                    )"
                                >
                                    Editar
                                </button>

                                <button
                                    class="btn btn-sm btn-danger"
                                    onclick="excluirProduto('${doc.id}')"
                                >
                                    Excluir
                                </button>

                            </div>
                        </div>

                    </div>
                `;
            });

            document.getElementById("lista-produtos").innerHTML = html;

            mostrarMensagem(
                "Produtos carregados com sucesso.",
                "info"
            );
        })
        .catch((error) => {

            console.error(
                "Erro ao carregar produtos:",
                error
            );

            mostrarMensagem(
                "Erro ao carregar produtos.",
                "danger"
            );
        });
}


// ===============================
// FORMULÁRIO
// ===============================

function mostrarFormulario() {

    document
        .getElementById("form-produto")
        .classList.remove("d-none");

    document.getElementById("id-produto").value = "";
    document.getElementById("nome").value = "";
    document.getElementById("preco").value = "";
    document.getElementById("estoque").value = "";
    document.getElementById("imagemURL").value = "";
    document.getElementById("imagemArquivo").value = "";

    document.getElementById("tipoImagem").value = "url";

    alternarEntradaImagem();
}


function cancelarFormulario() {

    document
        .getElementById("form-produto")
        .classList.add("d-none");
}


// ===============================
// SALVAR PRODUTO
// ===============================

function salvarProduto() {

    const id =
        document.getElementById("id-produto").value;

    const nome =
        document.getElementById("nome").value.trim();

    const preco =
        parseFloat(
            document.getElementById("preco").value
        );

    const estoque =
        parseInt(
            document.getElementById("estoque").value
        );

    const tipoImagem =
        document.getElementById("tipoImagem").value;

    const imagemURL =
        document.getElementById("imagemURL").value.trim();

    const imagemArquivo =
        document.getElementById("imagemArquivo").files[0];


    if (!nome || isNaN(preco) || isNaN(estoque)) {

        alert(
            "Preencha corretamente nome, preço e estoque."
        );

        return;
    }


    if (tipoImagem === "url" && imagemURL) {

        const dados = {
            nome: nome,
            preco: preco,
            estoque: estoque,
            imagem: imagemURL
        };

        salvarOuAtualizar(id, dados);

        return;
    }


    if (tipoImagem === "arquivo" && imagemArquivo) {

        const storageRef =
            storage.ref("produtos/" + imagemArquivo.name);

        storageRef
            .put(imagemArquivo)
            .then((snapshot) => {

                return snapshot.ref.getDownloadURL();

            })
            .then((url) => {

                const dados = {
                    nome: nome,
                    preco: preco,
                    estoque: estoque,
                    imagem: url
                };

                salvarOuAtualizar(id, dados);

            })
            .catch((error) => {

                console.error(
                    "Erro ao enviar imagem:",
                    error
                );

                alert(
                    "Erro ao enviar imagem: " +
                    error.message
                );
            });

        return;
    }


    alert(
        "Selecione um tipo de imagem válido e preencha o campo corretamente."
    );
}


// ===============================
// SALVAR OU ATUALIZAR
// ===============================

function salvarOuAtualizar(id, dados) {

    let operacao;

    if (id) {

        operacao =
            db.collection("produtos")
                .doc(id)
                .update(dados);

    } else {

        operacao =
            db.collection("produtos")
                .add(dados);
    }


    operacao
        .then(() => {

            mostrarMensagem(
                id
                    ? "Produto atualizado com sucesso!"
                    : "Produto adicionado com sucesso!",
                "success"
            );

            cancelarFormulario();
            carregarProdutos();

        })
        .catch((error) => {

            console.error(
                "Erro ao salvar produto:",
                error
            );

            mostrarMensagem(
                "Erro ao salvar produto: " +
                error.message,
                "danger"
            );
        });
}


// ===============================
// EDITAR PRODUTO
// ===============================

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

    document.getElementById("id-produto").value = id;
    document.getElementById("nome").value = nome;
    document.getElementById("preco").value = preco;
    document.getElementById("estoque").value = estoque;
    document.getElementById("imagemURL").value = imagem;

    document.getElementById("tipoImagem").value = "url";

    alternarEntradaImagem();
}


// ===============================
// EXCLUIR PRODUTO
// ===============================

function excluirProduto(id) {

    if (!confirm("Deseja excluir este produto?")) {
        return;
    }

    db.collection("produtos")
        .doc(id)
        .delete()
        .then(() => {

            mostrarMensagem(
                "Produto excluído com sucesso!",
                "danger"
            );

            carregarProdutos();

        })
        .catch((error) => {

            console.error(
                "Erro ao excluir produto:",
                error
            );

            mostrarMensagem(
                "Erro ao excluir produto: " +
                error.message,
                "danger"
            );
        });
}


// ===============================
// MENSAGENS
// ===============================

function mostrarMensagem(texto, tipo) {

    const el =
        document.getElementById("mensagem");

    el.className =
        "alert alert-" + tipo;

    el.textContent = texto;

    el.classList.remove("d-none");

    setTimeout(() => {
        el.classList.add("d-none");
    }, 3000);
}


// ===============================
// USUÁRIOS
// ===============================

function carregarUsuarios() {

    db.collection("usuarios")
        .get()
        .then((snapshot) => {

            let html = "";

            snapshot.forEach((doc) => {

                const u = doc.data();

                const email =
                    u.email || "Email não disponível";

                const isAdmin =
                    u.perfil === "admin";


                html += `
                    <li class="list-group-item d-flex justify-content-between align-items-center">

                        ${email}

                        ${
                            isAdmin
                                ? '<span class="badge bg-success">Admin</span>'
                                : `<button
                                    class="btn btn-sm btn-outline-success"
                                    onclick="promover('${doc.id}')"
                                  >
                                    Tornar Admin
                                  </button>`
                        }

                    </li>
                `;
            });

            document.getElementById(
                "lista-usuarios"
            ).innerHTML = html;

        })
        .catch((error) => {

            console.error(
                "Erro ao carregar usuários:",
                error
            );

            mostrarMensagem(
                "Erro ao carregar usuários: " +
                error.message,
                "danger"
            );
        });
}


// ===============================
// PROMOVER USUÁRIO
// ===============================

function promover(uid) {

    db.collection("usuarios")
        .doc(uid)
        .update({
            perfil: "admin"
        })
        .then(() => {

            mostrarMensagem(
                "Usuário promovido a admin.",
                "success"
            );

            carregarUsuarios();

        })
        .catch((error) => {

            console.error(
                "Erro ao promover usuário:",
                error
            );

            mostrarMensagem(
                "Erro ao promover usuário: " +
                error.message,
                "danger"
            );
        });
}

