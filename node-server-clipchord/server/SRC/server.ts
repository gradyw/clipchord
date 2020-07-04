import fs from 'fs';
import { User, Group } from './databaseManager';
import { Transform } from 'stream';
import { type } from 'os';
import { resolve } from 'path';
import { group } from 'console';

const express = require('express');
export const admin = require('firebase-admin');
var data = fs.readFileSync('admin.txt');
let serviceAccount = require(data.toString());

const firebase = require("firebase");


const firebaseConfig = {
    apiKey: "AIzaSyDxsGkfoFxwRVAA6uoQWyDH8FSdh6C7ROk",
    authDomain: "clipchord.firebaseapp.com",
    databaseURL: "https://clipchord.firebaseio.com",
    projectId: "clipchord",
    storageBucket: "clipchord.appspot.com",
    messagingSenderId: "303610186025",
    appId: "1:303610186025:web:3cd3c0dc7d14f85baf4f38",
    measurementId: "G-96T9MCEMF1"
};


  


firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();



messaging.onMessage((payload: any) =>  {
    console.log('Message received. ', payload);
})

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
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
        let prevAllUsers: User[] = Object.assign([], databaseManager.allUsers);
        databaseManager.saveUsers()
            .then(function () {
                for (let i = prevAllUsers.length; i < databaseManager.allUsers.length; i++) {
                    databaseManager.createDatabaseUserDirectory(databaseManager.allUsers[i])
                }
            }).then(function () {// check for any new group the user is in
                databaseManager.allUsers.forEach(function (user: User) {
                    console.log(user.getName())
                    databaseManager.addUserToNextGroup(user)
                });
            })
        resolve();
    });


    // download any videos that have not yet been downloaded
    await new Promise((resolve) => {
        databaseManager.dbGroupsRef.orderByKey();

        databaseManager.dbGroupsRef.once("value").then(function (snapshot: any) {
            snapshot.forEach(function (allGroups: any) {
                let key = allGroups.key;
                allGroups.forEach(function (singleGroup: any) {
                    let key2 = singleGroup.key;
                    if (key2 == "users") {
                        singleGroup.forEach(function (userKey: any) {
                            let key3 = userKey.key
                            let downloaded = true
                            let videoComplete = false
                            userKey.forEach(function (userDownloaded: any) {
                                if (userDownloaded.key == "Downloaded" && userDownloaded.val() == false) {
                                    downloaded = false;
                                }
                                if (userDownloaded.key == "VideoComplete" && userDownloaded.val() == true) {
                                    videoComplete = true;
                                }
                            })
                            if (!downloaded && videoComplete) {
                                fileManager.downloadFileAndDelete("Groups/" + allGroups.key + "/" + userKey.key + "/" + userKey.key + ".mp4",
                                    "Groups/" + allGroups.key + "/" + userKey.key, userKey.key + ".mp4");
                                databaseManager.dbGroupsRef.child(key + "/" + key2 + "/" + key3 + "/Downloaded").set(true);
                            }
                        })
                    }

                });

                return true;
            })
            resolve();
        }, function (errorObject: any) {
            console.log("The read failed: " + errorObject.code);
            resolve();
        });
    });
    console.log("Finished");
}

run()