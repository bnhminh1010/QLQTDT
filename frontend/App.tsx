import AppRoutes from "@/components/AppRouter";
import { Toaster } from "sonner";

function App() {
  return (
    <>
      <Toaster richColors position="top-right" />
      <AppRoutes />
    </>
  );
}

export default App;
