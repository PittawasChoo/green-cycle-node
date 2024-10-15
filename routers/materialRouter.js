const express = require("express");
const router = new express.Router();
const chalk = require("chalk");
const tokenManagement = require("../middleware/tokenManage");
const admin = require("firebase-admin");
const dateTime = require("node-datetime");
const nodemailer = require("nodemailer");

const auth = admin.auth();
const db = admin.firestore();
const materialRef = db.collection("materials");
const contributorRef = db.collection("contributors");
const manufactorRef = db.collection("manufacturers");
const userRef = db.collection("users");
const notiRef = db.collection("notifications");
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "help.greencycle@gmail.com",
        pass: "greencycle55",
    },
});

// ---------- get ----------

// get all materials
router.get("/material", async (req, res) => {
    try {
        const allDocs = await materialRef.get();
        const docsArray = [];
        allDocs.forEach((doc) => {
            let newDoc = doc.data();
            newDoc.id = doc.id;
            docsArray.push(newDoc);
        });
        if (!docsArray.length) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No material found."));
        } else {
            console.log(chalk.cyan.inverse(" GET "), chalk.cyan("Get all materials:", docsArray.length, "material(s)."));
        }
        // usage docsArray.forEach(doc => { }) | get data > doc.data(), get id > doc.id
        res.status(201).send(docsArray);
    } catch (e) {
        res.status(400).send(e);
    }
});

// get material by material doc id
router.post("/material", async (req, res) => {
    const id = req.body.id;
    try {
        const doc = await materialRef.doc(id).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No material found from this id."));
        } else {
            console.log(chalk.cyan.inverse(" GET "), chalk.cyan("Get material:", doc.data().name));
        }
        res.status(201).send(doc.data());
    } catch (e) {
        res.status(400).send(e);
    }
});

// get unapprove materials
router.get("/material/unapprove", async (req, res) => {
    let materialArray = [];
    try {
        const allDocs = await materialRef.get();
        allDocs.forEach((doc) => {
            if (!doc.data().isVerified) {
                let newDoc = doc.data();
                newDoc.id = doc.id;
                materialArray.push(newDoc);
            }
        });
        console.log(chalk.cyan.inverse(" GET "), chalk.cyan("Get unapprove materials:", materialArray.length, "material(s)."));
        res.status(201).send(materialArray);
    } catch (e) {
        res.status(400).send(e);
    }
});

// get approved materials
router.get("/material/approved", async (req, res) => {
    let materialArray = [];
    try {
        const allDocs = await materialRef.get();
        allDocs.forEach((doc) => {
            if (doc.data().isVerified) {
                let newDoc = doc.data();
                newDoc.id = doc.id;
                materialArray.push(newDoc);
            }
        });
        console.log(chalk.cyan.inverse(" GET "), chalk.cyan("Get approved materials:", materialArray.length, "material(s)."));
        res.status(201).send(materialArray);
    } catch (e) {
        res.status(400).send(e);
    }
});

