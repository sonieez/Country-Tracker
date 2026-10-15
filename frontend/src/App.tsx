import { useEffect } from 'react';
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
  

  return(
    <button onClick={authConnect}>Sign-in with Google</button>
  )
}

export default App
