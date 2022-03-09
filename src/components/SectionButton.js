import React, { useState } from "react";
import styled from "styled-components";

const SectionButton = ({ name, activeSection, setActiveSection }) => {
  const [subcategory, setSubcategory] = useState("");
  const style = (sectionName) => {
    if (
      (JSON.stringify(activeSection) === JSON.stringify(sectionName) &&
        !subcategory) ||
      sectionName === subcategory
    ) {
      return { backgroundColor: "#f5fbff", color: "#556cd6" };
    }
  };

  const renderSubsubsection = (subsection) => {
    if (
      Object.values(subsection)[0].includes(subcategory) ||
      subsection === subcategory
    ) {
      return true;
    }
  };

  const createSubsection = (subsection, key, toShow = subsection) => {
    return (
      <SubSection
        style={style(subsection)}
        onClick={() => setSubcategory(subsection)}
        key={key}
      >
        {toShow}
      </SubSection>
    );
  };

  return (
    <Container>
      <Section
        style={style(name)}
        onClick={() => {
          setActiveSection(name);
          setSubcategory("");
        }}
      >
        {name[0]}
      </Section>
      {JSON.stringify(name) === JSON.stringify(activeSection) &&
        name[1].map((subsection, key) => {
          if (typeof subsection === "string") {
            return createSubsection(subsection, key);
          } else {
            return (
              <Container key={key}>
                {createSubsection(subsection, key, Object.keys(subsection))}
                {renderSubsubsection(subsection) &&
                  Object.values(subsection)[0].map((obj, key) => {
                    {
                      return createSubsection(obj, key);
                    }
                  })}
              </Container>
            );
          }
        })}
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
  flex-direction: column;
`;

export default SectionButton;
