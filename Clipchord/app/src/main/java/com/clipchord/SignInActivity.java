package com.clipchord;

import androidx.appcompat.app.AppCompatActivity;
import androidx.constraintlayout.widget.ConstraintLayout;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;

import com.clipchord.ui.login.LoginFragment;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseUser;

public class SignInActivity extends AppCompatActivity {

    private FirebaseAuth mAuth;

    private ProgressBar progressBar;
    private ConstraintLayout loginBlock;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_sign_in);

        progressBar = this.findViewById(R.id.progressBar);
        loginBlock = this.findViewById(R.id.loginBlockLayout);
        mAuth = FirebaseAuth.getInstance();
    }

    public void onStart() {
        super.onStart();
        // Check if user is signed in (non-null) and update UI accordingly.
        FirebaseUser currentUser = mAuth.getCurrentUser();
        updateUI(currentUser);
    }

    public void updateUI(FirebaseUser user){
        progressBar.animate()
                .alpha(0)
                .setDuration(300)
                .setListener(new AnimatorListenerAdapter() {
                    @Override
                    public void onAnimationEnd(Animator animation) {
                        progressBar.setVisibility(View.GONE);
                    }
                });
        loginBlock.setAlpha(0f);
        loginBlock.setVisibility(View.VISIBLE);
        loginBlock.animate()
            .alpha(1f)
            .setDuration(300);
    }
}