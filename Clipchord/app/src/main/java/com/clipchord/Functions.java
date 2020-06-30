package com.clipchord;

import androidx.annotation.NonNull;

import com.google.android.gms.tasks.Continuation;
import com.google.android.gms.tasks.Task;
import com.google.firebase.functions.FirebaseFunctions;
import com.google.firebase.functions.HttpsCallableResult;

import java.util.HashMap;
import java.util.Map;

public class Functions {

    private FirebaseFunctions functions = FirebaseFunctions.getInstance();

    Task<String> joinGroup(String groupId) {
        Map<String, Object> data = new HashMap<>();

        data.put("text", groupId);
        data.put("push", true);

        return functions.
                getHttpsCallable("JoinGroup")
                .call(data)
                .continueWith(new Continuation<HttpsCallableResult, String>() {
                    @Override
                    public String then(@NonNull Task<HttpsCallableResult> task) throws Exception {
                        String result = (String) task.getResult().getData();
                        return result;
                    }
                });
    }

    Task<String> createGroup() {
        Map<String, Object> data = new HashMap<>();

        data.put("text", "New Group");
        data.put("push", true);

        return functions.
                getHttpsCallable("CreateGroup")
                .call(data)
                .continueWith(new Continuation<HttpsCallableResult, String>() {
                    @Override
                    public String then(@NonNull Task<HttpsCallableResult> task) throws Exception {
                        String result = (String) task.getResult().getData();
                        return result;
                    }
                });
    }

    Task<String> uploadFile(String groupId) {
        Map<String, Object> data = new HashMap<>();

        data.put("text", groupId);
        data.put("push", true);

        return functions.
                getHttpsCallable("UploadFile")
                .call(data)
                .continueWith(new Continuation<HttpsCallableResult, String>() {
                    @Override
                    public String then(@NonNull Task<HttpsCallableResult> task) throws Exception {
                        String result = (String) task.getResult().getData();
                        return result;
                    }
                });
    }

    Task<String> requestFinalVideo() {
        Map<String, Object> data = new HashMap<>();

        data.put("text", "Request Final Video");
        data.put("push", true);

        return functions.
                getHttpsCallable("RequestFinalVideo")
                .call(data)
                .continueWith(new Continuation<HttpsCallableResult, String>() {
                    @Override
                    public String then(@NonNull Task<HttpsCallableResult> task) throws Exception {
                        String result = (String) task.getResult().getData();
                        return result;
                    }
                });
    }

}
