import React, { useState } from "react";
import styled from "styled-components";

const SectionButton = ({ data, activeSection, setActiveSection }) => {
  const [subcategory, setSubcategory] = useState("");
  const [categoryTimesClicked, setCategoryTimesClicked] = useState(1);
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
      JSON.stringify(subsection) === JSON.stringify(subcategory) ||
      subsection.elements.includes(subcategory)
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

  const handleClick = (name) => {
    setSubcategory("");
    if (JSON.stringify(name) === JSON.stringify(activeSection)) {
      setCategoryTimesClicked(categoryTimesClicked + 1);
    } else {
      setCategoryTimesClicked(1);
    }
    setActiveSection(name);
  };

  return (
    <Container>
      <Section
        style={style(data)}
        onClick={() => {
          handleClick(data);
        }}
      >
        {data.name}
      </Section>
      {JSON.stringify(data) === JSON.stringify(activeSection) &&
        categoryTimesClicked % 2 != 0 &&
        data.elements.map((subsection, key) => {
          if (typeof subsection === "string") {
            return createSubsection(subsection, key);
          } else {
            return (
              <Container key={key}>
                {createSubsection(subsection, key, subsection.name)}
                {renderSubsubsection(subsection) &&
                  subsection.elements.map((subsubsection, key) => {
                    return createSubsection(subsubsection, key);
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
