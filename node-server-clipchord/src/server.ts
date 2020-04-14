export {}
// import * as fs from 'fs';
// import neatCsv = require('neat-csv');

// import * as csv from 'csv';
// const obj = csv();

import csv from 'csv-parser';
import fs from 'fs';
import { Transform } from 'stream';

function myCSV(groupid: number, groupname: string, usernames: string[]) {
    
}

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
    groupid: number;
    usernames: string[];
    downloaded: boolean;

	constructor(groupid: number, usernames: string[], downloaded: boolean) {
		this.groupid = groupid;
        this.usernames = usernames;
        this.downloaded = downloaded;
    }

    toString() : string {
        return this.groupid + ", " + this.usernames.toString + ", " + this.downloaded;
    }
}

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function moveUserVideosFirebaseToLocal(groupid: number, username: string) {
    downloadFileAndDelete("Groups/" + groupid + "/" + username + ".mp4", "Groups/" + groupid + "/" + username + ".mp4");

}

// TODO find a way to specify return type as bucket file
async function downloadFile(name: string, destname: string) {
    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: appdir + destname
    };

    // Downloads the file
    await bucket
        .file(name)
        .download(options);

    console.log(
        'success'
    );

    return bucket.file(name);
}

async function downloadFileAndDelete(name: string, destname: string) {
    const downloadedFile = downloadFile(name, destname);
    (await downloadedFile).delete();
}

async function uploadCompletedVideo(groupid: number) {
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

let groupsDownloaded: Group[] = [];
let groupsLeftOnServer: Group[] = [];
let groupsAwaitingReturn: Group[] = [];
let groupsRequested: Group[] = [];
let groupsComplete: Group[] = [];

let groups: Group[] = [];

function populateCSV() : any[] { 
    let groupslist: any[] = [];
    fs.createReadStream(appdir + 'groups.csv')
        .pipe(csv())
        .on('data', (data) => {
            // console.log(data);
            groupslist.push(data);
            // groups.push(new Group(data.read.toString as unknown as number, data[2] as unknown as Array<string>, data[3] as unknown as number == 1));
        })
        .on('end', () => {
            console.log('end');
            console.log(groupslist);
            // console.log(groups);
        });
    return groupslist;
}

function run(): void {
    let list1: any[] = populateCSV();
    console.log(list1.length);
    for (let i = 0; i < list1.length; i++) {
        console.log('in for loop');
        groups.push(new Group(list1[i].get('ID') as number, list1[i].get('USERNAMES') as string[], list1[i].get('DOWNLOADED') as number == 1));
    }

    console.log(groups);
}

run();



/*while (true) {
    let groups: Group[] = [];
    // let groupcsv: neatCsv.Row[] = [];


    fs.createReadStream(appdir + 'groups.csv')
        .pipe(csv())
        .on('data', (data) => 
            groups.push(new Group(data[0], data[2], data[3] == 1))
        )
        .on('end', () => {
            console.log(groups);
        });

    // obj.from.path(appdir + 'groups.csv').to.array(function (data: string | any[]) {
        // for (let i = 0; i < data.length; i++) {
            // groups.push(new Group(data[i][0] as unknown as number, data[i][2], data[i][3] as unknown as number == 1));
        // }
    // })
    // TODO figure out why this is returning void
    // let groupcsv: neatCsv.Row[] = fs.readFile(appdir + 'groups.csv', 'utf8', async (err, data) => {
        // if (err) {
            // console.error(err);
            // return [];
        // }
        // await neatCsv(data);
    // });

    // (async () => {
    //     groupcsv = await neatCsv(fs.readFile(appdir + "groups.csv", 'utf8'));
    // })();

    // for (let i = 0; i < groupcsv.length; i++) {
    //     groups.push(new Group((groupcsv[i][0] as unknown as number), groupcsv[i][2], groupcsv[i][3] == 1));
    // }

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