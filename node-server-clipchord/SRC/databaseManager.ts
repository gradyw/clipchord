/*import fs from 'fs';

const homedir = require('os').homedir();
const appdir = homedir + '/Desktop/ClipchordApp/';

export class User {
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


export let allUsers: User[] = [];

export async function saveUsers(nextPageToken?: any) {

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

export let db = admin.database();
export let dbUsersRef = db.ref("Data/Users");
export let dbGroupsRef = db.ref("Data/Groups");

let bucket = admin.storage().bucket();

export class Group {
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

export async function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function setNextGroup(user: User) {
    dbUsersRef.child(user.getUid() + "/nextGroup").once("value").then(function (snapshot: any) {
        user.setNextGroup(snapshot.val() as string)
    });
}

export async function createDatabaseUserDirectory(user: User) {
    let dir = dbUsersRef.child(user.getUid() + "/name");
    dir.set(user.getName());
    dir = dbUsersRef.child(user.getUid() + "/email");
    dir.set(user.getEmail());
}

export function generateNextGroupID(): void {
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



export async function addUserToNextGroup(user: User) {
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
}*/