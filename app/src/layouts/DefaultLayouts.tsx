import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

export default function DefaultLayouts() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
        <Outlet />
      </div>
    </div>
  );
}
