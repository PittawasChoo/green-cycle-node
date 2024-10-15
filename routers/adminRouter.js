const express = require('express')
const router = new express.Router()
const chalk = require('chalk')
const admin = require('firebase-admin')
const tokenManagement = require('../middleware/tokenManage')

const db = admin.firestore();
const adminRef = db.collection('admins')

// ---------- get ----------

// get all admins
router.get('/admins', async (req, res) => {
    try {
        const allDocs = await adminRef.get();
        const docsArray = []
        allDocs.forEach(doc => {
            docsArray.push(doc)
        })
        if (!docsArray.length) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No admin found.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get all admins:', docsArray.length, 'admin(s).'))
        }
        // usage docsArray.forEach(doc => { }) | get data > doc.data(), get id > doc.id
        res.status(201).send(docsArray)
    } catch (e) {
        res.status(400).send(e)
    }
});

// get admin by admin doc id
router.get('/admin/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const doc = await adminRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No admin found from this id.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get admin:', doc.data().name))
        }
        res.status(201).send(doc.data())
    } catch (e) {
        res.status(400).send(e)
    }
});

// get admin by token
router.get('/admin', async (req, res) => {
    const token = req.headers.authorization
    const uid = tokenManagement.decode(token).uid
    try {
        const admin = await adminRef.doc(uid).get()
        res.status(201).send(admin.data())
    } catch (e) {
        res.status(400).send(e)
    }
});

// ---------- create ----------

// add new admin
router.post('/admin/add', async (req, res) => {
    const body = req.body
    try {
        const doc = await adminRef.add(body)
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added admin'))
        res.status(201).send(body)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- update ----------

// update admin by id
router.put('/admin/updateadmin/:id', async (req, res) => {
    const id = req.params.id
    const body = req.body
    try {
        const doc = await adminRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No admin found.'))
        } else {
            adminRef.doc(id).update(body)
            console.log(chalk.magenta.inverse(' UPD '), chalk.magenta('Updated admin data'))
        }
        const updatedDoc = await adminRef.doc(id).get()
        res.status(201).send(updatedDoc.data())
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- delete ----------

// delete admin by id
router.delete('/admin/:id', async (req, res) => {
    const id = req.params.id
    try {
        const doc = await adminRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No admin found'))
        } else {
            adminRef.doc(id).delete()
            console.log(chalk.yellow.inverse(' DEL '), chalk.yellow('Deleted a admin'))
            const newCollection = await adminRef.get()
            const docsArray = []
            newCollection.forEach(doc => {
                docsArray.push(doc.data())
            })
        }
        res.status(201).send(body)
    } catch (e) {
        res.status(400).send(e)
    }
})

module.exports = router;