import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path'


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
    let firstGroupId: string = "None"
    let firstUid: string = "None"

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
    
})

exports.getNextRequestedVideo = functions.https.onCall(async (data, context) => {
    
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    const id: string = context.auth.uid;
    if (id !== "ywjvbu6GiIauRkNsGccILjCxpep1") {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated as admin account.')
    }

    let firstGroupId: string = "None"
    let firstUid: string = "None"

    dbGroupsRef.orderByKey();

    await dbGroupsRef.once("value", function (snapshot: any) {
        snapshot.forEach(function (allGroups: any) {
            let groupId = allGroups.key
            allGroups.forEach(function (singleGroup: any) {
                const usersKey = singleGroup.key;
                if (usersKey === "users") {
                    singleGroup.forEach(function (userKey: any) {
                        const uid = userKey.key
                        userKey.forEach(function (videoRequested: any) {
                            functions.logger.log(videoRequested.key)
                            if (videoRequested.key === "FinalVideoRequested" && videoRequested.val() === true) {
                                firstGroupId = groupId;
                                firstUid = uid
                            }
                        })
                    })
                }
            })
        })
        return true;
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not find users needing to request video")
    })

    return {
        groupId: firstGroupId,
        uid: firstUid
    }
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

exports.notifyVideoReceived = functions.database.ref('Data/Groups/{groupId}/users/{userId}/Downloaded')
.onUpdate((change, context) => {
    if (change.after.exportVal() === true) {
        let registrationToken: string = "None";
        if (change.after.ref.parent === null) {
            throw new functions.https.HttpsError('failed-precondition', 'must not be root directory')
        }
        const ref = change.after.ref.parent.child('MessagingToken')
        ref.once("value", function (snapshot: any) {
            registrationToken = snapshot.val()
        }).catch(() => {
            throw new functions.https.HttpsError('aborted', "Could not find token")
        })

        if (registrationToken === "None") {
            throw new functions.https.HttpsError('aborted', 'No token')
        }

        const message = {
            data: {finalVideoReady: 'Final Video is Ready!'},
            token: registrationToken
        }

        admin.messaging().send(message)
        .then((response) => {
            functions.logger.log("Message sent successfully")
        }).catch(() => {
            throw new functions.https.HttpsError('aborted', "Could not send message")
        })
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

exports.requestFinalVideo = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    const uid = context.auth.uid
    const groupId = data.groupId

    dbGroupsRef.child(groupId + '/users/' + uid + '/FinalVideoRequested').set(true)
    .catch(() => {
        throw new functions.https.HttpsError('aborted', 'no such group/user FinalVideoRequested value')
    })

    return {
        requested: true
    }
})

exports.notifyFinalVideoUploaded = functions.storage.object().onFinalize(async (object) => {
    if (typeof(object.name) !== 'string') {
        throw new functions.https.HttpsError('failed-precondition', 'file must exist')
    }
    const filePath = object.name
    const fileName = path.basename(filePath)
    if (fileName !== "finalVideo.mp4") {
        return
    }

    const pathList: string[] = filePath.split('/finalVideo.mp4')
    let registrationToken: string = "None"
    let index = 0;
    index = pathList.indexOf('users') + 1
    if (index === 1) {
        throw new functions.https.HttpsError('aborted', 'Problem with path string split')
    }

    let ref = db.ref(pathList[0]).child('MessagingToken')
    ref.once("value", function (snapshot: any) {
        registrationToken = snapshot.val()
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not find token")
    })

    const message = {
        data: {finalVideoReadyToDownload: 'You have 5 minutes to download your final video!'},
        token: registrationToken,
    }
    admin.messaging().send(message)
    .then((response) => {
        functions.logger.log("Message sent successfully")
    }).catch(() => {
        throw new functions.https.HttpsError('aborted', "Could not send message")
    })
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
        if (change.after.ref.parent === null) {
            throw new functions.https.HttpsError('failed-precondition', 'must not be root directory')
        }
        const ref = change.after.ref.parent.child('users')
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
            data: {finalVideoReady: 'Final Video is Ready to Be Requested!'},
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