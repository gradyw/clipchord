export { }
// import * as fs from 'fs';
// import neatCsv = require('neat-csv');

// import * as csv from 'csv';
// const obj = csv();

import fs from 'fs';
import { Transform } from 'stream';
import { type } from 'os';
import { resolve } from 'path';
import { group } from 'console';

let express = require('express');
let admin = require('firebase-admin');
let ffmpeg = require('fluent-ffmpeg');
const homedir = require('os').homedir();
const appdir = homedir + '/Desktop/ClipchordApp/';

var data = fs.readFileSync('admin.txt');

let serviceAccount = require(data.toString());

let app = express();

let PORT = 3000;

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "clipchord.appspot.com",
    databaseURL: "https://clipchord.firebaseio.com"
});

let auth = admin.auth();

class User {
    private uid: string;
    private name: string;
    private email: string;
    private nextGroup: string;

    constructor(uid: string, name: string, email: string, nextGroup: string) {
        this.uid = uid;
        this.name = name;
        this.email = email;
        this.nextGroup = nextGroup;
    }

    getUid(): string {
        return this.uid;
    }

    getName(): string {
        return this.name;
    }

    getEmail(): string {
        return this.email;
    }

    getNextGroup(): string {
        return this.nextGroup;
    }

    setNextGroup(nextGroup: string): void {
        this.nextGroup = nextGroup;
    }
}


let allUsers: User[] = [];

async function saveUsers(nextPageToken?: any) {

    await new Promise((resolve, reject) => {
        auth.listUsers(1000, nextPageToken)
            .then(function (listUserResult: any) {
                listUserResult.users.forEach(function (userRecord: any) {
                    console.log(userRecord.uid);
                    allUsers.push(new User(userRecord.uid, userRecord.displayName, userRecord.email, ""));
                });
                if (listUserResult.pageToken) {
                    saveUsers(listUserResult.pageToken)
                }
                resolve();
            })
            .catch(function (error: any) {
                console.log("Error retrieving users: ", error)
                reject()
            });
    });


}

let db = admin.database();
let dbUsersRef = db.ref("Data/Users");
let dbGroupsRef = db.ref("Data/Groups");

// dbRef.once("value", function(snapshot: any) {
//     console.log(snapshot.val());
//     console.log("Works");
// });

let bucket = admin.storage().bucket();

class Group {
    private id: string;
    private userids: string[];
    private downloaded: boolean;

    constructor(id: string, userids: string, downloaded: boolean) {
        this.id = id;
        this.userids = [];
        this.downloaded = downloaded;
        userids = userids.substring(1, userids.length - 1);
        let nameslist: string[] = userids.split(';');
        for (let i = 0; i < nameslist.length; i++) {
            this.userids.push(nameslist[i]);
        }
    }

    getID(): string {
        return this.id;
    }

    getUsernames(): string[] {
        return this.userids;
    }

    getDownloaded(): boolean {
        return this.downloaded;
    }

    setDownloaded(downloaded: boolean): void {
        this.downloaded = downloaded;
    }
}

async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function moveUserVideosFirebaseToLocal(groupid: number, username: string) {
    downloadFileAndDelete("Groups/" + groupid + "/" + username + ".mp4", "Groups/" + groupid, username + ".mp4");

}

function setNextGroup(user: User) {
    dbUsersRef.child(user.getUid()+ "/nextGroup").once("value").then(function (snapshot: any) {
        user.setNextGroup(snapshot.val() as string)
    });    
}

async function createDatabaseUserDirectory(user: User) {
    let dir = dbUsersRef.child(user.getUid() + "/name");
    dir.set(user.getName());
    dir = dbUsersRef.child(user.getUid() + "/email");
    dir.set(user.getEmail());
}

