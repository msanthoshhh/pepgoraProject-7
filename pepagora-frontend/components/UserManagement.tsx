// 'use client';

// import { useEffect, useState } from 'react';
// import axios from '@/lib/axiosInstance';
// import { TbEdit } from 'react-icons/tb';
// import { RiDeleteBin6Line } from 'react-icons/ri';
// import { toast } from 'react-toastify';
// import Sidebar from './Sidebar';

// type UserRole = 'admin' | 'category_manager' | 'pepagora_manager';

// interface User {
//   _id: string;
//   email: string;
//   username: string;
//   role: UserRole;
// }

// export default function UserManagement() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [editUser, setEditUser] = useState<User | null>(null);
//   const [searchQuery, setSearchQuery] = useState('');

//   const fetchUsers = async () => {
//     try {
//       const res = await axios.get('/auth/users');
//       setUsers(res.data?.data || res.data);
//     } catch (error) {
//       console.error('Failed to fetch users', error);
//     }
//   };

//   const deleteUser = async (id: string) => {
//     try {
//       await axios.delete(`/auth/users/${id}`);
//       toast.success('User deleted successfully');
//       await fetchUsers();
//     } catch (error) {
//       console.error('Failed to delete user', error);
//       toast.error('Failed to delete user');
//     }
//   };

//   const updateUser = async (id: string, updatedData: Pick<User, 'email' | 'username' | 'role'>) => {
//     try {
//       const payload = {
//         email: updatedData.email,
//         username: updatedData.username,
//         role: updatedData.role,
//       };
//       await axios.put(`/auth/users/${id}`, payload);
//       toast.success('User edited successfully');
//       await fetchUsers();
//     } catch (error) {
//       console.error('Failed to update user', error);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   const filteredUsers = users.filter((user) =>
//     user.username.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   return (
//   <div className="ml-60 flex min-h-screen bg-gray-50 relative">
//     <Sidebar />

//     <div className="flex-1 p-6 max-w-6xl mx-auto">
//       {/* Header */}
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
//       </div>

//       {/* Search */}
//       <div className="mb-4 flex justify-between items-center">
//         <input
//           type="text"
//           value={searchQuery}
//           onChange={(e) => setSearchQuery(e.target.value)}
//           placeholder="Search by username..."
//           className="w-full max-w-sm rounded-lg border px-3 py-2 shadow-sm focus:ring focus:ring-blue-200"
//         />
//       </div>

//       {/* Table */}
//       {filteredUsers.length === 0 ? (
//         <div className="text-center bg-white rounded-lg shadow p-10">
//           <p className="text-gray-600 text-lg">No users found.</p>
//         </div>
//       ) : (
//         <div className="overflow-x-auto bg-white rounded-lg shadow">
//           <table className="w-full border-collapse">
//             <thead>
//               <tr className="bg-gray-100 text-gray-700 text-sm uppercase">
//                 <th className="p-3 text-left">#</th>
//                 <th className="p-3 text-left">Username</th>
//                 <th className="p-3 text-left">Email</th>
//                 <th className="p-3 text-left">Role</th>
//                 <th className="p-3 text-center">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {filteredUsers.map((user, index) => (
//                 <tr
//                   key={user._id}
//                   className={`border-t hover:bg-gray-50 ${
//                     index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
//                   }`}
//                 >
//                   <td className="p-3">{index + 1}</td>
//                   <td className="p-3">{user.username}</td>
//                   <td className="p-3">{user.email}</td>
//                   <td className="p-3 capitalize">{user.role}</td>
//                   <td className="p-3 flex gap-2 justify-center">
//                     <button
//                       onClick={() => setEditUser(user)}
//                       className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
//                     >
//                       <TbEdit />
//                     </button>
//                     <button
//                       onClick={() => deleteUser(user._id)}
//                       className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
//                     >
//                       <RiDeleteBin6Line />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}

