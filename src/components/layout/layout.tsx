import { Container } from "react-bootstrap";
import "../../styles/globals.css";
import FooterBar from "./footerBar";
import NavigationBar from "./navBar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Container>
        {children}
      </Container>
    </div>
  );
}
