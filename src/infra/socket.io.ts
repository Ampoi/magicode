import { io } from 'socket.io-client';
import { serverAddress } from '../util/serverAddress';

export const socket = io(serverAddress.value)