const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const userRoutes = require('./routes/UserRoutes');
const cors = require('cors');
require('./config/Passport'); // Import passport config
const Message = require('./models/MessageModel');
const Friend = require('./models/FriendsModel')
const Group = require('./models/GroupModel');
const { timeStamp } = require('console');

dotenv.config();
const app = express();
const port = 4000;
const server = http.createServer(app);

const io = new Server(server,{
    cors:{
        origin:"http://localhost:3000",        
    }
})
// store connected users
let users ={};
let friends = {};  // New object to track friendships
io.on('connection',(socket)=>{
    console.log(`User connected:${socket.id}`);  

    //User joins with a username
    socket.on('join', async({ username, socketId, profilePic }) => {
        users[username] = { socketId, profilePic }; // Store both username and profilePic
        console.log(`${username} joined with ID: ${socket.id}`);

        // Set user online in MongoDB
        await Friend.updateMany(
            { 'friends.username': username },
            { $set: { 'friends.$.isOnline': true } }
        );

        // Send updated user list with username and profilePic
        io.emit('user list', Object.entries(users).map(([name, data]) => ({
            username: name,
            profilePic: data.profilePic,
            online: true
        })));
    });

      // Create or join a group
      socket.on('join group', async ({ groupName, username }) => {
        let group = await Group.findOne({ groupName });

        if (!group) {
            group = new Group({ groupName, members: [username], messages: [] });
        } else if (!group.members.includes(username)) {
            group.members.push(username);
        }

        await group.save();
        socket.join(groupName);

        io.to(groupName).emit('group update', group);
    });

    // Send message in group chat
    socket.on('group message', async ({ groupName, sender, message }) => {
        const group = await Group.findOne({ groupName });
        if (!group) return;

        const newMessage = { sender, message, timestamp: new Date() };
        group.messages.push(newMessage);
        await group.save();

        io.to(groupName).emit('receive group message', newMessage);
    });

    // Fetch group chat history
    socket.on('get group history', async ({ groupName }) => {
        const group = await Group.findOne({ groupName });
        if (group) {
            socket.emit('group chat history', group.messages);
        }
    });

    //Handle Private Message
    socket.on('private message',async({sender,receiver,message})=>{     
        const newMessage = new Message({
            sender,
            receiver,
            message
        })
        await newMessage.save();
        const reciverUser = users[receiver];
      
        if(reciverUser){
          io.to(reciverUser.socketId).emit('receive message',{
            sender,
            message,
            timestamp:new Date().toISOString()
          })
        }

        // Efficiently check if the user is already a friend
        const senderFriendExists = await Friend.findOne({
           username: sender,
           'friends.username': receiver
        });

        const receiverFriendExists = await Friend.findOne({
            username: receiver,
            'friends.username': sender
        });

        if (!senderFriendExists) {
            await Friend.updateOne(
                { username: sender },
                { $addToSet: { friends: { username: receiver, profilePic: users[receiver]?.profilePic || '', isOnline: true } } },
                { upsert: true }
            );
        }

        if (!receiverFriendExists) {
            await Friend.updateOne(
                { username: receiver },
                { $addToSet: { friends: { username: sender, profilePic: users[sender]?.profilePic || '', isOnline: true } } },
                { upsert: true }
            );
        }
    })

    socket.on('get friends list', async ({ username }) => {
        const userFriendData = await Friend.findOne({ username });
        socket.emit('friends list', userFriendData ? userFriendData.friends : []);
    });

    //Fetch Chat History
    socket.on('get chat History',async({sender,receiver})=>{       
        const chatHistory = await Message.find({
            $or:[
                {sender,receiver},
                {sender: receiver, receiver:sender}
            ]
        }).sort({timeStamp:1})        
        socket.emit('chat history',chatHistory);
    })

    // Handle Disconnection
    socket.on('logout', async ({ username, socketId }) => {
        console.log(`${username} with socket ID: ${socketId} is disconnected`);
        
        if (users[username]) {
            delete users[username]; // Remove from active users list
        }

        // Set user offline in MongoDB
        await Friend.updateMany(
            { 'friends.username': username },
            { $set: { 'friends.$.isOnline': false } }
        );

        io.emit('user list', Object.entries(users).map(([name, data]) => ({
            username: name,
            profilePic: data.profilePic,
            online: false
        })));
    });
})

app.use(
    cors()
);
//  Correct Middleware Order
app.use(
    session({
        secret: 'secret',
        resave: false,
        saveUninitialized: true,        
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use('/auth', userRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGOOSE_URL)
    .then(() => console.log('MongoDB Connected Successfully'))
    .catch((error) => console.log("Error:", error));

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
