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

export let db = admin.database()
export let dbGroupsRef = db.ref("Data/Groups")
export let dbUsersRef = db.ref("Data/Users")
export let bucket = admin.storage().bucket()

exports.createGroup = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('failed-precondition', 'The function must be called' + 
            ' while authenticated.')
    }
    const text = data.text
    const uid = context.auth?.uid
    const groupId = generateNextGroupID()
    if (typeof uid === 'string') {
        addUserToGroupDatabase(uid, groupId)
    }
})


export function addUserToGroupDatabase(uid: string, groupId: string): void {
    let groupUserRef = dbGroupsRef.child(groupId + "/users/" + uid);
    groupUserRef.set({
        Downloaded: false,
        VideoComplete: false,
        FinalVideoRequested: false
    })
}

export function generateNextGroupID(): string {
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
    return result
}