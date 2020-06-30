package com.clipchord;

import com.google.firebase.database.DataSnapshot;
import com.google.firebase.database.DatabaseError;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import com.google.firebase.database.ValueEventListener;

public class Database {

    private static FirebaseDatabase database = FirebaseDatabase.getInstance();

    private static boolean finalVideoComplete = false;

    static boolean getFinalVideoComplete(String groupId) {
        DatabaseReference nextGroupIdRef = database.getReference("Data").child("Groups/" + groupId + "/" + MainActivity.getUid() + "/FinalVideoComplete");

        ValueEventListener valueListener = new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                finalVideoComplete = (boolean) dataSnapshot.getValue();
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                System.out.println("Data Cancelled");
            }
        };
        nextGroupIdRef.addValueEventListener(valueListener);

        return finalVideoComplete;
    }
}
