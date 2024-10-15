const express = require('express')
const router = new express.Router()
const chalk = require('chalk')
const admin = require('firebase-admin')
const tokenManagement = require('../middleware/tokenManage')
const firebase = require('firebase')
const Promise = require('bluebird')
const dateTime = require('node-datetime')

const auth = firebase.auth()
const db = admin.firestore();
const contributorRef = db.collection('contributors')
const userRef = db.collection('users')
const notiRef = db.collection('notifications')

// ---------- get ----------

// get all contributors
router.get('/contributor', async (req, res) => {
    try {
        const allDocs = await contributorRef.get();
        const docsArray = []
        allDocs.forEach(doc => {
            docsArray.push(doc)
        })
        if (!docsArray.length) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get all contributors:', docsArray.length, 'contributor(s).'))
        }
        // usage docsArray.forEach(doc => { }) | get data > doc.data(), get id > doc.id
        res.status(201).send(docsArray)
    } catch (e) {
        res.status(400).send(e)
    }
});

// get contributor by contributor doc id
// router.get('/contributor/:id', async (req, res) => {
//     const id = req.params.id;
//     try {
//         const doc = await contributorRef.doc(id).get();
//         if (!doc.exists) {
//             console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found from this id.'))
//         } else {
//             console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get contributor:', doc.data().name))
//         }
//         res.status(201).send(doc.data())
//     } catch (e) {
//         res.status(400).send(e)
//     }
// });

// get cont data
router.get('/contributor/data', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    try {
        const doc = await contributorRef.doc(own).get()
        let newDoc = doc.data()
        newDoc.id = doc.id
        res.status(201).send(newDoc)
    } catch (e) {
        res.status(400).send(e)
    }
});

// get cont image
router.get('/contributor/image', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    try {
        const doc = await contributorRef.doc(own).get()
        res.status(201).send(doc.data().image)
    } catch (e) {
        res.status(400).send(e)
    }
});

// get all projects in contributor
router.get('/contributor/project', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    try {
        const allDocs = await contributorRef.doc(own).collection('projects').get();
        const docsArray = []
        allDocs.forEach(doc => {
            const returnValue = doc.data()
            returnValue.id = doc.id
            docsArray.push(returnValue)
        })
        if (!docsArray.length) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No project found.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get all projects:', docsArray.length, 'project(s).'))
        }
        // use docsArray.forEach(doc => { }) | get data > doc.data(), get id > doc.id
        res.status(201).send(docsArray)
    } catch (e) {
        res.status(400).send(e)
    }
})

const getAllProject = async (allDocs) => {
    const projects = []
    let count = 0

    let projectArray = new Promise((resolve, reject) => {
        allDocs.forEach( async doc => {
            if((await contributorRef.doc(doc.id).listCollections()).length === 0) {
                count += 1
                if (count === allDocs.size) {
                    return resolve(projects)
                }
            } else {
                contributorRef.doc(doc.id)
                    .listCollections()
                    .then( subCollections => {
                        subCollections.forEach(async subCollection => {
                            await subCollection
                                .get()
                                .then( array => {
                                    array.docs.forEach( doc => {
                                        let newDoc = doc.data()
                                        newDoc.id = doc.id
                                        projects.push(newDoc)
                                    })
                                })
                            count += 1
                            if (count === allDocs.size) {
                                return resolve(projects)
                            }
                        })
                    })
            }
        })
    })

    return await projectArray
}

