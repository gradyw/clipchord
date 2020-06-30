package com.clipchord;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;
import android.util.Log;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.ValueEventListener;

public class GroupsActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    static String nextGroupId;

    /**
     * Create a group. When there is a non-empty nextGroup group id the server
     * will automatically add user to the specified group in database and storage.
     */
    private void createGroup() {
        DatabaseReference nextGroupIdRef = MainActivity.getDatabase().getReference("Data").child("NextGroupID");

        ValueEventListener valueListener = new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                GroupsActivity.nextGroupId = (String) dataSnapshot.getValue();
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                System.out.println("Data Cancelled");
            }
        };
        nextGroupIdRef.addValueEventListener(valueListener);

        MainActivity.getDatabase().getReference("Data/Users/" + MainActivity.getUid() + "/nextGroup").setValue(nextGroupId);
    }

    
}
