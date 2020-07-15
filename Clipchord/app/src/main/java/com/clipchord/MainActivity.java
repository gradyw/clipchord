package com.clipchord;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;

import androidx.appcompat.app.AppCompatActivity;

import com.clipchord.firebase.Firebase;
import com.clipchord.firebase.Functions;

public class MainActivity extends AppCompatActivity {

    private static final int RC_SIGN_IN = 123;

    Button signInButton;


    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        if(Firebase.getUser() == null) {
            //List<AuthUI.IdpConfig> providers = Arrays.asList(new AuthUI.IdpConfig.EmailBuilder().build());

            /*MainActivity.this.startActivityForResult(
                    AuthUI.getInstance()
                            .createSignInIntentBuilder()
                            .setAvailableProviders(providers)
                            .build(),
                    RC_SIGN_IN);*/
            this.startActivity(new Intent(this, SignInActivity.class));
        }
    }

    @Override // this doesn't run, not leading to a result anymore
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == RC_SIGN_IN) {
            if (resultCode == RESULT_OK) {
                Firebase.updateUser();
                Log.d("Auth", "Sign In Succeeded");
                System.out.println(Firebase.getUser().getEmail());
                this.startActivity(new Intent(this, UploadTestActivity.class));
            } else {
                Log.d("Auth", "Sign In Failed");
            }
        } else {
            Log.d("Auth", "Diff request Code");
        }
    }
}
