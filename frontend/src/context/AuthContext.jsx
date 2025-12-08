import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("users");
    const loginTime = sessionStorage.getItem("loginTime");

    if (storedUser && loginTime) {
      const now = Date.now();
      const diff = now - parseInt(loginTime, 10);

      if (diff < 24 * 60 * 60 * 1000) {
        setUser(JSON.parse(storedUser));
        const remainingTime = 24 * 60 * 60 * 1000 - diff;
        scheduleLogout(remainingTime);
      } else {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const scheduleLogout = (time) => {
    if (time > 60 * 1000) {
      setTimeout(() => {
        setShowWarning(true);
      }, time - 60 * 1000);
    }
    setTimeout(() => {
      logout();
    }, time);
  };

  const login = (userData, token) => {
    const now = Date.now();
    sessionStorage.setItem("users", JSON.stringify(userData));
    sessionStorage.setItem("loginTime", now.toString());
    sessionStorage.setItem("token", token);
    setUser(userData);
    scheduleLogout(24 * 60 * 60 * 1000);
  };

  const logout = () => {
    sessionStorage.clear();
    setUser(null);
    setShowWarning(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser: login, loading, logout }}>
      {children}

      {showWarning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 shadow-lg text-center">
            <h2 className="text-xl font-bold mb-4">⚠️ Session Expiring</h2>
            <p>Your session will expire in 1 minute. Please save your work.</p>
            <button
              onClick={() => setShowWarning(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
