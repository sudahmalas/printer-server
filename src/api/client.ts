import axios from 'axios';

const client = axios.create({
  baseURL: 'http://127.0.0.1:18181', // local Express print server
  timeout: 10000,
});

export default client;
