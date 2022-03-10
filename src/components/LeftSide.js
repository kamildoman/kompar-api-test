import React, { useState } from "react";
import styled from "styled-components";
import SectionButton from "./SectionButton";
import logo from "../images/komparLogo.png";

const sections = [
  { name: "Introduction", elements: [] },
  { name: "Get started", elements: [] },
  {
    name: "Authorization",
    elements: [
      { name: "Token", elements: ["subsub", "subsub2", "subsub3"] },
      "Receiving access token",
      "The token is returned",
      "Sample request",
    ],
  },
  { name: "Authentication", elements: ["Header", "Sample request"] },
  {
    name: "Webhooks",
    elements: [
      { name: "About webhooks", elements: ["abc", "def"] },
      "Applications webhook",
      "Client's decision webhook",
      "Remove webhook",
      "Webhook security",
      "Application details",
      "Client's decision details",
      "Confirmation of receiving",
    ],
  },
  { name: "Offer", elements: [] },
  {
    name: "Methods related to application",
    elements: ["Close application", "Application is signed"],
  },
  { name: "Option list", elements: ["Loan purpose"] },
  { name: "How to test API?", elements: [] },
];

const LeftSide = () => {
  const [activeSection, setActiveSection] = useState(sections[0]);
  return (
    <Container>
      <Logo>
        <img src={logo} alt="logo" />
      </Logo>
      {sections.map((data, key) => (
        <SectionButton
          key={key}
          data={data}
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
