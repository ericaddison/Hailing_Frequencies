var firebaseUser;
var localUser;
var localUserId;
var userIdToken;

var config = {
    apiKey: "AIzaSyAq2ZvX1YatNlTsE6p5sDqZaNCVsEbcGxw",
    authDomain: "hailing-frequencies-2017.firebaseapp.com",
    databaseURL: "https://hailing-frequencies-2017.firebaseio.com",
    projectId: "hailing-frequencies-2017",
    storageBucket: "hailing-frequencies-2017.appspot.com",
    messagingSenderId: "153356807079"
};



firebase.initializeApp(config);


  function initApp (){
      var sign_in_status_header = document.getElementById('sign-in-status');
      var manage_account_button = document.getElementById('manage-account');
      var create_convo_button = document.getElementById('create-convo');
      var sign_in_button = document.getElementById('sign-in');

      return new Promise(function(resolve, reject){
          firebase.auth().onAuthStateChanged(function(user) {
              if (user) {
                  // User is signed in.
                  firebaseUser = user;
                  var displayName = user.displayName;
                  var email = user.email;
                  var emailVerified = user.emailVerified;
                  var photoURL = user.photoURL;
                  var uid = user.uid;
                  var providerData = user.providerData;

                  user.getIdToken().then(function(accessToken) {
                      userIdToken = accessToken;
                      sign_in_status_header.textContent = 'Signed in as ' + displayName + " <" + email + ">";
                      manage_account_button.value = 'Manage';
                      sign_in_button.value = 'Logout';
                      create_convo_button.style.visibility = "visible";
                      manage_account_button.style.visibility = "visible";
                      sign_in_status_header.style.visibility = "visible";
                  });
                  resolve();
              } else {
                  // User is signed out.
                  firebaseUser = null;
                  sign_in_status_header.style.visibility = "hidden";
                  manage_account_button.style.visibility = "hidden";
                  create_convo_button.style.visibility = "hidden";
                  sign_in_button.value = 'Login';
                  resolve();
              }
          },function(error) {console.log(error);})
      })
  }

  function userDataLoaded() {
      return new Promise(function (resolve, reject) {
          console.log("***userDataLoaded()");
          resolve();
      })
  }

  window.addEventListener('load', function() {
      initApp().then(function (){
          $.ajax({url:'/api/users/', type: "GET", headers: {'Authorization': 'Bearer ' + userIdToken}
          }).then(function (result) {
              if(result) {
                  localUser = result['user'];
                  localUserId = localUser['id'];
                  userDataLoaded().then(loadPageData());
              }
          })
      })
  });