import express from 'express';
import { createServer as createHttpServer } from "node:http";
import { Server, Socket } from 'socket.io';

const app = express();
const server = createHttpServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.get('/', (req, res) => res.send("This is magicode server"));

export const createServer = ( port: number, listener: (socket: Socket) => void ) => {
    io.on('connection', listener);
    server.listen(port, () => {
        console.log(`server running at http://localhost:${port}`);
    });
}
