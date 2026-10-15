//import { useEffect } from 'react';
import './App.css'
import {supabase} from './lib/supabase'

function App() {

  async function authConnect(){
    const result = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    if (result.error){
      console.log(result.error);
    }
  }

  // useEffect(() => {
  //   async function getSession() {
  //     const session = await supabase.auth.getSession()
  //     console.log(session);
  //   }
  //   getSession();
  // },[])
  
  async function testAuth(){
    const result = await supabase.auth.getSession()
    if (!result.data.session) {
      return;
    }
    const accessToken = result.data.session.access_token;
    const response = await fetch('http://localhost:3000/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    const data = await response.json();
    console.log(data);
    
  }

  return(
    <>
    <button onClick={authConnect}>Sign-in with Google</button>
    <button onClick={testAuth}>Test /me</button>    
    </>
  )
}

export default App
