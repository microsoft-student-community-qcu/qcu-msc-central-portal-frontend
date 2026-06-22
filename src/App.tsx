import { BrowserRouter, Routes, Route } from 'react-router-dom';

function EmptyRoute() {
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<EmptyRoute />} />
        <Route path="*" element={<EmptyRoute />} />
      </Routes>
    </BrowserRouter>
  );
}
