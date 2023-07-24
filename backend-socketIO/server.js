const io = require('socket.io')(8080,{
    cors:{
        origin:['http://localhost:4200']
    }
});

io.on('connection',(socket)=>{
    console.log(`connected with ${socket.id}`);
})