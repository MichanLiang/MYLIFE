/* ============================================================
   auth.js — Google OAuth Login
   ============================================================ */

const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

const Auth = {
  init(){
    if(typeof google !== 'undefined' && google.accounts){
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      google.accounts.id.renderButton(
        document.getElementById('googleSignInBtn'),
        { theme:'outline', size:'large', width:'100%', text:'signin_with', shape:'rectangular' }
      );
    } else {
      document.getElementById('googleSignInBtn').style.display='none';
      document.getElementById('fallbackLogin').style.display='block';
    }
  },

  handleCredentialResponse(response){
    try{
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      State.user = {
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        initial: (payload.name||payload.email)[0],
        picture: payload.picture || null
      };
      save('user', State.user);
      App.boot();
    }catch(e){
      console.error('Login error:', e);
      this.fallbackLogin();
    }
  },

  fallbackLogin(){
    const names = ['未央','小雅','阿凱','子晴','家豪','詩涵'];
    const nm = names[Math.floor(Math.random()*names.length)];
    State.user = {
      name: nm,
      email: nm.toLowerCase().replace(/[^a-z]/g,'')+'@gmail.com',
      initial: nm[0],
      picture: null
    };
    save('user', State.user);
    App.boot();
  },

  logout(){
    if(!confirm('確定要登出嗎？資料仍會保留在此裝置。')) return;
    State.user = null;
    save('user', null);
    if(typeof google !== 'undefined' && google.accounts){
      google.accounts.id.disableAutoSelect();
    }
    document.getElementById('shell').style.display='none';
    document.getElementById('view-login').classList.add('active');
  }
};
