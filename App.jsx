import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ImportPage from './pages/ImportPage.jsx'
import Layout from './components/Layout.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/import" replace />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
