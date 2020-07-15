package com.clipchord.firebase;

import android.net.Uri;
import android.os.Environment;

import androidx.annotation.NonNull;

import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.storage.FileDownloadTask;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.io.File;
import java.io.IOException;

public class Storage {

    private static final String LOCAL_STORAGE_DIRECTORY = Environment.getExternalStorageDirectory().getAbsolutePath() +
            "/Download/Firebase/";
    private static final String FINAL_VIDEO_NAME = "finalVideo";
    private static final String FILE_SUFFIX = "mp4";

    public static void uploadVideo(String groupId) {
        File uploadFile = new File(LOCAL_STORAGE_DIRECTORY + groupId + "/" + Firebase.getUid() + "." + FILE_SUFFIX);
        if (uploadFile.exists()) {
            Uri file = Uri.fromFile(uploadFile);
            StorageReference fileRef = getFileRef(groupId, false);
            UploadTask uploadTask = fileRef.putFile(file);
            uploadTask.addOnFailureListener(exception -> System.out.println("Unsuccessful Upload"))
                    .addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
                @Override
                public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
                    Functions.uploadFile(groupId);
                }
            });
        }
    }

    public static void downloadFinalVideo(String groupId) throws IOException {
        StorageReference videoRef = getFileRef(groupId, true);
        File localFile = File.createTempFile(FINAL_VIDEO_NAME, FILE_SUFFIX, new File(LOCAL_STORAGE_DIRECTORY + groupId));
        videoRef.getFile(localFile).addOnSuccessListener(new OnSuccessListener<FileDownloadTask.TaskSnapshot>() {
            @Override
            public void onSuccess(FileDownloadTask.TaskSnapshot taskSnapshot) {

            }
        }).addOnFailureListener(new OnFailureListener() {
            @Override
            public void onFailure(@NonNull Exception e) {

            }
        });
    }

    private static StorageReference getFileRef(String groupId, boolean isFinalVideo) {
        String end = (isFinalVideo ? FINAL_VIDEO_NAME : Firebase.getUid()) + "/." + FILE_SUFFIX;
        return Firebase.getStorageRef().child("Groups/" + groupId + "/users/" + Firebase.getUid() + "/" + end);
    }

}