// get project in contributor by project doc id
router.post('/contributor/projectById', async (req, res) => {
    const allDocs = await contributorRef.get()
    const projectId = req.body.id
    try {
        const allProject = await getAllProject(allDocs)
        let promise = new Promise((resolve, reject) => {
            for (let i = 0; i < allProject.length; i++) {
                if (allProject[i].id === projectId) {
                    return resolve(allProject[i])
                }
            }
        })
        const result = await promise
        res.status(201).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
})

// get all projects
router.get('/contributor/allProject', async (req, res) => {
    const allDocs = await contributorRef.get()
    try {
        const allProject = await getAllProject(allDocs)
        res.status(201).send(allProject)
    } catch (e) {
        res.status(400).send(e)
    }
})

// get related project
router.post('/contributor/relatedProject', async (req, res) => {
    const materialArray = req.body.material
    const id = req.body.id
    const allDocs = await contributorRef.get()
    let relatedProject = []
    try {
        const allProject = await getAllProject(allDocs)
        let promise = new Promise((resolve, reject) => {
            for (let i = 0; i < allProject.length; i++) {
                for(let j = 0; j < allProject[i].material.length; j++) {
                    if (materialArray.includes(allProject[i].material[j].id)) {
                        if (!relatedProject.includes(allProject[i]) && allProject[i].id !== id ) {
                            relatedProject.push(allProject[i])
                        }
                    }
                }
                if (i+1 === allProject.length) {
                    return resolve(relatedProject)
                }
            }
        })
        
        const result = await promise
        console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get related projects:', result.length))
        res.status(201).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- create ----------

// add new contributor
router.post('/contributor/add', async (req, res) => {
    const token = req.headers.authorization
    const uid = tokenManagement.decode(token).uid
    const body = req.body
    try {
        const doc = await contributorRef.add(body)
        const userDoc = await userRef.doc(uid).get()
        let newDoc = userDoc.data()
        newDoc.own = doc.id
        userRef.doc(uid).set(newDoc)
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added contributor'))
        res.status(201).send(doc)
    } catch (e) {
        res.status(400).send(e)
    }
})

// add new project to specific contributor id
router.post('/contributor/addProject', async (req, res) => {
    const token = req.headers.authorization
    const uid = tokenManagement.decode(token).uid
    const own = tokenManagement.decode(token).own
    const userDoc = await userRef.doc(uid).get()
    const id = userDoc.data().own
    const body = req.body
    try {
        const doc = await contributorRef.doc(id).collection('projects').add(body)
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added project'))
        notiRef.add({ 
            subject: "You have published a project", 
            detail: "Your project called \'" + body.name + "\' is now publish in GreenCycle." ,
            date: dateTime.create().format('d-m-Y'),
            id: own
        })
        res.status(201).send(doc.id)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- update ----------

// update contributor by id
router.post('/contributor/updateManufacturer', async (req, res) => {
    const token = req.headers.authorization
    const contributorId = tokenManagement.decode(token).own
    const body = req.body
    try {
        const doc = await contributorRef.doc(contributorId).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found.'))
        } else {
            contributorRef.doc(contributorId).update(body)
            console.log(chalk.magenta.inverse(' UPD '), chalk.magenta('Updated contributor data'))
        }
        const updatedDoc = await contributorRef.doc(contributorId).get()
        res.status(201).send(updatedDoc.data())
    } catch (e) {
        res.status(400).send(e)
    }
})

// update project by id
router.post('/contributor/updateProject/:id', async (req, res) => {
    const token = req.headers.authorization
    const contributorId = tokenManagement.decode(token).own
    const projectId = req.params.id
    const body = req.body
    try {
        const doc = await contributorRef.doc(contributorId).collection('projects').doc(projectId).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found.'))
        } else {
            contributorRef.doc(contributorId).collection('projects').doc(projectId).update(body)
            console.log(chalk.magenta.inverse(' UPD '), chalk.magenta('Updated product data'))
        }
        const updatedDoc = await contributorRef.doc(contributorId).collection('projects').doc(projectId).get()
        res.status(201).send(updatedDoc.data())
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- delete ----------

// delete contributor by id
router.delete('/contributor/:id', async (req, res) => {
    const id = req.params.id
    try {
        const doc = await contributorRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found'))
        } else {
            contributorRef.doc(id).delete()
            console.log(chalk.yellow.inverse(' DEL '), chalk.yellow('Deleted a contributor', doc.id))
            const newCollection = await contributorRef.get()
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

// delete project by id 
router.post('/contributor/deleteProject', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    const id = req.body.id
    const name = req.body.name
    try {
        contributorRef.doc(own).collection('projects').doc(id).delete()
        console.log(chalk.yellow.inverse(' DEL '), chalk.yellow('Deleted a project'))
        notiRef.add({ 
            subject: "You have deleted a project", 
            detail: "Your project called \'" + name + "\' has been deleted." ,
            date: dateTime.create().format('d-m-Y'),
            id: own
        })
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added notification'))
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- get Noti ----------

router.get('/contributor/getNoti', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    try {
        const noti = await notiRef.get()
        const docsArray = []
        noti.forEach(doc => {
            if (doc.data().id === own) {
                docsArray.push(doc.data())
            }
        })
        if (!docsArray.length) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No notification found.'))
        } else {
            res.status(201).send(docsArray)
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get all notifications:', docsArray.length, 'notification(s).'))
        }
        
    } catch (e) {
        res.status(201).send(false)
    }
})

// ---------- check isOwner ----------

router.post('/contributor/isOwner', async (req, res) => {
    const token = req.headers.authorization
    const role = tokenManagement.decode(token).role
    const own = tokenManagement.decode(token).own
    const id = req.body.id
    try {
        if (role !== 'contributor') {
            res.status(201).send(false)
        } else {
            const doc = await contributorRef.doc(own).collection('projects').doc(id).get()
            if (!doc.exists) {
                res.status(201).send(false)
                console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found'))
            } else {
                res.status(201).send(true)
                console.log(chalk.cyan.inverse(' GET '), chalk.cyan('This is owner'))
            }
        }
    } catch (e) {
        res.status(201).send(false)
    }
})

module.exports = router;