import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
} from "amazon-cognito-identity-js";

const poolData = {
  UserPoolId: "eu-north-1_Bq4EEZx8x",
  ClientId: "69otpcp4a838cg40jln9ropdqv",
};

const userPool = new CognitoUserPool(poolData);

export async function signInWithEmail(email, password) {
  return new Promise((resolve, reject) => {
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        console.log("✅ Authentication successful");
        resolve({
          user: cognitoUser,
          session: result,
          userId: result.getIdToken().payload.sub,
          username: result.getIdToken().payload.email,
          email: email,
        });
      },
      onFailure: (err) => {
        console.error("❌ Authentication failed:", err);
        reject(err);
      },
    });
  });
}

export async function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No user"));
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session.isValid()) {
        reject(new Error("Invalid session"));
        return;
      }

      resolve({
        userId: session.getIdToken().payload.sub,
        username: session.getIdToken().payload.email,
        email: session.getIdToken().payload.email,
      });
    });
  });
}

export async function signOut() {
  const cognitoUser = userPool.getCurrentUser();
  if (cognitoUser) {
    cognitoUser.signOut();
  }
}

export async function getAuthToken() {
  return new Promise((resolve, reject) => {
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) {
      reject(new Error("No user"));
      return;
    }

    cognitoUser.getSession((err, session) => {
      if (err || !session.isValid()) {
        reject(new Error("Invalid session"));
        return;
      }
      resolve(session.getIdToken().getJwtToken());
    });
  });
}
