export {}

var express = require('express');
var admin = require('firebase-admin');
var ffmpeg = require('fluent-ffmpeg');
const homedir = require('os').homedir();
const fs = require('fs');
const appdir = homedir + 'Desktop/Storage/ClipchordApp';
const neatcsv = require('neat-csv');

var serviceAccount = require(homedir + "/Downloads/clipchord-firebase-adminsdk-i4et0-50616b8a54.json");

var app = express();

var PORT = 3000;

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	storageBucket: "clipchord.appspot.com"
});

var bucket = admin.storage().bucket();

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



// TODO add the edit function here

let groupsDownloaded: Group[];
let groupsLeftOnServer: Group[];
let groupsAwaitingReturn: Group[];
let groupsRequested: Group[];
let groupsComplete: Group[];

while (true) {
    let groups: Group[];

    let groupcsv : Array<any> = fs.readFile(appdir + 'groups.csv', async (err, data: Array<any>) => {
        if (err) {
            console.error(err);
            return
        }
        await neatcsv(data);
    })

    for (let i = 0; i < groupcsv.length; i++) {
        groups.push(new Group(groupcsv[i][0], groupcsv[i][2], groupcsv[i][3] == 1));
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
}