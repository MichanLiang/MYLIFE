/* ============================================================
   auth.js — Firebase Google Authentication
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyAsKuKge8xua709gXW7U2wbuQHdd2yskUg",
  authDomain: "mylife-ee26d.firebaseapp.com",
  projectId: "mylife-ee26d",
  storageBucket: "mylife-ee26d.firebasestorage.app",
  messagingSenderId: "76957482631",
  appId: "1:76957482631:web:c5cf6541f7592868d34222"
};

firebase.initializeApp(firebaseConfig);
const fbAuth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

const Auth = {
  init(){
    DB.init();
    fbAuth.onAuthStateChanged(user => {
      if(user && !State.user){
        this.handleFirebaseUser(user);
      }
    });
  },

  login(){
    fbAuth.signInWithPopup(provider)
      .then(result => this.handleFirebaseUser(result.user))
      .catch(err => {
        console.error('Login error:', err);
        if(err.code !== 'auth/popup-closed-by-user'){
          alert('登入失敗：' + err.message);
        }
      });
  },

  handleFirebaseUser(user){
    State.user = {
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      initial: (user.displayName || user.email)[0],
      picture: user.photoURL || null
    };
    save('user', State.user);
    
    // Set DB uid and load data from Firebase
    DB.setUid(user.uid);
    DB.loadAll(()=>{
      initDefaultPockets();
      App.showShell();
    });
  },

  logout(){
    if(!confirm('確定要登出嗎？')) return;
    DB.clearUser();
    fbAuth.signOut().then(()=>{
      State.user = null;
      save('user', null);
      document.getElementById('shell').style.display='none';
      document.getElementById('view-login').classList.add('active');
    });
  }
};
