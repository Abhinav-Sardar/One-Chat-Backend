const express = require('express');
const app = express() ; 
const http = require('http') ; 
const PORT = process.env.PORT || 1919 ; 
const server = http.createServer(app) ; 
const socketio = require('socket.io') ; 
const io = socketio(server) ; 

app.get('/' , (req , res) => {
    res.send('Hello World') ; 
}) ; 

server.listen(PORT , () => {
    console.log('Listening on port ', PORT) ; 
})
