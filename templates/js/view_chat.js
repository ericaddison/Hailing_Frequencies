/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Initializes FriendlyChat.
function ChatApp() {
  this.checkSetup();

  // before anything, make sure user has joined the conversation...
  //TODO: also prompt for password here if necessary

    $.ajax({url: '/api/conversations/'+convId+'/users/',
            type: "POST",
            headers: {'Authorization': 'Bearer ' + userIdToken}
            }).then(function(result){
                console.log(result)
            });


  // Shortcuts to DOM Elements.
  this.messageList = document.getElementById('messages');
  this.messageForm = document.getElementById('message-form');
  this.messageInput = document.getElementById('message');
  this.submitButton = document.getElementById('submit');
  this.submitImageButton = document.getElementById('submitImage');
  this.imageForm = document.getElementById('image-form');
  this.mediaCapture = document.getElementById('mediaCapture');
  //this.userPic = document.getElementById('user-pic');
  //this.userName = document.getElementById('user-name');
  //this.signInButton = document.getElementById('sign-in');
  //this.signOutButton = document.getElementById('sign-out');
  this.signInSnackbar = document.getElementById('must-signin-snackbar');

  // Saves message on form submit.
  this.messageForm.addEventListener('submit', this.saveMessage.bind(this));
  //this.signOutButton.addEventListener('click', this.signOut.bind(this));
  //this.signInButton.addEventListener('click', this.signIn.bind(this));

  // Toggle for the button.
  var buttonTogglingHandler = this.toggleButton.bind(this);
  this.messageInput.addEventListener('keyup', buttonTogglingHandler);
  this.messageInput.addEventListener('change', buttonTogglingHandler);

  // Events for image upload.
  this.submitImageButton.addEventListener('click', function(e) {
    e.preventDefault();
    this.mediaCapture.click();
  }.bind(this));
  this.mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));

  this.initFirebase();
}

// Sets up shortcuts to Firebase features and initiate firebase auth.
ChatApp.prototype.initFirebase = function() {
    this.auth = firebase.auth();
    this.database = firebase.database();
    this.storage = firebase.storage();
    this.messaging = firebase.messaging();

    this.auth.onAuthStateChanged(this.onAuthStateChanged.bind(this));

};

// Loads chat messages history and listens for upcoming ones.
ChatApp.prototype.loadMessages = function() {
    //Reference to the /messages/ database path
    this.messagesRef = this.database.ref('messages').child(convId);
    // Remove all previous listeners
    this.messagesRef.off();

    //Load the last 12mh3S-VRD messages and listen for new ones.
    var setMessage = function(data){
        var val = data.val();
        this.displayMessage(data.key, val.name, val.text, val.photoUrl, val.imageUrl);
    }.bind(this);
    this.messagesRef.limitToLast(12).on('child_added', setMessage);
    this.messagesRef.limitToLast(12).on('child_changed', setMessage);
};

// Saves a new message on the Firebase DB.
ChatApp.prototype.saveMessage = function(e) {
  e.preventDefault();
  // Check that the user entered a message and is signed in.
  if (this.messageInput.value && this.checkSignedInWithMessage()) {
    var currentUser = this.auth.currentUser;
    //POST to '/api/conversations/(\d*)/messages/'
      var postUrl = '/api/conversations/' + convId + '/messages/';
      var messageInput = this.messageInput;
      var messageRef = this.messagesRef;
      var toggleButton = this.toggleButton();
      $.ajax({url: postUrl, type: "POST",
             headers: {'Authorization': 'Bearer ' + userIdToken},
             data: {"text": this.messageInput.value, "media_url_param": currentUser.photoURL || 'images/profile_placeholder.png'}

            }).then(function () {
                    //Clear message text field and SEND button state.
                    ChatApp.resetMaterialTextfield(messageInput);
                    toggleButton;

          });
  }
};

// Sets the URL of the given img element with the URL of the image stored in Cloud Storage.
ChatApp.prototype.setImageUrl = function(imageUri, imgElement) {
    if(imageUri.startsWith('gs://')){
        imgElement.src = ChatApp.LOADING_IMAGE_URL; //Display loading image first
        this.storage.refFromURL(imageUri).getMetadata().then(function(metadata){
            imgElement.src = metadata.downloadURLs[0];
        });
    } else {
        imgElement.src = imageUri;
    }
};

// Saves a new message containing an image URI in Firebase.
// This first saves the image in Firebase storage.
ChatApp.prototype.saveImageMessage = function(event) {
    event.preventDefault();
    var file = event.target.files[0];

    // Clear the selection in the file picker input.
    this.imageForm.reset();

    // Check if the file is an image.
    if (!file.type.match('image.*')) {
        var data = {
            message: 'You can only share images',
            timeout: 2000
        };
        this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
        return;
    }
    // Check if the user is signed-in
    if (this.checkSignedInWithMessage()) {
        if (this.checkSignedInWithMessage()) {
            var currentUser = this.auth.currentUser;
            var postUrl = '/api/conversations/' + convId + '/messages/';
            $.ajax({
                url: postUrl, type: "POST",
                headers: {'Authorization': 'Bearer ' + userIdToken},
                data: {
                    "text": this.messageInput.value,
                    "media_url_param": currentUser.photoURL || 'images/profile_placeholder.png'
                }

            }).then(function (result) {
                var userAlias = result['messages']['userAlias'];
                this.messagesRef.push({
                    name: userAlias,
                    imageUrl: ChatApp.LOADING_IMAGE_URL,
                    photoUrl: currentUser.photoURL || '/images/profile_placeholder.png',
                    timestamp: new Date().getTime()
            }).then(function (data) {
                    //Upload the image to Cloud Storage
                    var filePath = currentUser.uid + '/' + data.key + '/' + file.name;
                    return this.storage.ref(filePath).put(file).then(function (snapshot) {
                        //Get the file's Storage URI and update the chat message placeholder
                        var fullPath = snapshot.metadata.fullPath;
                        return data.update({imageUrl: this.storage.ref(fullPath).toString()});
                    }.bind(this));
                }.bind(this)).catch(function (error) {
                    console.error('There was an error uploading a file to Cloud Storage: ', error);
                });
            })
        }
    }
};

