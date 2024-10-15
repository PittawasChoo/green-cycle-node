const express = require("express");
const router = new express.Router();
const chalk = require("chalk");
const admin = require("firebase-admin");
const tokenManagement = require("../middleware/tokenManage");
const firebase = require("firebase");
const dateTime = require("node-datetime");
const nodemailer = require("nodemailer");

const auth = admin.auth();
const db = admin.firestore();
const userRef = db.collection("users");
const manufactorRef = db.collection("manufacturers");
const contributorRef = db.collection("contributors");
const notiRef = db.collection("notifications");
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "help.greencycle@gmail.com",
        pass: "greencycle55",
    },
});

// ---------- get ----------

// get all users
router.get("/user", async (req, res) => {
    try {
        const allDocs = await userRef.get();
        const docsArray = [];
        allDocs.forEach((doc) => {
            let newDoc = doc.data();
            newDoc.uid = doc.id;
            docsArray.push(newDoc);
        });
        if (!docsArray.length) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No user found."));
        } else {
            console.log(chalk.cyan.inverse(" GET "), chalk.cyan("Get all users:", docsArray.length, "user(s)."));
        }
        // usage docsArray.forEach(doc => { }) | get data > doc.data(), get id > doc.id
        res.status(201).send(docsArray);
    } catch (e) {
        res.status(400).send(e);
    }
});

// get user by user doc id
// router.get('/user/:id', async (req, res) => {
//     const id = req.params.id;
//     try {
//         const doc = await userRef.doc(id).get();
//         if (!doc.exists) {
//             console.log(chalk.red.inverse(' ERR '), chalk.red('No user found from this id.'))
//         } else {
//             console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get user:', doc.data().name))
//         }
//         res.status(201).send(doc.data())
//     } catch (e) {
//         res.status(400).send(e)
//     }
// });

