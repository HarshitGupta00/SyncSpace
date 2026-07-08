// App.jsx
import { Toaster } from "react-hot-toast";
import AppRouter from "./routes/AppRouter";

const App = () => {
  return (
    <>
      <AppRouter />
      <Toaster
        position="top-right"
        gutter={8}
        toastOptions={{
          duration: 3000,
          style: {
            background: "#0A0A0A",
            color: "#FFFFFF",
            fontSize: "13px",
            fontFamily: "Inter, sans-serif",
            fontWeight: "500",
            borderRadius: "10px",
            padding: "12px 16px",
            boxShadow: "0 4px 16px rgb(0 0 0 / 0.12)",
          },
          success: { iconTheme: { primary: "#16A34A", secondary: "#FFFFFF" } },
          error:   { iconTheme: { primary: "#DC2626", secondary: "#FFFFFF" } },
        }}
      />
    </>
  );
};

export default App;
