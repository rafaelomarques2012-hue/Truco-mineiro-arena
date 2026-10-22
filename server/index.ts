import { createServer } from "node:http";
import { Server } from "socket.io";
import { randomUUID } from "node:crypto";
import { createDeck, shuffle, deal, type Card } from "../src/game/engine";

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:5173", methods: ["GET", "POST"] }
});
type Room = { id: string; players: Map<string,{ userId:string; name:string }>; hands: Map<string,Card[]>; status:"waiting"|"playing" };
const rooms = new Map<string,Room>();

io.on("connection", socket => {
  // Demo identity only. Production must verify a signed session/JWT before accepting events.
  socket.on("room:create", ({ name }: {name:string}, ack?: (r:unknown)=>void) => {
    const id = randomUUID().slice(0,8).toUpperCase();
    const room:Room={id,players:new Map([[socket.id,{userId:socket.id,name:String(name||"Jogador").slice(0,24)}]]),hands:new Map(),status:"waiting"};
    rooms.set(id,room); socket.join(id); ack?.({ok:true,roomId:id,players:1});
  });
  socket.on("room:join", ({ roomId,name }: {roomId:string;name:string}, ack?: (r:unknown)=>void) => {
    const room=rooms.get(String(roomId).toUpperCase());
    if(!room) return ack?.({ok:false,error:"Sala não encontrada."});
    if(room.status!=="waiting" || room.players.size>=4) return ack?.({ok:false,error:"Sala cheia ou em andamento."});
    room.players.set(socket.id,{userId:socket.id,name:String(name||"Jogador").slice(0,24)});
    socket.join(room.id);
    io.to(room.id).emit("room:update",{roomId:room.id,players:[...room.players.values()],status:room.status});
    ack?.({ok:true,roomId:room.id,players:room.players.size});
  });
  socket.on("room:start", ({roomId}: {roomId:string}, ack?: (r:unknown)=>void) => {
    const room=rooms.get(String(roomId).toUpperCase());
    if(!room || !room.players.has(socket.id)) return ack?.({ok:false,error:"Você não pertence a esta sala."});
    if(room.players.size!==2 && room.players.size!==4) return ack?.({ok:false,error:"A sala precisa ter 2 ou 4 jogadores."});
    const deck=shuffle(createDeck()); const hands=deal(deck,room.players.size);
    room.hands.clear(); [...room.players.keys()].forEach((id,i)=>room.hands.set(id,hands[i]));
    room.status="playing";
    // Critical: send each client only their own cards, never opponents' hands.
    for(const id of room.players.keys()) io.to(id).emit("game:started",{roomId:room.id,hand:room.hands.get(id),players:[...room.players.values()],score:[0,0]});
    ack?.({ok:true});
  });
  socket.on("game:play", ({roomId,cardId}: {roomId:string;cardId:string}, ack?: (r:unknown)=>void) => {
    const room=rooms.get(String(roomId).toUpperCase());
    if(!room || room.status!=="playing" || !room.players.has(socket.id)) return ack?.({ok:false,error:"Jogada inválida."});
    const hand=room.hands.get(socket.id) ?? [];
    const card=hand.find(c=>c.id===cardId);
    if(!card) return ack?.({ok:false,error:"Carta não pertence à sua mão."});
    // This transport skeleton validates ownership. Implement turn order, trick resolution,
    // raises and score mutation in a server-owned Match aggregate before production.
    room.hands.set(socket.id,hand.filter(c=>c.id!==cardId));
    io.to(room.id).emit("game:card-played",{playerId:socket.id,cardId});
    socket.emit("game:hand",{hand:room.hands.get(socket.id)});
    ack?.({ok:true});
  });
  socket.on("friend:invite", ({targetSocketId,roomId}:{targetSocketId:string;roomId:string}) => {
    const room=rooms.get(String(roomId).toUpperCase());
    if(!room || !room.players.has(socket.id)) return;
    io.to(targetSocketId).emit("friend:invitation",{from:socket.id,roomId:room.id});
  });
  socket.on("disconnect",()=>{
    for(const [id,room] of rooms){
      if(room.players.delete(socket.id)){
        io.to(id).emit("room:update",{roomId:id,players:[...room.players.values()],status:room.status});
        if(room.players.size===0) rooms.delete(id);
      }
    }
  });
});
const port=Number(process.env.PORT ?? 3001);
httpServer.listen(port,()=>console.log(`Truco Arena Socket.IO em http://localhost:${port}`));