//  get not approved users
router.get("/user/unapproved", async (req, res) => {
    try {
        const allUsers = await userRef.get();
        const allManu = await manufactorRef.get();
        const allCont = await contributorRef.get();
        const userArray = [];
        const manuArray = [];
        const contArray = [];
        const unapprovedUser = [];
        allUsers.forEach((doc) => {
            let newDoc = doc.data();
            newDoc.id = doc.id;
            userArray.push(newDoc);
        });
        allManu.forEach((doc) => {
            let newDoc = doc.data();
            newDoc.role = "manufacturer";
            newDoc.id = doc.id;
            manuArray.push(newDoc);
        });
        allCont.forEach((doc) => {
            let newDoc = doc.data();
            newDoc.role = "contributor";
            newDoc.id = doc.id;
            contArray.push(newDoc);
        });
        for (let i = 0; i < userArray.length; i++) {
            if (userArray[i].role === "manufacturer" && !userArray[i].isVerified) {
                for (let j = 0; j < manuArray.length; j++) {
                    if (manuArray[j].id === userArray[i].own) {
                        let newDoc = manuArray[j];
                        newDoc.owner = userArray[i].id;
                        unapprovedUser.push(newDoc);
                    }
                }
            } else if (userArray[i].role === "contributor" && !userArray[i].isVerified) {
                for (let j = 0; j < contArray.length; j++) {
                    if (contArray[j].id === userArray[i].own) {
                        let newDoc = contArray[j];
                        newDoc.owner = userArray[i].id;
                        unapprovedUser.push(newDoc);
                    }
                }
            }
        }
        res.status(201).send(unapprovedUser);
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- create ----------

// add new user
router.post("/user/add", async (req, res) => {
    const body = req.body;
    try {
        const doc = await userRef.add(body);
        console.log(chalk.green.inverse(" ADD "), chalk.green("Added user"));
        res.status(201).send(body);
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- update ----------

// update user by id
router.put("/user/updateuser/:id", async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    try {
        const doc = await userRef.doc(id).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No user found."));
        } else {
            userRef.doc(id).update(body);
            console.log(chalk.magenta.inverse(" UPD "), chalk.magenta("Updated user data"));
        }
        const updatedDoc = await userRef.doc(id).get();
        res.status(201).send(updatedDoc.data());
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- delete ----------

// delete user by id
router.delete("/user/:id", async (req, res) => {
    const id = req.params.id;
    try {
        const doc = await userRef.doc(id).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No user found"));
        } else {
            userRef.doc(id).delete();
            console.log(chalk.yellow.inverse(" DEL "), chalk.yellow("Deleted a user"));
            const newCollection = await userRef.get();
            const docsArray = [];
            newCollection.forEach((doc) => {
                docsArray.push(doc.data());
            });
        }
        res.status(201).send(body);
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- check ----------

router.get("/user/role", async (req, res) => {
    const token = req.headers.authorization;
    try {
        object = tokenManagement.decode(token);
        res.status(201).send({ role: object.role });
    } catch (err) {
        res.status(401).send({ error: err.message });
    }
});

router.get("/user/checkSignIn", async (req, res) => {
    const token = req.headers.authorization;
    const object = tokenManagement.decode(token);
    try {
        const doc = await userRef.doc(object.uid).get();
        res.status(201).send({ role: object.role, own: object.own, isVerified: doc.data().isVerified });
    } catch (err) {
        res.status(401).send({ error: err.message });
    }
});

// ---------- accept user ----------

router.post("/user/accept", async (req, res) => {
    const owner = req.body.owner;
    const role = req.body.role;
    const id = req.body.id;
    let welcome = "";
    if (role === "manufacturer") {
        welcome = "product";
    } else if (role === "contributor") {
        welcome = "campaign";
    }
    try {
        const doc = await userRef.doc(owner).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No user found."));
        } else {
            let newDoc = doc.data();
            newDoc.isVerified = true;
            userRef.doc(owner).update(newDoc);
            console.log(chalk.magenta.inverse(" UPD "), chalk.magenta("Updated user data"));
            const user = await auth.getUser(owner);
            const mailOptions = {
                from: "GreenCycle admin <help.greencycle@gmail.com>",
                to: user.email,
                subject: "GreenCycle: Your account has been accepted",
                text: "Welcome to GreenCycle! Your account has been verified. Let's start creating new " + welcome + ". " + "For more information, please contact help.greencycle@gmail.com",
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log(chalk.red.inverse(" ERR "), chalk.red("Cannot send email to user."));
                } else {
                    console.log(chalk.magenta.inverse(" SND "), chalk.magenta("Sent notification to user."));
                }
            });
            notiRef.add({
                subject: "Welcome to GreenCycle!",
                detail: "Your account has been verified. Let's start creating new " + welcome + ".",
                date: dateTime.create().format("d-m-Y"),
                id: id,
            });
            console.log(chalk.green.inverse(" ADD "), chalk.green("Added notification"));
        }
    } catch (e) {
        res.status(401).send(e);
    }
});

// ---------- deny user ----------
router.post("/user/deny", async (req, res) => {
    const owner = req.body.owner;
    const id = req.body.id;
    const role = req.body.role;
    try {
        if (role === "manufacturer") {
            manufactorRef.doc(id).delete();
            console.log(chalk.yellow.inverse(" DEL "), chalk.yellow("Deleted a manufacturer"));
        } else {
            contributorRef.doc(id).delete();
            console.log(chalk.yellow.inverse(" DEL "), chalk.yellow("Deleted a contributor"));
        }
        const user = await auth.getUser(owner);
        const mailOptions = {
            from: "GreenCycle admin <help.greencycle@gmail.com>",
            to: user.email,
            subject: "GreenCycle: Your account has been denied",
            text: "Your account has been denied by admin. Please check your information and try again. For more information, please contact help.greencycle@gmail.com",
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(chalk.red.inverse(" ERR "), chalk.red("Cannot send email to user."));
            } else {
                console.log(chalk.magenta.inverse(" SND "), chalk.magenta("Sent notification to user."));
            }
        });
        admin
            .auth()
            .deleteUser(owner)
            .then(() => {
                console.log(chalk.yellow.inverse(" DEL "), chalk.yellow("Deleted a auth user"));
            })
            .catch((error) => {
                console.log("Error deleting user:", error);
            });
        userRef.doc(owner).delete();
        console.log(chalk.yellow.inverse(" DEL "), chalk.yellow("Deleted a user"));
    } catch (e) {
        res.status(401).send(e);
    }
});

// ---------- report ----------
router.post("/report", async (req, res) => {
    const body = req.body;
    try {
        const mailOptions = {
            from: "GreenCycle admin <help.greencycle@gmail.com>",
            to: "help.greencycle@gmail.com",
            subject: "Report: " + body.subject,
            text: 'Recieved report from "' + body.name + '" about "' + body.content + '". After the problem is solved, please reply to ' + body.email,
        };
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(chalk.red.inverse(" ERR "), chalk.red("Cannot send email to user."));
            } else {
                console.log(chalk.magenta.inverse(" SND "), chalk.magenta("Sent notification to user."));
            }
        });
    } catch (e) {
        res.status(401).send(e);
    }
});

module.exports = router;
