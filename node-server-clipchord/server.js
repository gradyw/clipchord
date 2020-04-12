"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var fs = require("fs");
var neatcsv = require("neat-csv");
var express = require('express');
var admin = require('firebase-admin');
var ffmpeg = require('fluent-ffmpeg');
var homedir = require('os').homedir();
var appdir = homedir + 'Desktop/Storage/ClipchordApp';
var serviceAccount = require(homedir + "/Downloads/clipchord-firebase-adminsdk-i4et0-50616b8a54.json");
var app = express();
var PORT = 3000;
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "clipchord.appspot.com"
});
var bucket = admin.storage().bucket();
//TODO encapsulate member variables
var Group = /** @class */ (function () {
    function Group(groupid, usernames, downloaded) {
        this.groupid = groupid;
        this.usernames = usernames;
        this.downloaded = downloaded;
    }
    return Group;
}());
function delay(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
function moveUserVideosFirebaseToLocal(groupid, username) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            downloadFileAndDelete("Groups/" + groupid + "/" + username + ".mp4", "Groups/" + groupid + "/" + username + ".mp4");
            return [2 /*return*/];
        });
    });
}
// TODO find a way to specify return type as bucket file
function downloadFile(name, destname) {
    return __awaiter(this, void 0, void 0, function () {
        var options;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = {
                        // The path to which the file should be downloaded, e.g. "./file.txt"
                        destination: appdir + destname
                    };
                    // Downloads the file
                    return [4 /*yield*/, bucket
                            .file(name)
                            .download(options)];
                case 1:
                    // Downloads the file
                    _a.sent();
                    console.log('success');
                    return [2 /*return*/, bucket.file(name)];
            }
        });
    });
}
function downloadFileAndDelete(name, destname) {
    return __awaiter(this, void 0, void 0, function () {
        var downloadedFile;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    downloadedFile = downloadFile(name, destname);
                    return [4 /*yield*/, downloadedFile];
                case 1:
                    (_a.sent())["delete"]();
                    return [2 /*return*/];
            }
        });
    });
}
function uploadCompletedVideo(groupid) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            bucket.upload(appdir + "/" + groupid + "final.mp4", {
                destination: "Groups/" + groupid + "/" + "final.mp4"
            });
            return [2 /*return*/];
        });
    });
}
// TODO add the edit function here
var groupsDownloaded;
var groupsLeftOnServer;
var groupsAwaitingReturn;
var groupsRequested;
var groupsComplete;
while (true) {
    var groups = void 0;
    // TODO figure out why this is returning void
    var groupcsv = fs.readFile(appdir + 'groups.csv', function (err, data) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (err) {
                        console.error(err);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, neatcsv(data)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    }); });
    for (var i = 0; i < groupcsv.length; i++) {
        groups.push(new Group(groupcsv[i][0], groupcsv[i][2], groupcsv[i][3] == 1));
    }
    //while there are more groups add to groups and groupsLeftOnServer
    groups.forEach(function (group) {
        if (!group.downloaded)
            groupsLeftOnServer.push(group);
    });
    // download each groups' videos and delete from firebase
    for (var i = 0; i < groupsLeftOnServer.length; i++) {
        for (var j = 0; j < groupsLeftOnServer[i].usernames.length; j++) {
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
    for (var i = 0; i < groupsRequested.length; i++) {
        uploadCompletedVideo(groupsRequested[i].groupid);
    }
    // check for signal from users that we can delete the video, and delete it
    // wait before continuing the loop
    delay(10000);
}