// get all material in project/product detail page
router.post("/material/detailPage", async (req, res) => {
    const id = req.body.id;
    let materialArray = [];
    try {
        for (let i = 0; i < id.length; i++) {
            let doc = await materialRef.doc(id[i]).get();
            let newDoc = doc.data();
            newDoc.id = doc.id;
            materialArray.push(newDoc);
        }
        console.log(chalk.cyan.inverse(" GET "), chalk.cyan("Get approved materials in project/product detail page:", materialArray.length, "material(s)."));
        res.status(201).send(materialArray);
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- create ----------

// request new material
router.post("/material/reqMaterial", async (req, res) => {
    const token = req.headers.authorization;
    const role = tokenManagement.decode(token).role;
    const uid = tokenManagement.decode(token).uid;
    const userDoc = await userRef.doc(uid).get();
    const id = userDoc.data().own;
    const body = req.body;
    let data = {};
    try {
        if (role === "contributor") {
            const doc = await contributorRef.doc(id).get();
            data = {
                isVerified: false,
                name: body.name,
                requestBy: id,
                userImage: doc.data().image,
                username: doc.data().name,
            };
        } else if (role === "manufacturer") {
            const doc = await manufactorRef.doc(id).get();
            data = {
                isVerified: false,
                name: body.name,
                requestBy: id,
                userImage: doc.data().image,
                username: doc.data().name,
            };
        }
        const mat = await materialRef.add(data);
        console.log(chalk.green.inverse(" ADD "), chalk.green("Added material"));
        res.status(201).send(mat);
    } catch (e) {
        res.status(400).send(e);
    }
});

// add new material
router.post("/material/add", async (req, res) => {
    const body = req.body;
    try {
        const doc = await materialRef.add(body);
        console.log(chalk.green.inverse(" ADD "), chalk.green("Added material"));
        res.status(201).send(doc.id);
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- update ----------

// update material by id
router.post("/material/updatematerial/:id", async (req, res) => {
    const id = req.params.id;
    const body = req.body;
    try {
        const doc = await materialRef.doc(id).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No manufacturer found."));
        } else {
            materialRef.doc(id).update(body);
            console.log(chalk.magenta.inverse(" UPD "), chalk.magenta("Updated product data"));
        }
        const updatedDoc = await materialRef.doc(id).get();
        res.status(201).send(updatedDoc.data());
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- delete ----------

// delete product by id
router.post("/material/deleteMaterial", async (req, res) => {
    const token = req.headers.authorization;
    const role = tokenManagement.decode(token).role;
    const id = req.body.id;
    try {
        if (role === "admin") {
            materialRef.doc(id).delete();
            console.log(chalk.yellow.inverse(" DEL "), chalk.yellow("Deleted a product"));
        }
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- accept Material ----------

// delete material by id
router.post("/material/accept", async (req, res) => {
    const id = req.body.id;
    const requestBy = req.body.requestBy;
    const name = req.body.name;
    try {
        const users = await userRef.get();
        users.forEach(async (doc) => {
            if (doc.data().own === requestBy) {
                const user = await auth.getUser(doc.id);
                const mailOptions = {
                    from: "help.greencycle@gmail.com",
                    to: user.email,
                    subject: "GreenCycle: Your requested material has been accepted",
                    text: "Your request for '" + name + "' has been approved by admin.",
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(chalk.red.inverse(" ERR "), chalk.red("Cannot send email to user."));
                    } else {
                        console.log(chalk.magenta.inverse(" SND "), chalk.magenta("Sent notification to user."));
                    }
                });
            }
        });
        const doc = await materialRef.doc(id).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No Material found."));
        } else {
            materialRef.doc(id).delete();
            console.log(chalk.yellow.inverse(" DEL "), chalk.yellow("Deleted a material for creating new one"));
            notiRef.add({
                subject: "Your request has been accepted",
                detail: "Your request for '" + name + "' has been approved by admin.",
                date: dateTime.create().format("d-m-Y"),
                id: requestBy,
            });
            console.log(chalk.green.inverse(" ADD "), chalk.green("Added notification"));
        }
    } catch (e) {
        res.status(400).send(e);
    }
});

// ---------- deny Material ----------

// delete material by id
router.post("/material/deny", async (req, res) => {
    const id = req.body.id;
    const name = req.body.name;
    const requestBy = req.body.requestBy;
    try {
        const users = await userRef.get();
        users.forEach(async (doc) => {
            if (doc.data().own === requestBy) {
                const user = await auth.getUser(doc.id);
                const mailOptions = {
                    from: "GreenCycle admin <help.greencycle@gmail.com>",
                    to: user.email,
                    subject: "GreenCycle: Your requested material has been denied",
                    text: "Your request for '" + name + "' has been rejected by admin. Contact our staff for more information.",
                };
                transporter.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        console.log(chalk.red.inverse(" ERR "), chalk.red("Cannot send email to user."));
                    } else {
                        console.log(chalk.magenta.inverse(" SND "), chalk.magenta("Sent notification to user."));
                    }
                });
            }
        });
        const doc = await materialRef.doc(id).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(" ERR "), chalk.red("No Material found."));
        } else {
            materialRef.doc(id).delete();
            console.log(chalk.yellow.inverse(" DEL "), chalk.yellow("Deleted a material: request rejected"));
            notiRef.add({
                subject: "Your request has been denied",
                detail: "Your request for '" + name + "' has been rejected by admin. Contact our staff for more information.",
                date: dateTime.create().format("d-m-Y"),
                id: requestBy,
            });
            console.log(chalk.green.inverse(" ADD "), chalk.green("Added notification"));
        }
    } catch (e) {
        res.status(400).send(e);
    }
});

module.exports = router;
