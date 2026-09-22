
let usuarioAtual = null;
let carrinho = [];
let produtosOriginais = [];

// ===============================
// LOGIN
// ===============================

function abrirLogin() {
    const modalElement = document.getElementById("loginModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function login() {
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    if (!email || !senha) {
        alert("Digite o e-mail e a senha.");
        return;
    }

    auth.signInWithEmailAndPassword(email, senha)
        .then((cred) => {
            console.log("Login realizado com sucesso:", cred.user.email);

            const modal = bootstrap.Modal.getInstance(
                document.getElementById("loginModal")
            );

            if (modal) {
                modal.hide();
            }
        })
        .catch((error) => {
            console.error("Erro completo no login:", error);

            let mensagem = "Erro ao fazer login.";

            switch (error.code) {
                case "auth/invalid-email":
                    mensagem = "O e-mail informado é inválido.";
                    break;

                case "auth/user-not-found":
                    mensagem = "Usuário não encontrado.";
                    break;

                case "auth/wrong-password":
                    mensagem = "Senha incorreta.";
                    break;

                case "auth/invalid-credential":
                    mensagem = "E-mail ou senha incorretos.";
                    break;

                case "auth/user-disabled":
                    mensagem = "Este usuário foi desativado.";
                    break;

                case "auth/too-many-requests":
                    mensagem = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
                    break;

                case "auth/network-request-failed":
                    mensagem = "Erro de conexão com o Firebase.";
                    break;

                default:
                    mensagem = "Erro ao fazer login: " + error.message;
            }

            alert(mensagem);
        });
}


// ===============================
// CADASTRO
// ===============================

function cadastrar() {
    const email = document.getElementById("emailCadastro").value.trim();
    const senha = document.getElementById("senhaCadastro").value;

    if (!email || !senha) {
        alert("Digite um e-mail e uma senha.");
        return;
    }

    auth.createUserWithEmailAndPassword(email, senha)
        .then((cred) => {
            return db.collection("usuarios")
                .doc(cred.user.uid)
                .set({
                    email: email,
                    perfil: "cliente"
                });
        })
        .then(() => {
            alert("Cadastro realizado com sucesso!");

            const modal = bootstrap.Modal.getInstance(
                document.getElementById("loginModal")
            );

            if (modal) {
                modal.hide();
            }
        })
        .catch((error) => {
            console.error("Erro ao cadastrar:", error);

            alert("Erro ao cadastrar: " + error.message);
        });
}


// ===============================
// LOGOUT
// ===============================

function logout() {
    auth.signOut()
        .then(() => {
            console.log("Usuário desconectado.");
        })
        .catch((error) => {
            console.error("Erro ao sair:", error);
            alert("Erro ao sair: " + error.message);
        });
}


// ===============================
// ESTADO DE AUTENTICAÇÃO
// ===============================

auth.onAuthStateChanged((user) => {
    usuarioAtual = user;

    const btnLogin = document.getElementById("btn-login");
    const btnLogout = document.getElementById("btn-logout");
    const btnAdmin = document.getElementById("btn-admin");

    if (btnLogin) {
        btnLogin.classList.toggle("d-none", !!user);
    }

    if (btnLogout) {
        btnLogout.classList.toggle("d-none", !user);
    }

    // Esconde o botão Admin inicialmente
    if (btnAdmin) {
        btnAdmin.classList.add("d-none");
    }

    if (!user) {
        console.log("Nenhum usuário autenticado.");
        return;
    }

    console.log("Usuário autenticado:", user.email);
    console.log("UID:", user.uid);

    db.collection("usuarios")
        .doc(user.uid)
        .get()
        .then((doc) => {
            if (!doc.exists) {
                console.warn("Documento do usuário não existe no Firestore.");
                return;
            }

            const dados = doc.data();

            console.log("Dados do usuário:", dados);

            if (dados.perfil === "admin") {
                if (btnAdmin) {
                    btnAdmin.classList.remove("d-none");
                }

                console.log("Usuário é administrador.");
            } else {
                console.log("Usuário é cliente.");
            }
        })
        .catch((error) => {
            console.error("Erro ao consultar usuário:", error);
        });
});


// ===============================
// CARRINHO
// ===============================

function adicionarAoCarrinho(produto) {
    if (!usuarioAtual) {
        abrirLogin();
        return;
    }

    carrinho.push(produto);
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const ul = document.getElementById("carrinho");

    if (!ul) return;

    ul.innerHTML = "";

    carrinho.forEach((p) => {
        const li = document.createElement("li");

        li.className = "list-group-item";

        li.textContent =
            `${p.nome} - R$ ${Number(p.preco).toFixed(2)}`;

        ul.appendChild(li);
    });
}

function finalizarCompra() {
    if (!usuarioAtual) {
        abrirLogin();
        return;
    }

    if (carrinho.length === 0) {
        alert("Carrinho vazio.");
        return;
    }

    db.collection("compras")
        .add({
            uid: usuarioAtual.uid,
            itens: carrinho,
            data: new Date()
        })
        .then(() => {
            alert("Compra registrada!");

            carrinho = [];
            renderizarCarrinho();
        })
        .catch((error) => {
            console.error("Erro ao registrar compra:", error);
            alert("Erro ao registrar compra: " + error.message);
        });
}


// ===============================
// PRODUTOS
// ===============================

function carregarProdutos() {
    db.collection("produtos")
        .get()
        .then((snapshot) => {
            produtosOriginais = [];

            snapshot.forEach((doc) => {
                const p = doc.data();

                console.log("Produto carregado:", p);

                produtosOriginais.push(p);
            });

            console.log(
                "Renderizando",
                produtosOriginais.length,
                "produtos..."
            );

            renderizarProdutos(produtosOriginais);
        })
        .catch((error) => {
            console.error("Erro ao carregar produtos:", error);

            const container = document.getElementById("produtos");

            if (container) {
                container.innerHTML =
                    "<p class='text-danger'>Erro ao carregar produtos. Verifique o console.</p>";
            }
        });
}


// ===============================
// FILTROS
// ===============================

function aplicarFiltros() {
    const busca = document
        .getElementById("busca")
        .value
        .toLowerCase();

    const precoMin = parseFloat(
        document.getElementById("precoMin").value
    );

    const precoMax = parseFloat(
        document.getElementById("precoMax").value
    );

    const filtrados = produtosOriginais.filter((p) => {
        const nome = String(p.nome || "").toLowerCase();

        const preco = Number(p.preco);

        const nomeOk = nome.includes(busca);

        const precoMinOk =
            isNaN(precoMin) || preco >= precoMin;

        const precoMaxOk =
            isNaN(precoMax) || preco <= precoMax;

        return nomeOk && precoMinOk && precoMaxOk;
    });

    renderizarProdutos(filtrados);
}


// ===============================
// RENDERIZAR PRODUTOS
// ===============================

function renderizarProdutos(lista) {
    const container = document.getElementById("produtos");

    if (!container) return;

    let html = "";

    lista.forEach((p) => {
        const preco = Number(p.preco);

        html += `
            <div class="col-md-4 mb-4">
                <div class="card h-100">

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
                            Preço: R$ ${preco.toFixed(2)}
                        </p>

                        <p class="card-text">
                            Estoque: ${p.estoque ?? 0}
                        </p>

                        <button
                            class="btn btn-primary w-100"
                            onclick='adicionarAoCarrinho(${JSON.stringify(p)})'
                        >
                            Comprar
                        </button>

                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}


// ===============================
// PROMOVER USUÁRIO
// ===============================

function promoverUsuarioParaAdmin() {
    if (!usuarioAtual) {
        alert("Faça login primeiro.");
        return;
    }

    db.collection("usuarios")
        .doc(usuarioAtual.uid)
        .set(
            {
                perfil: "admin"
            },
            {
                merge: true
            }
        )
        .then(() => {
            alert("Usuário promovido a administrador!");
        })
        .catch((error) => {
            console.error("Erro ao promover usuário:", error);
            alert("Erro ao promover usuário: " + error.message);
        });
}


// ===============================
// INICIALIZAÇÃO
// ===============================

document.addEventListener("DOMContentLoaded", () => {
    carregarProdutos();
});
