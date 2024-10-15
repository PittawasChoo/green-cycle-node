const express = require("express");
const router = new express.Router();
const chalk = require("chalk");
const admin = require("firebase-admin");
const firebase = require("firebase");
const tokenManagement = require("../middleware/tokenManage");
const { decode } = require("jsonwebtoken");
const { Storage } = require("@google-cloud/storage");
const fs = require("fs");
const dateTime = require("node-datetime");

const storage = new Storage({ keyFilename: "./ServiceAccountKey.json" });
const storageRef = storage.bucket("greencycle-db.appspot.com");
const storage2 = admin.storage();

router.post("/upload", async (req, res) => {
    let file = req.files.file;
    const uploadName = dateTime.create().format("Y-m-d-H-M-S") + "-" + file.name;
    storageRef.upload(file.tempFilePath, { destination: uploadName }).then((snapshot) => {
        storageRef.file(uploadName).makePublic(function (err, apiResponse) {});
        console.log(chalk.green.inverse(" ADD "), chalk.green("Added new image to storage"));
        return res.status(201).send(storageRef.file(uploadName).publicUrl());
    });
});

router.post("/mobileUpload", async (req, res) => {
    let file = req.files.file;
    const uploadName = dateTime.create().format("Y-m-d-H-M-S") + "-mobile_upload";
    storageRef.upload(file.tempFilePath, { destination: uploadName }).then((snapshot) => {
        storageRef.file(uploadName).makePublic(function (err, apiResponse) {});
        console.log(chalk.green.inverse(" ADD "), chalk.green("Added new image to storage"));
        return res.status(201).send(storageRef.file(uploadName).publicUrl());
    });
});

router.post("/fileupload", function (req, res) {
    let fstream;
    req.pipe(req.busboy);
    req.busboy.on("file", function (fieldname, file, filename) {
        console.log("Uploading: " + filename);
        fstream = fs.createWriteStream("../files/" + filename);
        file.pipe(fstream);
        console.log(file);
        console.log(filename);
        storageRef.upload(file, { destination: filename }).then((snapshot) => {
            console.log("Uploaded a blob or file!");
        });
        res.status(201).send("uploaded");
    });
});

module.exports = router;
