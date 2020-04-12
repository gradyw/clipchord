"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let express = require('express');
let admin = require('firebase-admin');
let ffmpeg = require('fluent-ffmpeg');
const homedir = require('os').homedir();
const appdir = homedir + '/Desktop/ClipchordApp/';
let serviceAccount = require(homedir + "/Downloads/clipchord-firebase-adminsdk-i4et0-50616b8a54.json");
let app = express();
let PORT = 3000;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "clipchord.appspot.com"
});
let bucket = admin.storage().bucket();
//TODO encapsulate member variables
class Group {
    constructor(groupid, usernames, downloaded) {
        this.groupid = groupid;
        this.usernames = usernames;
        this.downloaded = downloaded;
    }
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function moveUserVideosFirebaseToLocal(groupid, username) {
    downloadFileAndDelete("Groups/" + groupid + "/" + username + ".mp4", "Groups/" + groupid + "/" + username + ".mp4");
}
// TODO find a way to specify return type as bucket file
async function downloadFile(name, destname) {
    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: appdir + destname
    };
    // Downloads the file
    await bucket
        .file(name)
        .download(options);
    console.log('success');
    return bucket.file(name);
}
async function downloadFileAndDelete(name, destname) {
    const downloadedFile = downloadFile(name, destname);
    (await downloadedFile).delete();
}
async function uploadCompletedVideo(groupid) {
    bucket.upload(appdir + "/" + groupid + "final.mp4", {
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
            .on('error', (err) => {
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
            }
            else {
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
                .on('error', (err) => {
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
            .on('error', (err) => {
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
    }).on('error', function (err) {
        console.log('an error happened: ' + err.message);
    }).run();
}
edit();
let groupsDownloaded;
let groupsLeftOnServer;
let groupsAwaitingReturn;
let groupsRequested;
let groupsComplete;
/*while (true) {
    let groups: Group[];

    // TODO figure out why this is returning void
    let groupcsv = fs.readFile(appdir + 'groups.csv', async (err, data) => {
        if (err) {
            console.error(err);
            return
        }
        await neatcsv(data);
    })

    for (let i = 0; i < groupcsv.length; i++) {
        groups.push(new Group((groupcsv[i][0] as unknown as number), groupcsv[i][2], groupcsv[i][3] == 1));
    }

    //while there are more groups add to groups and groupsLeftOnServer
    groups.forEach(group => {
        if (!group.downloaded) groupsLeftOnServer.push(group);
    })

    // download each groups' videos and delete from firebase
    for (let i = 0; i < groupsLeftOnServer.length; i++) {
        for (let j = 0; j < groupsLeftOnServer[i].usernames.length; j++) {
            moveUserVideosFirebaseToLocal(groupsLeftOnServer[i].groupid, groupsLeftOnServer[i].usernames[j]);
        }
        groupsLeftOnServer[i].downloaded = true;
        groupsDownloaded.push(groupsLeftOnServer[i]);
        groupsLeftOnServer.splice(i, 1);
    }

    // edit the next group in groupsDownloaded and move it to groupsAwaitingReturn
    // edit(groupsDownloaded[0]);
    groupsAwaitingReturn.push(groupsDownloaded[0]);
    groupsDownloaded.splice(0, 1);

    // check for signal and add to groupsRequested, ensure that group is in groupsAwaitingReturn


    // upload groupsRequested
    for (let i = 0; i < groupsRequested.length; i++) {
        uploadCompletedVideo(groupsRequested[i].groupid);
    }

    // check for signal from users that we can delete the video, and delete it
    
    
    // wait before continuing the loop
    delay(10000);
}*/ 
