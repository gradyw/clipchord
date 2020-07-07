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

class FinalVideoOnCloud {
    private groupId: string
    private uid: string
    private time: number

    constructor(groupId: string, uid: string, time: number) {
        this.groupId = groupId
        this.uid = uid
        this.time = time
    }

    getUid(): string {
        return this.uid
    }

    getGroupId(): string {
        return this.groupId
    }

    getTime(): number {
        return this.time
    }
}



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

async function signIn() {
    const password = fs.readFileSync('authpw.txt').toString()
    const email = fs.readFileSync('authemail.txt').toString()

    await new Promise((resolve, reject) => {
        firebase.auth().signInWithEmailAndPassword(email, password).then(
            resolve()
        ).catch(function(error: any) {
            console.log(error.code);
            reject()
        })
    })    
}

let groupAwaitingDownload: string = "None";
let userAwaitingDownload: string = "None";
let groupAwaitingFinal: string = "None";
let userAwaitingFinal: string = "None";

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

async function uploadCompletedVideo(groupId: string, uid: string) {
    bucket.upload(appdir + "Groups/" + groupId + "/finalVideo.mp4", {
        destination: "Groups/" + groupId + "/users/" + uid + "/finalVideo.mp4"
    });
}


async function deleteFinalVideo(groupId: string, uid: string) {
    bucket.file('Groups/' + groupId + '/users/' + uid + '/finalVideo.mp4').delete()
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
    let finalVideosOnCloud: FinalVideoOnCloud[] = []
    
    while (true) {
        // check for next video awaiting downloading and next final video requested
        await new Promise((resolve, reject) => {    
            let getUploadedWaiting = functions.httpsCallable('getUploadedWaiting');
            getUploadedWaiting({text: 'none'}).then(function(result: any) {
                groupAwaitingDownload = result.data.groupId
                userAwaitingDownload = result.data.uid
                resolve()
            }).catch(function(error: any) {
                console.log(error.message)
                reject()
            })
        })

        await new Promise((resolve, reject) => {
            let getNextFinalRequested = functions.httpsCallable('getNextRequestedVideo')
            getNextFinalRequested({text: 'none'}).then(function(result: any) {
                groupAwaitingFinal = result.data.groupId
                userAwaitingFinal = result.data.uid
                resolve()
            }).catch(function(error: any) {
                console.log(error.message)
                reject()
            })

        })
        


        // download any videos that have not yet been downloaded
        await new Promise((resolve, reject) => {
            console.log(groupAwaitingDownload, "Group", userAwaitingDownload, "User")
            if (groupAwaitingDownload === "None" || userAwaitingDownload === "None") resolve()
            else {
                downloadFileAndDelete("Groups/" + groupAwaitingDownload + "/users/" + userAwaitingDownload + "/" + userAwaitingDownload + ".mp4", 
                    "Groups/" + groupAwaitingDownload + "/users/" + userAwaitingDownload, userAwaitingDownload + ".mp4")
                .catch(function(error: any) {
                    console.log(error.message)
                    reject();
                })
                dbGroupsRef.child(groupAwaitingDownload + "/users/" + userAwaitingDownload + "/Downloaded").set(true);
                resolve()
            }
            
        });


        let finalVideoUploading: boolean = false
        let videoOnCloud: any = null
        // upload next requested final video
        await new Promise((resolve, reject) => {
            console.log(groupAwaitingFinal, "Group", userAwaitingFinal, "User")
            if (groupAwaitingFinal === "None" || userAwaitingFinal === "None") resolve()
            else {
                uploadCompletedVideo(groupAwaitingFinal, userAwaitingFinal)
                .catch(function(error: any) {
                    console.log(error.message)
                    reject()
                })
                finalVideoUploading = true
                let date = new Date()
                let time: number = date.getTime() // time in ms since 01/01/1970
                videoOnCloud = new FinalVideoOnCloud(groupAwaitingFinal, userAwaitingFinal, time)
                resolve()
            }
        })
        
        // delete final videos from cloud that have been on cloud for more than 5 minutes
        await new Promise((resolve) => {
            let indicesToSkip: number[] = []
            let date = new Date()
            let now: number = date.getTime() // time in ms since 01/01/1970
            for (let i = 0; i < finalVideosOnCloud.length; i++) {
                if ((now - finalVideosOnCloud[i].getTime()) >= 300000) {// there are 300000 ms in 5 min
                    console.log('deleting')
                    deleteFinalVideo(finalVideosOnCloud[i].getGroupId(), finalVideosOnCloud[i].getUid())
                    .catch(function(error: any) {
                        console.log (error.message)
                    })
                    indicesToSkip.push(i)
                }
            }
            let newList: FinalVideoOnCloud[] = []
            for (let i = 0; i < finalVideosOnCloud.length; i++) {
                if (!(i in indicesToSkip)) {
                    newList.push(finalVideosOnCloud[i])
                }
            }
            finalVideosOnCloud = newList
            resolve()
        })
        await wait(10000) // only run loop every 10 seconds to avoid burdening system
        
        // If a final video was uploaded, don't add it to the list of videos in the cloud until after 
        // the wait because it takes time for the video to upload
        await new Promise((resolve) => {
            if (finalVideoUploading && videoOnCloud != null) {
                finalVideosOnCloud.push(videoOnCloud)
            }
            resolve()
        })
    }
}

run()