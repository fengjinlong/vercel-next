// "use client";

// import { useState } from "react";

// interface UserFormProps {
//   onSuccess?: () => void;
// }

// export default function UserForm({ onSuccess }: UserFormProps) {
//   const [formData, setFormData] = useState({
//     username: "",
//     email: "",
//   });
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError("");
//     setLoading(true);

//     // 验证表单数据
//     if (!formData.username.trim() || !formData.email.trim()) {
//       setError("Username and email are required");
//       setLoading(false);
//       return;
//     }

//     console.log("Form data being sent:", formData);

//     try {
//       // 确保Content-Type正确设置
//       const response = await fetch("/api/users", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           username: formData.username.trim(),
//           email: formData.email.trim(),
//         }),
//       });

//       console.log("Response status:", response.status);
//       const data = await response.json();
//       console.log("Response from server:", data);

//       if (!response.ok) {
//         throw new Error(data.error || "Failed to create user");
//       }

//       setFormData({ username: "", email: "" });
//       onSuccess?.();
//     } catch (err: any) {
//       console.error("Error details:", err);
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4">
//       <div>
//         <label
//           htmlFor="username"
//           className="block text-sm font-medium text-gray-700"
//         >
//           Username
//         </label>
//         <input
//           type="text"
//           id="username"
//           value={formData.username}
//           onChange={(e) =>
//             setFormData({ ...formData, username: e.target.value })
//           }
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//           required
//         />
//       </div>

//       <div>
//         <label
//           htmlFor="email"
//           className="block text-sm font-medium text-gray-700"
//         >
//           Email
//         </label>
//         <input
//           type="email"
//           id="email"
//           value={formData.email}
//           onChange={(e) => setFormData({ ...formData, email: e.target.value })}
//           className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
//           required
//         />
//       </div>

//       {error && <div className="text-red-500 text-sm">{error}</div>}

//       <button
//         type="submit"
//         disabled={loading}
//         className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//       >
//         {loading ? "Submitting..." : "Submit"}
//       </button>
//     </form>
//   );
// }
