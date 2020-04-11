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

async function moveUserVideosFirebaseToLocal(groupname, username) {
    downloadFileAndDelete("Groups/" + groupname + "/" + username + ".mp4", "Groups/" + groupname + "/" + username + ".mp4");

}

async function downloadFile(name, destname) {
    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: homedir + '/Desktop/Storage/' + destname
    };

    // Downloads the file
    await bucket
        .file("PaperMoon/" + name)
        .download(options);

    console.log(
        'success'
    );

    return bucket.file("PaperMoon/" + name);
}
async function downloadFileAndDelete(name, destname) {
    const downloadedFile = downloadFile(name, destname);
    (await downloadedFile).delete();
}

// TODO need to change this to accept the files as parameters
async function edit() {
    var fileDs = ["PaperMoonBariFinal.mp4", "PaperMoonLeadFinal.mp4", "PaperMoonTenorFinal.mp4", "PaperMoonBassFinal.mp4"];
    for (let i = 0; i < fileDs.length; i++) {
        await downloadFile(fileDs[i], i + ".mp4").catch(console.log);
    }

    var audio = ffmpeg(homedir + '/Desktop/Storage/0.mp4');
    for (let i = 1; i < fileDs.length; i++) {
        audio.addInput(homedir + '/Desktop/Storage/' + i + '.mp4');
    }
    audio.complexFilter([{
        filter: 'amix',
        options: {
            inputs: fileDs.length,
            duration: 'longest'
        }
    }]);
    audio.output(homedir + '/Desktop/Storage/output.mp3');
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
                videoPart.input(homedir + '/Desktop/Storage/empty.mp4');
            } else {
                videoPart.input(homedir + '/Desktop/Storage/' + currentVid + '.mp4');
            }
            currentVid++;
        }
        videoPart.complexFilter([{
            filter: 'hstack',
            options: {
                inputs: closestSquareRt
            }
        }]);
        videoPart.output(homedir + '/Desktop/Storage/part' + h + '.mp4');
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
        video.input(homedir + '/Desktop/Storage/part' + h + '.mp4');
    }
    video.complexFilter([{
        filter: 'vstack',
        options: {
            inputs: neededRows
        }
    }]);
    video.output(homedir + '/Desktop/Storage/output.mp4');
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

    var complete = ffmpeg(homedir + '/Desktop/Storage/output.mp4').input(homedir + '/Desktop/Storage/output.mp3');
    complete.outputOptions(["-c:v copy",
        "-map 0:v:0",
        "-map 1:a:0"]);
    complete.output(homedir + '/Desktop/Storage/complete.mp4');
    complete.on('end', function () {
        console.log('Complete!');
    }).on('error', function (err) {
        console.log('an error happened: ' + err.message);
    }).run();
}

// edit();

var groupsDownloaded = [];
var groupsLeft = [];
var groupsAwaitingReturn = [];
var groupsComplete = [];
while (true) {
	var groups = [];
	// fs.readFile(appdir + "/groups.csv");
	// console.log(fs);


	// TODO figure out how to wait
	// setTimeout(() => {
	// 	var groups = [];
	// 	groups[0] = 1;
	// }, 10000);
}











// var fileD = bucket.file("importData.txt");
// fileD.delete().then(() => {
//    console.log('Deleted!');
//}).catch(() => {
//    console.log('Delete failed!');
//})

// bucket.upload("C:/Users/lisaw/Documents/Robot2019CANBus.txt");


// var db = admin.database();
// var ref = db.ref("restricted_access/secret_document");
// ref.once("value", function(snapshot) {
	// console.log(snapshot.val());
// });

app.get('/', function(req, res) {
    res.status(200).send('Hello world');
});

app.listen(PORT, function() {
    console.log('Server is running on PORT:', PORT);
});








// var http = require('http');

// var server = http.createServer(function(req, res) {
//     res.writeHead(200, { "Content-type": "text/plain"
// });
//     res.end("Hello world\n");
// });

// server.listen(3000, function() {
//     console.log('Server is running at 3000')
// });