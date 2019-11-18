const http = require("http");
const express = require('express');
const socket = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.Server(app).listen(8080);
const io = socket(server);

const clientes = {}

app.use(express.static(`${__dirname}/../client/`));
app.use(express.static(`${__dirname}/../node_modules/`));

app.get('/', (req, res) => {
    const stream = fs.createReadStream(`${__dirname}/../client/index.html`);
    stream.pipe(res);
})

const newCliente = socket => {
    console.log(`NOVO CLIENTE CONNECTADO => ${socket.id}`);
    clientes[socket.id] = socket;
}

const removeCliente = socket => {
    console.log(`CLIENTE DESCONECTOU => ${socket.id}`);
    delete clientes[socket.id];
}

io.sockets.on('connection', socket => {
    let id = socket.id;

    newCliente(socket);

    socket.on('mousemove', data => {
        data.id = id;
        socket.broadcast.emit('movendo => ', data);
    })

    socket.on('disconnect', () => {
        removeCliente(socket);
        socket.broadcast.emit('clientedesconectou', id);
    });

});

let jogadores = {}, incoparavel;

function entrouNoJogo(socket) {
    // Add jogadores na partida
    jogadores[socket.id] = {
        adversario: incoparavel,
        simbolo: 'X',
        socket: socket,
    }

    if (incoparavel) {
        jogadores[socket.id].simbolo = '0';
        jogadores[incoparavel].adversario = socket.id
        incoparavel = null;
    } else {
        incoparavel = socket.id
    }
}

function getAdversario(socket) {
    if (!jogadores[socket.id].adversario) return;
    console.log(jogadores)
    return jogadores[jogadores[socket.id].adversario].socket;
}

io.on('connection', (socket) => {
    entrouNoJogo(socket);

    if (getAdversario(socket)) {
        socket.emit('inicio', {
            simbolo: jogadores[socket.id].simbolo
        });
        getAdversario(socket).emit('inicio', {
            simbolo: jogadores[getAdversario(socket).id].simbolo
        });
    }

    // Escuta uma mudanca a ser feita e emite um evento para ambos jogadores
    socket.on('mover', function(data) {
        if (!getAdversario(socket)) return;

        socket.emit('fazer', data);
        getAdversario(socket).emit('fazer', data);
    });

    // evento se um dos jogadores sair
    socket.on('disconnect', function() {
        if (getAdversario(socket)) getAdversario(socket).emit('sair')
    })
})
