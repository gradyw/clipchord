package com.clipchord;

import java.io.IOException;

import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

public class NoFirebaseFunctions {


    static String test() throws IOException {

        OkHttpClient client = new OkHttpClient();

        Request request = new Request.Builder().url("http://10.0.0.211:3000/JSON1").build();
        System.out.println("Past request");
        Response response = client.newCall(request).execute();
        System.out.println("Past execution");
        if (response.isSuccessful()) {
            System.out.println("successful");
            return response.message();
        } else {
            System.out.println("Unsuccessful");
            return "unsuccessful";
        }
    }


}
