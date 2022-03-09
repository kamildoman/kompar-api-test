import React, { useState } from "react";
import styled from "styled-components";
import SectionButton from "./SectionButton";
import logo from "../images/komparLogo.png";

const LeftSide = () => {
  const sections = [
    ["Introduction"],
    ["Get started"],
    [
      "Authorization",
      "Token",
      "Receiving access token",
      "The token is returned",
      "Sample request",
    ],
    ["Authentication", "Header", "Sample request"],
    [
      "Webhooks",
      "About webhooks",
      "Applications webhook",
      "Client's decision webhook",
      "Remove webhook",
      "Webhook security",
      "Application details",
      "Client's decision details",
      "Confirmation of receiving",
    ],
    ["Offer"],
    [
      "Methods related to application",
      "Close application",
      "Application is signed",
    ],
    ["Option list", "Loan purpose"],
    ["How to test API?"],
  ];

  const [activeSection, setActiveSection] = useState([["Introduction"], 0]);
  return (
    <Container>
      <Logo>
        <img src={logo} alt="logo" />
      </Logo>
      {sections.map((section, key) => (
        <SectionButton
          key={key}
          name={section}
          setActiveSection={setActiveSection}
          activeSection={activeSection}
        />
      ))}
    </Container>
  );
};

const Container = styled.div`
  grid-area: leftside;
  width: 100%;
  min-height: 100vh;
  border-right: 1px solid rgba(0, 0, 0, 0.07);
  text-align: center;
  display: flex;
  flex-direction: column;
`;

const Logo = styled.div``;

export default LeftSide;
