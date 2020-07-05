package com.clipchord;

import android.util.Log;
import android.widget.Toast;

import androidx.annotation.NonNull;

import com.google.android.gms.tasks.Continuation;
import com.google.android.gms.tasks.OnCompleteListener;
import com.google.android.gms.tasks.Task;
import com.google.firebase.functions.FirebaseFunctions;
import com.google.firebase.functions.HttpsCallableResult;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.iid.InstanceIdResult;

import java.util.HashMap;
import java.util.Map;

public class Functions {

    private static FirebaseFunctions functions = FirebaseFunctions.getInstance();
    private static final String TAG = "Functions";
    private static String token;

    private static void getDeviceToken() {
        FirebaseInstanceId.getInstance().getInstanceId()
                .addOnCompleteListener(new OnCompleteListener<InstanceIdResult>() {
                    @Override
                    public void onComplete(@NonNull Task<InstanceIdResult> task) {
                        if (!task.isSuccessful()) {
                            Log.w(TAG, "getInstanceId failed", task.getException());
                            return;
                        }
                        // Get new Instance ID token
                        token = task.getResult().getToken();
                    }
                });
    }

    static Task<String> joinGroup(String groupId) {
        Map<String, Object> data = new HashMap<>();
        getDeviceToken();
        data.put("groupId", groupId);
        data.put("token", token);
        data.put("push", true);

        return functions.
                getHttpsCallable("joinGroup")
                .call(data)
                .continueWith(new Continuation<HttpsCallableResult, String>() {
                    @Override
                    public String then(@NonNull Task<HttpsCallableResult> task) throws Exception {
                        String result = (String) task.getResult().getData();
                        return result;
                    }
                });
    }

    static Task<String> createGroup() {
        Map<String, Object> data = new HashMap<>();
        getDeviceToken();
        data.put("token", token);
        data.put("push", true);

        return functions.
                getHttpsCallable("createGroup")
                .call(data)
                .continueWith(new Continuation<HttpsCallableResult, String>() {
                    @Override
                    public String then(@NonNull Task<HttpsCallableResult> task) throws Exception {
                        String result = (String) task.getResult().getData();
                        return result;
                    }
                });
    }

    static Task<String> uploadFile(String groupId) {
        Map<String, Object> data = new HashMap<>();

        getDeviceToken();
        data.put("token", token);
        data.put("groupId", groupId);
        data.put("push", true);

        return functions.
                getHttpsCallable("UpdateVideoComplete")
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
