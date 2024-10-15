const express = require("express");
const admin = require("firebase-admin");
const firebase = require("firebase");
const serviceAccount = require("./ServiceAccountKey.json");
const cors = require("cors");
const app = express();
const fs = require("fs");
var busboy = require("connect-busboy");
const fileUpload = require("express-fileupload");
const bodyParser = require("body-parser");

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(busboy());
app.use(cors());
app.use(
    fileUpload({
        useTempFiles: true,
        safeFileNames: true,
        preserveExtension: true,
        tempFileDir: `${__dirname}/public/files/temp`,
    })
);
const port = process.env.PORT || 3003;

// ---------- firebase config ----------
const firebaseConfig = {
    apiKey: "AIzaSyDaEo87ybie_bOjdqK3DyN4RJLJQiapzQo",
    authDomain: "greencycle-db.firebaseapp.com",
    databaseURL: "https://greencycle-db.firebaseio.com",
    projectId: "greencycle-db",
    storageBucket: "greencycle-db.appspot.com",
    messagingSenderId: "596629187371",
    appId: "1:596629187371:web:b059e8130d76c5ef83336e",
    measurementId: "G-E35BXMRY4Z",
};

// ---------- initialize app ----------
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
firebase.initializeApp(firebaseConfig);

const adminRouter = require("./routers/adminRouter");
const authRouter = require("./routers/authRouter");
const categoryRouter = require("./routers/categoryRouter");
const contributorRouter = require("./routers/contributorRouter");
const manufacturerRouter = require("./routers/manufacturerRouter");
const materialRouter = require("./routers/materialRouter");
const userRouter = require("./routers/userRouter");
const storageRouter = require("./routers/storageRouter");

app.use(adminRouter);
app.use(authRouter);
app.use(categoryRouter);
app.use(contributorRouter);
app.use(manufacturerRouter);
app.use(materialRouter);
app.use(userRouter);
app.use(storageRouter);

app.listen(port, () => {
    console.log("Server is up on port " + port + ".");
});
