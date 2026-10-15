import { supabase } from "../lib/supabase.js";

async function checkAuth(req, res, next) {
  try{
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      res.status(401).json({error: 'Invalid Authorization'});
      return;
    }
    const authToken = auth.split(' ')[1];
    const result = await supabase.auth.getUser(authToken);
    if (result.error || !result.data.user) {
      res.status(401).json({error: 'Invalid Authorization'})
      return;
    }
    req.user = result.data.user;
    next();
  } catch(error) {
    next(error);
  }
}
export default checkAuth