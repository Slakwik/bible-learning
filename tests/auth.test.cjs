const {test} = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup(profilePromise) {
  const events = new EventTarget();
  const user = {uid:'user-1',email:'test@example.invalid'};
  let listener, writes=0, banner;
  const context = {
    window:events, CustomEvent,
    document:{
      addEventListener(){}, getElementById(id){return id==='authError'?banner:null;},
      createElement(){ return {classList:{},setAttribute(){}}; },
      querySelector(){ return {prepend(el){banner=el;}}; }
    },
    BibleDB:{onAuthChanged(fn){listener=fn;},getCurrentUser(){return user;},
      getUserProfile(){return profilePromise;},setUserProfile(){writes++; return Promise.resolve();}}
  };
  vm.runInNewContext(fs.readFileSync('assets/js/auth.js','utf8'),context);
  return {events,user,auth:events.BibleAuth,resolve(){listener(user);},writes:()=>writes,banner:()=>banner};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
test('auth delivers once and replays to late subscribers', async()=>{
  const env=setup(Promise.resolve({name:'Test',role:'user'}));
  let count=0;
  env.auth.onReady(()=>count++);
  env.resolve(); await tick();
  assert.equal(count,1);
  let late=0; env.auth.onReady((user,profile)=>{late++;assert.equal(profile.uid,user.uid);});
  assert.equal(late,1);
});
test('missing profile is persisted before ready',async()=>{
  const env=setup(Promise.resolve(null));let ready=false;
  env.auth.onReady(()=>{assert.equal(env.writes(),1);ready=true;});
  env.resolve();await tick();assert.ok(ready);
});
test('profile failure shows error and never signals successful auth',async()=>{
  const env=setup(Promise.reject(new Error('permission-denied')));let ready=false,failed=false;
  env.auth.onReady(()=>ready=true);env.events.addEventListener('bible-auth-error',()=>failed=true);
  env.resolve();await tick();assert.equal(ready,false);assert.equal(failed,true);
  assert.match(env.banner().textContent,/Не удалось загрузить профиль/);
});
