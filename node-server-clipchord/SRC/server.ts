import fs from 'fs';
//import { User, Group } from './databaseManager';
import { Transform } from 'stream';
import { type } from 'os';
import { resolve } from 'path';
import { group } from 'console';

const express = require('express');
const http = require('http');

const fileManager = require("./fileManager");
const databaseManager = require("./databaseManager");
const homedir = require('os').homedir();
const appdir = homedir + '/Desktop/ClipchordApp/';

let app = express();

const hostname = '127.0.0.1';
const port = 7777;

const server = http.createServer((req:any, res:any) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
});


async function run() {

    console.log("Testing");

    // create a database directory for any new users
    /*await new Promise((resolve) => {
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
    });*/
    console.log("Finished");
}

run()