// TODO find a way to specify return type as bucket file
async function downloadFile(name: string, destDirName: string, destFileName: string) {
    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: appdir + destDirName + "/" + destFileName
    };

    if (!fs.existsSync(appdir + destDirName)) {
        fs.mkdirSync(appdir + destDirName);
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

async function downloadFileAndDelete(name: string, destDirName: string, destFileName: string) {
    console.log("dest" + name + destDirName);
    const downloadedFile = downloadFile(name, destDirName, destFileName);
    (await downloadedFile).delete();
}

async function uploadCompletedVideo(groupid: number) {
    bucket.upload(appdir + "/Groups/" + groupid + "final.mp4", {
        destination: "Groups/" + groupid + "/" + "final.mp4"
    });
}

async function edit() {
    var fileDs = ["PaperMoonBariFinal.mp4", "PaperMoonLeadFinal.mp4", "PaperMoonTenorFinal.mp4", "PaperMoonBassFinal.mp4"];
    for (let i = 0; i < fileDs.length; i++) {
        //await downloadFile("PaperMoon/" + fileDs[i], i + ".mp4").catch(console.log);
    }

    var audio = ffmpeg(appdir + '0.mp4');
    for (let i = 1; i < fileDs.length; i++) {
        audio.addInput(appdir + i + '.mp4');
    }
    audio.complexFilter([{
        filter: 'amix',
        options: {
            inputs: fileDs.length,
            duration: 'longest'
        }
    }]);
    audio.output(appdir + 'output.mp3');
    await new Promise((resolve, reject) => {
        audio
            .on('error', (err: Error) => {
                console.log('an error happened: ' + err.message);
                reject(err);
            })
            .on('end', () => {
                console.log('Audio has been merged succesfully...');
                resolve();
            })
            .run();
    });

    let closestSquareRt = Math.ceil(Math.sqrt(fileDs.length));
    let neededRows = Math.ceil(fileDs.length / closestSquareRt);
    let currentVid = 0;
    for (let h = 0; h < neededRows; h++) {
        var videoPart = ffmpeg();
        for (let i = 0; i < closestSquareRt; i++) {
            if (currentVid >= fileDs.length) {
                videoPart.input(appdir + 'empty.mp4');
            } else {
                videoPart.input(appdir + currentVid + '.mp4');
            }
            currentVid++;
        }
        videoPart.complexFilter([{
            filter: 'hstack',
            options: {
                inputs: closestSquareRt
            }
        }]);
        videoPart.output(appdir + "part" + h + '.mp4');
        await new Promise((resolve, reject) => {
            videoPart
                .on('error', (err: Error) => {
                    console.log('an error happened: ' + err.message);
                    reject(err);
                })
                .on('end', () => {
                    console.log('Video Part ' + h + ' has been merged succesfully...');
                    resolve();
                })
                .run();
        });
    }
    var video = ffmpeg();
    for (let h = 0; h < neededRows; h++) {
        video.input(appdir + 'part' + h + '.mp4');
    }
    video.complexFilter([{
        filter: 'vstack',
        options: {
            inputs: neededRows
        }
    }]);
    video.output(appdir + 'output.mp4');
    await new Promise((resolve, reject) => {
        video
            .on('error', (err: Error) => {
                console.log('an error happened: ' + err.message);
                reject(err);
            })
            .on('end', () => {
                console.log('Video has been merged succesfully...');
                resolve();
            })
            .run();
    });

    var complete = ffmpeg(appdir + 'output.mp4').input(appdir + 'output.mp3');
    complete.outputOptions(["-c:v copy",
        "-map 0:v:0",
        "-map 1:a:0"]);
    complete.output(appdir + 'complete.mp4');
    complete.on('end', function () {
        console.log('Complete!');
    }).on('error', function (err: Error) {
        console.log('an error happened: ' + err.message);
    }).run();
}
// edit();

console.log("test1")

// let groupsDownloaded: Group[] = [];
// let groupsLeftOnServer: Group[] = [];
// let groupsAwaitingReturn: Group[] = [];
// let groupsRequested: Group[] = [];
// let groupsComplete: Group[] = [];

// let groups: Group[] = [];

// async function populateFromCSV() {

//     let csvStream = fs.createReadStream(appdir + 'groups.csv');
//     let groupslist: any[] = [];
//     await new Promise((resolve) => {
//         csvStream
//             .pipe(csv(['ID', 'GROUPNAME', 'USERNAMES', 'DOWNLOADED']))
//             .on('data', (data) => {
//                 groupslist.push(data);
//             })
//             .on('end', () => {
//                 resolve();
//             });
//     });
//     await new Promise((resolve) => {
//         for (let i = 1; i < groupslist.length; i++) {
//             groups.push(new Group(groupslist[i]['ID'] as number, groupslist[i]['GROUPNAME'] as string, groupslist[i]['USERNAMES'] as string,
//                 groupslist[i]['DOWNLOADED'] as number == 1));
//         }
//         resolve();
//     });
//     console.log(groups);
// }


// async function read(dir: string) {
//     fs.createReadStream(dir)
//             .pipe(csv())
//             .on('data', (data) => {
//                 groups.push(new Group(data['ID'], data['GROUPNAME'], data['USERNAMES'], data['DOWNLOADED'] == 1));
//                 console.log(groups);

//             })
//             .on('end', () => {
//                 console.log(groups);
//     });
// }

// populateFromCSV();

function generateNextGroupID(): void {
    let length: number = 6
    let chars: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result: string = ''
    let matches = true
    while (matches) {
        result = ''
        matches = false
        for (let i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)]
        dbGroupsRef.once("value").then(function (snapshot: any) {
            snapshot.forEach(function (group: any) {
                console.log(group.key)
                if (group.key === result) {
                    matches = true
                }
            })
        })
    }
    console.log(result)
    let nextGroupRef = db.ref("Data")
    nextGroupRef.child("NextGroupID").set(result)
}



