import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Country from './pages/Country'
import Profile from './pages/Profile'
import NotFound from './pages/NotFound'
import Countries from './pages/Countries'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path='/countries' element={<Countries />} />
        <Route path="/countries/:code" element={<Country />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}