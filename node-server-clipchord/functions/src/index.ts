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
    const uid = context.auth?.uid
    const groupId = generateNextGroupID()
    const groupRef = dbGroupsRef.child(groupId)
    const token = data.token
    groupRef.set({
        FinalVideoComplete: false
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not add FinalVideoComplete value to group database")
    })
    addUserToGroupDatabase(uid, groupId, token)

    return {
        groupCreated: true,
        groupId: groupId
    }
})


exports.joinGroup = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    const uid = context.auth.uid
    const groupId = data.groupId
    const token = data.token
    addUserToGroupDatabase(uid, groupId, token)
    return {
        userJoined: true,
        groupId: groupId
    }
})

exports.checkVideoReceived = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    const uid = context.auth.uid
    const groupId = data.text
    let ref = dbGroupsRef.child(groupId + '/users/' + uid);
    let videoReceived = false
    ref.once("value", function (snapshot: any) {
        if (snapshot.key === "Downloaded") {
            videoReceived = snapshot.val()
        }
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not find location in database")
    })
    return {
        videoReceived: videoReceived
    }
})

exports.updateVideoComplete = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    const uid = context.auth.uid
    const groupId = data.groupId
    const token = data.token

    dbGroupsRef.child(groupId + '/users/' + uid + '/VideoComplete').set(true)
    .catch(() => {
        throw new functions.https.HttpsError('aborted', 'no such group/user VideoComplete value')
    })

    dbGroupsRef.child(groupId + '/users/' + uid + '/MessagingToken').set(token)
    .catch(() => {
        throw new functions.https.HttpsError('aborted', 'no such group/user MessagingToken value')
    })
    return {
        videoUploaded: true
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

exports.notifyFinalVideoComplete = functions.database.ref('Data/Groups/{groupId}/FinalVideoComplete')
    .onUpdate((change, context) => {
        if (change.after.exportVal() === true) {
            let registrationTokens: string[] = [];
            const ref = dbGroupsRef.child('{groupId}/users');// this might not work as intended, might send
                                                             // to everyone every time
            ref.once("value", function (user: any) {
                user.forEach(function (token: any) {
                    if (token.key === "MessagingToken") {
                        registrationTokens.push(token.val())
                    }
                })
            }).catch(() => {
                throw new functions.https.HttpsError('aborted', "Could not find tokens")
            })

            const message = {
                data: {finalVideoReady: 'Final Video is Ready!'},
                tokens: registrationTokens,
            }

            admin.messaging().sendMulticast(message)
            .then((response) => {
                functions.logger.log(response.successCount + "messages sent successfully")
            }).catch(() => {
                throw new functions.https.HttpsError('aborted', "Could not send messages")
            })
        }
    })


function addUserToGroupDatabase(uid: string, groupId: string, token: string): void {
    const groupUserRef = dbGroupsRef.child(groupId + "/users/" + uid);
    groupUserRef.set({
        Downloaded: false,
        VideoComplete: false,
        FinalVideoRequested: false,
        MessagingToken: token
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