async function addUserToNextGroup(user: User) {
    let userRef = dbUsersRef.child(user.getUid());
    userRef.once("value").then(function (snapshot: any) {
        snapshot.forEach(function (userProfile: any) {
            console.log(userProfile.key)
            if (userProfile.key === "nextGroup" && userProfile.val() != "") {
                console.log("here")
                console.log(userProfile.val() + "/users/" + user.getUid())
                let groupId = userProfile.val()
                let groupUserRef = dbGroupsRef.child(groupId + "/users/" + user.getUid())
                groupUserRef.set({
                    Downloaded: false,
                    VideoComplete: false,
                    FinalVideoRequested: false
                });
                dbGroupsRef.child(groupId + "/FinalVideoComplete").set(false)
                dbUsersRef.child(user.getUid() + "/nextGroup").set("")
                generateNextGroupID()
                bucket.upload(appdir + "/sample.txt", {
                    destination: "Groups/" + groupId + "/users/" + user.getUid() + "/sample.txt" // upload an empty file to create the directory
                });
            }
        })
    })
}

async function run() {

    console.log("Testing");

    // create a database directory for any new users
    await new Promise((resolve) => {
        let prevAllUsers: User[] = Object.assign([], allUsers);
        saveUsers()
            .then(function () {
                for (let i = prevAllUsers.length; i < allUsers.length; i++) {
                    createDatabaseUserDirectory(allUsers[i])
                }
            }).then(function () {// check for any new group the user is in
                allUsers.forEach(function (user: User) {
                    console.log(user.getName())
                    addUserToNextGroup(user)
                });
            })
        resolve();
    });


    // download any videos that have not yet been downloaded
    await new Promise((resolve) => {
        dbGroupsRef.orderByKey();

        dbGroupsRef.once("value").then(function (snapshot: any) {
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
                                downloadFileAndDelete("Groups/" + allGroups.key + "/" + userKey.key + "/" + userKey.key + ".mp4",
                                    "Groups/" + allGroups.key + "/" + userKey.key, userKey.key + ".mp4");
                                dbGroupsRef.child(key + "/" + key2 + "/" + key3 + "/Downloaded").set(true);
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
    //     while (true) {
    //         // let groups: Group[] = [];
    //         // let groupcsv: neatCsv.Row[] = [];



    //         // dbRef.on("value", function(snapshot: any) {
    //         //     console.log(snapshot.val());
    //         // }, function(errorObject: any) {
    //         //     console.log("The read failed: " + errorObject.code);
    //         // });



    //         break;
    // /*        
    //         console.log("test2");
    //         console.log(appdir+'groups.csv');


    //         await new Promise((resolve) => fs.createReadStream(appdir + 'groups.csv')
    //             .pipe(csv())
    //             .on('data', (data) => {
    //                 groups.push(new Group(data['ID'], data['GROUPNAME'], data['USERNAMES'], data['DOWNLOADED'] == 1));
    //                 console.log(groups);

    //             })
    //             .on('end', () => {
    //                 console.log(groups);
    //                 resolve()
    //             }));

    //         console.log("test01");
    //         console.log("3"+groups);
    //         //while there are more groups add to groups and groupsLeftOnServer
    //         groups.forEach(group => {
    //             console.log("test00")
    //             console.log(group)
    //             if (!group.getDownloaded()) groupsLeftOnServer.push(group);
    //         })

    //         console.log("test3");

    //         // download each groups' videos and delete from firebase
    //         for (let i = 0; i < groupsLeftOnServer.length; i++) {
    //             for (let j = 0; j < groupsLeftOnServer[i].getUsernames().length; j++) {
    //                 moveUserVideosFirebaseToLocal(groupsLeftOnServer[i].getID(), groupsLeftOnServer[i].getUsernames()[j]);
    //             }
    //             groupsLeftOnServer[i].setDownloaded(true);
    //             groupsDownloaded.push(groupsLeftOnServer[i]);
    //             groupsLeftOnServer.splice(i, 1);
    //             while (true) {// REMOVE THIS ONCE IT GETS HERE!
    //                 // console.log("test4" + i);
    //             }
    //         }
    //         break;*/
    //         // edit the next group in groupsDownloaded and move it to groupsAwaitingReturn, send signal that it's ready
    //         // edit(groupsDownloaded[0]);
    //         // groupsAwaitingReturn.push(groupsDownloaded[0]);
    //         // groupsDownloaded.splice(0, 1);

    //         // check for signal and add to groupsRequested, ensure that group is in groupsAwaitingReturn


    //         // upload groupsRequested
    //         // for (let i = 0; i < groupsRequested.length; i++) {
    //             // uploadCompletedVideo(groupsRequested[i].getID());
    //         // }

    //         // check for signal from users that we can delete the video, and delete it


    //         // wait before continuing the loop
    //         delay(10000);
    //     }
}

run()