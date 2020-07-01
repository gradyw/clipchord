import fs from 'fs';

const ffmpeg = require('fluent-ffmpeg');

const homedir = require('os').homedir();
const appdir = homedir + '/Desktop/ClipchordApp/';

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