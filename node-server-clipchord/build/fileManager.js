"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const server_1 = require("./server");
const ffmpeg = require('fluent-ffmpeg');
const homedir = require('os').homedir();
const appdir = homedir + '/Desktop/ClipchordApp/';
let bucket = server_1.admin.storage().bucket();
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
async function moveUserVideosFirebaseToLocal(groupid, username) {
    downloadFileAndDelete("Groups/" + groupid + "/" + username + ".mp4", "Groups/" + groupid, username + ".mp4");
}
// TODO find a way to specify return type as bucket file
async function downloadFile(name, destDirName, destFileName) {
    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: appdir + destDirName + "/" + destFileName
    };
    if (!fs_1.default.existsSync(appdir + destDirName)) {
        fs_1.default.mkdirSync(appdir + destDirName);
    }
    // Downloads the file
    await bucket
        .file(name)
        .download(options);
    console.log('success');
    return bucket.file(name);
}
async function downloadFileAndDelete(name, destDirName, destFileName) {
    console.log("dest" + name + destDirName);
    const downloadedFile = downloadFile(name, destDirName, destFileName);
    (await downloadedFile).delete();
}
async function uploadCompletedVideo(groupid) {
    bucket.upload(appdir + "/Groups/" + groupid + "final.mp4", {
        destination: "Groups/" + groupid + "/" + "final.mp4"
    });
}
