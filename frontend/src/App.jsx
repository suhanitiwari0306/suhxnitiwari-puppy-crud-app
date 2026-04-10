import Header from './components/Header';
import Body from './components/Body';
import Footer from './components/Footer';
import './index.css';

function App() {
  return (
    <div className="app-container">
      <Header />
      <Body />

      {/* Chatbot */}
      <strata-chat workspace="mis372t" />

      <Footer />
    </div>
  );
}

export default App;
