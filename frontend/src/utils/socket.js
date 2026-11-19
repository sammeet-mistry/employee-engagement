import { io } from 'socket.io-client';
import axios from './axios';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5002', {
  autoConnect: false,
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
