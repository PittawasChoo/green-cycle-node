const express = require("express");
const router = new express.Router();
const chalk = require("chalk");
const admin = require("firebase-admin");
const firebase = require("firebase");
const tokenManagement = require("../middleware/tokenManage");
const { decode } = require("jsonwebtoken");

const auth = firebase.auth();
const db = admin.firestore();
const usersRef = db.collection("users");

// ---------- sign up ----------

router.post("/signup", async (req, res) => {
    const body = req.body;
    try {
        const user = await auth.createUserWithEmailAndPassword(body.email, body.password);
        // const path = user.user.uid)
        usersRef.doc(user.user.uid).set({
            isVerified: false,
            role: body.role,
        });
        const userData = auth.currentUser;
        console.log(chalk.green.inverse(" ADD "), chalk.green("Added new user as " + body.role));
        user.user.sendEmailVerification();
        token = tokenManagement.encode({ uid: userData.uid, own: null, role: body.role });
        res.status(201).send({ token: token });
    } catch (err) {
        res.status(401).send({ error: err.message });
    }
});

// ---------- sign in ----------

router.post("/signin", async (req, res) => {
    const body = req.body;
    try {
        const user = await auth.signInWithEmailAndPassword(body.email, body.password);
        // if (auth.currentUser.emailVerified) {
        const userData = auth.currentUser;
        const doc = await usersRef.doc(userData.uid).get();
        if (!doc.data().own) {
            doc.data.own = null;
        }
        token = tokenManagement.encode({
            uid: userData.uid,
            own: doc.data().own,
            role: doc.data().role,
        });
        res.status(201).send({
            token: token,
            role: doc.data().role,
            isVerified: doc.data().isVerified,
            own: doc.data().own,
        });
    } catch (err) {
        res.status(201).send({ error: err.message });
    }
});

// ---------- sign out ----------

router.get("/signout", async (req, res) => {
    try {
        await auth.signOut();
        res.status(201).send("logged out");
    } catch (err) {
        res.status(401).send({ error: err.message });
    }
});

module.exports = router;
