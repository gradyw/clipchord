package com.clipchord.firebase;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;
import com.google.firebase.storage.FirebaseStorage;
import com.google.firebase.storage.StorageReference;

public class Firebase {

    private static FirebaseUser user;
    private static String uid;
    private static FirebaseStorage storage = FirebaseStorage.getInstance();
    private static StorageReference storageRef = storage.getReference();

    public static void updateUser() {
        user = FirebaseAuth.getInstance().getCurrentUser();
        uid = FirebaseAuth.getInstance().getCurrentUser().getUid(); // this could cause a null pointer if no one is signed in
    }

    static String getUid() {
        updateUser();
        return uid;
    }

    public static FirebaseUser getUser() {
        updateUser();
        return user;
    }

    static StorageReference getStorageRef() {
        return storageRef;
    }

}
