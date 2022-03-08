import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const Test = () => {
  return <div>Hello</div>;
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Test />} />
      </Routes>
    </Router>
  );
};

export default App;
