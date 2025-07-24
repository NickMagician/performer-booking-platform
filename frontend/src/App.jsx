import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Components
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import PerformerProfilePage from './pages/PerformerProfilePage';
import CategoryPage from './pages/CategoryPage';
import CategoriesListPage from './pages/CategoriesListPage';
import AboutPage from './pages/AboutPage';
import FAQPage from './pages/FAQPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';

// Context
import { SearchProvider } from './context/SearchContext';

// Styles
import './App.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SearchProvider>
        <Router>
          <div className="App">
            <Header />
            <main className="main-content">
              <Routes>
                {/* Home page */}
                <Route path="/" element={<HomePage />} />
                
                {/* Dynamic category routes */}
                <Route path="/categories" element={<CategoriesListPage />} />
                <Route path="/search" element={<SearchResultsPage />} />
                <Route path="/performer/:slug" element={<PerformerProfilePage />} />
                <Route path="/:categorySlug/:locationSlug" element={<CategoryPage />} />
                <Route path="/:categorySlug" element={<CategoryPage />} />
                
                {/* Static pages */}
                <Route path="/about" element={<AboutPage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/terms" element={<TermsPage />} />
                {/* 404 */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </Router>
      </SearchProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
