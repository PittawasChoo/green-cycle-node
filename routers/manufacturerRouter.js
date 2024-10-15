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
const manuRef = db.collection('manufacturers')
const userRef = db.collection('users')
const notiRef = db.collection('notifications')

// ---------- get ----------

// get all manufacturers
router.get('/manufacturer', async (req, res) => {
    try {
        const allDocs = await manuRef.get();
        const docsArray = []
        allDocs.forEach(doc => {
            docsArray.push(doc)
        })
        if (!docsArray.length) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No manufacturer found.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get all manufacturers:', docsArray.length, 'manufacturer(s).'))
        }
        // usage docsArray.forEach(doc => { }) | get data > doc.data(), get id > doc.id
        res.status(201).send(docsArray)
    } catch (e) {
        res.status(400).send(e)
    }
});

// get manufacturer by manufacturer doc id
// router.get('/manufacturer/:id', async (req, res) => {
//     const id = req.params.id;
//     try {
//         const doc = await manuRef.doc(id).get();
//         if (!doc.exists) {
//             console.log(chalk.red.inverse(' ERR '), chalk.red('No manufacturer found from this id.'))
//         } else {
//             console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get manufacturer:', doc.data().name))
//         }
//         res.status(201).send(doc.data())
//     } catch (e) {
//         res.status(400).send(e)
//     }
// });

// get manu data
router.get('/manufacturer/data', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    try {
        const doc = await manuRef.doc(own).get()
        let newDoc = doc.data()
        newDoc.id = doc.id
        res.status(201).send(newDoc)
    } catch (e) {
        res.status(400).send(e)
    }
});

// get manu image
router.get('/manufacturer/image', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    try {
        const doc = await manuRef.doc(own).get()
        res.status(201).send(doc.data().image)
    } catch (e) {
        res.status(400).send(e)
    }
});

// get all products in manufacturer
router.get('/manufacturer/product', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    try {
        const allDocs = await manuRef.doc(own).collection('products').get();
        const docsArray = []
        allDocs.forEach(doc => {
            const returnValue = doc.data()
            returnValue.id = doc.id
            docsArray.push(returnValue)
        })
        if (!docsArray.length) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No product found.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get all products:', docsArray.length, 'product(s).'))
        }
        // use docsArray.forEach(doc => { }) | get data > doc.data(), get id > doc.id
        res.status(201).send(docsArray)
    } catch (e) {
        res.status(400).send(e)
    }
})

const getAllProduct = async (allDocs) => {
    const products = []
    let count = 0

    let productArray = new Promise((resolve, reject) => {
        allDocs.forEach( async doc => {
            if((await manuRef.doc(doc.id).listCollections()).length === 0) {
                count += 1
                if (count === allDocs.size) {
                    return resolve(products)
                }
            } else {
                manuRef.doc(doc.id)
                    .listCollections()
                    .then( subCollections => {
                        subCollections.forEach(async subCollection => {
                            await subCollection
                                .get()
                                .then( array => {
                                    array.docs.forEach( doc => {
                                        let newDoc = doc.data()
                                        newDoc.id = doc.id
                                        products.push(newDoc)
                                    })
                                })
                            count += 1
                            if (count === allDocs.size) {
                                return resolve(products)
                            }
                        })
                    })
            }
        })
    })

    return await productArray
}

