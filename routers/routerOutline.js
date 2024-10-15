const express = require('express')
const router = new express.Router()
const chalk = require('chalk')
const admin = require('firebase-admin')
// const serviceAccount = require('../ServiceAccountKey.json')
// const { request } = require('express')
// const app = express()
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// })
// const port = process.env.PORT || 3002
// app.listen(port, () => console.log(`Listening on port${port}...`) )
// app.use(express.json());

const db = admin.firestore();
const contributorRef = db.collection('contributors')

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
router.get('/contributor/:id', async (req, res) => {
    const id = req.params.id;
    try {
        const doc = await contributorRef.doc(id).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found from this id.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get contributor:', doc.data().name))
        }
        res.status(201).send(doc.data())
    } catch (e) {
        res.status(400).send(e)
    }
});

// get all projects in contributor
router.post('/contributor/project', async (req, res) => {
    const id = req.body.id;
    try {
        const allDocs = await contributorRef.doc(id).collection('projects').get();
        const docsArray = []
        allDocs.forEach(doc => {
            docsArray.push(doc)
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

// get project in contributor by project doc id
router.post('/contributor/project/:id', async (req, res) => {
    const contributorId = req.body.id;
    const projectId = req.params.id;
    try {
        const doc = await contributorRef.doc(contributorId).collection('projects').doc(projectId).get();
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No project found from this id.'))
        } else {
            console.log(chalk.cyan.inverse(' GET '), chalk.cyan('Get project:', doc.name))
        }
        res.status(201).send(doc.data())
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- create ----------

// add new contributor
router.post('/contributor/add', async (req, res) => {
    const body = req.body
    try {
        const doc = await contributorRef.add(body)
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added contributor'))
        res.status(201).send(body)
    } catch (e) {
        res.status(400).send(e)
    }
})

// add new project to specific contributor id
router.post('/contributor/add/:id', async (req, res) => {
    const id = req.params.id
    const body = req.body
    try {
        const doc = await contributorRef.doc(id).collection('projects').add(body)
        console.log(chalk.green.inverse(' ADD '), chalk.green('Added project'))
        res.status(201).send(body)
    } catch (e) {
        res.status(400).send(e)
    }
})

// ---------- update ----------

// update contributor by id
router.put('/contributor/updatecontributor/:id', async (req, res) => {
    const id = req.params.id
    const body = req.body
    try {
        const doc = await contributorRef.doc(id).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found.'))
        } else {
            contributorRef.doc(id).update(body)
            console.log(chalk.magenta.inverse(' UPD '), chalk.magenta('Updated contributor data'))
        }
        const updatedDoc = await contributorRef.doc(id).get()
        res.status(201).send(updatedDoc.data())
    } catch (e) {
        res.status(400).send(e)
    }
})

// update project by id (contributor id in body project id in url)
router.put('/contributor/updateproject/:id', async (req, res) => {
    const projectId = req.params.id
    const contributorId = req.body.id
    const body = req.body
    delete body.id;
    try {
        const doc = await contributorRef.doc(contributorId).collection('projects').doc(projectId).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('Not found.'))
        } else {
            if (body.hasOwnProperty('material')) {
                const materialArray = body.material
                const dataJson = {
                    "material": materialArray,
                    "address": doc.data().address,
                    "name": doc.data().name,
                    "preparing": doc.data().preparing,
                    "projectDetail": doc.data().projectDetail,
                    "shippingService": doc.data().shippingService
                }
                contributorRef.doc(contributorId).collection('projects').doc(projectId).set(dataJson)
                delete body.material
            }
            contributorRef.doc(contributorId).collection('projects').doc(projectId).update(body)
            console.log(chalk.magenta.inverse(' UPD '), chalk.magenta('Updated project data'))
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

// delete project by id (contributor id in body project id in url)
router.delete('/contributor/deleteproject/:id', async (req, res) => {
    const projectId = req.params.id
    const contributorId = req.body.id
    const body = req.body
    try {
        const doc = await contributorRef.doc(contributorId).get()
        if (!doc.exists) {
            console.log(chalk.red.inverse(' ERR '), chalk.red('No contributor found'))
        } else {
            contributorRef.doc(contributorId).collection('projects').doc(projectId).delete()
            console.log(chalk.yellow.inverse(' DEL '), chalk.yellow('Delete a project'))
        }
        res.status(201).send(body)
    } catch (e) {
        res.status(400).send(e)
    }
})

module.exports = router;

// to delete collection (or sub-collection) need to delete all doc and collection will be deleted automatically 
// to delete field need to delete by update

// ---------- other ----------
// delete doc
// async function deleteDocument(db) {
//     const contributor = db.collection('contributors')
//     const doc = await contributor.where('name', '==', 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)').get();
//     if (doc.empty) {
//         console.log(chalk.red('No product from value matching documents.'));
//         return;
//     }
//     doc.forEach(doc => {
//         db.collection('contributors').doc(doc.id).delete();
//     });
// }
// deleteDocument(db)

//delete sub-collection by delete document inside it. if sub-collection has sub-collection inside, need to delete deeper sub-collection first. if no document inside collection, it will be deleted automatically
// async function deleteSubCollection(db) {
//     const contributor = db.collection('contributors')
//     const doc = await contributor.where('name', '==', 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)').get();
//     if (doc.empty) {
//         console.log(chalk.red('No product from value matching documents.'));
//         return;
//     }
//     doc.forEach(async doc => {
//         const projectRef = db.collection('contributors').doc(doc.id).collection('projects')
//         const project = await projectRef.where('name', '==', 'ccc').get();
//         if (project.empty) {
//             console.log(chalk.red('No product from value matching documents.'));
//             return;
//         }
//         project.forEach(project => {
//             db.collection('contributors').doc(doc.id).collection('projects').doc(project.id).delete();
//         });
//     });
// }
// deleteSubCollection(db)

// // original
// const chalk = require('chalk');
// const admin = require('firebase-admin');
// const serviceAccount = require('./ServiceAccountKey.json');
// admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
// });

// const db = admin.firestore();

// // ----------- get ------------
// // get manufacturer doc from doc id
// async function getManufacturer(id, db) {
//     const manufacturer = db.collection('manufacturers').doc(id);
//     const doc = await manufacturer.get();
//     if (!doc.exists) {
//         console.log(chalk.red('No smanu found!'));
//     } else {
//         console.log(chalk.cyan.inverse('manu data:'), doc.data());
//     }
// } 
// // getManufacturer('sample manufacturer', db);

// // get product doc in manufacturer doc from doc id
// async function getProduct(id, db) {
//     const product = db.collection('manufacturers').doc('sample manufacturer').collection('products').doc(id);
//     const doc = await product.get()
//     if (!doc.exists) {
//         console.log(chalk.red('No product found!'));
//     } else {
//         console.log(chalk.green.inverse('product data:'), doc.data());
//     }
// } 
// // getProduct('sample product 2', db);

// // get product doc in manufacturer doc from searching with key "name"
// // real work gonna use code below:
// // query.get()
// //   .then(snapshot => {
// //     if (!snapshot.exists) {
// //       console.log('No such document!');
// //     } else {
// //       console.log('Document data:', snapshot.data());
// //     }
// //   }.catch(err => {
// //     console.log('Error getting document', err);
// //   });
// async function getProductFromValue(name, db) {
//     const product = db.collection('manufacturers').doc('sample manufacturer').collection('products');
//     const doc = await product.where('name', '==', name).get();
//     if (doc.empty) {
//         console.log(chalk.red('No product from value matching documents.'));
//         return;
//     }
//     doc.forEach(doc => {
//         console.log(chalk.blue.inverse('product data from value:'), doc.data());
//     });
// } 
// // getProductFromValue('sample product 2', db);

// //get all sub-collections
// async function getSubCollections(db) {
//     const product = db.collection('manufacturers').doc('sample manufacturer').collection('products');
//     const doc = await product.listDocuments();
//     doc.forEach(doc => {
//         console.log(chalk.yellow.inverse('found collections with id:'), doc.id);
//     })
// } 
// //getSubCollections(db);

// // get sample contributor
// async function getSampleContributor(db) {
//     const contributor = db.collection('contributors')
//     const doc = await contributor.where('name', '==', 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)').get()
//     if (doc.empty) {
//         console.log(chalk.red('No product from value matching documents.'));
//         return;
//     }
//     doc.forEach(doc => {
//         console.log(chalk.blue.inverse('product data from value:'), doc.data());
//     });
// }

// // ------------- create -------------
// // to create new collection, use db.collection([new collection name]).doc([new document name]).get() <- too EZ

// // Add a new document with a generated id.
// const newContributor = {
//     name: 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)',
//     detail: 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน) หรือ จีซี ในฐานะแกนนำธุรกิจเคมีภัณฑ์ของกลุ่ม ปตท. มุ่งมั่นในการเป็นผู้นำในธุรกิจเคมีภัณฑ์ที่ผสานนวัตกรรม และเทคโนโลยีที่เป็นมิตรต่อสิ่งแวดล้อม เพื่อการพัฒนาผลิตภัณฑ์เพื่อสร้างสรรค์ชีวิตความเป็นอยู่ที่ดีขึ้น เราดำเนินธุรกิจปิโตรเคมีครบวงจร ครอบคลุมการผลิตและจำหน่ายผลิตภัณฑ์ปิโตรเคมีขั้นต้น ขั้นกลางและขั้นปลาย ซึ่งสามารถนำไปต่อยอดเป็นเคมีภัณฑ์ที่หลากหลายและเป็นวัตถุดิบพื้นฐานของอุตสาหกรรมต่อเนื่องต่างๆ ได้แก่ บรรจุภัณฑ์ เครื่องนุ่งห่ม อุปกรณ์การสื่อสารและอิเล็กทรอนิกส์ เครื่องใช้ไฟฟ้า ยานยนต์ ธุรกิจก่อสร้าง พลาสติกเชิงวิศวกรรม อุปกรณ์ ทางการเกษตร และอีกมากมาย ซึ่งล้วนเป็นผลิตภัณฑ์รอบตัวเราและช่วยอำนวยความสะดวกในชีวิตประจำวันเพื่อสร้างสรรค์ชีวิตที่ดีกว่า',
//     email: '',
//     address: 'เลขที่ 555/1 ศูนย์เอนเนอร์ยี่คอมเพล็กซ์ อาคารเอ ชั้น 14 – 18 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900',
//     contactNumber: '022658400',
//     website: 'https://www.pttgcgroup.com/th/about'
// }

// async function addDocument(data, db) {
//     const res = await db.collection('contributors').add(data);
//     console.log('Added document with ID: ', res.id);
// }
// // addDocument(newContributor ,db).then(() => {
// //     getSampleContributor(db);
// // })

// //add new sub-collection (with doc) in doc
// const project = {
//     address: 'aaa22',
//     detail: 'bbb22',
//     name: 'ccc22',
//     shippingService: 'ddd22'
// }
// async function addDocument(project, db) {
//     const contributor = db.collection('contributors')
//     const doc = await contributor.where('name', '==', 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)').get()
//     if (doc.empty) {
//         console.log(chalk.red('No product from value matching documents.'));
//         return;
//     }
//     doc.forEach(doc => {
//         db.collection('contributors').doc(doc.id).collection('projects').add(project)
//     });
// }
// // addDocument(project, db)

// // ------------- update -------------

// async function updateData(db) {
//     const contributor = db.collection('contributors')
//     const doc = await contributor.where('name', '==', 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)').get();
//     if (doc.empty) {
//         console.log(chalk.red('No product from value matching documents.'));
//         return;
//     }
//     doc.forEach(doc => {
//         db.collection('contributors').doc(doc.id).update({ email: 'noemail3@noemail.com'});
//     });
// }
// // updateData(db).then(() => {
// //     getSampleContributor(db)
// // })

// // ------------- delete -------------
// // to delete collection (or sub-collection) need to delete all doc and collection will be deleted automatically 
// // to delete field need to delete by update

// // delete doc
// async function deleteDocument(db) {
//     const contributor = db.collection('contributors')
//     const doc = await contributor.where('name', '==', 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)').get();
//     if (doc.empty) {
//         console.log(chalk.red('No product from value matching documents.'));
//         return;
//     }
//     doc.forEach(doc => {
//         db.collection('contributors').doc(doc.id).delete();
//     });
// }
// // deleteDocument(db)

// //delete sub-collection by delete document inside it. if sub-collection has sub-collection inside, need to delete deeper sub-collection first. if no document inside collection, it will be deleted automatically
// async function deleteSubCollection(db) {
//     const contributor = db.collection('contributors')
//     const doc = await contributor.where('name', '==', 'บริษัท พีทีที โกลบอล เคมิคอล จำกัด (มหาชน)').get();
//     if (doc.empty) {
//         console.log(chalk.red('No product from value matching documents.'));
//         return;
//     }
//     doc.forEach(async doc => {
//         const projectRef = db.collection('contributors').doc(doc.id).collection('projects')
//         const project = await projectRef.where('name', '==', 'ccc').get();
//         if (project.empty) {
//             console.log(chalk.red('No product from value matching documents.'));
//             return;
//         }
//         project.forEach(project => {
//             db.collection('contributors').doc(doc.id).collection('projects').doc(project.id).delete();
//         });
//     });
// }
// // deleteSubCollection(db)