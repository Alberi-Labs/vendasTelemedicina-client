import { Container } from "react-bootstrap";
import "../../styles/globals.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import FooterBar from "./footerBar";
import Sidebar from "./sideBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw", backgroundColor: "#edeade" }}>
      <Sidebar />
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Container style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {children}
        </Container>
        <FooterBar />
      </div>
    </div>
  );
}
