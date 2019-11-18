const url = window.location.origin;
let socket = io.connect(url)

let minhaVez = true, simbolo;

function getBordaState() {
    let obj = {};

    $('.borda button').each(() => {
        obj[$(this).attr('id')] = $(this).text() || '';
    })

    return obj
}

function isGameOver() {
    let estado = getBordaState(),
    // uma das linhas deve ser igual a qualquer um desses valores
    // para que o jogo termine
    testes = ['XXX', '000'],
    // possibilidades
    rows = [
      estado.a0 + estado.a1 + estado.a2,
      estado.b0 + estado.b1 + estado.b2,
      estado.c0 + estado.c1 + estado.c2,
      estado.a0 + estado.b1 + estado.c2,
      estado.a2 + estado.b1 + estado.c0,
      estado.a0 + estado.b0 + estado.c0,
      estado.a1 + estado.b1 + estado.c1,
      estado.a2 + estado.b2 + estado.c2
    ];
    // for para comparar linhas e ver se os valores correspodem
    for (let i = 0; i < rows.length; i++) {
        if (rows[i] === testes[0] || rows === testes[1]) return true
    }
}

function renderMensagem() {
    // Desativa o tabuleiro do oponente
    if (!minhaVez) {
        $('#mensagem').text('Vez do seu oponente');
        $('.borda button').attr('disabled', true);
    // ativa o quadro se for sua vez
    } else {
        $('#mensagem').text('Sua vez.');
        $('.borda button').removeAttr('disabled');
    }
}

function move(e) {
    e.preventDefault();

    // nao e sua vez
    if(!minhaVez) return

    // espaco marcado
    if ($(this).text().length) return

    // manda pro server a mudanca
    socket.emit('mover', {
        simbolo: simbolo,
        posicao: $(this).attr('id')
    });
}

// evento chamado qnd jogador faz um movimento
socket.on('fazer', function(data) {
    // render o movimento
    $(`#${data.posicao}`).text(data.simbolo);

    minhaVez = data.simbolo !== simbolo;

    if (!isGameOver()) {
        renderMensagem();
    } else {
        if (minhaVez) {
            $('#mensagem').text('Game over, Voce perdeu :(');
        } else {
            $('#mensagem').text('Game over, Voce Ganhou :)');
        }

        $('.borda button').attr('disabled', true);
    }
});

socket.on("inicio", function(data) {
    simbolo = data.simbolo;
  
    minhaVez = simbolo === "X";
    renderMensagem();
});

socket.on('sair', function() {
    $('#mensagem').text('Seu adversario saiu do jogo');
    $('.borda button').attr('disabled', true);
});

$(function() {
    $('.borda button').attr('disabled', true);
    $('.borda> button').on('click', move)
})
