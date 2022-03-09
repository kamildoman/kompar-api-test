import React, { useState } from "react";
import styled from "styled-components";
import SectionButton from "./SectionButton";
import logo from "../images/komparLogo.png";

const sections = {
  Introduction: [],
  "Get started": [],
  Authorization: [
    { Token: ["subsub", "subsub2", "subsub3"] },
    "Receiving access token",
    "The token is returned",
    "Sample request",
  ],
  Authentication: ["Header", "Sample request"],
  Webhooks: [
    { "About webhooks": ["abc", "def"] },
    "Applications webhook",
    "Client's decision webhook",
    "Remove webhook",
    "Webhook security",
    "Application details",
    "Client's decision details",
    "Confirmation of receiving",
  ],
  Offer: [],

  "Methods related to application": [
    "Close application",
    "Application is signed",
  ],
  "Option list": ["Loan purpose"],
  "How to test API?": [],
};

const LeftSide = () => {
  const [activeSection, setActiveSection] = useState(
    Object.entries(sections)[0]
  );
  return (
    <Container>
      <Logo>
        <img src={logo} alt="logo" />
      </Logo>
      {Object.entries(sections).map((key) => (
        <SectionButton
          key={key}
          name={key}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
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
