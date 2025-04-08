import Cookies from "js-cookie";
import axios from "axios";

/**
 * 检查用户是否已登录
 */
export const isLoggedIn = (): boolean => {
  return !!Cookies.get("token");
};

/**
 * 获取当前用户token
 */
export const getToken = (): string | undefined => {
  return Cookies.get("token");
};

/**
 * 登出
 */
export const logout = async () => {
  try {
    // 调用登出API
    await axios.post("/api/logout");
  } catch (error) {
    console.error("登出API调用失败", error);
  }

  // 无论API调用是否成功，都清除本地Cookie
  Cookies.remove("token");

  // 重定向到登录页
  window.location.href = "/login";
};
