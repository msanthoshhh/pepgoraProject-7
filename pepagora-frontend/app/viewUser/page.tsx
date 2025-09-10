import Sidebar from "@/components/Sidebar";
import UserManagement from "@/components/UserManagement";

 export default function ViewUserPage() {
  return (
    <div className="flex items-center justify-center">
      <Sidebar/>
      <UserManagement/>
    </div>
  );
}
