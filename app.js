const express=require("express");
const app=express();
const indexRouter=require("./routes/index")
const path=require("path")


//setting up socket io
//since socket io cannot run on spp server , we create a http server to run it.

const http=require("http");
const socketIO=require("socket.io");
const server=http.createServer(app);//app server  ka use karke http ka server banao 
const io=socketIO(server);


let waitingusers=[];
let rooms={
    //uniqueRoomName=[person1,person2]//both the persons are chatting with each other

}

//when the browser open a request from frontend automatically comes ..
//server can access it using io.on 
io.on("connection",function(socket){ //the parameter socket contains all the details of the requesting user 
    //console.log("connected from the web browser")

    //jaise hi connect ho waise hi koi 2 bande sirf aapas me baat kar paye //in short 2 bando ka ek room ban jaye
    socket.on("joinroom",function(){
        //console.log("Reqest for joining");
        if(waitingusers.length >0){
            //minimum one user is present at a time 
            let partner=waitingusers.shift(); //this will give the first user in the array and remove it from the array
            const roomname=`${socket.id}-${partner.id}`; //making a unique room namev
            socket.join(roomname); //You or user 1 join in this room
            partner.join(roomname); //user2 join in this room 


            //sending msg to this room 
            io.to(roomname).emit("joined",roomname) //roomname also should be sended
        }
        else{
            waitingusers.push(socket);//push yourself
        }
    })
    socket.on("signalingMessage",function(data){
        socket.broadcast.to(data.room).emit("signalingMessage",data.message) //jo bhi data aaya mere pass se usko haamare room me broadcast kar do 
    })

    socket.on("message",function(data){
        //console.log(data)
        socket.broadcast.to(data.room).emit("message",data.message); //jo bhi hame msg recieve hua usko broadcast karo room me message name se 
    })



    socket.on("startVideoCall",function({room}){
        socket.broadcast.to(room).emit("incomingCall")
    })

    socket.on("acceptCall",function({room}){
        socket.broadcast.to(room).emit("callAccepted");

    })
    socket.on("rejectCall",function({room}){
        socket.broadcast.to(room).emit("callRejected");
    })

    socket.on("disconnect",function(){
        let indexofUserDisconnected=waitingusers.findIndex(waitingUser =>waitingUser.id === socket.id);
        waitingusers.splice(indexofUserDisconnected,1); //remove the user from the waiting list 
    })
})





app.set("view engine","ejs");
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,"public")));


app.use("/",indexRouter);




server.listen(process.env.PORT || 3000);