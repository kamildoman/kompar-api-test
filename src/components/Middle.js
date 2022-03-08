import React from "react";
import styled from "styled-components";

const Middle = () => {
  return <Container>Middle</Container>;
};

const Container = styled.div`
  grid-area: middle;
  width: 100%;
  height: 100vh;
  margin-left: 15%;
`;

export default Middle;
