import React from "react";
import styled from "styled-components";

const RightSide = () => {
  return <Container>Right</Container>;
};

const Container = styled.div`
  grid-area: rightside;
  width: 100%;
  height: 100vh;
`;

export default RightSide;
