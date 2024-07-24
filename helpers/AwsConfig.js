const AWS = require('aws-sdk');
const jwt_decode = require('jwt-decode');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
let cognitoAttributeList = [];

const poolData = { 
    UserPoolId : process.env.AWS_COGNITO_USER_POOL_ID,
    ClientId : process.env.AWS_COGNITO_CLIENT_ID,

};

const attributes = (key, value) => { 
  return {
    Name : key,
    Value : value
  }
};

function setCognitoAttributeList(email,name,agent) {
  let attributeList = [];
  attributeList.push(attributes('email',email));
  attributeList.push(attributes('name',name));
  attributeList.forEach(element => {
    cognitoAttributeList.push(new AmazonCognitoIdentity.CognitoUserAttribute(element));
  });
}

function getCognitoAttributeList() {
  return cognitoAttributeList;
}

function getCognitoUser(email) {
  const userData = {
    Username: email,
    Pool: getUserPool()
  };
  return new AmazonCognitoIdentity.CognitoUser(userData);
}

function getUserPool(){
  return new AmazonCognitoIdentity.CognitoUserPool(poolData);
}

function getAuthDetails(email, password) {
  var authenticationData = {
    Username: email,
    Password: password,
   };
  return new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
}

function initAWS (region = process.env.AWS_COGNITO_REGION, identityPoolId = process.env.AWS_COGNITO_IDENTITY_POOL_ID) {
  AWS.config.region = region;
  AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: identityPoolId,
  });
}

function decodeJWTToken(token) {
  const {  email, exp, auth_time , token_use  , sub} = jwt_decode(token.idToken);
  const scope  = jwt_decode(token.accessToken)['cognito:groups'];
  return {  token, email, exp, uid: sub, auth_time, token_use , scope };
}

function formatUserData(apiResponse) {
  console.log(apiResponse);
  const users = apiResponse.Users;
  return users.map(user => {
      const userInfo = {
          Username: user.Username,
          UserCreateDate: new Date(user.UserCreateDate).toLocaleString(),
          UserLastModifiedDate: new Date(user.UserLastModifiedDate).toLocaleString(),
          Enabled: user.Enabled,
          UserStatus: user.UserStatus,
      };
      user.Attributes.forEach(attribute => {
          userInfo[attribute.Name] = attribute.Value;
      });
      return userInfo;
  });
}

// function listUsers(scope) {
//   const params = {
//     UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
//     Limit: '10',
//     GroupName: scope
//   };
//   AWS.config.update({ region: process.env.AWS_COGNITO_REGION, 'accessKeyId': process.env.AWS_ACCESS_KEY, 'secretAccessKey': process.env.AWS_SECRET_KEY });
//   const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
//   return new Promise((resolve, reject) => {
//     cognitoidentityserviceprovider.listUsersInGroup(params, (err, data) => {
//       if (err) {
//         return reject(err);
//       }
//       resolve(formatUserData(data));
//     });
//   });
// }

async function listUsers(scope) {
  const params = {
    UserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    Limit: '10'
  };

  AWS.config.update({
    region: process.env.AWS_COGNITO_REGION,
    accessKeyId: process.env.AWS_USER_ACCESS_KEY,
    secretAccessKey: process.env.AWS_USER_SECRET_KEY
  });

  const cognitoidentityserviceprovider = new AWS.CognitoIdentityServiceProvider();
  
  
  try {
    const results = await Promise.all(scope.map(groupName => {
      return new Promise((resolve, reject) => {
        cognitoidentityserviceprovider.listUsersInGroup({ ...params, GroupName: groupName }, (err, data) => {
          if (err) {
            return reject(err);
          }
          resolve(formatUserData(data));
        });
      });
    }));
    return results.flat();
  } catch (err) {
    throw err;
  }
}

module.exports = {
  initAWS,
  getCognitoAttributeList,
  getUserPool,
  getCognitoUser,
  setCognitoAttributeList,
  getAuthDetails,
  decodeJWTToken,
  listUsers,
}
