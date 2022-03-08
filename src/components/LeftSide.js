import React from "react";
import styled from "styled-components";

const LeftSide = () => {
  return (
    <Container>
      <Logo>
        <img
          src="https://uploads-ssl.webflow.com/5e066b03be0f82573b6e8b54/5e2ad79d941c939418b5fd94_kompar2.png"
          alt="logo"
        />
      </Logo>
      Introduction...
    </Container>
  );
};

const Container = styled.div`
  grid-area: leftside;
  width: 100%;
  height: 100vh;
  margin-left: 10px;
  border-right: 1px solid rgba(0, 0, 0, 0.07);
  text-align: center;
`;

const Logo = styled.div``;

export default LeftSide;
