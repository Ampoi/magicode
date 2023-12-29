import express from 'express';
import { createServer as createHttpServer } from "node:http";
import { Server, ServerOptions, Socket } from 'socket.io';

export const createServer = ( port: number, listener: (socket: Socket) => void, opts?: Partial<ServerOptions> ) => {
    const app = express();
    const server = createHttpServer(app);
    const io = new Server(server, opts);
    
    app.get('/', (req, res) => res.send("This is magicode server"));

    io.on('connection', listener);
    server.listen(port, () => {
        console.log(`server running at http://localhost:${port}`);
    });
}