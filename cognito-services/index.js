const AwsConfig = require('../helpers/AwsConfig');
const jwt_decode = require('jwt-decode');

function signUp(email, password,name,agent = 'none') {
  return new Promise((resolve) => {
    AwsConfig.initAWS();
    AwsConfig.setCognitoAttributeList(email,name,agent);
    AwsConfig.getUserPool().signUp(email, password, AwsConfig.getCognitoAttributeList(), null, function(err, result){
      if (err) {
        return resolve({ statusCode: 422, response: err });
      }
      const response = {
        username: result.user.username,
        userConfirmed: result.userConfirmed,
        userAgent: result.user.client.userAgent,
      }
        return resolve({ statusCode: 200, response: response });
      });
    });
}

function verify(email, code) {
  return new Promise((resolve) => {
    AwsConfig.getCognitoUser(email).confirmRegistration(code, true, (err, result) => {
      if (err) {
        return resolve({ statusCode: 422, response: err });
      }
      return resolve({ statusCode: 200, response: result });
    });
  });
}

function signIn(email, password) {
  return new Promise((resolve) => {
    AwsConfig.getCognitoUser(email).authenticateUser(AwsConfig.getAuthDetails(email, password), {
      onSuccess: (result) => {
        const token = {
          accessToken: result.getAccessToken().getJwtToken(),
          idToken: result.getIdToken().getJwtToken(),
          refreshToken: result.getRefreshToken().getToken(),
        }  
        return resolve({ statusCode: 200, response: AwsConfig.decodeJWTToken(token) });
      },
      onFailure: (err) => {
        return resolve({ statusCode: 400, response: err.message || JSON.stringify(err)});
      },
    });
  });
}

function getUserList(token) {
  return new Promise((resolve) => {
    console.log(token);
    if(!token)
      resolve({ statusCode: 400, response: 'TOKEN MISSING' });
    const scope = jwt_decode(token)['cognito:groups'];
    AwsConfig.initAWS();
    AwsConfig.listUsers(scope)
      .then((result) => {
        resolve({ statusCode: 200, response: result });
      })
      .catch((err) => {
        resolve({ statusCode: 400, response: err.message || JSON.stringify(err) });
      });
  });
}


module.exports = {
    signUp,
    verify,
    signIn,
    getUserList
}