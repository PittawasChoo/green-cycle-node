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
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DATABASE_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
    measurementId: process.env.MEASUREMENT_ID,
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
