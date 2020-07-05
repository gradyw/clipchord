import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';


// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
// export const helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

admin.initializeApp({
    storageBucket: "clipchord.appspot.com",
    databaseURL: "https://clipchord.firebaseio.com"
})

const db = admin.database()
const dbGroupsRef = db.ref("Data/Groups")
const dbUsersRef = db.ref("Data/Users")
// const bucket = admin.storage().bucket()


exports.getUploadedWaiting = functions.https.onCall(async (data, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    const id: string = context.auth.uid;
    if (id !== "ywjvbu6GiIauRkNsGccILjCxpep1") {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated as admin account.')
    }
    // let waiting: Video[] = []

    let firstGroupId: string = "None"
    let firstUid: string = "None"

    // let groupIds: string[] = []
    // let uids: string[] = []

    // let wait2: string[][] = [];

    dbGroupsRef.orderByKey();

    await dbGroupsRef.once("value", function (snapshot: any) {
        snapshot.forEach(function (allGroups: any) {
            let groupId = allGroups.key
            allGroups.forEach(function (singleGroup: any) {
                const usersKey = singleGroup.key;
                if (usersKey === "users") {
                    singleGroup.forEach(function (userKey: any) {
                        const uid = userKey.key
                        let downloaded = true
                        let videoComplete = false
                        userKey.forEach(function (userDownloaded: any) {
                            functions.logger.log(userDownloaded.key)
                            if (userDownloaded.key === "Downloaded" && userDownloaded.val() === false) {
                                downloaded = false;
                            }
                            if (userDownloaded.key === "VideoComplete" && userDownloaded.val() === true) {
                                videoComplete = true;
                            }
                        })
                        if (!downloaded && videoComplete) {
                            firstGroupId = groupId;
                            firstUid = uid;
                            // groupIds.push(groupId)
                            // uids.push(uid)
                            // waiting.push(new Video(groupId, uid))
                            // wait2.push([groupId, uid])
                        }
                    })
                }

            })
        })
        return true;
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not find users needing to download")
    })

    return {
        groupId: firstGroupId,
        uid: firstUid
    }
        // list2: wait2
    
})

exports.createGroup = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    //const text = data.text
    const uid = context.auth?.uid
    const groupId = generateNextGroupID()
    const groupRef = dbGroupsRef.child(groupId)
    groupRef.set({
        FinalVideoComplete: false
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not add FinalVideoComplete value to group database")
    })
    if (typeof uid === 'string') {
        addUserToGroupDatabase(uid, groupId)
    } else {
        throw new functions.https.HttpsError('failed-precondition', 'Uid not a string')
    }

    return {
        groupCreated: true
    }
})


exports.joinGroup = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    const uid = context.auth.uid
    const groupId = data.text
    if (typeof uid === 'string') {
        addUserToGroupDatabase(uid, groupId)
    } else {
        throw new functions.https.HttpsError('failed-precondition', 'Uid not a string')
    }

    return {
        userJoined: true,
        groupId: groupId
    }
})


exports.addNewUserToDatabase = functions.auth.user().onCreate((user) => {
    const dir = dbUsersRef.child(user.uid)
    dir.set({
        email: user.email
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not add new user to users database")
    })
    functions.logger.log("Finished Adding User " + user)
})


function addUserToGroupDatabase(uid: string, groupId: string): void {
    const groupUserRef = dbGroupsRef.child(groupId + "/users/" + uid);
    groupUserRef.set({
        Downloaded: false,
        VideoComplete: false,
        FinalVideoRequested: false
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not add user to group database")
    })
    
}

function generateNextGroupID(): string {
    const length: number = 6
    const chars: string = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
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
        }).catch(() => {
            throw new functions.https.HttpsError('aborted', "Group ID not generated")
        })
    }
    return result
}