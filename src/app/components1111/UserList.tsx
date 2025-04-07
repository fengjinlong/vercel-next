// "use client";

// import { useEffect, useState } from "react";

// interface User {
//   id: number;
//   username: string;
//   email: string;
//   created_at: string;
// }

// export default function UserList() {
//   const [users, setUsers] = useState<User[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");

//   const fetchUsers = async () => {
//     try {
//       const response = await fetch("/api/users");
//       if (!response.ok) {
//         throw new Error("Failed to fetch users");
//       }
//       const data = await response.json();
//       setUsers(data);
//     } catch (err: any) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//   }, []);

//   if (loading) {
//     return <div className="text-center py-4">Loading...</div>;
//   }

//   if (error) {
//     return <div className="text-red-500 text-center py-4">{error}</div>;
//   }

//   return (
//     <div className="max-w-4xl mx-auto p-4">
//       <h2 className="text-2xl font-bold mb-4">Users</h2>
//       <div className="bg-white shadow overflow-hidden sm:rounded-md">
//         <ul className="divide-y divide-gray-200">
//           {users.map((user) => (
//             <li key={user.id} className="px-6 py-4">
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm font-medium text-gray-900">
//                     {user.username}
//                   </p>
//                   <p className="text-sm text-gray-500">{user.email}</p>
//                 </div>
//                 <div className="text-sm text-gray-500">
//                   {new Date(user.created_at).toLocaleDateString()}
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       </div>
//     </div>
//   );
// }
