import firebase from 'firebase';
require('@firebase/firestore')
const firebaseConfig = {
    apiKey: "AIzaSyBwXHTrQaJMTMxYyT2GeIOTe7i87vJvf7g",
    authDomain: "wily-a99d7.firebaseapp.com",
    projectId: "wily-a99d7",
    storageBucket: "wily-a99d7.appspot.com",
    messagingSenderId: "196601566958",
    appId: "1:196601566958:web:e4d4eaf5ac3fb7904645ff"
  };
  firebase.initializeApp(firebaseConfig);
  export default firebase.firestore();