// get product in manufacturer by product doc id
router.post('/manufacturer/productById', async (req, res) => {
    const allDocs = await manuRef.get()
    const productId = req.body.id
    try {
        const allProduct = await getAllProduct(allDocs)
        let promise = new Promise((resolve, reject) => {
            for (let i = 0; i < allProduct.length; i++) {
                if (allProduct[i].id === productId) {
                    return resolve(allProduct[i])
                }
            }
        })
        const result = await promise
        res.status(201).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
})

// get all products
router.get('/manufacturer/allProduct', async (req, res) => {
    const allDocs = await manuRef.get()
    try {
        const allProduct = await getAllProduct(allDocs)
        res.status(201).send(allProduct)
    } catch (e) {
        res.status(400).send(e)
    }
})

// get related product
router.post('/manufacturer/relatedProduct', async (req, res) => {
    const materialArray = req.body.material
    const id = req.body.id
    const allDocs = await manuRef.get()
    let relatedProduct = []
    try {
        const allProduct = await getAllProduct(allDocs)
        let promise = new Promise((resolve, reject) => {
            for (let i = 0; i < allProduct.length; i++) {
                for(let j = 0; j < allProduct[i].material.length; j++) {
                    if (materialArray.includes(allProduct[i].material[j].id)) {
                        if (!relatedProduct.includes(allProduct[i]) && allProduct[i].id !== id) {
                            relatedProduct.push(allProduct[i])
                        }
                    }
                }
                if (i+1 === allProduct.length) {
                    return resolve(relatedProduct)
                }
            }
        })
        
        const result = await promise
        console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get related products:', result.length))
        res.status(201).send(result)
    } catch (e) {
        res.status(400).send(e)
    }
});

// ---------- create ----------

// add new manufacturer
router.post('/manufacturer/add', async (req, res) => {
    const token = req.headers.authorization
    const uid = tokenManagement.decode(token).uid
    const body = req.body
    try {
        const doc = await manuRef.add(body)
        const userDoc = await userRef.doc(uid).get()
        let newDoc = userDoc.data()
        newDoc.own = doc.id
        userRef.doc(uid).set(newDoc)
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added manufacturer'))
        res.status(201).send(doc)
    } catch (e) {
        res.status(400).send(e)
    }
})

// add new product to specific manufacturer id
router.post('/manufacturer/addProduct', async (req, res) => {
    const token = req.headers.authorization
    const uid = tokenManagement.decode(token).uid
    const own = tokenManagement.decode(token).own
    const userDoc = await userRef.doc(uid).get()
    const id = userDoc.data().own
    const body = req.body
    try {
        const doc = await manuRef.doc(id).collection('products').add(body)
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added product'))
        notiRef.add({ 
            subject: "You have published a product", 
            detail: "Your product called \'" + body.name + "\' is now publish in GreenCycle." ,
            date: dateTime.create().format('d-m-Y'),
            id: own
        })
        res.status(201).send(doc.id)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- update ----------

// update manufacturer by id
router.post('/manufacturer/updateManufacturer', async (req, res) => {
    const token = req.headers.authorization
    const manufactorId = tokenManagement.decode(token).own
    const body = req.body
    try {
        const doc = await manuRef.doc(manufactorId).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No manufacturer found.'))
        } else {
            manuRef.doc(manufactorId).update(body)
            console.log(chalk.magenta.inverse(' UPD '), chalk.magenta('Updated manufacturer data'))
        }
        const updatedDoc = await manuRef.doc(manufactorId).get()
        res.status(201).send(updatedDoc.data())
    } catch (e) {
        res.status(400).send(e)
    }
})

// update product by id
router.post('/manufacturer/updateProduct/:id', async (req, res) => {
    const token = req.headers.authorization
    const manufactorId = tokenManagement.decode(token).own
    const productId = req.params.id
    const body = req.body
    try {
        const doc = await manuRef.doc(manufactorId).collection('products').doc(productId).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No manufacturer found.'))
        } else {
            manuRef.doc(manufactorId).collection('products').doc(productId).update(body)
            console.log(chalk.magenta.inverse(' UPD '), chalk.magenta('Updated product data'))
        }
        const updatedDoc = await manuRef.doc(manufactorId).collection('products').doc(productId).get()
        res.status(201).send(updatedDoc.data())
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- delete ----------

// delete manufacturer by id
router.delete('/manufacturer/:id', async (req, res) => {
    const id = req.params.id
    try {
        const doc = await manuRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No manufacturer found'))
        } else {
            manuRef.doc(id).delete()
            console.log(chalk.yellow.inverse(' DEL '), chalk.yellow('Deleted a manufacturer'))
            const newCollection = await manuRef.get()
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

// delete product by id
router.post('/manufacturer/deleteProduct', async (req, res) => {
    const token = req.headers.authorization
    const own = tokenManagement.decode(token).own
    const id = req.body.id
    const name = req.body.name
    try {
        manuRef.doc(own).collection('products').doc(id).delete()
        console.log(chalk.yellow.inverse(' DEL '), chalk.yellow('Deleted a product'))
        notiRef.add({ 
            subject: "You have deleted a product", 
            detail: "Your product called \'" + name + "\' has been deleted." ,
            date: dateTime.create().format('d-m-Y'),
            id: own
        })
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added notification'))
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- check isOwner ----------

router.post('/manufacturer/isOwner', async (req, res) => {
    const token = req.headers.authorization
    const role = tokenManagement.decode(token).role
    const own = tokenManagement.decode(token).own
    const id = req.body.id
    try {
        if (role !== 'manufacturer') {
            res.status(201).send(false)
        } else {
            const doc = await manuRef.doc(own).collection('products').doc(id).get()
            if (!doc.exists) {
                res.status(201).send(false)
                console.log(chalk.red.inverse(' ERR '), chalk.red('No manufacturer found'))
            } else {
                res.status(201).send(true)
                console.log(chalk.cyan.inverse(' GET '), chalk.cyan('This is owner'))
            }
        }
    } catch (e) {
        res.status(201).send(false)
    }
})

// ---------- get Noti ----------

router.get('/manufacturer/getNoti', async (req, res) => {
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

module.exports = router;