//       {/* Edit Modal */}
//       {editUser && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
//           <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-lg relative">
//             <h2 className="text-xl font-semibold mb-4">Edit User</h2>
//             <form
//               onSubmit={async (e) => {
//                 e.preventDefault();
//                 await updateUser(editUser._id, editUser);
//                 setEditUser(null);
//               }}
//               className="space-y-4"
//             >
//               <div>
//                 <label className="block text-sm font-medium">Username</label>
//                 <input
//                   type="text"
//                   value={editUser.username}
//                   onChange={(e) =>
//                     setEditUser({ ...editUser, username: e.target.value })
//                   }
//                   className="w-full rounded-lg border px-3 py-2"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium">Email</label>
//                 <input
//                   type="email"
//                   value={editUser.email}
//                   onChange={(e) =>
//                     setEditUser({ ...editUser, email: e.target.value })
//                   }
//                   className="w-full rounded-lg border px-3 py-2"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium">Role</label>
//                 <select
//                   value={editUser.role}
//                   onChange={(e) =>
//                     setEditUser({ ...editUser, role: e.target.value as UserRole })
//                   }
//                   className="w-full rounded-lg border px-3 py-2"
//                 >
//                   <option value="admin">Admin</option>
//                   <option value="category_manager">Category Manager</option>
//                   <option value="pepagora_manager">Pepagora Manager</option>
//                 </select>
//               </div>
//               <div className="flex justify-end gap-2 pt-2">
//                 <button
//                   type="button"
//                   onClick={() => setEditUser(null)}
//                   className="rounded-lg border px-4 py-2"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700"
//                 >
//                   Update
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   </div>
// );
// }


'use client';

import { useEffect, useState } from 'react';
import axios from '@/lib/axiosInstance';
import { TbEdit } from 'react-icons/tb';
import { RiDeleteBin6Line } from 'react-icons/ri';
import { FiSearch, FiUserPlus } from 'react-icons/fi';
import { toast } from 'react-toastify';
import Sidebar from './Sidebar';

type UserRole = 'admin' | 'category_manager' | 'pepagora_manager';

interface User {
  _id: string;
  email: string;
  username: string;
  role: UserRole;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/auth/users');
      setUsers(res.data?.data || res.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await axios.delete(`/auth/users/${id}`);
      toast.success('User deleted successfully');
      await fetchUsers();
    } catch (error) {
      console.error('Failed to delete user', error);
      toast.error('Failed to delete user');
    }
  };

  const updateUser = async (id: string, updatedData: Pick<User, 'email' | 'username' | 'role'>) => {
    try {
      const payload = {
        email: updatedData.email,
        username: updatedData.username,
        role: updatedData.role,
      };
      await axios.put(`/auth/users/${id}`, payload);
      toast.success('User edited successfully');
      await fetchUsers();
    } catch (error) {
      console.error('Failed to update user', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ml-60 flex min-h-screen relative">
      <Sidebar />

      <div className="flex-1 p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          {/*  */}
        </div>

        {/* Search */}
        <div className="mb-6 flex items-center">
          <div className="relative w-full max-w-sm">
            <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center bg-white rounded-lg shadow p-10">
            <p className="text-gray-600 text-lg">No users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700 text-sm uppercase sticky top-0">
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">Username</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr
                    key={user._id}
                    className={`border-t hover:bg-indigo-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium text-gray-800">{user.username}</td>
                    <td className="p-3 text-gray-600">{user.email}</td>
                    <td className="p-3 capitalize">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          user.role === 'admin'
                            ? 'bg-red-100 text-red-700'
                            : user.role === 'category_manager'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 justify-center">
                      <button
                        onClick={() => setEditUser(user)}
                        className="p-2 rounded-full bg-green-100 hover:bg-green-200 text-green-700 transition"
                        title="Edit User"
                      >
                        <TbEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteUser(user._id)}
                        className="p-2 rounded-full bg-red-100 hover:bg-red-200 text-red-700 transition"
                        title="Delete User"
                      >
                        <RiDeleteBin6Line className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-fadeIn">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-800">Edit User</h2>
                <button
                  onClick={() => setEditUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await updateUser(editUser._id, editUser);
                  setEditUser(null);
                }}
                className="p-6 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={editUser.username}
                    onChange={(e) =>
                      setEditUser({ ...editUser, username: e.target.value })
                    }
                    className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={editUser.email}
                    onChange={(e) =>
                      setEditUser({ ...editUser, email: e.target.value })
                    }
                    className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <select
                    value={editUser.role}
                    onChange={(e) =>
                      setEditUser({ ...editUser, role: e.target.value as UserRole })
                    }
                    className="w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="category_manager">Category Manager</option>
                    <option value="pepagora_manager">Pepagora Manager</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="rounded-lg border px-4 py-2 hover:bg-gray-100 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 shadow-sm transition"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