// Signs-in Friendly Chat.
ChatApp.prototype.signIn = function() {
    var provider = new firebase.auth.GoogleAuthProvider();
    this.auth.signInWithPopup(provider);
};

// Signs-out of Friendly Chat.
ChatApp.prototype.signOut = function() {
    this.auth.signOut();
};

// Triggers when the auth state change for instance when the user signs-in or signs-out.
ChatApp.prototype.onAuthStateChanged = function(user) {
  if (user) { // User is signed in!
    // Get profile pic and user's name from the Firebase user object.
    var profilePicUrl = user.photoURL;   // TODO(DEVELOPER): Get profile pic.
    var userName = user.displayName;     // TODO(DEVELOPER): Get user's name.

    // Set the user's profile pic and name.
    //this.userPic.style.backgroundImage = 'url(' + profilePicUrl + ')';
    //this.userName.textContent = userName;

    // Show user's profile and sign-out button.
    //this.userName.removeAttribute('hidden');
    //this.userPic.removeAttribute('hidden');
    //this.signOutButton.removeAttribute('hidden');

    // Hide sign-in button.
    //this.signInButton.setAttribute('hidden', 'true');

    // We load currently existing chant messages.
    this.loadMessages();

    // We save the Firebase Messaging Device token and enable notifications.
    this.saveMessagingDeviceToken();
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    //this.userName.setAttribute('hidden', 'true');
    //this.userPic.setAttribute('hidden', 'true');
    //this.signOutButton.setAttribute('hidden', 'true');

    // Show sign-in button.
    //this.signInButton.removeAttribute('hidden');
  }
};

// Returns true if user is signed-in. Otherwise false and displays a message.
ChatApp.prototype.checkSignedInWithMessage = function() {
  if(this.auth.currentUser){
      return true;
  }
  // Display a message to the user using a Toast.
  var data = {
    message: 'You must sign-in first',
    timeout: 2000
  };
  this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
  return false;
};

// Saves the messaging device token to the datastore.
ChatApp.prototype.saveMessagingDeviceToken = function() {
    navigator.serviceWorker.register('/js/firebase-messaging-sw.js')
        .then(function (registration) {
            firebase.messaging().useServiceWorker(registration);
            firebase.messaging().getToken().then(function (currentToken) {
                if (currentToken) {
                    console.log("Got FCM device token: ", currentToken);
                    //Saving the Device Token to the datastore
                    firebase.database().ref('/fcmTokens').child(currentToken)
                        .set(firebase.auth().currentUser.uid);
                } else {
                    console.log("Need to request FCM device token");
                    //Need to request permissions to show notifications
                    this.requestNotificationsPermissions();
                }
            }.bind(this)).catch(function (error) {
                console.error('Unable to get messaging token.', error);
            });
        });
};


// Requests permissions to show notifications.
ChatApp.prototype.requestNotificationsPermissions = function() {
    console.log('Requesting notifications permission...');
    firebase.messaging().requestPermission().then(function(){
        //Notification permission granted
        this.saveMessagingDeviceToken();
    }.bind(this)).catch(function(error){
        console.error('Unable to get permission to notify.', error);
    });
};

// Resets the given MaterialTextField.
ChatApp.prototype.resetMaterialTextfield = function(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
};

// Template for messages.
var MESSAGE_TEMPLATE = '<div class="message-container">' +
      '<div class="spacing" style="display: table-cell; vertical-align: top;">' +
    '<div class="pic" style="background-image: url(\'/images/profile_placeholder.png\');  background-repeat: no-repeat; width: 30px; height: 30px; background-size: 30px;  border-radius: 20px;"></div></div>' +
      '<div class="message" style="display: table-cell;  width: calc(100% - 40px);  padding: 5px 0 5px 10px;"></div>' +
    '<div class="name" style="display: inline-block;width: 100%;padding-left: 40px;color: #bbb;font-style: italic;font-size: 10px;box-sizing: border-box;"></div>' +
    '</div>';




// A loading image URL.
ChatApp.LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// Displays a Message in the UI.
ChatApp.prototype.displayMessage = function(key, name, text, picUrl, imageUri) {
  var div = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', key);
    this.messageList.appendChild(div);
  }
  if (picUrl) {
    div.querySelector('.pic').style.backgroundImage = 'url(' + picUrl + ')';
  }
    div.querySelector('.name').textContent = name;
  var messageElement = div.querySelector('.message');
  if (text) { // If the message is text.
    messageElement.textContent = text;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else if (imageUri) { // If the message is an image.
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      this.messageList.scrollTop = this.messageList.scrollHeight;
    }.bind(this));
    this.setImageUrl(imageUri, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }
  // Show the card fading-in.
  setTimeout(function() {div.classList.add('visible')}, 1);
  this.messageList.scrollTop = this.messageList.scrollHeight;
  this.messageInput.focus();
};

// Enables or disables the submit button depending on the values of the input
// fields.
ChatApp.prototype.toggleButton = function() {
  if (this.messageInput.value) {
    this.submitButton.removeAttribute('disabled');
  } else {
    this.submitButton.setAttribute('disabled', 'true');
  }
};

// Checks that the Firebase SDK has been correctly setup and configured.
ChatApp.prototype.checkSetup = function() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
};


