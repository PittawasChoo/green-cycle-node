const express = require('express')
const router = new express.Router()
const chalk = require('chalk')
const admin = require('firebase-admin')

const db = admin.firestore();
const categoryRef = db.collection('categories')
const materialRef = db.collection('materials')
const contributorRef = db.collection('contributors')
const manufactorRef = db.collection('manufacturers')

// ---------- get ----------

// get all category
router.get('/category', async (req, res) => {
    const id = "gYapPxp9KS4F3ijtd4T3";
    try {
        const doc = await categoryRef.doc(id).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No category found from this id.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get all categories'))
            res.status(201).send(doc.data().name)
        }
    } catch (e) {
        res.status(400).send(e)
    }
});

// ---------- create ----------

const updateProject = async (allDocs, materials, category) => {
        allDocs.forEach( async cont => {
            contributorRef.doc(cont.id)
                .listCollections()
                .then( subCollections => {
                    subCollections.forEach(async subCollection => {
                        await subCollection
                            .get()
                            .then( array => {
                                array.docs.forEach( doc => {
                                    let newDoc = doc.data()
                                    for (let i = 0; i < newDoc.material.length; i++) {
                                        if (materials.includes(newDoc.material[i].id)) {
                                            if (!newDoc.categories.includes(category)) {
                                                newDoc.categories.push(category)
                                            }
                                        }
                                    }
                                    contributorRef.doc(cont.id).collection('projects').doc(doc.id).update(newDoc)
                                })
                            })
                    })
                })
        })
}

const updateProduct = async (allDocs, materials, category) => {
        allDocs.forEach( async manu => {
            manufactorRef.doc(manu.id)
                .listCollections()
                .then( subCollections => {
                    subCollections.forEach(async subCollection => {
                        await subCollection
                            .get()
                            .then( array => {
                                array.docs.forEach( doc => {
                                    let newDoc = doc.data()
                                    for (let i = 0; i < newDoc.material.length; i++) {
                                        if (materials.includes(newDoc.material[i].id)) {
                                            if (!newDoc.categories.includes(category)) {
                                                newDoc.categories.push(category)
                                            }
                                        }
                                    }
                                    manufactorRef.doc(manu.id).collection('products').doc(doc.id).update(newDoc)
                                })
                            })
                    })
                })
            }
        )
}

const updateMaterial = async (allDocs, materials, category) => {
    allDocs.forEach( async mat => {
        let newDoc = mat.data()
        if (materials.includes(mat.id)) {
            if (!newDoc.category.includes(category)) {
                newDoc.category.push(category)
            }
        }
        materialRef.doc(mat.id).update(newDoc)
    })
}

// add new category
router.post('/category/add', async (req, res) => {
    const name = req.body.name
    const id = "gYapPxp9KS4F3ijtd4T3"
    const material = req.body.material
    try {
        const allCont = await contributorRef.get()
        const allManu = await manufactorRef.get()
        const allMat = await materialRef.get()
        const doc = await categoryRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No category found.'))
        } else {
            // add category to categories document
            let categoryArray = doc.data().name
            categoryArray.push(name)
            categoryRef.doc(id).update({name: categoryArray})
            console.log(chalk.green.inverse(' ADD '), chalk.green('Added new category'))

            // update category to project with same material
            await updateProject(allCont, material, name)

            // update category to product with same material
            await updateProduct(allManu, material, name)

            // update category to material in list
            await updateMaterial(allMat, material, name)
        }
        res.status(201).send(name)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- update ----------

// update category(body -> index (0-x) and edited name)
router.put('/category/updatecategory', async (req, res) => {
    const body = req.body
    const id = "gYapPxp9KS4F3ijtd4T3";
    try {
        const doc = await categoryRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No category found.'))
        } else {
            let categoryArray = doc.data().name
            categoryArray[body.index] = body.name
            categoryRef.doc(id).update({name: categoryArray})
            console.log(chalk.magenta.inverse(' UPD '), chalk.magenta('Updated category data'))
        }
        const updatedDoc = await categoryRef.doc(id).get()
        res.status(201).send(updatedDoc.data())
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- delete ----------

// delete category
router.delete('/category', async (req, res) => {
    const body = req.body
    const id = "gYapPxp9KS4F3ijtd4T3";
    try {
        const doc = await categoryRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No category found'))
        } else {
            let categoryArray = doc.data().name
            categoryArray.splice(body.index)
            categoryRef.doc(id).set({name: categoryArray})
            console.log(chalk.yellow.inverse(' DEL '), chalk.yellow('Deleted a category'))
        }
        res.status(201).send(body)
    } catch (e) {
        res.status(400).send(e)
    }
})

module.exports = router;