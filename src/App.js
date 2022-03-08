import React from "react";
import styled from "styled-components";
import LeftSide from "./components/LeftSide";
import Middle from "./components/Middle";
import RightSide from "./components/RightSide";

const App = () => {
  return (
    <Container>
      <Layout>
        <LeftSide />
        <Middle />
        <RightSide />
      </Layout>
    </Container>
  );
};

const Container = styled.div`
  max-width: 100%;
  background-color: white;
  position: absolute;
  left: 0;
  right: 0;
  overflow-y: auto;
  height: 100%;
`;

const Layout = styled.div`
  display: grid;
  grid-template-areas: "leftside middle rightside";
  grid-template-columns: minmax(0, 4fr) minmax(0, 10fr) minmax(0, 10fr);
  column-gap: 15px;
  grid-template-rows: auto;
`;

export default App;
