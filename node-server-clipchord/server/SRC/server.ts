import fs from 'fs';
import { User, Group } from './databaseManager';
import { Transform } from 'stream';
import { type } from 'os';
import { resolve } from 'path';
import { group } from 'console';
import { sign } from 'crypto';

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

let functions = firebase.functions();


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

const wait = (time: number) => {
    return new Promise(resolve => setTimeout(resolve, time))
}

// remove and secure pw!!!!
async function signIn() {
    const password = fs.readFileSync('authpw.txt').toString()
    const email = fs.readFileSync('authemail.txt').toString()

    await new Promise((resolve, reject) => {
        console.log(email, password)
        firebase.auth().signInWithEmailAndPassword(email, password).then(
            // console.log("Signed in", firebase.auth().uid)
            resolve()
        ).catch(function(error: any) {
            console.log(error.code);
            reject()
        })
    })    
}

let waitingGroup: string = "None";
let waitingUser: string = "None";

async function downloadFileAndDelete(name: string, destDirName: string, destFileName: string) {
    console.log("dest" + name + destDirName);
    const downloadedFile = downloadFile(name, destDirName, destFileName);
    (await downloadedFile).delete();
}

let bucket = admin.storage().bucket();


// THIS LINE TO NEXT MAJOR COMMENT SHOULD BE BACK IN FILE MANAGER. COULDN'T
// FIGURE OUT HOW TO WORK MODULES. GRADY 7/4/20

// TODO find a way to specify return type as bucket file
async function downloadFile(name: string, destDirName: string, destFileName: string) {
    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: appdir + destDirName + "/" + destFileName
    };

    if (!fs.existsSync(appdir + destDirName)) {
        fs.mkdirSync(appdir + destDirName, {recursive: true})
    }

    // Downloads the file
    await bucket
        .file(name)
        .download(options);

    console.log(
        'success'
    );

    return bucket.file(name);
}

// END OF MOVED FUNCTIONS FROM FILE MANAGER
// BEGINNING OF MOVED DEFINITIONS FROM DATABASE MANAGER
const db = admin.database()
const dbGroupsRef = db.ref('Data/Groups')
// END OF MOVED DEFINITIONS FROM DATABASE MANAGER

async function run() {


    // should be outside of loop
    await signIn()
    await wait(10000)
    
    
    
    // check for next video awaiting downloading
    await new Promise((resolve, reject) => {
        
        let getUploadedWaiting = functions.httpsCallable('getUploadedWaiting');
        getUploadedWaiting({text: 'none'}).then(function(result: any) {
            waitingGroup = result.data.groupId
            waitingUser = result.data.uid
            resolve()

        }).catch(function(error: any) {
            console.log(error.message)
            reject()
        })
    })

    

    
    // // download any videos that have not yet been downloaded
    await new Promise((resolve, reject) => {
        console.log(waitingGroup, "Group", waitingUser, "User")
        if (waitingGroup === "None" || waitingUser === "None") resolve()
        else {
            downloadFileAndDelete("Groups/" + waitingGroup + "/users/" + waitingUser + "/" + waitingUser + ".mp4", 
                "Groups/" + waitingGroup + "/users/" + waitingUser, waitingUser + ".mp4")
            .catch(function(error: any) {
                console.log(error.message)
                 reject();
            })
            dbGroupsRef.child(waitingGroup + "/users/" + waitingUser + "/Downloaded").set(true);
            resolve()
        }
        
    });
    console.log("Finished");
}

run()