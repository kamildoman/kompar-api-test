import React from "react";
import styled from "styled-components";

const SectionButton = ({ name, setActiveSection, activeSection }) => {
  const style = (sectionName) => {
    return {
      backgroundColor:
        activeSection[0][activeSection[1]] === sectionName ? "#f5fbff" : "#fff",
      color:
        activeSection[0][activeSection[1]] === sectionName ? "#556cd6" : null,
    };
  };

  return (
    <Container>
      <Section
        style={style(name[0])}
        onClick={() => setActiveSection([name, 0])}
      >
        {name[0]}
      </Section>
      {activeSection[0][0] === name[0] &&
        name.slice(1).map((section, key) => (
          <SubSection
            style={style(section)}
            onClick={() => setActiveSection([name, key + 1])}
            key={key}
          >
            {section}
          </SubSection>
        ))}
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

const Section = styled.div`
  width: 100%;
  height: 100%;
  min-height: 30px;
  margin: 5px 0;
  font-weight: 600;
  color: #697386;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  &:hover {
    cursor: pointer;
    color: #000;
  }
`;

const SubSection = styled(Section)`
  font-size: 15px;
  margin: 3px 0;
  font-weight: 400;
`;

export default SectionButton;
