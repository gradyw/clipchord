"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
let auth = server_1.admin.auth();
const homedir = require('os').homedir();
const appdir = homedir + '/Desktop/ClipchordApp/';
class User {
    constructor(uid, name, email, nextGroup) {
        this.uid = uid;
        this.name = name;
        this.email = email;
        this.nextGroup = nextGroup;
    }
    getUid() {
        return this.uid;
    }
    getName() {
        return this.name;
    }
    getEmail() {
        return this.email;
    }
    getNextGroup() {
        return this.nextGroup;
    }
    setNextGroup(nextGroup) {
        this.nextGroup = nextGroup;
    }
}
exports.User = User;
exports.allUsers = [];
async function saveUsers(nextPageToken) {
    await new Promise((resolve, reject) => {
        auth.listUsers(1000, nextPageToken)
            .then(function (listUserResult) {
            listUserResult.users.forEach(function (userRecord) {
                console.log(userRecord.uid);
                exports.allUsers.push(new User(userRecord.uid, userRecord.displayName, userRecord.email, ""));
            });
            if (listUserResult.pageToken) {
                saveUsers(listUserResult.pageToken);
            }
            resolve();
        })
            .catch(function (error) {
            console.log("Error retrieving users: ", error);
            reject();
        });
    });
}
exports.saveUsers = saveUsers;
exports.db = server_1.admin.database();
exports.dbUsersRef = exports.db.ref("Data/Users");
exports.dbGroupsRef = exports.db.ref("Data/Groups");
let bucket = server_1.admin.storage().bucket();
class Group {
    constructor(id, userids, downloaded) {
        this.id = id;
        this.userids = [];
        this.downloaded = downloaded;
        userids = userids.substring(1, userids.length - 1);
        let nameslist = userids.split(';');
        for (let i = 0; i < nameslist.length; i++) {
            this.userids.push(nameslist[i]);
        }
    }
    getID() {
        return this.id;
    }
    getUsernames() {
        return this.userids;
    }
    getDownloaded() {
        return this.downloaded;
    }
    setDownloaded(downloaded) {
        this.downloaded = downloaded;
    }
}
exports.Group = Group;
async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.delay = delay;
function setNextGroup(user) {
    exports.dbUsersRef.child(user.getUid() + "/nextGroup").once("value").then(function (snapshot) {
        user.setNextGroup(snapshot.val());
    });
}
exports.setNextGroup = setNextGroup;
async function createDatabaseUserDirectory(user) {
    let dir = exports.dbUsersRef.child(user.getUid() + "/name");
    dir.set(user.getName());
    dir = exports.dbUsersRef.child(user.getUid() + "/email");
    dir.set(user.getEmail());
}
exports.createDatabaseUserDirectory = createDatabaseUserDirectory;
function generateNextGroupID() {
    let length = 6;
    let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    let matches = true;
    while (matches) {
        result = '';
        matches = false;
        for (let i = length; i > 0; --i)
            result += chars[Math.floor(Math.random() * chars.length)];
        exports.dbGroupsRef.once("value").then(function (snapshot) {
            snapshot.forEach(function (group) {
                console.log(group.key);
                if (group.key === result) {
                    matches = true;
                }
            });
        });
    }
    console.log(result);
    let nextGroupRef = exports.db.ref("Data");
    nextGroupRef.child("NextGroupID").set(result);
}
exports.generateNextGroupID = generateNextGroupID;
async function addUserToNextGroup(user) {
    let userRef = exports.dbUsersRef.child(user.getUid());
    userRef.once("value").then(function (snapshot) {
        snapshot.forEach(function (userProfile) {
            console.log(userProfile.key);
            if (userProfile.key === "nextGroup" && userProfile.val() != "") {
                console.log("here");
                console.log(userProfile.val() + "/users/" + user.getUid());
                let groupId = userProfile.val();
                let groupUserRef = exports.dbGroupsRef.child(groupId + "/users/" + user.getUid());
                groupUserRef.set({
                    Downloaded: false,
                    VideoComplete: false,
                    FinalVideoRequested: false
                });
                exports.dbGroupsRef.child(groupId + "/FinalVideoComplete").set(false);
                exports.dbUsersRef.child(user.getUid() + "/nextGroup").set("");
                generateNextGroupID();
                bucket.upload(appdir + "/sample.txt", {
                    destination: "Groups/" + groupId + "/users/" + user.getUid() + "/sample.txt" // upload an empty file to create the directory
                });
            }
        });
    });
}
exports.addUserToNextGroup = addUserToNextGroup;
