const express = require("express");
const jwt = require("jsonwebtoken")
const dotEnv = require("dotenv").config();
const cors =require("cors");
const bcrypt = require("bcryptjs")
const mongodb=require("mongodb")
const mongoClient = mongodb.MongoClient;
const nodemailer = require("nodemailer")
const URL =process.env.DATAB;
const DB ="stackoverflow";
const app =express();
app.use(express.json());

app.use(cors({
    origin:"http://localhost:3001"
}))
app.post("/userpost",async function(req,res){
    try {
        const connection = await mongoClient.connect(URL)
    const db = connection.db(DB)
    let uExist =await db.collection('userdata').findOne({email:req.body.email})
    if(uExist){
      res.json({messege:'User already exists'})
    }else{
        let salt = await bcrypt.genSalt(10)
        let hash = await bcrypt.hash(req.body.password,salt)
        req.body.activeStatus =false
        req.body.password=hash
        await db.collection('userdata').insertOne(req.body)
        let user = await db.collection('userdata').findOne({email:req.body.email})
        let token = jwt.sign({_id:user._id},process.env.JCODE)
        await db.collection('userdata').findOneAndUpdate({email:user.email},{$set:{token_id:token}})
        let sender = nodemailer.createTransport({
        
            service:'gmail',
          
            auth: {
               user: "valanrains@gmail.com",
               pass: `${process.env.MLC}`
            },
            debug: false,
            logger: true
        
           });
           let composeEmail={
            from:"valanrains@gmail.com",
            to:`${user.email}`,
            subject:"Activate your account by clicking the link",
            text:`Click the link to verify your account http://localhost:3001/activation?code=${token}`
           }
            sender.sendMail(composeEmail,(err)=>{
                if(err){
                    console.log("Error found",err)
                }else{
                    console.log("Mail sent")
                }
            })
        res.json({messege:"User updated and a mail have been sent to your mail id to activate your account"})
    }
    
    await connection.close()
    
    } catch (error) {
        res.status(500).json({messege:'Internal server error'})
        console.log(error)
    }
    
    
    
    })
    app.get('/token-verifi',async(req,res)=>{
        try {
            const connection = await mongoClient.connect(URL);
        const db =connection.db(DB);
        let userD =await db.collection('userdata').findOne({token_id:req.headers.auth})
        if(!userD.activeStatus){
            await db.collection('userdata').findOneAndUpdate({token_id:req.headers.auth},{$set:{activeStatus:true}})
            res.json({messege:'account activated'})
        }
        else if(userD.activeStatus){
            res.json({messege:"your account is already activated"})
        }
        await connection.close()
        
        } catch (error) {
            console.log(error)
            res.json({messege:'error'})
        }
        })
        let authenticate =(req,res,next)=>{
            let decode = jwt.verify(req.headers.auth,"df4r8f484edffwef")
if(decode){
next();
}
else if(!decode){
    res.status(401).json({messege:'Unauthorized'})
}
        }
        app.post('/loginc',async (req,res)=>{
            const connection =await mongoClient.connect(URL);
            const db = connection.db(DB);
         let sUser= await  db.collection('userdata').findOne({email:req.body.email})
         if(sUser){
            if(sUser.activeStatus){
                
                let compare = await bcrypt.compare(req.body.password,sUser.password);
                if(compare){
                    let token = jwt.sign({_id:sUser.id},"df4r8f484edffwef",{expiresIn:'100m'})
                    res.json({token:token,fName:sUser.firstName,sName:sUser.lastName,userId:sUser._id})
                }else{
                    res.json({messege:'Username/password is invalid'})
                }
            }else{
                res.json({messege:'verify your emailId'})
            }
            
         }else{
            res.json({messege:'Username/password is invalid'})
         }
        await connection.close();
        })
