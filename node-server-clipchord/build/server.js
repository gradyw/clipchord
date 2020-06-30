"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const express = require('express');
exports.admin = require('firebase-admin');
var data = fs_1.default.readFileSync('admin.txt');
let serviceAccount = require(data.toString());
exports.admin.initializeApp({
    credential: exports.admin.credential.cert(serviceAccount),
    storageBucket: "clipchord.appspot.com",
    databaseURL: "https://clipchord.firebaseio.com"
});
const fileManager = require("./fileManager");
const databaseManager = require("./databaseManager");
const homedir = require('os').homedir();
const appdir = homedir + '/Desktop/ClipchordApp/';
let app = express();
async function run() {
    console.log("Testing");
    // create a database directory for any new users
    await new Promise((resolve) => {
        let prevAllUsers = Object.assign([], databaseManager.allUsers);
        databaseManager.saveUsers()
            .then(function () {
            for (let i = prevAllUsers.length; i < databaseManager.allUsers.length; i++) {
                databaseManager.createDatabaseUserDirectory(databaseManager.allUsers[i]);
            }
        }).then(function () {
            databaseManager.allUsers.forEach(function (user) {
                console.log(user.getName());
                databaseManager.addUserToNextGroup(user);
            });
        });
        resolve();
    });
    // download any videos that have not yet been downloaded
    await new Promise((resolve) => {
        databaseManager.dbGroupsRef.orderByKey();
        databaseManager.dbGroupsRef.once("value").then(function (snapshot) {
            snapshot.forEach(function (allGroups) {
                let key = allGroups.key;
                allGroups.forEach(function (singleGroup) {
                    let key2 = singleGroup.key;
                    if (key2 == "users") {
                        singleGroup.forEach(function (userKey) {
                            let key3 = userKey.key;
                            let downloaded = true;
                            let videoComplete = false;
                            userKey.forEach(function (userDownloaded) {
                                if (userDownloaded.key == "Downloaded" && userDownloaded.val() == false) {
                                    downloaded = false;
                                }
                                if (userDownloaded.key == "VideoComplete" && userDownloaded.val() == true) {
                                    videoComplete = true;
                                }
                            });
                            if (!downloaded && videoComplete) {
                                fileManager.downloadFileAndDelete("Groups/" + allGroups.key + "/" + userKey.key + "/" + userKey.key + ".mp4", "Groups/" + allGroups.key + "/" + userKey.key, userKey.key + ".mp4");
                                databaseManager.dbGroupsRef.child(key + "/" + key2 + "/" + key3 + "/Downloaded").set(true);
                            }
                        });
                    }
                });
                return true;
            });
            resolve();
        }, function (errorObject) {
            console.log("The read failed: " + errorObject.code);
            resolve();
        });
    });
    console.log("Finished");
}
run();
