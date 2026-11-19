import { io } from 'socket.io-client';
import axios from './axios';

const socketUrl = import.meta.env.VITE_API_URL
  || (import.meta.env.DEV ? 'http://localhost:5002' : window.location.origin);
const socket = io(socketUrl, {
  autoConnect: false,
  path: '/api/socket.io',
  transports: ['websocket'],
  auth: (callback) => {
    axios.get('/api/auth/socket-token')
      .then(({ data }) => callback({ token: data.token }))
      .catch((error) => {
        console.error('Unable to authenticate realtime connection:', error.message);
        callback({ token: '' });
      });
  }
});

export default socket;