app.get('/userDet',authenticate,async(req,res)=>{
   try {
    const connection =await mongoClient.connect(URL)
    const db = connection.db(DB);
    let userData = await db.collection('userdata').findOne({_id:mongodb.ObjectId(req.headers.userid)})
    res.status(200).json({user:userData})
   await connection.close()
   } catch (error) {
    console.log(error)
   }
})
    app.post('/ques-post',authenticate,async(req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            let userdata = await db.collection('userdata').findOne({_id:mongodb.ObjectId(req.headers.userid)})
           
            req.body.userid = mongodb.ObjectId(req.headers.userid)
            req.body.userName = `${userdata.firstName} ${userdata.lastName}`
             await db.collection('questions').insertOne(req.body)
            res.status(200).json({messege:'Question posted'})
           await connection.close()
           } catch (error) {
            console.log(error)
           }
    })    

    app.get('/get-ques',authenticate,async(req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            req.body.userid = mongodb.ObjectId(req.headers.userid)
            let userData = await db.collection('questions').find({userid:mongodb.ObjectId(req.headers.userid)}).toArray()
            
            res.status(200).json(userData)
           await connection.close()
           } catch (error) {
            console.log(error)
           }
    })
    app.get('/all-ques',authenticate,async(req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            
            let userData = await db.collection('questions').find({}).toArray()
           
            res.json({questions:userData})
           await connection.close()
           } catch (error) {
            console.log(error)
           }
    })
    app.get('/ques/:id',authenticate,async (req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            console.log(req.params.id)
            console.log(mongodb.ObjectId(req.params.id))
            let userData = await db.collection('questions').findOne({_id:mongodb.ObjectId(req.params.id)})
           
            res.json({question:userData})
           await connection.close()
           } catch (error) {
            console.log(error)
           }
    })
    app.put('/cmtpost/:id',authenticate, async(req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            console.log(req.params.id)
            let userData = await db.collection('questions').findOneAndUpdate({_id:mongodb.ObjectId(req.params.id)},{$push:{comments:req.body}})
           
            res.json({question:userData})
           await connection.close()
           } catch (error) {
            console.log(error)
           }
    })
    app.get('/positive-vote/:id',authenticate, async(req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            
            let userData = await db.collection('questions').findOne({_id:mongodb.ObjectId(req.params.id),votes:mongodb.ObjectId(req.headers.userid)})
           console.log(userData) 
           if(!userData){
            await db.collection('questions').findOneAndUpdate({_id:mongodb.ObjectId(req.params.id)},{$push:{votes:mongodb.ObjectId(req.headers.userid)}})
            res.json({messege:"voted"})
           }
           else if(userData){
        res.json({messege:"you have already voted"})
           }
            
           await connection.close()
           } catch (error) {
            console.log(error)
           }
    })
    app.delete('/negative-vote/:id',authenticate, async(req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            //Check this tomorrow vote can be deleted by anyone
            let userData = await db.collection('questions').findOne({_id:mongodb.ObjectId(req.params.id),votes:mongodb.ObjectId(req.headers.userid)})
            console.log(userData)
           if(userData){
            await db.collection('questions').findOneAndUpdate({_id:mongodb.ObjectId(req.params.id)},{$pull:{votes:mongodb.ObjectId(req.headers.userid)}})
            res.json({messege:"vote removed"})
           }
           else if(!userData){
        res.json({messege:"you haven't already voted"})
           }
            
           await connection.close()
           } catch (error) {
            console.log(error)
           }
    })

    // to view count 
    app.get('/view-count/:id',authenticate, async(req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            //Check this tomorrow vote can be deleted by anyone
            let userData = await db.collection('questions').findOne({_id:mongodb.ObjectId(req.params.id),views:mongodb.ObjectId(req.headers.userid)})
            console.log(userData)
           if(!userData){
            await db.collection('questions').findOneAndUpdate({_id:mongodb.ObjectId(req.params.id)},{$push:{views:mongodb.ObjectId(req.headers.userid)}})
            res.json({messege:"view added"})
           }
           else if(userData){
        res.json({messege:"you haven't already viewed"})
           }
            
           await connection.close()
           } catch (error) {
            console.log(error)
           }
    })

    // search 
    app.post('/search',authenticate, async(req,res)=>{
        try {
            const connection =await mongoClient.connect(URL)
            const db = connection.db(DB);
            //Check this tomorrow vote can be deleted by anyone
            //db.products.find( { description: { $regex: /^S/, $options: 'm' } } )

            let regex = new RegExp(`.*${req.body.tag}.*`)
            console.log(regex)
            let userData = await db.collection('questions').find({tags:{$regex:regex , $options:'i'}}).toArray()
         
           console.log(regex)
            
           await connection.close()
           res.json(userData)
           } catch (error) {
            console.log(error)
           }
    })
        /// pass verification
app.post("/verify-email", async function(req,res){
    try {
        const connection = await mongoClient.connect(URL);

    const db = connection.db(DB);

   let mail = await db.collection("userdata").findOne({email:req.body.email});
   
   

if(mail){

    let token = jwt.sign({_id:mail._id},process.env.JCODE)
    await db.collection("userdata").findOneAndUpdate({_id:mail._id},{$set:{token_id:token}})
   let sender = nodemailer.createTransport({
    
    service:'gmail',
  
    auth: {
       user: "valanrains@gmail.com",
       pass: `${process.env.MLC}`
    },
    debug: false,
    logger: true

   });
  
   let composeEmail={
    from:"valanrains@gmail.com",
    to:`${mail.email}`,
    subject:"Reseting the password",
    text:`http://localhost:3001/passreset?code=${token}`
   }
    sender.sendMail(composeEmail,(err)=>{
        if(err){
            console.log("Error found",err)
        }else{
            console.log("Mail sent")
        }
    })
    
    res.json({messege:"Email have been sent to your mail id"})
}else{
    res.json({messege:"User not found"})
}
await connection.close();
    } catch (error) {
        console.log(error)
        res.status(500).json({messege:"something went wrong"})

    }
    
    
});

app.get("/token-verify",async function(req,res){
    try {
        let connection = await mongoClient.connect(URL)
let db = connection.db(DB)

let data = await db.collection("userdata").findOne({token_id:req.headers.authorization})

await connection.close()

if(data){
    
    res.status(200).json({userF:data._id})
}
else{
    res.status(404).json({messege:"Not authorised"})
}
    
    } catch (error) {
        res.status(404).json({messege:"404 Not found"})
    }

});

app.put("/update", async function(req,res){
   try {
    const connection = await mongoClient.connect(URL);
    let db = connection.db(DB);
    let salt = await bcrypt.genSalt(10);
    let hash = await bcrypt.hash(req.body.password,salt);
    
  let updated =await  db.collection("userdata").findOneAndUpdate({token_id:req.headers.authorization},{$set:{password:hash}});
  if(updated){
    await db.collection('userdata').findOneAndUpdate({token_id:req.headers.authorization},{$unset:{token_id:""}})
  }
  await connection.close()
  res.json({messege:"done"})
   } catch (error) {
    console.log(error)
    res.json({messege:"something went down"})
   }

})

app.listen( 3000);
