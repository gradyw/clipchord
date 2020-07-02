package com.clipchord;

import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.widget.Button;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;

import com.google.android.gms.auth.api.signin.internal.Storage;
import com.google.android.gms.tasks.OnFailureListener;
import com.google.android.gms.tasks.OnSuccessListener;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.storage.StorageReference;
import com.google.firebase.storage.UploadTask;

import java.io.File;
import java.io.IOException;

public class UploadTestActivity extends AppCompatActivity {

//    private void setDbVideoComplete(String groupId) {
//        DatabaseReference ref = MainActivity.getDatabase().getReference("Data/Groups/" + groupId + "/users/" +
//                MainActivity.getUid() + "/VideoComplete");
//        ref.setValue(true);
//    }

//    private void uploadVideo(String groupId) {
//        File uploadFile = new File(Environment.getExternalStorageDirectory().getAbsolutePath() + "/Download/" + MainActivity.getUid() + ".mp4");
//        if (uploadFile.exists()) {
//            Uri file = Uri.fromFile(uploadFile);
//            StorageReference fileRef = MainActivity.getStorageRef().child("Groups/" + groupId + "/users/" + MainActivity.getUid() + "/" + MainActivity.getUid() + ".mp4");
//            UploadTask uploadTask = fileRef.putFile(file);
//            uploadTask.addOnFailureListener(exception -> System.out.println("Unsuccessful Upload")).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
//                @Override
//                public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
//                    setDbVideoComplete(groupId);
//                }
//            });
//        }
//    }


    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_uploadtest);

        Button button = findViewById(R.id.upload);

        button.setOnClickListener((v) -> {
//            File uploadFile = new File(Environment.getExternalStorageDirectory().getAbsolutePath()+"/Download/test.txt");
//            System.out.println("File Exists" + uploadFile.exists());

//            Functions.createGroup();
//            Functions.joinGroup("Ucyw5B");
//            String a = "";
//            try {
//                a = NoFirebaseFunctions.test();
//            } catch (IOException e) {
//                e.printStackTrace();
//            }
//            System.out.println(a);
            System.out.println("finished function");
//
//            Uri file = Uri.fromFile(uploadFile);
//            StorageReference fileRef = MainActivity.getStorageRef().child(file.getLastPathSegment());
//            UploadTask uploadTask = fileRef.putFile(file);

//            uploadTask.addOnFailureListener(exception -> System.out.println("Unsuccessful Upload")).addOnSuccessListener(new OnSuccessListener<UploadTask.TaskSnapshot>() {
//                @Override
//                public void onSuccess(UploadTask.TaskSnapshot taskSnapshot) {
//                }
//            });
        });
    }
}