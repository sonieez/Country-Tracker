import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import CountryPage from './pages/Country'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Countries from './pages/Countries'
import About from './pages/About'
import UserProfile from './pages/UserProfile'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path='/countries' element={<Countries />} />
        <Route path="/countries/:code" element={<CountryPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route path='/about' element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}