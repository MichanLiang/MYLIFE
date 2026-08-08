/* ============================================================
   db.js — Firebase Realtime Database Sync
   ============================================================ */

const DB = {
  db: null,
  uid: null,
  listeners: {},

  init(){
    this.db = firebase.database();
  },

  setUid(uid){
    this.uid = uid;
  },

  userRef(){
    if(!this.uid) return null;
    return this.db.ref('users/' + this.uid);
  },

  /* ---- Save single key ---- */
  save(key, val){
    // Sync to Firebase
    const ref = this.userRef();
    if(ref){
      ref.child(key).set(val).catch(err=>{
        console.error('DB save error:', key, err);
      });
    }
  },

  /* ---- Load all data from Firebase ---- */
  loadAll(callback){
    const ref = this.userRef();
    if(!ref){
      callback();
      return;
    }
    
    ref.once('value').then(snapshot=>{
      const data = snapshot.val() || {};
      
      // Update State from Firebase, fallback to localStorage
      const keys = ['daily','pockets','money','items','chores','articles','todos','budget','lists','dailyGoals','reviews','calReviews','colors','order'];
      keys.forEach(k=>{
        if(data[k] !== undefined){
          State[k] = data[k];
          save(LS[k], data[k]); // Update localStorage cache
        }
      });
      
      callback();
    }).catch(err=>{
      console.error('DB loadAll error:', err);
      callback(); // Fallback to localStorage data
    });
  },

  /* ---- Listen for real-time changes ---- */
  on(key, callback){
    const ref = this.userRef();
    if(!ref) return;
    
    // Remove old listener if exists
    if(this.listeners[key]) this.listeners[key].off();
    
    this.listeners[key] = ref.child(key);
    this.listeners[key].on('value', snapshot=>{
      const val = snapshot.val();
      if(val !== null){
        State[key] = val;
        save(LS[key], val);
        if(callback) callback(val);
      }
    });
  },

  /* ---- Stop all listeners ---- */
  offAll(){
    Object.values(this.listeners).forEach(ref=>ref.off());
    this.listeners = {};
  },

  /* ---- Delete user data on logout ---- */
  clearUser(){
    this.offAll();
    // Don't delete data on logout, keep it in Firebase
  }
};
