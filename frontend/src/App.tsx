import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import HomePage       from './pages/HomePage'
import AssessmentPage from './pages/AssessmentPage'
import LookupPage     from './pages/LookupPage'
import ContactPage    from './pages/ContactPage'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/"           element={<HomePage />}       />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/lookup"     element={<LookupPage />}     />
        <Route path="/case/:id"   element={<LookupPage />}     />
        <Route path="/contact"    element={<ContactPage />}    />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}