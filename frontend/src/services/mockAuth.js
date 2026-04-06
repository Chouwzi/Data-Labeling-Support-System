const mockUsers = [
  { email: "admin@gmail.com", password: "123456", role: "ADMIN" },
  { email: "manager@gmail.com", password: "123456", role: "MANAGER" },
  { email: "annotator@gmail.com", password: "123456", role: "ANNOTATOR" },
  { email: "reviewer@gmail.com", password: "123456", role: "REVIEWER" }
];

export const mockLogin = async (email, password) => {
  // Simulate network delay for realistic UX
  await new Promise((resolve) => setTimeout(resolve, 600));

  const user = mockUsers.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) {
    throw new Error("Invalid credentials");
  }

  return {
    accessToken: "mock-jwt-token-" + user.role,
    role: user.role,
  };
};
