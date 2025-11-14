import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import withNavigate from "../../src/oop/router/withNavigate.jsx";

const navigateSpy = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  };
});

describe("withNavigate HOC", () => {
  beforeEach(() => {
    navigateSpy.mockClear();
  });

  it("injects navigate prop into wrapped component", () => {
    const BaseComponent = ({ navigate })=>{
      React.useEffect(() => {
        navigate("/target");
      }, [navigate]);
      return <div>Wrapped</div>;
    };
    const Wrapped = withNavigate(BaseComponent);
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<Wrapped />} />
        </Routes>
      </MemoryRouter>
    );
    expect(navigateSpy).toHaveBeenCalledWith("/target");
  });
});
