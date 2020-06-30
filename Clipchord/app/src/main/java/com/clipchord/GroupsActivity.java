package com.clipchord;

import androidx.appcompat.app.AppCompatActivity;

import android.os.Bundle;

public class GroupsActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    /**
     * Create or join a group. When there is a non-empty nextGroup group id the server
     * will automatically add user to the specified group in database and storage.
     * @param groupId alphanumeric ID of the group
     */
    private void joinGroup(String groupId) {
        MainActivity.getDatabase().getReference("Data/Users/" + MainActivity.getUid() + "/nextGroup").setValue(groupId);
    }
}
